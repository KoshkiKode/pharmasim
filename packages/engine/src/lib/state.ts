import type { Substance } from '../data/types';
import type { RegimenConfig } from './pharmacokinetics';

export interface AddedSubstance {
  substance: Substance;
  regimen: RegimenConfig;
  advancedOpen: boolean;
}

export function defaultRegimen(s: Substance): RegimenConfig {
  const dose = s.typicalDoseMg ?? 100;
  return {
    mode: 'acute',
    doseMg: dose,
    dailyDoseMg: dose,
    daysOnRegimen: 7,
    frequency: 'QD',
    toleranceOverride: null,
  };
}

export const CATEGORY_LABELS: Record<Substance['category'], string> = {
  pharmaceutical: 'Pharmaceutical',
  'research-chemical': 'Research chemical',
  chemical: 'Chemical',
  'plant-herb': 'Plant / herb',
  recreational: 'Recreational',
  supplement: 'Supplement',
};

export const CATEGORY_COLOR: Record<Substance['category'], string> = {
  pharmaceutical: '#38bdf8',
  'research-chemical': '#a78bfa',
  chemical: '#f472b6',
  'plant-herb': '#4ade80',
  recreational: '#fb923c',
  supplement: '#facc15',
};
