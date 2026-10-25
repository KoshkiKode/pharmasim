import {
  BODY_SYSTEMS, ROUTES, SUBSTANCE_CATEGORIES, PARAMETER_EVIDENCE_UNITS,
  type Substance, type SubstanceParameter,
} from './types';

/** A single problem found while validating the substance database. */
export interface ValidationIssue {
  substanceId: string;
  field: string;
  message: string;
}

const BODY_SYSTEM_SET = new Set<string>(BODY_SYSTEMS);
const ROUTE_SET = new Set<string>(ROUTES);
const CATEGORY_SET = new Set<string>(SUBSTANCE_CATEGORIES);
const FORMULATION_SET = new Set(['IR', 'ER', 'XR', 'CR']);
const ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isNonemptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

function validateEvidence(s: Substance, add: (field: string, message: string) => void): void {
  if (s.parameterEvidence === undefined) return;
  if (!isRecord(s.parameterEvidence)) {
    add('parameterEvidence', 'parameterEvidence must be an object');
    return;
  }
  for (const [parameter, evidence] of Object.entries(s.parameterEvidence)) {
    const field = `parameterEvidence.${parameter}`;
    if (!Object.prototype.hasOwnProperty.call(PARAMETER_EVIDENCE_UNITS, parameter)) {
      add(field, `unknown evidence parameter "${parameter}"`);
      continue;
    }
    const value = s[parameter as SubstanceParameter];
    if (value == null || (typeof value === 'object' && Object.keys(value).length === 0))
      add(field, 'evidence requires a present, nonempty parameter value, including unknown basis');
    if (!isRecord(evidence)) {
      add(field, 'evidence must be an object');
      continue;
    }
    let validUrl = false;
    if (isNonemptyString(evidence.sourceUrl) && /^https:\/\//i.test(evidence.sourceUrl)) {
      try {
        const url = new URL(evidence.sourceUrl);
        validUrl = url.protocol === 'https:' && url.hostname.length > 0;
      } catch { /* Invalid URLs are reported below. */ }
    }
    if (!validUrl) add(`${field}.sourceUrl`, 'sourceUrl must be an absolute HTTPS URL');
    if (!isNonemptyString(evidence.sourceTitle))
      add(`${field}.sourceTitle`, 'sourceTitle must be a nonempty string');
    const date = evidence.reviewedAt;
    const parsed = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? new Date(`${date}T00:00:00.000Z`) : undefined;
    if (!parsed || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date)
      add(`${field}.reviewedAt`, 'reviewedAt must be a real YYYY-MM-DD calendar date');
    if (!['high', 'moderate', 'low'].includes(evidence.quality as string))
      add(`${field}.quality`, 'quality must be high, moderate, or low');
    if (!['measured', 'estimated', 'unknown'].includes(evidence.basis as string))
      add(`${field}.basis`, 'basis must be measured, estimated, or unknown');
    const unit = PARAMETER_EVIDENCE_UNITS[parameter as SubstanceParameter];
    if (evidence.unit !== unit) add(`${field}.unit`, `unit must be "${unit}"`);
    if (evidence.notes !== undefined && !isNonemptyString(evidence.notes))
      add(`${field}.notes`, 'notes must be a nonempty string when present');
  }
}

/**
 * Validate the substance database for the invariants the app and engines rely
 * on. The TypeScript types already constrain literal fields (categories, tags,
 * routes, body systems); this catches the things the type system cannot —
 * duplicate ids, malformed ids, nonsensical numeric ranges, and empty
 * required collections. Used by the test suite and as a dev-mode guard so a
 * malformed entry fails loudly instead of silently breaking search or PK.
 */
