import type { Substance } from '@/data/types';

export type MetabolizerPhenotype = 'poor' | 'normal' | 'rapid' | 'ultrarapid';
export type OrganHealth = 'impaired' | 'reduced' | 'normal';
export type DosingMode = 'acute' | 'daily';
export type Frequency = 'QD' | 'BID' | 'TID' | 'QID';

export interface PatientProfile {
  biologicalSex: 'M' | 'F';
  ageYears: number;
  weightKg: number;
  heightCm: number;
  bodyFatPct: number;
  tolerance: number; // 0..100, general tolerance level
  liver: OrganHealth;
  kidney: OrganHealth;
  hydrationPct: number; // 0..100, 50 = euhydrated
  genetics: Record<string, MetabolizerPhenotype>; // map of CYP enzyme to phenotype
  conditions: string[]; // preexisting condition IDs
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
  activeSubstances: Substance[] = []
): { multiplier: number; factors: { label: string; effect: number }[] } {
  const factors: { label: string; effect: number }[] = [];

  const hepaticallyCleared =
    (substance.cypMetabolism?.length ?? 0) > 0 ||
    substance.bodySystems.some((s) => /hepat|liver/i.test(s));
  const renallyCleared = substance.bodySystems.some((s) => /renal|kidney/i.test(s));

  const liverImpaired = patient.liver === 'impaired' || patient.conditions?.includes('liver-cirrhosis');
  const liverReduced = patient.liver === 'reduced';
  const kidneyImpaired = patient.kidney === 'impaired' || patient.conditions?.includes('ckd');
  const kidneyReduced = patient.kidney === 'reduced';

  // Hepatic function
  if (hepaticallyCleared) {
    const hep = liverImpaired ? 0.45 : liverReduced ? 0.7 : 1;
    if (hep !== 1) {
      factors.push({ 
        label: liverImpaired && patient.conditions?.includes('liver-cirrhosis') ? 'Liver Cirrhosis' : 'Hepatic function', 
        effect: hep 
      });
    }
  }

  // Renal function (Physiologically-based Cockcroft-Gault)
  let scr = 1.0;
  if (kidneyImpaired) scr = 2.5;
  else if (kidneyReduced) scr = 1.6;
  
  let crcl = ((140 - patient.ageYears) * patient.weightKg) / (72 * scr);
  if (patient.biologicalSex === 'F') crcl *= 0.85;

  const renalFactor = Math.max(0.1, Math.min(1.4, crcl / 100)); // normalized to typical 100 mL/min

  if (renallyCleared) {
    if (Math.abs(renalFactor - 1) > 0.05) {
      factors.push({
        label: kidneyImpaired && patient.conditions?.includes('ckd') ? `CrCl ${Math.round(crcl)} mL/min (CKD)` : `Renal Clearance (${Math.round(crcl)} mL/min)`,
        effect: renalFactor
      });
    }
  } else {
    // Non-renal drugs still have minor renal contribution
    const minorRenalFactor = 1 - (1 - renalFactor) * 0.15;
    if (Math.abs(minorRenalFactor - 1) > 0.02) {
      factors.push({
        label: 'Renal contribution',
        effect: minorRenalFactor
      });
    }
  }

  // CYP metabolizer phenotype + Drug-Drug Interactions
  const cypMetabolism = substance.cypMetabolism || [];
  if (cypMetabolism.length > 0) {
    let combinedCypEffect = 1;
    let labelParts: string[] = [];

    for (const cyp of cypMetabolism) {
      let enzymeEffect = 1;
      
      // Genetic effect
      const phenotype = patient.genetics?.[cyp] || 'normal';
      if (phenotype === 'poor') enzymeEffect *= 0.3;
      else if (phenotype === 'rapid') enzymeEffect *= 1.5;
      else if (phenotype === 'ultrarapid') enzymeEffect *= 2.0;
      
      if (phenotype !== 'normal') {
        labelParts.push(`${cyp} ${phenotype}`);
      }

      // Interaction effect (inhibitors/inducers)
      let isInhibited = false;
      let isInduced = false;
      for (const other of activeSubstances) {
        if (other.id === substance.id) continue;
        if (other.cypInhibits?.includes(cyp)) isInhibited = true;
        if (other.cypInduces?.includes(cyp)) isInduced = true;
      }
      
      if (isInhibited && isInduced) {
        // Competitive effects roughly cancel out or are unpredictable
        labelParts.push(`${cyp} (inhibited + induced)`);
      } else if (isInhibited) {
        enzymeEffect *= 0.25; // strong clearance reduction
        labelParts.push(`${cyp} Inhibited`);
      } else if (isInduced) {
        enzymeEffect *= 2.5; // strong clearance increase
        labelParts.push(`${cyp} Induced`);
      }

      combinedCypEffect *= enzymeEffect;
    }

    if (labelParts.length > 0) {
      factors.push({ label: labelParts.join(', '), effect: combinedCypEffect });
    }
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
export function effectiveHalfLife(
  patient: PatientProfile, 
  substance: Substance,
  activeSubstances: Substance[] = []
): number {
  const { multiplier } = clearanceMultiplier(patient, substance, activeSubstances);
  return substance.halfLifeHours / multiplier;
}

export interface PlasmaPoint {
  hour: number;
  concentration: number; // actual plasma concentration (mg/L)
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
  activeSubstances: Substance[] = []
): PKResult {
  const { multiplier, factors } = clearanceMultiplier(patient, substance, activeSubstances);
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

  // Pharmacokinetic Parameters
  const f = substance.bioavailability;
  const Vd = substance.vdLKg * patient.weightKg;

  // Real concentration function (mg/L) -> C(t) = (Dose * F / Vd) * (ka / (ka - k)) * (e^-kt - e^-kat)
  // For 'daily' mode, Dose is dailyDoseMg / (24/tau)
  const dose = regimen.mode === 'acute' ? regimen.doseMg : (regimen.dailyDoseMg * tau) / 24;
  const doseMultiplier = (dose * f) / Vd;

  const unitDose = (t: number): number => {
    if (t < 0) return 0;
    if (Math.abs(ka - k) < 1e-6) return doseMultiplier * k * t * Math.exp(-k * t);
    return doseMultiplier * (ka / (ka - k)) * (Math.exp(-k * t) - Math.exp(-ka * t));
  };

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
      if (dtm <= t) c += unitDose(t - dtm);
    }
    if (c > peak) peak = c;
    series.push({ hour: Math.round(t * 10) / 10, concentration: Math.round(c * 1000) / 1000 });
  }

  // steady-state trough estimate
  const ssTrough = regimen.mode === 'daily' ? peak * Math.exp(-k * tau) : 0;

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
