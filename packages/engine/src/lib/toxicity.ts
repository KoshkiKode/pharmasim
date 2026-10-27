import type { Substance } from '../data/types';
import type { PKResult } from './pharmacokinetics';

export interface ToxicityAlert {
  substanceId: string;
  name: string;
  peakConcentration: number;
  toxicThreshold: number;
  lethalThreshold: number;
  status: 'safe' | 'toxic' | 'lethal';
  hourOfPeak: number;
}

export function evaluateToxicity(pkResults: PKResult[], substances: Substance[]): ToxicityAlert[] {
  return pkResults.map(pk => {
    const substance = substances.find(s => s.id === pk.substanceId);
    if (!substance || !substance.toxicity) return null;

    const { toxicConcentrationMgL, lethalConcentrationMgL } = substance.toxicity;
    
    let status: 'safe' | 'toxic' | 'lethal' = 'safe';
    if (pk.peakConcentration >= lethalConcentrationMgL) {
      status = 'lethal';
    } else if (pk.peakConcentration >= toxicConcentrationMgL) {
      status = 'toxic';
    }

    return {
      substanceId: pk.substanceId,
      name: substance.name,
      peakConcentration: pk.peakConcentration,
      toxicThreshold: toxicConcentrationMgL,
      lethalThreshold: lethalConcentrationMgL,
      status,
      hourOfPeak: pk.peakHour
    };
  }).filter((alert): alert is NonNullable<typeof alert> => alert !== null);
}
