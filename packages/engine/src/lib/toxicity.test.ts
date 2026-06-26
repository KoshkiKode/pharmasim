import { describe, expect, it } from 'vitest';
import { evaluateToxicity } from './toxicity';
import type { Substance } from '../data/types';
import type { PKResult } from './pharmacokinetics';

const mockSubstances: Substance[] = [
  {
    id: 'test-drug-tox',
    name: 'ToxicDrug',
    brandNames: [],
    category: 'pharmaceutical',
    drugClass: 'Test',
    halfLifeHours: 4,
    routes: ['oral'],
    mechanism: 'Testing.',
    bodySystems: ['CNS'],
    bioavailability: 1.0,
    vdLKg: 1.0,
    toxicity: {
      toxicConcentrationMgL: 5.0,
      lethalConcentrationMgL: 10.0,
    },
  },
  {
    id: 'test-drug-safe',
    name: 'SafeDrug',
    brandNames: [],
    category: 'pharmaceutical',
    drugClass: 'Test',
    halfLifeHours: 4,
    routes: ['oral'],
    mechanism: 'Testing.',
    bodySystems: ['CNS'],
    bioavailability: 1.0,
    vdLKg: 1.0,
  },
];

describe('toxicity evaluation', () => {
  it('ignores substances without toxicity configuration', () => {
    const pkResults: PKResult[] = [
      {
        substanceId: 'test-drug-safe',
        series: [
          { hour: 1, concentration: 100.0 }, // ridiculously high but no limits defined
        ],
        effectiveHalfLifeHours: 4.0,
        baseHalfLifeHours: 4.0,
        clearanceFactors: [],
        accumulationRatio: 1.0,
        daysToSteadyState: 1.0,
      } as any as PKResult,
    ];

    const alerts = evaluateToxicity(pkResults, mockSubstances);
    expect(alerts).toEqual([]);
  });

  it('marks peak below toxic threshold as safe', () => {
    const pkResults: PKResult[] = [
      {
        substanceId: 'test-drug-tox',
        series: [
          { hour: 0, concentration: 0.0 },
          { hour: 1, concentration: 3.5 },
          { hour: 2, concentration: 2.0 },
        ],
        effectiveHalfLifeHours: 4.0,
        baseHalfLifeHours: 4.0,
        clearanceFactors: [],
        accumulationRatio: 1.0,
        daysToSteadyState: 1.0,
      } as any as PKResult,
    ];

    const alerts = evaluateToxicity(pkResults, mockSubstances);
    expect(alerts.length).toBe(1);
    expect(alerts[0].status).toBe('safe');
    expect(alerts[0].peakConcentration).toBe(3.5);
    expect(alerts[0].hourOfPeak).toBe(1);
  });

  it('marks peak between toxic and lethal thresholds as toxic', () => {
    const pkResults: PKResult[] = [
      {
        substanceId: 'test-drug-tox',
        series: [
          { hour: 0, concentration: 0.0 },
          { hour: 1, concentration: 6.5 },
          { hour: 2, concentration: 5.5 },
        ],
        effectiveHalfLifeHours: 4.0,
        baseHalfLifeHours: 4.0,
        clearanceFactors: [],
        accumulationRatio: 1.0,
        daysToSteadyState: 1.0,
      } as any as PKResult,
    ];

    const alerts = evaluateToxicity(pkResults, mockSubstances);
    expect(alerts.length).toBe(1);
    expect(alerts[0].status).toBe('toxic');
    expect(alerts[0].peakConcentration).toBe(6.5);
  });

  it('marks peak above lethal threshold as lethal', () => {
    const pkResults: PKResult[] = [
      {
        substanceId: 'test-drug-tox',
        series: [
          { hour: 0, concentration: 0.0 },
          { hour: 1, concentration: 12.0 },
        ],
        effectiveHalfLifeHours: 4.0,
        baseHalfLifeHours: 4.0,
        clearanceFactors: [],
        accumulationRatio: 1.0,
        daysToSteadyState: 1.0,
      } as any as PKResult,
    ];

    const alerts = evaluateToxicity(pkResults, mockSubstances);
    expect(alerts.length).toBe(1);
    expect(alerts[0].status).toBe('lethal');
    expect(alerts[0].peakConcentration).toBe(12.0);
  });
});
