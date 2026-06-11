export type SubstanceCategory =
  | 'pharmaceutical'
  | 'research-chemical'
  | 'chemical'
  | 'plant-herb'
  | 'recreational'
  | 'supplement';

export interface Substance {
  id: string;
  name: string; // generic name
  brandNames: string[];
  category: SubstanceCategory;
  drugClass: string;
  halfLifeHours: number; // elimination half-life
  typicalDoseMg?: number;
  doseRangeMg?: [number, number];
  routes: string[];
  cypMetabolism?: string[];
  cypInhibits?: string[];
  cypInduces?: string[];
  mechanism: string;
  bodySystems: string[];
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
