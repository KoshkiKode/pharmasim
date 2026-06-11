import type { Substance } from '@/data/types';

export type MetabolizerStatus = 'poor' | 'normal' | 'rapid';
export type OrganHealth = 'impaired' | 'reduced' | 'normal';
export type DosingMode = 'acute' | 'daily';
export type Frequency = 'QD' | 'BID' | 'TID' | 'QID';

export interface PatientProfile {
  ageYears: number;
  weightKg: number;
  heightCm: number;
  bodyFatPct: number;
  tolerance: number; // 0..100, general tolerance level
  liver: OrganHealth;
  kidney: OrganHealth;
  hydrationPct: number; // 0..100, 50 = euhydrated
  metabolizer: MetabolizerStatus;
}

export interface RegimenConfig {
  mode: DosingMode;
  doseMg: number; // single dose (acute) or per-administration dose (daily)
  dailyDoseMg: number; // total mg/day in daily mode
  daysOnRegimen: number;
  frequency: Frequency;
  toleranceOverride: number | null; // per-substance override 0..100, null = use patient
}

export const FREQUENCY_PER_DAY: Record<Frequency, number> = {
  QD: 1,
  BID: 2,
  TID: 3,
  QID: 4,
};

export function tauHours(frequency: Frequency): number {
  return 24 / FREQUENCY_PER_DAY[frequency];
}

/** Elimination rate constant (per hour). */
export function rateConstant(halfLifeHours: number): number {
  return Math.log(2) / halfLifeHours;
}

/** Multiple-dose accumulation ratio: R = 1 / (1 - e^(-k·τ)). */
export function accumulationRatio(halfLifeHours: number, tau: number): number {
  const k = rateConstant(halfLifeHours);
  const denom = 1 - Math.exp(-k * tau);
  if (denom <= 0) return Infinity;
  return 1 / denom;
}

/** Time to ~97% of steady state ≈ 5 half-lives, expressed in days. */
export function daysToSteadyState(halfLifeHours: number): number {
  return (5 * halfLifeHours) / 24;
}

/**
 * Composite clearance multiplier from patient factors. >1 means faster
 * clearance (lower exposure), <1 means slower clearance (higher exposure /
 * accumulation). Combines hepatic, renal, metabolizer, age, allometric weight
 * and hydration effects multiplicatively.
 */
export function clearanceMultiplier(
  patient: PatientProfile,
  substance: Substance,
): { multiplier: number; factors: { label: string; effect: number }[] } {
  const factors: { label: string; effect: number }[] = [];

  const hepaticallyCleared =
    (substance.cypMetabolism?.length ?? 0) > 0 ||
    substance.bodySystems.some((s) => /hepat|liver/i.test(s));
  const renallyCleared = substance.bodySystems.some((s) => /renal|kidney/i.test(s));

  // Hepatic function
  if (hepaticallyCleared) {
    const hep = patient.liver === 'impaired' ? 0.45 : patient.liver === 'reduced' ? 0.7 : 1;
    if (hep !== 1) factors.push({ label: 'Hepatic function', effect: hep });
  }

  // Renal function
  if (renallyCleared) {
    const ren = patient.kidney === 'impaired' ? 0.4 : patient.kidney === 'reduced' ? 0.7 : 1;
    if (ren !== 1) factors.push({ label: 'Renal function', effect: ren });
  } else {
    // Even non-renal drugs have some renal contribution
    const ren = patient.kidney === 'impaired' ? 0.85 : patient.kidney === 'reduced' ? 0.95 : 1;
    if (ren !== 1) factors.push({ label: 'Renal contribution', effect: ren });
  }

  // CYP metabolizer phenotype (only relevant if CYP-metabolised)
  if ((substance.cypMetabolism?.length ?? 0) > 0) {
    const met =
      patient.metabolizer === 'poor' ? 0.55 : patient.metabolizer === 'rapid' ? 1.6 : 1;
    if (met !== 1) factors.push({ label: 'CYP metabolizer', effect: met });
  }

  // Age — clearance declines roughly with age in elderly
  let age = 1;
  if (patient.ageYears >= 75) age = 0.7;
  else if (patient.ageYears >= 65) age = 0.82;
  else if (patient.ageYears <= 12) age = 0.85;
  if (age !== 1) factors.push({ label: 'Age', effect: age });

  // Allometric scaling — clearance scales ~ weight^0.75 relative to 70 kg
  const allo = Math.pow(patient.weightKg / 70, 0.75);
  const alloClamped = Math.max(0.6, Math.min(1.5, allo));
  if (Math.abs(alloClamped - 1) > 0.02)
    factors.push({ label: 'Body weight (allometric)', effect: alloClamped });

  // Hydration — dehydration reduces renal clearance modestly
  const hyd = patient.hydrationPct < 35 ? 0.85 : patient.hydrationPct > 70 ? 1.05 : 1;
  if (hyd !== 1) factors.push({ label: 'Hydration', effect: hyd });

  const multiplier = factors.reduce((acc, f) => acc * f.effect, 1);
  return { multiplier: Math.max(0.15, multiplier), factors };
}

