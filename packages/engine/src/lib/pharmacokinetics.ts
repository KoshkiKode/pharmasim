import { ROUTES, type Substance, type Route, type OrganHealth, type Formulation, type DoseEvent } from '../data/types';
import { conditions } from '../data/conditions';

export type MetabolizerPhenotype = 'poor' | 'normal' | 'rapid' | 'ultrarapid';
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
  /**
   * The route of administration used for this specific dose.
   * If omitted, the engine assumes the substance's primary (first) route.
   */
  route?: Route;
  formulation?: Formulation; // Defaults to IR
  /** 
   * Optional overrides for a plant's active ingredients. 
   * Maps constituent ID to a new mass ratio (0 to 1). 
   */
  customConstituentRatios?: Record<string, number>;
  /**
   * Explicit dosing events on a timeline. If provided, overrides mode/frequency.
   */
  customEvents?: DoseEvent[];
}

export interface ProfileRegimen {
  substanceId: string;
  regimen: RegimenConfig;
}

export interface SavedProfile {
  id: string;
  name: string;
  patient: PatientProfile;
  regimens: ProfileRegimen[];
  lastSavedAt: number; // timestamp
}

export const FREQUENCY_PER_DAY: Record<Frequency, number> = {
  QD: 1,
  BID: 2,
  TID: 3,
  QID: 4,
};

export function tauHours(frequency: Frequency): number {
  const perDay = FREQUENCY_PER_DAY[frequency];
  return typeof perDay === 'number' && perDay > 0 ? 24 / perDay : 24;
}

/** Elimination rate constant (per hour). */
export function rateConstant(halfLifeHours: number): number {
  return Math.log(2) / halfLifeHours;
}

/** Multiple-dose accumulation ratio: R = 1 / (1 - e^(-k·τ)). */
export function accumulationRatio(halfLifeHours: number, tau: number): number {
  const k = rateConstant(halfLifeHours);
  const denom = -Math.expm1(-k * tau);
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
  patient = {
    ...patient,
    weightKg: positiveFinite(patient.weightKg, 70),
    ageYears: Number.isFinite(patient.ageYears) ? patient.ageYears : 35,
  };
  const factors: { label: string; effect: number }[] = [];

  const hepaticallyCleared =
    (substance.cypMetabolism?.length ?? 0) > 0 ||
    (substance.bodySystems ?? []).some((s) => /hepat|liver/i.test(s));
  const renallyCleared = (substance.bodySystems ?? []).some((s) => /renal|kidney/i.test(s));
  const patientConditions = (patient.conditions || []).map(id => conditions.find(c => c.id === id)).filter((c): c is NonNullable<typeof c> => c !== undefined);
  
  let forcedLiver = patient.liver;
  let forcedKidney = patient.kidney;
  let overallConditionClearanceScalar = 1.0;
  
  for (const cond of patientConditions) {
    if (cond.pkModifiers) {
      if (cond.pkModifiers.forceLiverHealth === 'impaired') forcedLiver = 'impaired';
      else if (cond.pkModifiers.forceLiverHealth === 'reduced' && forcedLiver !== 'impaired') forcedLiver = 'reduced';
      
      if (cond.pkModifiers.forceKidneyHealth === 'impaired') forcedKidney = 'impaired';
      else if (cond.pkModifiers.forceKidneyHealth === 'reduced' && forcedKidney !== 'impaired') forcedKidney = 'reduced';
      
      if (cond.pkModifiers.clearanceScalar) {
        overallConditionClearanceScalar *= cond.pkModifiers.clearanceScalar;
      }
    }
  }

  const liverImpaired = forcedLiver === 'impaired';
  const liverReduced = forcedLiver === 'reduced';
  const kidneyImpaired = forcedKidney === 'impaired';
  const kidneyReduced = forcedKidney === 'reduced';

  // Hepatic function
  if (hepaticallyCleared) {
    const hep = liverImpaired ? 0.45 : liverReduced ? 0.7 : 1;
    if (hep !== 1) {
      factors.push({ 
        label: liverImpaired ? 'Liver Impairment' : 'Reduced Hepatic Function', 
        effect: hep 
      });
    }
  }

  // Renal function (Physiologically-based Cockcroft-Gault)
  let scr = 1.0;
  if (kidneyImpaired) scr = 2.5;
  else if (kidneyReduced) scr = 1.6;
  
  let crcl = ((140 - patient.ageYears) * Math.max(0.1, patient.weightKg)) / (72 * scr);
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

  let multiplier = factors.reduce((acc, f) => acc * f.effect, 1);
  
  if (overallConditionClearanceScalar !== 1.0) {
      multiplier *= overallConditionClearanceScalar;
      factors.push({ label: 'Pre-existing Conditions', effect: overallConditionClearanceScalar });
  }
  
  return { multiplier: Math.max(0.15, multiplier), factors };
}

