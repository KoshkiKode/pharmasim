export type SubstanceCategory =
  | 'pharmaceutical'
  | 'research-chemical'
  | 'chemical'
  | 'plant-herb'
  | 'recreational'
  | 'supplement';

/** All substance categories, in display order. */
export const SUBSTANCE_CATEGORIES: readonly SubstanceCategory[] = [
  'pharmaceutical',
  'research-chemical',
  'chemical',
  'plant-herb',
  'recreational',
  'supplement',
] as const;

/**
 * Canonical body systems. The interaction engine and body-system summary group
 * on these, so new substances must use one of these labels (extend this list to
 * introduce a new system).
 */
export const BODY_SYSTEMS = [
  'CNS',
  'Cardiovascular',
  'Respiratory',
  'GI',
  'Hepatic',
  'Renal',
  'Endocrine',
  'Metabolic',
  'Musculoskeletal',
  'Hematologic',
  'Immune',
  'Integumentary',
  'Genitourinary',
] as const;

export type BodySystem = (typeof BODY_SYSTEMS)[number];

/** Canonical routes of administration. */
export const ROUTES = [
  'oral',
  'sublingual',
  'intranasal',
  'inhaled',
  'rectal',
  'transdermal',
  'IV',
  'IM',
  'SC',
  'subcutaneous',
] as const;

export type Route = (typeof ROUTES)[number];

export interface Substance {
  id: string;
  name: string; // generic name
  brandNames: string[];
  category: SubstanceCategory;
  drugClass: string;
  halfLifeHours: number; // elimination half-life
  typicalDoseMg?: number;
  doseRangeMg?: [number, number];
  routes: Route[];
  /**
   * Metabolising enzyme(s). Usually CYP450 isoforms (e.g. `'CYP3A4'`) but may be
   * other clearance enzymes (`'MAO'`, `'alcohol dehydrogenase'`). The
   * interaction engine matches these by string against inhibit/induce fields.
   */
  cypMetabolism?: string[];
  cypInhibits?: string[];
  cypInduces?: string[];
  mechanism: string;
  bodySystems: BodySystem[];
  warnings?: string[];
  /** Pharmacodynamic interaction tags used by the rule engine. */
  tags?: SubstanceTag[];
  /** True when PK values are approximate / poorly characterised. */
  approximate?: boolean;
}

/**
 * Pharmacodynamic / mechanistic tags. The interaction engine reasons over these
 * plus CYP fields, so adding a tag to a substance automatically wires it into
 * the relevant interaction rules.
 */
export type SubstanceTag =
  | 'serotonergic'
  | 'maoi'
  | 'cns-depressant'
  | 'respiratory-depressant'
  | 'opioid'
  | 'benzodiazepine'
  | 'qt-prolonging'
  | 'anticoagulant'
  | 'antiplatelet'
  | 'nsaid'
  | 'sympathomimetic'
  | 'serotonin-releaser'
  | 'stimulant'
  | 'anticholinergic'
  | 'hepatotoxic'
  | 'nephrotoxic'
  | 'gaba-ergic'
  | 'dopaminergic'
  | 'alcohol';
