import { describe, expect, it } from 'vitest';
import type { Substance } from '../data/types';
import { computeReceptorState } from './pharmacodynamics';
import type { PKResult } from './pharmacokinetics';

const ligand: Substance = {
  id: 'ligand',
  name: 'Ligand',
  brandNames: [],
  category: 'pharmaceutical',
  drugClass: 'Test',
  halfLifeHours: 12,
  routes: ['oral'],
  mechanism: 'test',
  bodySystems: ['CNS'],
  bioavailability: 1,
  vdLKg: 1,
  bindingAffinities: {
    '5-HT2A': { kiNm: 10, intrinsicActivity: 1 },
  },
};

// Two-point series: concentration rises from 0 mg/L at h0 to 1 mg/L at h10.
const pk: PKResult = {
  substanceId: 'ligand',
  effectiveHalfLifeHours: 12,
  baseHalfLifeHours: 12,
  clearanceMultiplier: 1,
  clearanceFactors: [],
  accumulationRatio: 1,
  daysToSteadyState: 0,
  tauHours: 24,
  series: [
    { hour: 0, concentration: 0 },
    { hour: 10, concentration: 1 },
  ],
  peakConcentration: 1,
  steadyStateTrough: 0,
  toleranceScalar: 1,
  aucMgHourL: 5,
  peakHour: 10,
  horizonHours: 10,
  warnings: [],
};

describe('computeReceptorState concentration lookup', () => {
  it('interpolates inside the sampled range', () => {
    const mid = computeReceptorState('5-HT2A', [pk], [ligand], 5);
    expect(mid.totalOccupancy).toBeGreaterThan(0);
  });

  it('clamps to the final sampled point instead of reporting zero after it', () => {
    const atEnd = computeReceptorState('5-HT2A', [pk], [ligand], 10);
    const pastEnd = computeReceptorState('5-HT2A', [pk], [ligand], 48);
    expect(pastEnd.totalOccupancy).toBeCloseTo(atEnd.totalOccupancy, 10);
    expect(pastEnd.totalOccupancy).toBeGreaterThan(0);
  });

  it('clamps to the first sampled point before the curve begins', () => {
    const laterCurve = {
      ...pk,
      series: [
        { hour: 2, concentration: 1 },
        { hour: 10, concentration: 0.5 },
      ],
    };
    const atStart = computeReceptorState('5-HT2A', [laterCurve], [ligand], 2);
    const beforeStart = computeReceptorState('5-HT2A', [laterCurve], [ligand], -10);
    expect(beforeStart.totalOccupancy).toBeCloseTo(atStart.totalOccupancy, 10);
  });

  it('uses a substance molar mass when provided instead of the 350 g/mol fallback', () => {
    const heavy: Substance = { ...ligand, molarMassGPerMol: 700 };
    const withFallback = computeReceptorState('5-HT2A', [pk], [ligand], 10);
    const withHeavy = computeReceptorState('5-HT2A', [pk], [heavy], 10);
    // Double molar mass => half the molar concentration => lower occupancy.
    expect(withHeavy.totalOccupancy).toBeLessThan(withFallback.totalOccupancy);
  });
});
