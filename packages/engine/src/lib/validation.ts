import { conditions } from '../data/conditions';
import {
  BODY_SYSTEMS,
  ROUTES,
  type DoseEvent,
  type Formulation,
  type Route,
  type Substance,
} from '../data/types';
import type {
  Frequency,
  PatientProfile,
  RegimenConfig,
  MetabolizerPhenotype,
} from './pharmacokinetics';
import { defaultRegimen } from './state';

export interface InputIssue {
  field: string;
  message: string;
}

const FORMULATIONS = new Set<Formulation>(['IR', 'ER', 'XR', 'CR']);
const FREQUENCIES = new Set<Frequency>(['QD', 'BID', 'TID', 'QID']);
const ORGAN_HEALTH = new Set<PatientProfile['liver']>(['normal', 'reduced', 'impaired']);
const PHENOTYPES = new Set<MetabolizerPhenotype>([
  'poor',
  'normal',
  'rapid',
  'ultrarapid',
]);
const ROUTE_SET = new Set<string>(ROUTES);
const CONDITION_SET = new Set(conditions.map((condition) => condition.id));
const MAX_DOSE_MG = 10_000_000;

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function clamp(value: unknown, fallback: number, min: number, max: number): number {
  return finite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

export function validatePatientProfile(patient: PatientProfile): InputIssue[] {
  const issues: InputIssue[] = [];
  if (patient.biologicalSex !== 'M' && patient.biologicalSex !== 'F') {
    issues.push({ field: 'biologicalSex', message: 'must be M or F' });
  }
  if (!finite(patient.ageYears) || patient.ageYears < 0 || patient.ageYears > 120) {
    issues.push({ field: 'ageYears', message: 'must be between 0 and 120' });
  }
  if (!finite(patient.weightKg) || patient.weightKg <= 0 || patient.weightKg > 500) {
    issues.push({ field: 'weightKg', message: 'must be greater than 0 and at most 500' });
  }
  if (!finite(patient.heightCm) || patient.heightCm <= 0 || patient.heightCm > 300) {
    issues.push({ field: 'heightCm', message: 'must be greater than 0 and at most 300' });
  }
  if (!finite(patient.bodyFatPct) || patient.bodyFatPct < 0 || patient.bodyFatPct > 100) {
    issues.push({ field: 'bodyFatPct', message: 'must be between 0 and 100' });
  }
  if (!finite(patient.tolerance) || patient.tolerance < 0 || patient.tolerance > 100) {
    issues.push({ field: 'tolerance', message: 'must be between 0 and 100' });
  }
  if (!ORGAN_HEALTH.has(patient.liver)) issues.push({ field: 'liver', message: 'unknown organ-health value' });
  if (!ORGAN_HEALTH.has(patient.kidney)) issues.push({ field: 'kidney', message: 'unknown organ-health value' });
  if (!finite(patient.hydrationPct) || patient.hydrationPct < 0 || patient.hydrationPct > 100) {
    issues.push({ field: 'hydrationPct', message: 'must be between 0 and 100' });
  }
  if (!Array.isArray(patient.conditions)) {
    issues.push({ field: 'conditions', message: 'must be an array' });
  } else {
    for (const conditionId of patient.conditions) {
      if (!CONDITION_SET.has(conditionId)) {
        issues.push({ field: 'conditions', message: `unknown condition "${conditionId}"` });
      }
    }
  }
  if (!patient.genetics || typeof patient.genetics !== 'object') {
    issues.push({ field: 'genetics', message: 'must be an object' });
  } else {
    for (const [enzyme, phenotype] of Object.entries(patient.genetics)) {
      if (!enzyme.trim() || !PHENOTYPES.has(phenotype)) {
        issues.push({ field: `genetics.${enzyme}`, message: 'unknown metabolizer phenotype' });
      }
    }
  }
  return issues;
}

export function sanitizePatientProfile(
  fallback: PatientProfile,
  candidate: Partial<PatientProfile> | null | undefined,
): PatientProfile {
  const source = candidate && typeof candidate === 'object' ? candidate : {};
  const genetics: PatientProfile['genetics'] = { ...fallback.genetics };
  if (source.genetics && typeof source.genetics === 'object') {
    for (const [enzyme, phenotype] of Object.entries(source.genetics)) {
      if (enzyme.trim() && PHENOTYPES.has(phenotype)) genetics[enzyme] = phenotype;
    }
  }
  return {
    biologicalSex: source.biologicalSex === 'F' ? 'F' : source.biologicalSex === 'M' ? 'M' : fallback.biologicalSex,
    ageYears: clamp(source.ageYears, fallback.ageYears, 0, 120),
    weightKg: clamp(source.weightKg, fallback.weightKg, 0.1, 500),
    heightCm: clamp(source.heightCm, fallback.heightCm, 1, 300),
    bodyFatPct: clamp(source.bodyFatPct, fallback.bodyFatPct, 0, 100),
    tolerance: clamp(source.tolerance, fallback.tolerance, 0, 100),
    liver: isOrganHealth(source.liver) ? source.liver : fallback.liver,
    kidney: isOrganHealth(source.kidney) ? source.kidney : fallback.kidney,
    hydrationPct: clamp(source.hydrationPct, fallback.hydrationPct, 0, 100),
    genetics,
    conditions: Array.isArray(source.conditions)
      ? [...new Set(source.conditions.filter((id): id is string => typeof id === 'string' && CONDITION_SET.has(id)))]
      : [...fallback.conditions],
  };
}

function isOrganHealth(value: unknown): value is PatientProfile['liver'] {
  return typeof value === 'string' && ORGAN_HEALTH.has(value as PatientProfile['liver']);
}

function sanitizeDoseEvent(event: Partial<DoseEvent>, substance: Substance, index: number): DoseEvent | null {
  if (typeof event !== 'object' || event === null) return null;
  const route = typeof event.route === 'string' && ROUTE_SET.has(event.route)
    ? event.route as Route
    : substance.routes[0] ?? 'oral';
  const formulation = typeof event.formulation === 'string' && FORMULATIONS.has(event.formulation as Formulation)
    ? event.formulation as Formulation
    : 'IR';
  if (!finite(event.administrationHour) || event.administrationHour < 0) return null;
  const doseMg = clamp(event.doseMg, 0, 0, MAX_DOSE_MG);
  const kaOverride = finite(event.kaOverride) && event.kaOverride > 0 ? event.kaOverride : undefined;
  return {
    id: typeof event.id === 'string' && event.id.trim() ? event.id : `${substance.id}-${index}`,
    substanceId: substance.id,
    doseMg,
    route,
    formulation,
    administrationHour: event.administrationHour,
    ...(kaOverride === undefined ? {} : { kaOverride }),
  };
}

export function sanitizeRegimenConfig(
  substance: Substance,
  candidate: Partial<RegimenConfig> | null | undefined,
): RegimenConfig {
  const fallback = defaultRegimen(substance);
  const source = candidate && typeof candidate === 'object' ? candidate : {};
  const route = typeof source.route === 'string' && ROUTE_SET.has(source.route)
    ? source.route as Route
    : fallback.route;
  const customConstituentRatios: Record<string, number> = {};
  if (source.customConstituentRatios && typeof source.customConstituentRatios === 'object') {
    for (const [id, ratio] of Object.entries(source.customConstituentRatios)) {
      if (finite(ratio) && ratio >= 0 && ratio <= 1) customConstituentRatios[id] = ratio;
    }
  }
  const customEvents = Array.isArray(source.customEvents)
    ? source.customEvents
        .map((event, index) => sanitizeDoseEvent(event, substance, index))
        .filter((event): event is DoseEvent => event !== null)
    : undefined;
  return {
    mode: source.mode === 'daily' ? 'daily' : 'acute',
    doseMg: clamp(source.doseMg, fallback.doseMg, 0, MAX_DOSE_MG),
    dailyDoseMg: clamp(source.dailyDoseMg, fallback.dailyDoseMg, 0, MAX_DOSE_MG),
    daysOnRegimen: Math.round(clamp(source.daysOnRegimen, fallback.daysOnRegimen, 1, 365)),
    frequency: FREQUENCIES.has(source.frequency as Frequency) ? source.frequency as Frequency : fallback.frequency,
    toleranceOverride:
      source.toleranceOverride === null
        ? null
        : clamp(source.toleranceOverride, fallback.toleranceOverride ?? 0, 0, 100),
    ...(route === undefined ? {} : { route }),
    formulation:
      typeof source.formulation === 'string' && FORMULATIONS.has(source.formulation as Formulation)
        ? source.formulation as Formulation
        : fallback.formulation,
    ...(Object.keys(customConstituentRatios).length === 0 ? {} : { customConstituentRatios }),
    ...(customEvents && customEvents.length > 0 ? { customEvents } : {}),
  };
}

export function validateRegimenConfig(regimen: RegimenConfig): InputIssue[] {
  const issues: InputIssue[] = [];
  if (regimen.mode !== 'acute' && regimen.mode !== 'daily') issues.push({ field: 'mode', message: 'must be acute or daily' });
  if (!finite(regimen.doseMg) || regimen.doseMg < 0 || regimen.doseMg > MAX_DOSE_MG) issues.push({ field: 'doseMg', message: 'is outside the supported range' });
  if (!finite(regimen.dailyDoseMg) || regimen.dailyDoseMg < 0 || regimen.dailyDoseMg > MAX_DOSE_MG) issues.push({ field: 'dailyDoseMg', message: 'is outside the supported range' });
  if (!Number.isInteger(regimen.daysOnRegimen) || regimen.daysOnRegimen < 1 || regimen.daysOnRegimen > 365) issues.push({ field: 'daysOnRegimen', message: 'must be an integer from 1 to 365' });
  if (!FREQUENCIES.has(regimen.frequency)) issues.push({ field: 'frequency', message: 'unknown dosing frequency' });
  if (regimen.toleranceOverride !== null && (!finite(regimen.toleranceOverride) || regimen.toleranceOverride < 0 || regimen.toleranceOverride > 100)) {
    issues.push({ field: 'toleranceOverride', message: 'must be null or between 0 and 100' });
  }
  return issues;
}