/** Patient-adjusted effective half-life (hours). */
export function effectiveHalfLife(
  patient: PatientProfile, 
  substance: Substance,
  activeSubstances: Substance[] = []
): number {
  let baseHalfLife = substance.halfLifeHours;
  if (substance.clearanceMlMinKg != null) {
    const clearanceLHrKg = substance.clearanceMlMinKg * 0.06;
    // T1/2 = 0.693 * Vd / Cl
    if (Number.isFinite(clearanceLHrKg) && clearanceLHrKg > 0) {
      baseHalfLife = (Math.LN2 * substance.vdLKg) / clearanceLHrKg;
    }
  }

  const { multiplier } = clearanceMultiplier(patient, substance, activeSubstances);
  return baseHalfLife / multiplier;
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
  aucMgHourL: number; // area under the curve over the finite simulation horizon
  peakHour: number; // sampled peak, including event boundaries and individual analytical peaks
  horizonHours: number;
  warnings: string[];
}

export interface RouteMultiplier {
  bioavailabilityScalar: number; // multiplied by baseline F (capped at 1.0)
  tmaxHours: number; // absolute Tmax for absorption rate constant (ka)
}

export const ROA_MULTIPLIERS: Record<Route, RouteMultiplier> = {
  oral: { bioavailabilityScalar: 1.0, tmaxHours: 1.5 },
  sublingual: { bioavailabilityScalar: 1.5, tmaxHours: 0.5 },
  intranasal: { bioavailabilityScalar: 1.3, tmaxHours: 0.25 },
  nasal: { bioavailabilityScalar: 1.3, tmaxHours: 0.25 },
  smoked: { bioavailabilityScalar: 1.6, tmaxHours: 0.08 },
  buccal: { bioavailabilityScalar: 1.5, tmaxHours: 0.5 },
  inhaled: { bioavailabilityScalar: 1.6, tmaxHours: 0.08 }, // ~5 minutes
  rectal: { bioavailabilityScalar: 1.3, tmaxHours: 0.75 },
  transdermal: { bioavailabilityScalar: 1.0, tmaxHours: 8.0 },
  IV: { bioavailabilityScalar: 100, tmaxHours: 0.02 }, // F is hardcapped to 1.0
  IM: { bioavailabilityScalar: 1.8, tmaxHours: 0.3 },
  SC: { bioavailabilityScalar: 1.6, tmaxHours: 0.5 },
  subcutaneous: { bioavailabilityScalar: 1.6, tmaxHours: 0.5 },
};

const FORMULATIONS: Formulation[] = ['IR', 'ER', 'XR', 'CR'];
// Representative release windows; actual products vary by drug and product.
const RELEASE_HOURS: Partial<Record<Formulation, number>> = { ER: 8, XR: 12, CR: 24 };

function positiveFinite(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isFinite(value) && value > 0 ? value : fallback;
}

function validDoseEvents(events: DoseEvent[], substanceId: string): DoseEvent[] {
  return events
    .filter(
      (event): event is DoseEvent =>
        !!event &&
        typeof event === 'object' &&
        Number.isFinite(event.administrationHour) &&
        event.administrationHour >= 0 &&
        Number.isFinite(event.doseMg) &&
        event.doseMg >= 0 &&
        ROUTES.includes(event.route) &&
        FORMULATIONS.includes(event.formulation) &&
        (event.kaOverride === undefined || (Number.isFinite(event.kaOverride) && event.kaOverride > 0)) &&
        (event.infusionDurationHours === undefined ||
          (event.route === 'IV' && event.kaOverride === undefined &&
            Number.isFinite(event.infusionDurationHours) && event.infusionDurationHours > 0)),
    )
    .map((event) => ({ ...event, substanceId }))
    .sort((a, b) => a.administrationHour - b.administrationHour)
    .slice(0, 2000);
}

/**
 * Flattens a static RegimenConfig into discrete DoseEvents over the given days.
 */
