import type { Substance } from '../data/types';

export interface RiskScores {
  anticholinergicBurden: number; // 0-3+ (3 is high risk)
  serotoninBurden: number;       // 0-3+ (3 is high risk)
  qtProlongationRisk: number;    // 0-3+ (3 is high risk)
}

function hasTag(s: Substance, tag: string): boolean {
  return !!s.tags?.includes(tag as any);
}

export function computeRiskScores(substances: Substance[]): RiskScores {
  let anticholinergicBurden = 0;
  let serotoninBurden = 0;
  let qtProlongationRisk = 0;

  for (const s of substances) {
    // 1. Anticholinergic Burden
    // E.g., Doxepin, Amitriptyline, Diphenhydramine (these are typically strong ACB=3)
    // We'll use a simplified tag-based scoring since we don't have ACB hardcoded in the DB
    if (hasTag(s, 'anticholinergic')) {
      // If it's a strong anticholinergic (TCA or First-gen antihistamine)
      if (s.drugClass.includes('TCA') || s.drugClass.includes('First-generation antihistamine')) {
        anticholinergicBurden += 3;
      } else if (s.drugClass.includes('antipsychotic') || s.drugClass.includes('SSRI') || s.drugClass.includes('SNRI')) {
        anticholinergicBurden += 1;
      } else {
        anticholinergicBurden += 2;
      }
    }

    // 2. Serotonin Burden
    if (hasTag(s, 'serotonergic') || hasTag(s, 'serotonin-releaser') || hasTag(s, 'maoi')) {
      if (hasTag(s, 'maoi') || hasTag(s, 'serotonin-releaser')) {
        serotoninBurden += 3;
      } else if (s.drugClass.includes('SSRI') || s.drugClass.includes('SNRI')) {
        serotoninBurden += 2;
      } else {
        serotoninBurden += 1;
      }
    }

    // 3. QT Prolongation
    if (hasTag(s, 'qt-prolonging')) {
      if (s.drugClass.includes('Antiarrhythmic') || s.drugClass.includes('fluoroquinolone') || s.drugClass.includes('macrolide')) {
        qtProlongationRisk += 3;
      } else if (s.drugClass.includes('SSRI') || s.drugClass.includes('antipsychotic') || s.drugClass.includes('TCA')) {
        qtProlongationRisk += 2;
      } else {
        qtProlongationRisk += 1;
      }
    }
  }

  return {
    anticholinergicBurden,
    serotoninBurden,
    qtProlongationRisk,
  };
}

export function getRiskLevel(score: number): 'low' | 'moderate' | 'high' {
  if (score >= 3) return 'high';
  if (score >= 1) return 'moderate';
  return 'low';
}
