import { describe, expect, it } from 'vitest';
import type { DoseEvent, Substance } from '../data/types';
import {
  accumulationRatio,
  clearanceMultiplier,
  computeEventPK,
  computePK,
  daysToSteadyState,
  effectiveHalfLife,
  flattenRegimensToEvents,
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

describe('flattenRegimensToEvents custom timeline hardening', () => {
  const baseEvent: DoseEvent = {
    id: 'e1',
    substanceId: 'drug',
    doseMg: 50,
    route: 'oral',
    formulation: 'IR',
    administrationHour: 4,
  };

  it('clones, sorts, and reassigns substance ids without mutating the caller array', () => {
    const input: DoseEvent[] = [
      { ...baseEvent, id: 'b', administrationHour: 12 },
      { ...baseEvent, id: 'a', administrationHour: 1 },
    ];
    const result = flattenRegimensToEvents({ ...acute, customEvents: input }, drug);
    expect(result.map((e) => e.id)).toEqual(['a', 'b']);
    expect(input[0].id).toBe('b'); // caller array untouched
    expect(result[0]).not.toBe(input[1]); // cloned, not aliased
  });

  it('drops events with negative or non-finite hours and doses', () => {
    const input = [
      baseEvent,
      { ...baseEvent, id: 'neg-hour', administrationHour: -1 },
      { ...baseEvent, id: 'nan-hour', administrationHour: Number.NaN },
      { ...baseEvent, id: 'neg-dose', doseMg: -5 },
      { ...baseEvent, id: 'inf-dose', doseMg: Number.POSITIVE_INFINITY },
      null,
      undefined,
    ] as unknown as DoseEvent[];
    const result = flattenRegimensToEvents({ ...acute, customEvents: input }, drug);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('e1');
  });

  it('caps runaway custom timelines', () => {
    const input: DoseEvent[] = Array.from({ length: 5000 }, (_, i) => ({
      ...baseEvent,
      id: `e${i}`,
      administrationHour: i,
    }));
    const result = flattenRegimensToEvents({ ...acute, customEvents: input }, drug);
    expect(result.length).toBeLessThanOrEqual(2000);
  });

  it('retains the earliest doses when an unsorted timeline exceeds the cap', () => {
    const input: DoseEvent[] = [
      ...Array.from({ length: 2000 }, (_, i) => ({
        ...baseEvent,
        id: `late-${i}`,
        administrationHour: 1000 + i,
      })),
      { ...baseEvent, id: 'earliest', administrationHour: 1 },
    ];
    const result = flattenRegimensToEvents({ ...acute, customEvents: input }, drug);
    expect(result).toHaveLength(2000);
    expect(result[0]).toMatchObject({ id: 'earliest', administrationHour: 1 });
    expect(result[result.length - 1].administrationHour).toBe(2998);
    expect(input[0].id).toBe('late-0');
  });

  it('rejects invalid route, formulation, and absorption overrides', () => {
    const input = [
      baseEvent,
      { ...baseEvent, id: 'bad-route', route: 'unknown' },
      { ...baseEvent, id: 'bad-form', formulation: 'delayed' },
      { ...baseEvent, id: 'bad-ka', kaOverride: Number.NaN },
    ] as unknown as DoseEvent[];
    expect(flattenRegimensToEvents({ ...acute, customEvents: input }, drug).map((event) => event.id)).toEqual(['e1']);
  });
});

describe('event-based pharmacokinetics', () => {
  const event = (overrides: Partial<DoseEvent> = {}): DoseEvent => ({
    id: 'dose',
    substanceId: drug.id,
    doseMg: 50,
    route: 'oral',
    formulation: 'IR',
    administrationHour: 0,
    ...overrides,
  });

  it('models an IV dose as an immediate bolus with complete bioavailability', () => {
    const pk = computeEventPK(healthy, drug, [event({ route: 'IV' })]);
    const expectedC0 = 50 / (drug.vdLKg * healthy.weightKg);
    expect(pk.series[0].concentration).toBeCloseTo(expectedC0, 10);
    expect(pk.peakConcentration).toBeCloseTo(expectedC0, 10);
    expect(pk.series[1].concentration).toBeLessThan(expectedC0);
  });

  it('keeps metabolite formation first-order even when its route is IV', () => {
    const formationRate = 0.5;
    const pk = computeEventPK(healthy, drug, [
      event({ route: 'IV', kaOverride: formationRate }),
    ]);
    expect(pk.series[0].concentration).toBe(0);
    expect(pk.peakConcentration).toBeLessThan(50 / (drug.vdLKg * healthy.weightKg));
    expect(pk.peakConcentration).toBeGreaterThan(0);
  });

  it('uses distinct controlled-release profiles for ER, XR, and CR', () => {
    const profiles = (['IR', 'ER', 'XR', 'CR'] as const).map((formulation) => {
      const pk = computeEventPK(healthy, drug, [event({ formulation })]);
      const peak = pk.series.reduce((highest, point) =>
        point.concentration > highest.concentration ? point : highest,
      );
      const auc = pk.series.slice(1).reduce((area, point, index) => {
        const previous = pk.series[index];
        return area + ((point.concentration + previous.concentration) * (point.hour - previous.hour)) / 2;
      }, 0);
      return { formulation, peak, auc };
    });
    expect(profiles[0].peak.hour).toBeLessThan(profiles[1].peak.hour);
    expect(profiles[1].peak.hour).toBeLessThan(profiles[2].peak.hour);
    expect(profiles[2].peak.hour).toBeLessThan(profiles[3].peak.hour);
    expect(new Set(profiles.map(({ peak }) => peak.concentration)).size).toBe(4);
    const expectedAuc = ((50 * drug.bioavailability) / (drug.vdLKg * healthy.weightKg)) /
      (Math.LN2 / drug.halfLifeHours);
    for (const profile of profiles) {
      expect(profile.auc).toBeCloseTo(expectedAuc, 1);
    }
  });

  it('derives a regular event interval and ignores invalid unsorted events', () => {
    const pk = computeEventPK(healthy, drug, [
      event({ id: 'later', administrationHour: 12 }),
      event({ id: 'invalid', administrationHour: 4, doseMg: -1 }),
      event({ id: 'earlier', administrationHour: 1 }),
    ]);
    expect(pk.tauHours).toBe(11);
    expect(pk.accumulationRatio).toBeGreaterThan(1);
    expect(pk.series.every((point, index, series) => index === 0 || point.hour > series[index - 1].hour)).toBe(true);
  });

  it('samples the analytical peak for a very short half-life', () => {
    const shortLivedDrug = { ...drug, halfLifeHours: 0.01 };
    const shortLivedPatient = { ...healthy };
    const pk = computePK(shortLivedPatient, shortLivedDrug, {
      ...acute,
      route: 'inhaled',
    });
    const eliminationRate = Math.LN2 / pk.effectiveHalfLifeHours;
    const absorptionRate = Math.max(eliminationRate * 1.1, 3.5 / 0.08);
    const expectedTmax = Math.log(absorptionRate / eliminationRate) / (absorptionRate - eliminationRate);
    expect(pk.series.some((point) => Math.abs(point.hour - expectedTmax) < 1e-9)).toBe(true);
    expect(pk.peakConcentration).toBeGreaterThan(0);
  });

  it('calculates the steady-state IV trough from the repeated dose schedule', () => {
    const pk = computePK(healthy, drug, { ...acute, mode: 'daily', route: 'IV' });
    const k = Math.LN2 / pk.effectiveHalfLifeHours;
    const expected = (50 / (drug.vdLKg * healthy.weightKg)) * Math.exp(-k * 24) / (1 - Math.exp(-k * 24));
    expect(pk.steadyStateTrough).toBeCloseTo(expected, 8);
  });

  it('calculates an oral steady-state trough from absorbed repeated doses', () => {
    const pk = computePK(healthy, drug, { ...acute, mode: 'daily' });
    const k = Math.LN2 / pk.effectiveHalfLifeHours;
    const ka = Math.max(k * 1.1, 3.5 / 1.5);
    const doseMultiplier = (50 * drug.bioavailability) / (drug.vdLKg * healthy.weightKg);
    const expected =
      doseMultiplier *
      (ka / (ka - k)) *
      (Math.exp(-k * 24) / (1 - Math.exp(-k * 24)) -
        Math.exp(-ka * 24) / (1 - Math.exp(-ka * 24)));
    expect(pk.steadyStateTrough).toBeCloseTo(expected, 8);
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