export function flattenRegimensToEvents(regimen: RegimenConfig, substance: Substance): DoseEvent[] {
  if (regimen.customEvents && regimen.customEvents.length > 0) {
    // Callers may bypass sanitizeRegimenConfig (e.g. direct API use or
    // restored state), so defensively clone, validate, sort, and cap the
    // timeline here rather than trusting or mutating the caller's array.
    return validDoseEvents(regimen.customEvents, substance.id);
  }
  
  const events: DoseEvent[] = [];
  const totalDays = Math.min(365, Math.max(1,
    regimen.mode === 'daily' ? positiveFinite(regimen.daysOnRegimen, 1) : 1));
  const tau = tauHours(regimen.frequency);
  const nDoses = regimen.mode === 'acute' ? 1 : Math.min(Math.ceil((totalDays * 24) / tau), 400);
  
  // Base formulation and route
  const route = regimen.route || (substance.routes?.[0] as Route) || 'oral';
  const form = regimen.formulation || 'IR';
  const dose = regimen.mode === 'acute' ? regimen.doseMg : (regimen.dailyDoseMg * tau) / 24;

  for (let i = 0; i < nDoses; i++) {
    events.push({
      id: `${substance.id}-${i}`,
      substanceId: substance.id,
      doseMg: dose,
      route,
      formulation: form,
      administrationHour: i * tau
    });
  }
  return events;
}

function absorptionResponse(dt: number, ka: number, k: number): number {
  if (dt <= 0) return 0;
  const difference = Math.abs(ka - k);
  const decay = Math.exp(-Math.min(ka, k) * dt);
  if (decay === 0) return 0;
  if (difference === 0) return ka * dt * decay;
  return (ka * (-Math.expm1(-difference * dt) / difference)) * decay;
}

/** Integral of the Bateman response over [start, start + elapsed]. */
function absorptionIntegral(start: number, elapsed: number, ka: number, k: number): number {
  if (elapsed <= 0 || !Number.isFinite(start)) return 0;
  if (elapsed * Math.max(ka, k) < 1e-6) {
    return elapsed * absorptionResponse(start + elapsed / 2, ka, k);
  }
  if (Math.abs(ka - k) <= 1e-5 * Math.max(ka, k)) {
    // The equal-rate limit avoids subtracting nearly identical exponentials.
    const rate = (ka + k) / 2;
    const x = rate * elapsed;
    const gamma = x < 0.001
      ? x * x * (0.5 + x * (-1 / 3 + x * (1 / 8 - x / 30)))
      : -Math.expm1(-x) - x * Math.exp(-x);
    return (ka / rate) * Math.exp(-rate * start) *
      (rate * start * -Math.expm1(-x) + gamma) / rate;
  }
  const exponentialIntegral = (rate: number) =>
    Math.exp(-rate * start) * -Math.expm1(-rate * elapsed) / rate;
  return Math.max(0, (exponentialIntegral(k) - exponentialIntegral(ka)) * (ka / (ka - k)));
}

function makeEventCurve(
  event: DoseEvent,
  doseMultiplier: number,
  ka: number,
  k: number,
  releaseHours?: number,
  lagHours = 0,
): (time: number) => number {
  const origin = event.administrationHour + lagHours;

  if (event.route === 'IV' && event.kaOverride === undefined) {
    return (time) => {
      const dt = time - event.administrationHour;
      if (dt < 0) return 0;
      const duration = event.infusionDurationHours;
      if (duration === undefined) return doseMultiplier * Math.exp(-k * dt);
      const elapsed = Math.min(dt, duration);
      const elimination = k * elapsed;
      return doseMultiplier * (elapsed / duration) *
        (elimination === 0 ? 1 : -Math.expm1(-elimination) / elimination) *
        Math.exp(-k * Math.max(0, dt - duration));
    };
  }

  if (releaseHours !== undefined) {
    return (time) => {
      const dt = time - origin;
      if (dt <= 0) return 0;
      if (dt >= releaseHours && releaseHours * Math.max(ka, k) < 1e-6) {
        return doseMultiplier * absorptionResponse(dt - releaseHours / 2, ka, k);
      }
      const elapsed = Math.min(dt, releaseHours);
      return doseMultiplier * (absorptionIntegral(dt - elapsed, elapsed, ka, k) / releaseHours);
    };
  }

  return (time) =>
    doseMultiplier * absorptionResponse(time - origin, ka, k);
}

