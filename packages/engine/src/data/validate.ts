import { BODY_SYSTEMS, ROUTES, SUBSTANCE_CATEGORIES, type Substance } from './types';

/** A single problem found while validating the substance database. */
export interface ValidationIssue {
  substanceId: string;
  field: string;
  message: string;
}

const BODY_SYSTEM_SET = new Set<string>(BODY_SYSTEMS);
const ROUTE_SET = new Set<string>(ROUTES);
const CATEGORY_SET = new Set<string>(SUBSTANCE_CATEGORIES);
const ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

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
    if (!(s.halfLifeHours > 0))
      add('halfLifeHours', `halfLifeHours must be > 0 (got ${s.halfLifeHours})`);

    // dose range / typical dose (0 is allowed for substances not dosed in mg,
    // e.g. inhaled gases; negative values and inverted ranges are not).
    if (s.doseRangeMg) {
      const [lo, hi] = s.doseRangeMg;
      if (lo < 0 || hi < 0) add('doseRangeMg', 'dose range values must be >= 0');
      if (lo > hi) add('doseRangeMg', `dose range is inverted ([${lo}, ${hi}])`);
      if (s.typicalDoseMg !== undefined && (s.typicalDoseMg < lo || s.typicalDoseMg > hi))
        add(
          'typicalDoseMg',
          `typicalDoseMg ${s.typicalDoseMg} is outside doseRangeMg [${lo}, ${hi}]`,
        );
    }
    if (s.typicalDoseMg !== undefined && s.typicalDoseMg < 0)
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

    // routes
    if (!s.routes?.length) add('routes', 'at least one route is required');
    for (const r of s.routes ?? [])
      if (!ROUTE_SET.has(r)) add('routes', `unknown route "${r}"`);

    // body systems
    if (!s.bodySystems?.length) add('bodySystems', 'at least one body system is required');
    for (const b of s.bodySystems ?? [])
      if (!BODY_SYSTEM_SET.has(b)) add('bodySystems', `unknown body system "${b}"`);
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
