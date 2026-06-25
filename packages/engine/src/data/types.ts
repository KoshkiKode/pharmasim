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

export type Formulation = 'IR' | 'ER' | 'XR' | 'CR';

export interface DoseEvent {
  id: string;
  substanceId: string;
  doseMg: number;
  route: Route;
  formulation: Formulation;
  administrationHour: number; // T=0 is start of timeline
  kaOverride?: number; // Used for modeling metabolite formation
}

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

  // New clinical and safety properties
  pregnancyCategory?: 'A' | 'B' | 'C' | 'D' | 'X';
  lactationWarning?: string;
  foodInteractions?: string[];
  renalDosingWarning?: string;
  hepaticDosingWarning?: string;

  // Advanced PK properties
  bioavailability: number; // Fraction 0..1 (Baseline / Oral)
  bioavailabilityByRoute?: Partial<Record<Route, number>>; // Explicit clinical bioavailability per route
  vdLKg: number; // Volume of distribution (L/kg)
  clearanceMlMinKg?: number; // Systemic clearance (mL/min/kg)
  proteinBindingPct?: number; // 0..100
  
  // Relational Properties
  /** If this is a mixture/plant, the active ingredients and their typical mass ratio (0..1) */
  activeIngredients?: { id: string; ratio: number }[];
  /** If this is an active ingredient, the primary plant/source it comes from */
  parentSource?: string;
  /** Known synthetic or semi-synthetic derivatives */
  derivatives?: string[];

  // Advanced Simulation Properties
  /** Active metabolites generated as this drug is cleared */
  metabolites?: { targetId: string; conversionFraction: number; enzyme: string }[];
  /** Receptor binding affinities. kiNm = Affinity (lower = stronger). intrinsicActivity: 1=full agonist, 0=antagonist, <1=partial */
  bindingAffinities?: Record<string, { kiNm: number; intrinsicActivity: number }>; 
  /** Concentration thresholds for toxicity and death */
  toxicity?: { toxicConcentrationMgL: number; lethalConcentrationMgL: number };

  /** Auto-generated encyclopedic blurb summarizing the drug */
  encyclopediaEntry?: string;
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
  | 'alcohol'
  | 'psychosis-risk'
  | 'dissociative'
  | 'cholinergic'
  | 'excitotoxic'
  | 'vasoconstrictor'
  | 'holistic';

export type ConditionCategory = 'oncology' | 'cardiovascular' | 'neurological' | 'renal' | 'hepatic' | 'respiratory' | 'psychiatric' | 'autoimmune' | 'infectious' | 'endocrine' | 'other';
export type OrganHealth = 'impaired' | 'reduced' | 'normal';

export interface Condition {
  id: string;
  name: string;
  category: ConditionCategory;
  description: string;
  
  // --- PK INTEGRATION ---
  pkModifiers?: {
    forceLiverHealth?: OrganHealth; // Automatically downgrades liver function (e.g. Cirrhosis forces 'impaired')
    forceKidneyHealth?: OrganHealth; // Automatically downgrades kidney function (e.g. CKD Stage 4)
    clearanceScalar?: number; // E.g., Heart Failure reduces organ perfusion, lowering clearance across the board by 20%
    vdScalar?: number; // E.g., Severe ascites/edema massively increases Volume of Distribution for water-soluble drugs
    justification?: string; // Medical justification for why these specific scalars are applied
  };

  // --- PD & RISK INTEGRATION ---
  contraindicatedTags?: SubstanceTag[]; // E.g. Hypertension -> 'stimulant' triggers a severe risk alert
  indicatedTags?: SubstanceTag[]; // E.g. Anxiety -> 'benzodiazepine' shows up as a therapeutic indication
}