function integrateCurve(curve: (hour: number) => number, start: number, end: number): number {
  if (end <= start) return 0;
  const recurse = (
    left: number, right: number, a: number, b: number, c: number,
    estimate: number, tolerance: number, depth: number,
  ): number => {
    const middle = (left + right) / 2;
    const d = curve((left + middle) / 2);
    const e = curve((middle + right) / 2);
    const first = (middle - left) * (a + 4 * d + b) / 6;
    const second = (right - middle) * (b + 4 * e + c) / 6;
    const delta = first + second - estimate;
    if (depth === 0 || Math.abs(delta) <= 15 * tolerance) {
      return Math.max(0, first + second + delta / 15);
    }
    return recurse(left, middle, a, d, b, first, tolerance / 2, depth - 1) +
      recurse(middle, right, b, e, c, second, tolerance / 2, depth - 1);
  };
  const a = curve(start);
  const b = curve((start + end) / 2);
  const c = curve(end);
  const estimate = (end - start) * (a + 4 * b + c) / 6;
  return recurse(start, end, a, b, c, estimate, Math.max(1e-16, Math.abs(estimate) * 1e-9), 16);
}

function regularInterval(events: DoseEvent[]): number | undefined {
  if (events.length < 2) return undefined;
  const intervals = events.slice(1).map((event, index) =>
    event.administrationHour - events[index].administrationHour,
  );
  const first = intervals[0];
  return first > 0 && intervals.every((interval) => Math.abs(interval - first) < 1e-6)
    ? first
    : undefined;
}

function periodicTrough(
  curve: (time: number) => number,
  interval: number,
  halfLife: number,
  originHour: number,
): number {
  const periods = Math.min(20000, Math.ceil((40 * halfLife) / interval) + 2);
  let concentration = 0;
  for (let dose = 0; dose <= periods; dose++) {
    concentration += curve(originHour + (dose + 1) * interval);
  }
  return concentration;
}

/**
 * Computes plasma concentration curve dynamically from an array of explicit dose events.
 * Handles IV boluses, controlled-release formulations, variable routes, and overlapping doses.
 */
