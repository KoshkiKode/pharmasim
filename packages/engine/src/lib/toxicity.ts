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

    let peakConcentration = 0;
    let hourOfPeak = 0;
    for (const point of pk.series) {
      if (point.concentration > peakConcentration) {
        peakConcentration = point.concentration;
        hourOfPeak = point.hour;
      }
    }

    const { toxicConcentrationMgL, lethalConcentrationMgL } = substance.toxicity;
    
    let status: 'safe' | 'toxic' | 'lethal' = 'safe';
    if (peakConcentration >= lethalConcentrationMgL) {
      status = 'lethal';
    } else if (peakConcentration >= toxicConcentrationMgL) {
      status = 'toxic';
    }

    return {
      substanceId: pk.substanceId,
      name: substance.name,
      peakConcentration,
      toxicThreshold: toxicConcentrationMgL,
      lethalThreshold: lethalConcentrationMgL,
      status,
      hourOfPeak
    };
  }).filter((alert): alert is NonNullable<typeof alert> => alert !== null);
}
