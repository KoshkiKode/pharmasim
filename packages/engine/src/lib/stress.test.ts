import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  clearanceMultiplier,
  computePK,
  type PatientProfile,
  type RegimenConfig,
} from './pharmacokinetics';
import type { Substance } from '../data/types';
import { substances } from '../data/substances';

describe('PK Engine Property-Based Stress Tests', () => {
  const patientGen = fc.record({
    biologicalSex: fc.constantFrom('M', 'F') as fc.Arbitrary<'M' | 'F'>,
    ageYears: fc.integer({ min: 0, max: 120 }),
    weightKg: fc.float({ min: 0, max: 300, noNaN: true }),
    heightCm: fc.float({ min: 0, max: 250, noNaN: true }),
    bodyFatPct: fc.float({ min: 0, max: 100, noNaN: true }),
    tolerance: fc.float({ min: 0, max: 100, noNaN: true }),
    liver: fc.constantFrom('impaired', 'reduced', 'normal') as fc.Arbitrary<'impaired' | 'reduced' | 'normal'>,
    kidney: fc.constantFrom('impaired', 'reduced', 'normal') as fc.Arbitrary<'impaired' | 'reduced' | 'normal'>,
    hydrationPct: fc.float({ min: 0, max: 100, noNaN: true }),
    genetics: fc.dictionary(
      fc.string(),
      fc.constantFrom('poor', 'normal', 'rapid', 'ultrarapid') as fc.Arbitrary<'poor' | 'normal' | 'rapid' | 'ultrarapid'>
    ),
    conditions: fc.array(fc.string()),
  });

  const regimenGen = fc.record({
    mode: fc.constantFrom('acute', 'daily') as fc.Arbitrary<'acute' | 'daily'>,
    doseMg: fc.float({ min: 0, max: 10000, noNaN: true }),
    dailyDoseMg: fc.float({ min: 0, max: 100000, noNaN: true }),
    daysOnRegimen: fc.integer({ min: 1, max: 365 }),
    frequency: fc.constantFrom('QD', 'BID', 'TID', 'QID') as fc.Arbitrary<'QD' | 'BID' | 'TID' | 'QID'>,
    toleranceOverride: fc.option(fc.float({ min: 0, max: 100, noNaN: true }), { nil: null }),
  });

  const randomSubstanceGen = fc.constantFrom(...substances);

  it('clearanceMultiplier never returns NaN or throws', () => {
    fc.assert(
      fc.property(patientGen, randomSubstanceGen, (patient, drug) => {
        const result = clearanceMultiplier(patient, drug);
        expect(Number.isNaN(result.multiplier)).toBe(false);
        expect(result.multiplier).toBeGreaterThanOrEqual(0); // Assuming clearance should never be negative
      }),
      { numRuns: 10000 }
    );
  });

  it('computePK never returns NaN or throws', () => {
    fc.assert(
      fc.property(patientGen, regimenGen, randomSubstanceGen, (patient, regimen, drug) => {
        // Skip drugs with 0 half-life for computePK (if it exists) to avoid divide by zero for now
        // Or wait, this stress test should catch divide by zero and force us to fix it in computePK!
        const pk = computePK(patient, drug, regimen);
        expect(Number.isNaN(pk.peakConcentration)).toBe(false);
        expect(Number.isNaN(pk.steadyStateTrough)).toBe(false);
        expect(Number.isNaN(pk.effectiveHalfLifeHours)).toBe(false);
        expect(Number.isNaN(pk.daysToSteadyState)).toBe(false);
        
        // They should be finite, or Infinity is acceptable if division by zero is handled by the math but shouldn't crash
        // For our engine, let's just make sure it doesn't crash or return NaN.
      }),
      { numRuns: 10000 }
    );
  });
});