export function computeEventPK(
  patient: PatientProfile,
  substance: Substance,
  events: DoseEvent[],
  activeSubstances: Substance[] = [],
  steadyStateIntervalHours?: number,
): PKResult {
  const warnings = new Set<string>();
  if (!substance.parameterEvidence || Object.keys(substance.parameterEvidence).length === 0) {
    warnings.add('Parameter provenance is absent; PK estimates are not source-verified.');
  } else {
    const parameters: (keyof NonNullable<Substance['parameterEvidence']>)[] =
      ['halfLifeHours', 'vdLKg', 'bioavailability'];
    if (substance.clearanceMlMinKg !== undefined) parameters.push('clearanceMlMinKg');
    if (substance.bioavailabilityByRoute !== undefined) parameters.push('bioavailabilityByRoute');
    if (substance.absorptionByRoute !== undefined) parameters.push('absorptionByRoute');
    if (substance.releaseHoursByFormulation !== undefined) parameters.push('releaseHoursByFormulation');
    if (substance.metabolites?.length) parameters.push('metabolites');
    const missing = parameters.filter((parameter) => !substance.parameterEvidence?.[parameter]);
    if (missing.length > 0) {
      warnings.add(`Parameter provenance is partial; evidence is missing for ${missing.join(', ')}.`);
    }
  }
  const { multiplier, factors } = clearanceMultiplier(patient, substance, activeSubstances);
  
  let baseHalfLife = substance.halfLifeHours;
  if (substance.clearanceMlMinKg != null) {
    const clearanceLHrKg = substance.clearanceMlMinKg * 0.06;
    if (Number.isFinite(clearanceLHrKg) && clearanceLHrKg > 0) {
      const derivedHalfLife = (Math.LN2 * substance.vdLKg) / clearanceLHrKg;
      if (Number.isFinite(derivedHalfLife) && derivedHalfLife > 0 &&
          Number.isFinite(baseHalfLife) && baseHalfLife > 0 &&
          Math.abs(derivedHalfLife - baseHalfLife) / baseHalfLife > 0.25) {
        warnings.add('CL/Vd-derived half-life differs from the listed half-life by more than 25%; the clearance-derived value is used by this one-compartment model.');
      }
      baseHalfLife = derivedHalfLife;
    }
  }
  
  if (!Number.isFinite(baseHalfLife) || baseHalfLife <= 0) {
    warnings.add('Invalid elimination parameters; a generic 12-hour half-life default was used.');
    baseHalfLife = 12;
  }
  const rawHalfLife = baseHalfLife / multiplier;
  const tHalf = Math.min(1e9, Math.max(1e-6, rawHalfLife));
  if (tHalf !== rawHalfLife) warnings.add('Extreme half-life was bounded for numerical stability.');
  const k = Math.log(2) / tHalf;

  let conditionVdScalar = 1.0;
  const patientConditions = (patient.conditions || []).map(id => conditions.find(c => c.id === id)).filter((c): c is NonNullable<typeof c> => c !== undefined);
  for (const cond of patientConditions) {
      if (cond.pkModifiers?.vdScalar) conditionVdScalar *= cond.pkModifiers.vdScalar;
  }
  const volume = positiveFinite(substance.vdLKg, 1) * positiveFinite(patient.weightKg, 70) * conditionVdScalar;
  const Vd = Math.min(1e12, Math.max(0.01, positiveFinite(volume, 70)));
  if (!Number.isFinite(volume) || volume <= 0 || !Number.isFinite(patient.weightKg) ||
      patient.weightKg <= 0 || !Number.isFinite(substance.vdLKg) || substance.vdLKg <= 0) {
    warnings.add('Invalid distribution parameters; generic volume/weight defaults were used.');
  }

  const validEvents = validDoseEvents(events, substance.id);
  if (validEvents.length !== events.length) {
    warnings.add('Invalid dose events were discarded or the 2000-event timeline limit was applied.');
  }
  if (substance.metabolites?.length || validEvents.some((event) => event.kaOverride !== undefined)) {
    warnings.add('Metabolites use a simplified first-order formation approximation; parent absorption/bioavailability, infusion/release timing, molecular-mass conversion and enzyme-specific formation are not fully coupled.');
  }
  const profiles = validEvents.map((ev) => {
    if (!substance.routes.includes(ev.route)) {
      warnings.add(`Unsupported route for ${substance.id}: ${ev.route}; estimates are extrapolated.`);
    }
    const roa = ROA_MULTIPLIERS[ev.route] || ROA_MULTIPLIERS.oral;
    const absorption = substance.absorptionByRoute?.[ev.route];
    const rawKa = ev.kaOverride ?? absorption?.kaPerHour;
    const ka = Math.min(1e12, Math.max(1e-12,
      positiveFinite(rawKa, Math.max(k * 1.1, 3.5 / roa.tmaxHours))));
    const isBolusOrInfusion = ev.route === 'IV' && ev.kaOverride === undefined;
    if (!isBolusOrInfusion && (rawKa === undefined || !Number.isFinite(rawKa) || rawKa <= 0)) {
      warnings.add(`Generic absorption defaults used for ${ev.route}.`);
    } else if (rawKa !== undefined && rawKa !== ka) {
      warnings.add('Extreme absorption rate was bounded for numerical stability.');
    }
    const lagHours = ev.route !== 'IV' && absorption?.lagHours !== undefined &&
      Number.isFinite(absorption.lagHours) && absorption.lagHours >= 0 ? absorption.lagHours : 0;
    if (absorption?.lagHours !== undefined && (!Number.isFinite(absorption.lagHours) || absorption.lagHours < 0)) {
      warnings.add('Invalid absorption lag discarded; zero lag was used.');
    }
    const configuredRelease = substance.releaseHoursByFormulation?.[ev.formulation];
    const releaseHours = ev.route === 'IV' ? undefined :
      configuredRelease !== undefined && Number.isFinite(configuredRelease) && configuredRelease > 0
        ? configuredRelease : RELEASE_HOURS[ev.formulation];
    if (releaseHours !== undefined && releaseHours !== configuredRelease) {
      warnings.add(`Generic ${ev.formulation} release duration default used.`);
    } else if (configuredRelease !== undefined && releaseHours === undefined && ev.route !== 'IV') {
      warnings.add('Invalid release duration discarded.');
    }
    let f = ev.route === 'IV' ? 1 : substance.bioavailability;
    if (ev.route !== 'IV' && substance.bioavailabilityByRoute && substance.bioavailabilityByRoute[ev.route] !== undefined) {
      f = substance.bioavailabilityByRoute[ev.route]!;
    } else {
      if (ev.route !== 'IV') {
        const baseline = substance.bioavailability;
        if (!Number.isFinite(baseline) || baseline < 0 || baseline > 1) {
          warnings.add('Invalid bioavailability; a bounded generic default was used.');
          f = 0.7 * roa.bioavailabilityScalar;
        } else {
          f = baseline * roa.bioavailabilityScalar;
        }
        if (f > 0.95) f = 0.95;
        warnings.add(`Generic route bioavailability scaling used for ${ev.route}.`);
      }
    }
    if (!Number.isFinite(f) || f < 0 || f > 1) {
      warnings.add('Invalid bioavailability; a bounded generic default was used.');
      f = Number.isFinite(f) ? Math.min(1, Math.max(0, f)) : 0.7;
    }
    const dose = Math.min(ev.doseMg, 1e7);
    if (dose !== ev.doseMg) warnings.add('Extreme dose was bounded to 10000000 mg for numerical stability.');
    const doseMultiplier = (dose * f) / Vd;
    const curve = makeEventCurve(ev, doseMultiplier, ka, k, releaseHours, lagHours);
    return { curve, ka, lagHours, releaseHours, doseMultiplier, isBolusOrInfusion };
  });
  const eventCurves = profiles.map((profile) => profile.curve);

  const series: PlasmaPoint[] = [];
  const maxHour = validEvents.length > 0 ? validEvents[validEvents.length - 1].administrationHour : 0;
  
  const maxReleaseHours = profiles.reduce(
    (max, profile, index) => Math.max(max, profile.lagHours +
      (profile.releaseHours ?? validEvents[index].infusionDurationHours ?? 0)),
    0,
  );
  const slowestAbsorptionTail = profiles.reduce(
    (max, profile) => Math.max(max, profile.isBolusOrInfusion ? 0 : 10 * Math.LN2 / profile.ka),
    0,
  );
  const desiredHorizon = maxHour + Math.max(tHalf * 10, slowestAbsorptionTail) + maxReleaseHours;
  const horizonHours = Math.min(
    desiredHorizon,
    24 * 30,
  );
  if (desiredHorizon > horizonHours) {
    warnings.add('Horizon truncation: the 720-hour limit excludes later doses or residual exposure; AUC is finite-horizon, not total exposure.');
  }
  
  const steps = 300;
  const dt = horizonHours / steps;
  const sampleTimes = new Set<number>();
  for (let i = 0; i <= steps; i++) sampleTimes.add(i * dt);
  sampleTimes.add(horizonHours);
  for (let index = 0; index < validEvents.length; index++) {
    const event = validEvents[index];
    const { releaseHours, lagHours, ka } = profiles[index];
    const origin = event.administrationHour + lagHours;
    sampleTimes.add(event.administrationHour);
    sampleTimes.add(origin);
    if (origin > horizonHours) continue;
    const deliveryHours = event.infusionDurationHours ?? releaseHours;
    if (deliveryHours !== undefined && origin + deliveryHours <= horizonHours) {
      sampleTimes.add(origin + deliveryHours);
    }
    const curve = eventCurves[index];
    if (!profiles[index].isBolusOrInfusion) {
      if (releaseHours !== undefined) {
        let left = origin;
        let right = Math.min(horizonHours, origin + releaseHours + 6 * Math.max(tHalf, Math.LN2 / ka));
        for (let iteration = 0; iteration < 40; iteration++) {
          const first = left + (right - left) / 3;
          const second = right - (right - left) / 3;
          if (curve(first) < curve(second)) left = first;
          else right = second;
        }
        sampleTimes.add((left + right) / 2);
      } else {
        const relativeDifference = (ka - k) / k;
        const tmax = ka === k ? 1 / k :
          (Math.abs(relativeDifference) < 0.5 ? Math.log1p(relativeDifference) : Math.log(ka / k)) / (ka - k);
        if (origin + tmax <= horizonHours) {
          sampleTimes.add(origin + tmax);
        }
      }
    }
  }
  let peak = 0;
  let peakHour = 0;

  let peakIndividualDose = 0;
  for (const t of [...sampleTimes].filter((time) => time >= 0 && time <= horizonHours).sort((a, b) => a - b)) {
    let c = 0;
    for (const fn of eventCurves) {
      c += fn(t);
    }
    if (c > peak) {
      peak = c;
      peakHour = t;
      peakIndividualDose = eventCurves.reduce((max, fn) => Math.max(max, fn(t)), 0);
    }
    series.push({ hour: t, concentration: c });
  }

  const dss = daysToSteadyState(tHalf);
  const inferredInterval = regularInterval(validEvents);
  const repeatableSchedule =
    validEvents.length > 1 &&
    validEvents.every(
      (event) =>
        event.doseMg === validEvents[0].doseMg &&
        event.route === validEvents[0].route &&
        event.formulation === validEvents[0].formulation &&
        event.kaOverride === validEvents[0].kaOverride &&
        event.infusionDurationHours === validEvents[0].infusionDurationHours,
    );
  const steadyStateInterval =
    steadyStateIntervalHours !== undefined && Number.isFinite(steadyStateIntervalHours) && steadyStateIntervalHours > 0
      ? steadyStateIntervalHours
      : repeatableSchedule ? inferredInterval : undefined;
  const steadyStateTail = profiles.length > 0 ? Math.max(tHalf,
    profiles[0].isBolusOrInfusion ? 0 : Math.LN2 / profiles[0].ka,
    (profiles[0].lagHours + (profiles[0].releaseHours ?? validEvents[0].infusionDurationHours ?? 0)) / 40,
  ) : tHalf;
  if (steadyStateInterval !== undefined && (40 * steadyStateTail) / steadyStateInterval + 2 > 20000) {
    warnings.add('Steady-state trough summation was truncated at 20000 periods; very slow kinetics or short intervals can underestimate the trough.');
  }
  const inferredTau = inferredInterval ?? (validEvents.length > 1
    ? validEvents.slice(1).map((event, index) => event.administrationHour - validEvents[index].administrationHour)
      .filter((interval) => interval > 0)
      .sort((a, b) => a - b)[Math.floor((validEvents.length - 2) / 2)] ?? 0
    : 0);
  
  // Tolerance calculation (perceived effect)
  // For now, if events array is massive (long history), we could scale tolerance up.
  const tol = Number.isFinite(patient.tolerance) ? Math.max(0, Math.min(100, patient.tolerance)) : 0;
  const toleranceScalar = Math.max(0.2, 1 - (tol / 100) * 0.8);
  const aucMgHourL = profiles.reduce((total, profile, index) => {
    const event = validEvents[index];
    const origin = event.administrationHour + profile.lagHours;
    const elapsed = horizonHours - origin;
    if (elapsed <= 0) return total;
    if (profile.isBolusOrInfusion && event.infusionDurationHours === undefined) {
      return total + profile.doseMultiplier * -Math.expm1(-k * elapsed) / k;
    }
    if (!profile.isBolusOrInfusion && profile.releaseHours === undefined) {
      return total + profile.doseMultiplier * absorptionIntegral(0, elapsed, profile.ka, k);
    }
    // Split at delivery boundaries and both kinetic timescales so adaptive
    // quadrature cannot miss a narrow peak on an otherwise long horizon.
    const deliveryEnd = origin + (event.infusionDurationHours ?? profile.releaseHours ?? 0);
    const breakpoints = [origin, horizonHours, deliveryEnd];
    for (const boundary of [origin, deliveryEnd]) {
      for (let delta = Math.min(1 / k, 1 / profile.ka); delta < horizonHours - boundary; delta *= 2) {
        breakpoints.push(boundary + delta);
      }
    }
    const times = [...new Set(breakpoints.filter((time) =>
      time >= origin && time <= horizonHours))].sort((a, b) => a - b);
    const normalizedCurve = makeEventCurve(event, 1, profile.ka, k, profile.releaseHours, profile.lagHours);
    return total + profile.doseMultiplier * times.slice(1).reduce((area, time, i) =>
      area + integrateCurve(normalizedCurve, times[i], time), 0);
  }, 0);

  return {
    substanceId: substance.id,
    effectiveHalfLifeHours: tHalf,
    baseHalfLifeHours: baseHalfLife,
    clearanceMultiplier: multiplier,
    clearanceFactors: factors,
    accumulationRatio: peakIndividualDose > 0 ? peak / peakIndividualDose : 1,
    daysToSteadyState: dss,
    tauHours: inferredTau,
    series,
    peakConcentration: peak,
    steadyStateTrough:
      steadyStateInterval !== undefined && eventCurves.length > 0
        ? periodicTrough(
            eventCurves[0],
            steadyStateInterval,
            steadyStateTail,
            validEvents[0].administrationHour,
          )
        : 0,
    toleranceScalar,
    aucMgHourL,
    peakHour,
    horizonHours,
    warnings: [...warnings],
  };
}

