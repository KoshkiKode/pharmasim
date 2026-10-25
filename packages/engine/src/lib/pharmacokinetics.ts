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
    const clearanceLHrKg = (substance.clearanceMlMinKg * 60) / 1000;
    // T1/2 = 0.693 * Vd / Cl
    if (clearanceLHrKg > 0) {
      baseHalfLife = (0.693 * substance.vdLKg) / clearanceLHrKg;
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
        (event.kaOverride === undefined || (Number.isFinite(event.kaOverride) && event.kaOverride > 0)),
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
  const totalDays = Math.max(1, regimen.mode === 'daily' ? regimen.daysOnRegimen : 1);
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
  if (dt < 0) return 0;
  if (Math.abs(ka - k) < 1e-8) return k * dt * Math.exp(-k * dt);
  return (ka / (ka - k)) * Math.exp(-k * dt) * -Math.expm1(-(ka - k) * dt);
}

function makeEventCurve(
  event: DoseEvent,
  doseMultiplier: number,
  ka: number,
  k: number,
): (time: number) => number {
  const releaseHours = event.route === 'IV' ? undefined : RELEASE_HOURS[event.formulation];

  if (event.route === 'IV' && event.kaOverride === undefined) {
    return (time) => {
      const dt = time - event.administrationHour;
      return dt < 0 ? 0 : doseMultiplier * Math.exp(-k * dt);
    };
  }

  if (releaseHours !== undefined) {
    const releaseIntegral = (time: number, elapsed: number): number => {
      const start = time - elapsed;
      if (Math.abs(ka - k) < 1e-8) {
        return (ka / (k * k)) *
          ((1 + k * start) * Math.exp(-k * start) - (1 + k * time) * Math.exp(-k * time));
      }
      return (
        (Math.exp(-k * start) * -Math.expm1(-k * elapsed)) / k -
        (Math.exp(-ka * start) * -Math.expm1(-ka * elapsed)) / ka
      ) * (ka / (ka - k));
    };
    return (time) => {
      const dt = time - event.administrationHour;
      if (dt <= 0) return 0;
      const elapsed = Math.min(dt, releaseHours);
      return (doseMultiplier / releaseHours) * releaseIntegral(dt, elapsed);
    };
  }

  return (time) =>
    doseMultiplier * absorptionResponse(time - event.administrationHour, ka, k);
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
  const { multiplier, factors } = clearanceMultiplier(patient, substance, activeSubstances);
  
  let baseHalfLife = substance.halfLifeHours;
  if (substance.clearanceMlMinKg != null) {
    const clearanceLHrKg = (substance.clearanceMlMinKg * 60) / 1000;
    if (clearanceLHrKg > 0) baseHalfLife = (0.693 * substance.vdLKg) / clearanceLHrKg;
  }
  
  const tHalf = baseHalfLife / multiplier;
  const k = Math.log(2) / tHalf;

  let conditionVdScalar = 1.0;
  const patientConditions = (patient.conditions || []).map(id => conditions.find(c => c.id === id)).filter((c): c is NonNullable<typeof c> => c !== undefined);
  for (const cond of patientConditions) {
      if (cond.pkModifiers?.vdScalar) conditionVdScalar *= cond.pkModifiers.vdScalar;
  }
  const Vd = Math.max(0.01, substance.vdLKg * Math.max(0.1, patient.weightKg) * conditionVdScalar);

  const validEvents = validDoseEvents(events, substance.id);
  const eventCurves = validEvents.map((ev) => {
    const roa = ROA_MULTIPLIERS[ev.route] || ROA_MULTIPLIERS.oral;
    const ka = ev.kaOverride ?? Math.max(k * 1.1, 3.5 / roa.tmaxHours);
    let f = ev.route === 'IV' ? 1 : substance.bioavailability;
    if (ev.route !== 'IV' && substance.bioavailabilityByRoute && substance.bioavailabilityByRoute[ev.route] !== undefined) {
      f = substance.bioavailabilityByRoute[ev.route]!;
    } else {
      if (ev.route !== 'IV') {
        f = substance.bioavailability * roa.bioavailabilityScalar;
        if (f > 0.95) f = 0.95;
      }
    }

    return makeEventCurve(ev, (ev.doseMg * f) / Vd, ka, k);
  });

  const series: PlasmaPoint[] = [];
  const maxHour = validEvents.length > 0 ? validEvents[validEvents.length - 1].administrationHour : 0;
  
  const maxReleaseHours = validEvents.reduce(
    (max, event) => Math.max(max, event.route === 'IV' ? 0 : RELEASE_HOURS[event.formulation] ?? 0),
    0,
  );
  const horizonHours = Math.min(
    Math.max(tHalf * 10, maxHour + tHalf * 10 + maxReleaseHours),
    24 * 30,
  );
  
  const steps = 300;
  const dt = horizonHours / steps;
  const sampleTimes = new Set<number>();
  for (let i = 0; i <= steps; i++) sampleTimes.add(i * dt);
  for (let index = 0; index < validEvents.length; index++) {
    const event = validEvents[index];
    sampleTimes.add(event.administrationHour);
    const releaseHours = event.route === 'IV' ? undefined : RELEASE_HOURS[event.formulation];
    if (releaseHours !== undefined && event.administrationHour + releaseHours <= horizonHours) {
      sampleTimes.add(event.administrationHour + releaseHours);
    }
    const curve = eventCurves[index];
    if (event.route !== 'IV' && event.kaOverride === undefined) {
      if (releaseHours !== undefined) {
        let left = event.administrationHour;
        let right = Math.min(horizonHours, event.administrationHour + releaseHours + 6 * tHalf);
        for (let iteration = 0; iteration < 40; iteration++) {
          const first = left + (right - left) / 3;
          const second = right - (right - left) / 3;
          if (curve(first) < curve(second)) left = first;
          else right = second;
        }
        sampleTimes.add((left + right) / 2);
      } else {
        const ka = Math.max(k * 1.1, 3.5 / ROA_MULTIPLIERS[event.route].tmaxHours);
        const tmax = Math.abs(ka - k) < 1e-8 ? 1 / k : Math.log(ka / k) / (ka - k);
        if (event.administrationHour + tmax <= horizonHours) {
          sampleTimes.add(event.administrationHour + tmax);
        }
      }
    }
  }
  let peak = 0;

  let peakIndividualDose = 0;
  for (const t of [...sampleTimes].filter((time) => time >= 0 && time <= horizonHours).sort((a, b) => a - b)) {
    let c = 0;
    for (const fn of eventCurves) {
      c += fn(t);
    }
    if (c > peak) {
      peak = c;
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
        event.kaOverride === validEvents[0].kaOverride,
    );
  const steadyStateInterval =
    steadyStateIntervalHours !== undefined && Number.isFinite(steadyStateIntervalHours) && steadyStateIntervalHours > 0
      ? steadyStateIntervalHours
      : repeatableSchedule ? inferredInterval : undefined;
  const inferredTau = inferredInterval ?? (validEvents.length > 1
    ? validEvents.slice(1).map((event, index) => event.administrationHour - validEvents[index].administrationHour)
      .filter((interval) => interval > 0)
      .sort((a, b) => a - b)[Math.floor((validEvents.length - 2) / 2)] ?? 0
    : 0);
  
  // Tolerance calculation (perceived effect)
  // For now, if events array is massive (long history), we could scale tolerance up.
  const tol = patient.tolerance;
  const toleranceScalar = Math.max(0.2, 1 - (tol / 100) * 0.8);

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
            tHalf,
            validEvents[0].administrationHour,
          )
        : 0,
    toleranceScalar,
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
