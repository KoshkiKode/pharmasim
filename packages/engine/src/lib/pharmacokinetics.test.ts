import { describe, expect, it } from 'vitest';
import type { Substance } from '../data/types';
import {
  accumulationRatio,
  clearanceMultiplier,
  computePK,
  daysToSteadyState,
  effectiveHalfLife,
  formatHours,
  rateConstant,
  tauHours,
  type PatientProfile,
  type RegimenConfig,
} from './pharmacokinetics';

const drug: Substance = {
  id: 'drug',
  name: 'Drug',
  brandNames: [],
  category: 'pharmaceutical',
  drugClass: 'Test',
  halfLifeHours: 12,
  routes: ['oral'],
  mechanism: 'test',
  bodySystems: ['Hepatic'],
  cypMetabolism: ['CYP3A4'],
  bioavailability: 0.7,
  vdLKg: 1.0,
};

const healthy: PatientProfile = {
  biologicalSex: 'M',
  ageYears: 35,
  weightKg: 70,
  heightCm: 175,
  bodyFatPct: 22,
  tolerance: 0,
  liver: 'normal',
  kidney: 'normal',
  hydrationPct: 50,
  genetics: {},
  conditions: [],
};

const acute: RegimenConfig = {
  mode: 'acute',
  doseMg: 50,
  dailyDoseMg: 50,
  daysOnRegimen: 7,
  frequency: 'QD',
  toleranceOverride: null,
};

describe('pharmacokinetic primitives', () => {
  it('derives the elimination rate constant from the half-life', () => {
    expect(rateConstant(12)).toBeCloseTo(Math.LN2 / 12, 10);
  });

  it('maps dosing frequency to the dosing interval tau', () => {
    expect(tauHours('QD')).toBe(24);
    expect(tauHours('BID')).toBe(12);
    expect(tauHours('QID')).toBe(6);
  });

  it('accumulates more for longer half-lives at a fixed interval', () => {
    expect(accumulationRatio(48, 24)).toBeGreaterThan(accumulationRatio(6, 24));
    expect(accumulationRatio(12, 24)).toBeGreaterThan(1);
  });

  it('estimates time to steady state as ~5 half-lives', () => {
    expect(daysToSteadyState(24)).toBeCloseTo(5, 10);
  });
});

describe('clearanceMultiplier', () => {
  it('is neutral for a healthy 70 kg adult', () => {
    expect(clearanceMultiplier(healthy, drug).multiplier).toBeCloseTo(1, 5);
  });

  it('slows clearance (longer half-life) with hepatic impairment', () => {
    const impaired = { ...healthy, liver: 'impaired' as const };
    expect(clearanceMultiplier(impaired, drug).multiplier).toBeLessThan(1);
    expect(effectiveHalfLife(impaired, drug)).toBeGreaterThan(drug.halfLifeHours);
  });

  it('speeds clearance for rapid CYP metabolizers', () => {
    const rapid = { ...healthy, genetics: { 'CYP3A4': 'rapid' as const } };
    expect(clearanceMultiplier(rapid, drug).multiplier).toBeGreaterThan(1);
  });
});

describe('computePK', () => {
  it('produces an estimated single-dose plasma curve in acute mode', () => {
    const pk = computePK(healthy, drug, acute);
    expect(pk.series.length).toBeGreaterThan(0);
    expect(pk.peakConcentration).toBeGreaterThan(0); // real mg/L
    expect(pk.series[0].concentration).toBeLessThan(pk.peakConcentration);
  });

  it('accumulates above a single dose peak in daily mode', () => {
    const pkAcute = computePK(healthy, drug, acute);
    const pkDaily = computePK(healthy, drug, { ...acute, mode: 'daily' });
    expect(pkDaily.accumulationRatio).toBeGreaterThan(1);
    expect(pkDaily.peakConcentration).toBeGreaterThan(pkAcute.peakConcentration);
  });

  it('reduces perceived effect as tolerance rises', () => {
    const none = computePK(healthy, drug, acute).toleranceScalar;
    const high = computePK({ ...healthy, tolerance: 100 }, drug, acute).toleranceScalar;
    expect(high).toBeLessThan(none);
  });
});

describe('formatHours', () => {
  it('formats minutes, hours and days', () => {
    expect(formatHours(0.5)).toBe('30 min');
    expect(formatHours(4)).toBe('4.0 h');
    expect(formatHours(72)).toBe('3.0 d');
    expect(formatHours(Infinity)).toBe('∞');
  });
});