/**
 * Backwards compatible wrapper for the UI
 */
export function computePK(
  patient: PatientProfile,
  substance: Substance,
  regimen: RegimenConfig,
  activeSubstances: Substance[] = []
): PKResult {
  const events = flattenRegimensToEvents(regimen, substance);
  const tau = tauHours(regimen.frequency);
  const isGeneratedDaily = regimen.mode === 'daily' && !(regimen.customEvents && regimen.customEvents.length > 0);
  const result = computeEventPK(
    patient,
    substance,
    events,
    activeSubstances,
    isGeneratedDaily ? tau : undefined,
  );
  if (regimen.customEvents && events.length !== regimen.customEvents.length) {
    result.warnings.push('Invalid dose events were discarded or the 2000-event timeline limit was applied.');
  }
  
  if (isGeneratedDaily) {
    result.tauHours = tau;
    result.accumulationRatio = accumulationRatio(result.effectiveHalfLifeHours, tau);
  }
  
  return result;
}

export interface UnpackedDose {
  substance: Substance;
  regimen: RegimenConfig;
  isConstituent: boolean;
  isEntourageHolistic: boolean;
  parentSourceId?: string;
}

/**
 * Resolves active metabolites for a parent substance and generates their DoseEvents.
 * The formation rate (ka) of the metabolite is strictly the elimination rate (k) of the parent.
 */
