import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  clearanceMultiplier,
  computeEventPK,
  computePK,
  type PatientProfile,
  type RegimenConfig,
} from './pharmacokinetics';
import type { DoseEvent, Substance } from '../data/types';
import { substances } from '../data/substances';

// 10,000 generated cases per property. That takes ~10s plain but ~45s with V8
// coverage instrumentation on a CI runner, which blew through the global 30s
// testTimeout. Give these two tests explicit headroom instead of cutting numRuns.
const PROPERTY_TEST_TIMEOUT_MS = 120_000;

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
  }, PROPERTY_TEST_TIMEOUT_MS);

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
        expect(Number.isFinite(pk.aucMgHourL)).toBe(true);
        expect(Number.isFinite(pk.peakHour)).toBe(true);
        expect(Number.isFinite(pk.horizonHours)).toBe(true);
        
        // They should be finite, or Infinity is acceptable if division by zero is handled by the math but shouldn't crash
        // For our engine, let's just make sure it doesn't crash or return NaN.
      }),
      { numRuns: 10000 }
    );
  }, PROPERTY_TEST_TIMEOUT_MS);

  it('preserves positivity, linearity and event-order invariance across extreme overlapping kinetics', () => {
    const positiveRate = fc.integer({ min: -12, max: 12 }).map((power) => 10 ** power);
    const eventGen = fc.record({
      administrationHour: fc.integer({ min: 0, max: 48 }),
      doseMg: fc.double({ min: 0, max: 1000, noNaN: true }),
      route: fc.constantFrom('oral', 'IV') as fc.Arbitrary<'oral' | 'IV'>,
      formulation: fc.constantFrom('IR', 'ER', 'XR', 'CR') as fc.Arbitrary<DoseEvent['formulation']>,
      duration: fc.option(positiveRate, { nil: undefined }),
    });
    fc.assert(fc.property(
      positiveRate, positiveRate, fc.integer({ min: -6, max: 6 }),
      fc.array(eventGen, { minLength: 1, maxLength: 6 }),
      (ka, releaseHours, halfLifePower, inputs) => {
        const patient: PatientProfile = {
          biologicalSex: 'M', ageYears: 35, weightKg: 70, heightCm: 175,
          bodyFatPct: 22, tolerance: 0, liver: 'normal', kidney: 'normal',
          hydrationPct: 50, genetics: {}, conditions: [],
        };
        const drug: Substance = {
          ...substances[0], halfLifeHours: 10 ** halfLifePower,
          clearanceMlMinKg: undefined, vdLKg: 1, bioavailability: 0.7,
          bioavailabilityByRoute: { oral: 0.7 },
          absorptionByRoute: { oral: { kaPerHour: ka, lagHours: 2 } },
          releaseHoursByFormulation: { ER: releaseHours, XR: releaseHours, CR: releaseHours },
        };
        const events: DoseEvent[] = inputs.map((input, index) => ({
          id: `event-${index}`, substanceId: drug.id, doseMg: input.doseMg,
          route: input.route, formulation: input.formulation, administrationHour: input.administrationHour,
          ...(input.route === 'IV' && input.duration !== undefined
            ? { infusionDurationHours: input.duration } : {}),
        }));
        const result = computeEventPK(patient, drug, events);
        const doubled = computeEventPK(patient, drug, [...events].reverse().map((event) => ({
          ...event, doseMg: event.doseMg * 2,
        })));
        expect(result.series.every((point) => Number.isFinite(point.concentration) && point.concentration >= 0)).toBe(true);
        expect(result.series.every((point, index) => index === 0 || point.hour > result.series[index - 1].hour)).toBe(true);
        expect(result.peakHour).toBeGreaterThanOrEqual(0);
        expect(result.peakHour).toBeLessThanOrEqual(result.horizonHours);
        expect(result.horizonHours).toBeLessThanOrEqual(720);
        expect(result.series[result.series.length - 1].hour).toBe(result.horizonHours);
        expect(Number.isFinite(result.aucMgHourL)).toBe(true);
        expect(result.aucMgHourL).toBeGreaterThanOrEqual(0);
        const maximumAuc = events.reduce((sum, event) => sum + event.doseMg *
          (event.route === 'IV' ? 1 : 0.7) / 70, 0) *
          result.effectiveHalfLifeHours / Math.LN2;
        expect(result.aucMgHourL).toBeLessThanOrEqual(maximumAuc * (1 + 1e-6) + 1e-12);
        const relativeError = (actual: number, expected: number) =>
          Math.abs(actual - expected) / Math.max(1e-10, Math.abs(expected));
        expect(relativeError(doubled.peakConcentration, result.peakConcentration * 2)).toBeLessThan(1e-7);
        expect(relativeError(doubled.aucMgHourL, result.aucMgHourL * 2)).toBeLessThan(1e-6);
        expect(events.map((event) => event.doseMg)).toEqual(inputs.map((input) => input.doseMg));
      },
    ), { numRuns: 1000 });
  }, PROPERTY_TEST_TIMEOUT_MS);

  it('discards malformed events and keeps invalid numerical parameters finite', () => {
    const numberGen = fc.constantFrom(NaN, Infinity, -Infinity, -1, 0, Number.MIN_VALUE, Number.MAX_VALUE, 1);
    fc.assert(fc.property(
      numberGen, numberGen, numberGen,
      fc.array(fc.record({
        doseMg: numberGen,
        administrationHour: numberGen,
        infusionDurationHours: fc.option(numberGen, { nil: undefined }),
        kaOverride: fc.option(numberGen, { nil: undefined }),
        route: fc.constantFrom('oral', 'IV', 'invalid'),
        formulation: fc.constantFrom('IR', 'CR', 'invalid'),
      }), { maxLength: 8 }),
      (halfLife, volume, weight, inputs) => {
        const patient: PatientProfile = {
          biologicalSex: 'M', ageYears: 35, weightKg: weight, heightCm: 175,
          bodyFatPct: 22, tolerance: NaN, liver: 'normal', kidney: 'normal',
          hydrationPct: 50, genetics: {}, conditions: [],
        };
        const drug: Substance = {
          ...substances[0], halfLifeHours: halfLife, vdLKg: volume,
          clearanceMlMinKg: undefined, bioavailability: NaN,
          bioavailabilityByRoute: undefined,
          absorptionByRoute: { oral: { kaPerHour: halfLife, lagHours: weight } },
          releaseHoursByFormulation: { CR: volume },
        };
        const events = inputs.map((input, index) => ({
          ...input, id: `invalid-${index}`, substanceId: drug.id,
        })) as DoseEvent[];
        const result = computeEventPK(patient, drug, events);
        expect(result.series.every((point) =>
          Number.isFinite(point.hour) && Number.isFinite(point.concentration) && point.concentration >= 0)).toBe(true);
        expect([result.aucMgHourL, result.peakHour, result.horizonHours,
          result.effectiveHalfLifeHours, result.steadyStateTrough, result.toleranceScalar].every(Number.isFinite)).toBe(true);
      },
    ), { numRuns: 500 });
  }, PROPERTY_TEST_TIMEOUT_MS);
});