/** Patient-adjusted effective half-life (hours). */
export function effectiveHalfLife(patient: PatientProfile, substance: Substance): number {
  const { multiplier } = clearanceMultiplier(patient, substance);
  // half-life is inversely proportional to clearance
  return substance.halfLifeHours / multiplier;
}

export interface PlasmaPoint {
  hour: number;
  concentration: number; // relative units (fraction of a single-dose peak)
}

export interface PKResult {
  substanceId: string;
  effectiveHalfLifeHours: number;
  baseHalfLifeHours: number;
  clearanceMultiplier: number;
  clearanceFactors: { label: string; effect: number }[];
  accumulationRatio: number;
  daysToSteadyState: number;
  tauHours: number;
  series: PlasmaPoint[];
  peakConcentration: number;
  steadyStateTrough: number;
  toleranceScalar: number; // perceived-effect scalar from tolerance (0..1)
}

/**
 * Build a plasma-concentration time series. In acute mode we model a single
 * first-order absorption + elimination curve. In daily mode we superpose
 * repeated doses up to `daysOnRegimen` so accumulation toward steady state is
 * visible.
 */
export function computePK(
  patient: PatientProfile,
  substance: Substance,
  regimen: RegimenConfig,
): PKResult {
  const { multiplier, factors } = clearanceMultiplier(patient, substance);
  const tHalf = substance.halfLifeHours / multiplier;
  const k = Math.log(2) / tHalf;
  // absorption rate constant — assume fast oral absorption (tmax ~1h)
  const ka = Math.max(k * 4, Math.log(2) / 0.7);
  const tau = tauHours(regimen.frequency);
  const R = accumulationRatio(tHalf, tau);
  const dss = daysToSteadyState(tHalf);

  // Tolerance reduces *perceived* effect, not concentration.
  const tol = regimen.toleranceOverride ?? patient.tolerance;
  const toleranceScalar = Math.max(0.2, 1 - (tol / 100) * 0.8);

  // Single-dose unit concentration (Bateman function), normalised to peak = 1.
  const unitDose = (t: number): number => {
    if (t < 0) return 0;
    if (Math.abs(ka - k) < 1e-6) return k * t * Math.exp(-k * t);
    return (ka / (ka - k)) * (Math.exp(-k * t) - Math.exp(-ka * t));
  };
  // find peak of unit curve for normalisation
  const tmax = Math.abs(ka - k) < 1e-6 ? 1 / k : Math.log(ka / k) / (ka - k);
  const unitPeak = unitDose(tmax) || 1;

  const series: PlasmaPoint[] = [];
  let horizonHours: number;
  let doseTimes: number[] = [];

  if (regimen.mode === 'acute') {
    horizonHours = Math.min(Math.max(tHalf * 6, 12), 24 * 14);
    doseTimes = [0];
  } else {
    const totalDays = Math.max(1, regimen.daysOnRegimen);
    horizonHours = Math.min(totalDays * 24, 24 * 30);
    const nDoses = Math.min(Math.ceil(horizonHours / tau), 400);
    doseTimes = Array.from({ length: nDoses }, (_, i) => i * tau);
  }

  const steps = 220;
  const dt = horizonHours / steps;
  let peak = 0;
  for (let i = 0; i <= steps; i++) {
    const t = i * dt;
    let c = 0;
    for (const dtm of doseTimes) {
      if (dtm <= t) c += unitDose(t - dtm) / unitPeak;
    }
    if (c > peak) peak = c;
    series.push({ hour: Math.round(t * 10) / 10, concentration: Math.round(c * 1000) / 1000 });
  }

  // steady-state trough estimate (relative)
  const ssTrough = regimen.mode === 'daily' ? Math.exp(-k * tau) * R : 0;

  return {
    substanceId: substance.id,
    effectiveHalfLifeHours: tHalf,
    baseHalfLifeHours: substance.halfLifeHours,
    clearanceMultiplier: multiplier,
    clearanceFactors: factors,
    accumulationRatio: R,
    daysToSteadyState: dss,
    tauHours: tau,
    series,
    peakConcentration: peak,
    steadyStateTrough: Math.round(ssTrough * 1000) / 1000,
    toleranceScalar,
  };
}

export function formatHours(h: number): string {
  if (!isFinite(h)) return '∞';
  if (h < 1) return `${Math.round(h * 60)} min`;
  if (h < 48) return `${h.toFixed(1)} h`;
  return `${(h / 24).toFixed(1)} d`;
}