export function generateMetaboliteEvents(
  parentEvents: DoseEvent[],
  parentEliminationRateK: number,
  metaboliteTargetId: string,
  conversionFraction: number
): DoseEvent[] {
  return parentEvents.map(ev => ({
    id: `${ev.id}-metab-${metaboliteTargetId}`,
    substanceId: metaboliteTargetId,
    doseMg: ev.doseMg * conversionFraction,
    // Systemic conversion acts identically to 100% bioavailable IV with custom ka = parent_k
    route: 'IV',
    formulation: 'IR',
    administrationHour: ev.administrationHour,
    kaOverride: parentEliminationRateK
  }));
}

/**
 * Unpacks a plant or mixture into its constituent active ingredients
 * based on defined mass ratios, supporting custom overrides.
 * Includes the parent plant as a holistic entourage profile.
 */
export function unpackMixtures(
  substance: Substance,
  regimen: RegimenConfig,
  database: Substance[]
): UnpackedDose[] {
  if (!substance.activeIngredients || substance.activeIngredients.length === 0) {
    return [{ substance, regimen, isConstituent: false, isEntourageHolistic: false }];
  }

  const results: UnpackedDose[] = [];

  // 1. Add the holistic parent plant (Option B: Strip heavy tags to avoid double counting)
  const heavyTags = new Set(['opioid', 'cns-depressant', 'respiratory-depressant', 'serotonergic', 'stimulant', 'gaba-ergic']);
  const holisticSubstance: Substance = {
    ...substance,
    tags: substance.tags?.filter(t => !heavyTags.has(t)) || []
  };

  results.push({
    substance: holisticSubstance,
    regimen,
    isConstituent: false,
    isEntourageHolistic: true
  });

  // 2. Add the active constituents using default or custom ratios
  for (const ingredient of substance.activeIngredients) {
    const ratio = regimen.customConstituentRatios?.[ingredient.id] ?? ingredient.ratio;
    
    if (ratio <= 0) continue;

    const activeSub = database.find(s => s.id === ingredient.id);
    if (activeSub) {
      results.push({
        substance: activeSub,
        regimen: {
          ...regimen,
          doseMg: regimen.doseMg * ratio,
          dailyDoseMg: regimen.dailyDoseMg * ratio
        },
        isConstituent: true,
        isEntourageHolistic: false,
        parentSourceId: substance.id
      });
    }
  }
  
  return results;
}

export function formatHours(h: number): string {
  if (!isFinite(h)) return '∞';
  if (h < 1) return `${Math.round(h * 60)} min`;
  if (h < 48) return `${h.toFixed(1)} h`;
  return `${(h / 24).toFixed(1)} d`;
}