export function validateSubstances(list: Substance[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seenIds = new Set<string>();
  const byId = new Map(list.map((s) => [s.id, s]));

  for (const s of list) {
    const add = (field: string, message: string) =>
      issues.push({ substanceId: s.id || '(missing id)', field, message });

    // id
    if (!s.id) add('id', 'id is empty');
    else {
      if (!ID_PATTERN.test(s.id))
        add('id', `id "${s.id}" must be lowercase alphanumeric with hyphens`);
      if (seenIds.has(s.id)) add('id', `duplicate id "${s.id}"`);
      seenIds.add(s.id);
    }

    // name
    if (!s.name?.trim()) add('name', 'name is empty');
    if (!s.drugClass?.trim()) add('drugClass', 'drugClass is empty');
    if (!s.mechanism?.trim()) add('mechanism', 'mechanism is empty');

    // category
    if (!CATEGORY_SET.has(s.category)) add('category', `unknown category "${s.category}"`);

    // half-life
    if (!Number.isFinite(s.halfLifeHours) || !(s.halfLifeHours > 0))
      add('halfLifeHours', `halfLifeHours must be finite and > 0 (got ${s.halfLifeHours})`);

    // dose range / typical dose (0 is allowed for substances not dosed in mg,
    // e.g. inhaled gases; negative values, inverted ranges, and NaN are not).
    if (s.doseRangeMg) {
      const [lo, hi] = s.doseRangeMg;
      if (!Number.isFinite(lo) || !Number.isFinite(hi))
        add('doseRangeMg', 'dose range values must be finite numbers');
      else {
        if (lo < 0 || hi < 0) add('doseRangeMg', 'dose range values must be >= 0');
        if (lo > hi) add('doseRangeMg', `dose range is inverted ([${lo}, ${hi}])`);
        if (
          s.typicalDoseMg !== undefined &&
          Number.isFinite(s.typicalDoseMg) &&
          (s.typicalDoseMg < lo || s.typicalDoseMg > hi)
        )
          add(
            'typicalDoseMg',
            `typicalDoseMg ${s.typicalDoseMg} is outside doseRangeMg [${lo}, ${hi}]`,
          );
      }
    }
    if (s.typicalDoseMg !== undefined && !Number.isFinite(s.typicalDoseMg))
      add('typicalDoseMg', 'typicalDoseMg must be a finite number');
    else if (s.typicalDoseMg !== undefined && s.typicalDoseMg < 0)
      add('typicalDoseMg', `typicalDoseMg must be >= 0 (got ${s.typicalDoseMg})`);

    if (!Number.isFinite(s.bioavailability) || s.bioavailability < 0 || s.bioavailability > 1)
      add('bioavailability', 'bioavailability must be finite and between 0 and 1');
    if (!Number.isFinite(s.vdLKg) || s.vdLKg <= 0)
      add('vdLKg', 'vdLKg must be finite and > 0');
    if (s.clearanceMlMinKg !== undefined && (!Number.isFinite(s.clearanceMlMinKg) || s.clearanceMlMinKg < 0))
      add('clearanceMlMinKg', 'clearanceMlMinKg must be finite and >= 0 when present');
    if (s.proteinBindingPct !== undefined && (!Number.isFinite(s.proteinBindingPct) || s.proteinBindingPct < 0 || s.proteinBindingPct > 100))
      add('proteinBindingPct', 'proteinBindingPct must be between 0 and 100');
    for (const [route, value] of Object.entries(s.bioavailabilityByRoute ?? {})) {
      if (!ROUTE_SET.has(route)) add('bioavailabilityByRoute', `unknown route "${route}"`);
      if (!Number.isFinite(value) || value < 0 || value > 1)
        add(`bioavailabilityByRoute.${route}`, 'route bioavailability must be between 0 and 1');
    }
    if (s.absorptionByRoute !== undefined && !isRecord(s.absorptionByRoute))
      add('absorptionByRoute', 'absorptionByRoute must be an object');
    for (const [route, value] of Object.entries(s.absorptionByRoute ?? {})) {
      const field = `absorptionByRoute.${route}`;
      if (!ROUTE_SET.has(route)) add(field, `unknown route "${route}"`);
      if (!isRecord(value)) {
        add(field, 'absorption parameters must be an object');
        continue;
      }
      if (typeof value.kaPerHour !== 'number' || !Number.isFinite(value.kaPerHour) || value.kaPerHour <= 0)
        add(`${field}.kaPerHour`, 'kaPerHour must be finite and > 0');
      if (value.lagHours !== undefined && (typeof value.lagHours !== 'number' || !Number.isFinite(value.lagHours) || value.lagHours < 0))
        add(`${field}.lagHours`, 'lagHours must be finite and >= 0');
    }
    if (s.releaseHoursByFormulation !== undefined && !isRecord(s.releaseHoursByFormulation))
      add('releaseHoursByFormulation', 'releaseHoursByFormulation must be an object');
    for (const [formulation, value] of Object.entries(s.releaseHoursByFormulation ?? {})) {
      const field = `releaseHoursByFormulation.${formulation}`;
      if (!FORMULATION_SET.has(formulation)) add(field, `unknown formulation "${formulation}"`);
      if (!Number.isFinite(value) || value <= 0)
        add(field, 'release duration must be finite and > 0');
    }
    validateEvidence(s, add);
    if (s.toxicity) {
      const { toxicConcentrationMgL, lethalConcentrationMgL } = s.toxicity;
      if (!Number.isFinite(toxicConcentrationMgL) || toxicConcentrationMgL < 0)
        add('toxicity.toxicConcentrationMgL', 'toxic threshold must be finite and >= 0');
      if (!Number.isFinite(lethalConcentrationMgL) || lethalConcentrationMgL < toxicConcentrationMgL)
        add('toxicity.lethalConcentrationMgL', 'lethal threshold must be finite and >= toxic threshold');
    }
    const ingredientIds = new Set<string>();
    let ingredientRatioTotal = 0;
    for (const ingredient of s.activeIngredients ?? []) {
      if (!ingredient.id.trim()) add('activeIngredients', 'ingredient id must not be empty');
      else if (!byId.has(ingredient.id)) add('activeIngredients', `unknown ingredient "${ingredient.id}"`);
      if (ingredient.id === s.id) add('activeIngredients', 'ingredient must not reference itself');
      if (ingredientIds.has(ingredient.id)) add('activeIngredients', `duplicate ingredient "${ingredient.id}"`);
      ingredientIds.add(ingredient.id);
      if (!Number.isFinite(ingredient.ratio) || ingredient.ratio < 0 || ingredient.ratio > 1)
        add(`activeIngredients.${ingredient.id}`, 'ingredient ratio must be between 0 and 1');
      ingredientRatioTotal += ingredient.ratio;
    }
    if (ingredientRatioTotal > 1.000001)
      add('activeIngredients', `ingredient ratios total ${ingredientRatioTotal.toFixed(4)}, above 1`);
    for (const [index, metabolite] of (s.metabolites ?? []).entries()) {
      if (!metabolite.targetId.trim()) add(`metabolites.${index}.targetId`, 'metabolite targetId must not be empty');
      else if (!byId.has(metabolite.targetId)) add(`metabolites.${index}.targetId`, `unknown metabolite "${metabolite.targetId}"`);
      if (metabolite.targetId === s.id) add(`metabolites.${index}.targetId`, 'metabolite must not reference itself');
      if (!Number.isFinite(metabolite.conversionFraction) || metabolite.conversionFraction < 0 || metabolite.conversionFraction > 1)
        add(`metabolites.${index}.conversionFraction`, 'conversion fraction must be between 0 and 1');
      if (!metabolite.enzyme.trim()) add(`metabolites.${index}.enzyme`, 'metabolite enzyme must not be empty');
    }
    for (const [receptor, affinity] of Object.entries(s.bindingAffinities ?? {})) {
      if (!receptor.trim()) add('bindingAffinities', 'receptor name must not be empty');
      if (!Number.isFinite(affinity.kiNm) || affinity.kiNm <= 0)
        add(`bindingAffinities.${receptor}.kiNm`, 'kiNm must be finite and > 0');
      if (!Number.isFinite(affinity.intrinsicActivity) || affinity.intrinsicActivity < 0 || affinity.intrinsicActivity > 1)
        add(`bindingAffinities.${receptor}.intrinsicActivity`, 'intrinsic activity must be between 0 and 1');
    }
    if (s.molarMassGPerMol !== undefined && (!Number.isFinite(s.molarMassGPerMol) || s.molarMassGPerMol <= 0))
      add('molarMassGPerMol', 'molarMassGPerMol must be finite and > 0');

    // routes
    if (!s.routes?.length) add('routes', 'at least one route is required');
    for (const r of s.routes ?? [])
      if (!ROUTE_SET.has(r)) add('routes', `unknown route "${r}"`);

    // body systems
    if (!s.bodySystems?.length) add('bodySystems', 'at least one body system is required');
    for (const b of s.bodySystems ?? [])
      if (!BODY_SYSTEM_SET.has(b)) add('bodySystems', `unknown body system "${b}"`);
  }

  // Mixture expansion and metabolite formation must not recurse through cycles,
  // including cycles that alternate between the two relationship kinds.
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const visit = (s: Substance): void => {
    if (visited.has(s.id)) return;
    visiting.add(s.id);
    const edges = [
      ...(s.activeIngredients ?? []).map((i) => ({ target: i.id, field: 'activeIngredients' })),
      ...(s.metabolites ?? []).map((m, index) => ({ target: m.targetId, field: `metabolites.${index}.targetId` })),
    ];
    for (const { target, field } of edges) {
      if (target === s.id) continue; // Already reported with the field-level checks.
      if (visiting.has(target))
        issues.push({ substanceId: s.id, field, message: `cyclic substance reference to "${target}"` });
      else if (byId.has(target)) visit(byId.get(target)!);
    }
    visiting.delete(s.id);
    visited.add(s.id);
  };
  for (const s of list) visit(s);
  return issues;
}

/**
 * Non-fatal one-compartment consistency audit. CL (mL/min/kg) is converted to
 * L/h/kg; expected t½ = ln(2) × Vd / CL. Report >25% discrepancy relative to the
 * listed half-life. Zero/invalid CL cannot imply a finite half-life and is
 * skipped; structural validation remains separate from this approximate model.
 */
export function auditSubstanceConsistency(list: Substance[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const s of list) {
    const cl = s.clearanceMlMinKg;
    if (cl === undefined || !Number.isFinite(cl) || cl <= 0 ||
        !Number.isFinite(s.vdLKg) || s.vdLKg <= 0 ||
        !Number.isFinite(s.halfLifeHours) || s.halfLifeHours <= 0) continue;
    const expected = Math.LN2 * s.vdLKg / (cl * 0.06);
    if (Math.abs(expected - s.halfLifeHours) / s.halfLifeHours > 0.25)
      issues.push({
        substanceId: s.id,
        field: 'halfLifeHours',
        message: `CL/Vd imply a half-life of ${expected.toFixed(3)} h, >25% different from listed ${s.halfLifeHours} h`,
      });
  }
  return issues;
}

/** Throw if the database has any validation issues, with a readable summary. */
export function assertValidSubstances(list: Substance[]): void {
  const issues = validateSubstances(list);
  if (issues.length === 0) return;
  const summary = issues
    .slice(0, 25)
    .map((i) => `  • [${i.substanceId}] ${i.field}: ${i.message}`)
    .join('\n');
  const more = issues.length > 25 ? `\n  …and ${issues.length - 25} more` : '';
  throw new Error(`Substance database has ${issues.length} validation issue(s):\n${summary}${more}`);
}
