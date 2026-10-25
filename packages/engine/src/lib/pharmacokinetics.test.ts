import { describe, expect, it } from 'vitest';
import { PARAMETER_EVIDENCE_UNITS, type DoseEvent, type Substance } from '../data/types';
import {
  accumulationRatio,
  clearanceMultiplier,
  computeEventPK,
  computePK,
  daysToSteadyState,
  effectiveHalfLife,
  flattenRegimensToEvents,
  formatHours,
  generateMetaboliteEvents,
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

  it('reports the periodic minimum at delayed absorption onset, not the higher pre-dose value', () => {
    const halfLifeHours = 2;
    const ka = 100;
    const lagHours = 6;
    const specific = { ...drug, halfLifeHours, absorptionByRoute: { oral: { kaPerHour: ka, lagHours } } };
    const pk = computePK(healthy, specific, { ...acute, mode: 'daily' });
    const k = Math.LN2 / pk.effectiveHalfLifeHours;
    const denominator = -Math.expm1(-k * 24);
    const doseMultiplier = 50 * drug.bioavailability / 70;
    const expected = doseMultiplier * ka / (ka - k) *
      (Math.exp(-k * 24) / denominator - Math.exp(-ka * 24) / -Math.expm1(-ka * 24));
    const predose = doseMultiplier * ka / (ka - k) *
      (Math.exp(-k * (24 - lagHours)) / denominator -
        Math.exp(-ka * (24 - lagHours)) / -Math.expm1(-ka * 24));
    expect(pk.steadyStateTrough).toBeCloseTo(expected, 12);
    expect(predose / pk.steadyStateTrough).toBeCloseTo(8, 8);
  });

  it.each([0.01, Math.LN2 / 12, (Math.LN2 / 12) * (1 + 1e-10)])(
    'keeps the periodic minimum stable with slow or equal absorption (%s)', (ka) => {
      const pk = computePK(healthy, {
        ...drug, absorptionByRoute: { oral: { kaPerHour: ka, lagHours: 30 } },
      }, { ...acute, mode: 'daily' });
      const k = Math.LN2 / pk.effectiveHalfLifeHours;
      const reference = Array.from({ length: 5000 }, (_, index) => {
        const time = (index + 1) * 24;
        if (Math.abs(ka - k) < 1e-8 * k) return ka * time * Math.exp(-k * time);
        return ka / (ka - k) * (Math.exp(-k * time) - Math.exp(-ka * time));
      }).reduce((sum, concentration) => sum + concentration, 0) * 50 * drug.bioavailability / 70;
      expect(pk.steadyStateTrough).toBeCloseTo(reference, 9);
    },
  );

  it.each([4, 30, 48])('finds the periodic IV infusion minimum with %s-hour overlapping input', (duration) => {
    const interval = 24;
    const pk = computeEventPK(healthy, drug, [event({
      route: 'IV', infusionDurationHours: duration,
    })], [], interval);
    const k = Math.LN2 / pk.effectiveHalfLifeHours;
    const expected = Array.from({ length: 100 }, (_, index) => {
      const time = (index + 1) * interval;
      return (50 / 70) * -Math.expm1(-k * Math.min(time, duration)) / (k * duration) *
        Math.exp(-k * Math.max(0, time - duration));
    }).reduce((sum, concentration) => sum + concentration, 0);
    expect(pk.steadyStateTrough).toBeCloseTo(expected, 10);
  });

  it.each([8, 40, 48])('searches actual periodic minima after delayed %s-hour controlled release', (duration) => {
    const interval = 24;
    const ka = 1;
    const lagHours = 6;
    const specific = {
      ...drug, halfLifeHours: 2,
      absorptionByRoute: { oral: { kaPerHour: ka, lagHours } },
      releaseHoursByFormulation: { ER: duration },
    };
    const pk = computeEventPK(healthy, specific, [event({ formulation: 'ER' })], [], interval);
    const k = Math.LN2 / pk.effectiveHalfLifeHours;
    const reference = (phase: number) => Array.from({ length: 60 }, (_, index) => {
      const time = phase - lagHours + index * interval;
      if (time <= 0) return 0;
      const elapsed = Math.min(time, duration);
      const integral = (rate: number) =>
        Math.exp(-rate * (time - elapsed)) * -Math.expm1(-rate * elapsed) / rate;
      return (50 * drug.bioavailability / 70 / duration) * ka / (ka - k) * (integral(k) - integral(ka));
    }).reduce((sum, concentration) => sum + concentration, 0);
    let minimumPhase = 0;
    for (let phase = 0; phase <= interval; phase += 0.01) {
      if (reference(phase) < reference(minimumPhase)) minimumPhase = phase;
    }
    let left = Math.max(0, minimumPhase - 0.01);
    let right = Math.min(interval, minimumPhase + 0.01);
    for (let iteration = 0; iteration < 60; iteration++) {
      const first = left + (right - left) / 3;
      const second = right - (right - left) / 3;
      if (reference(first) > reference(second)) left = first;
      else right = second;
    }
    expect(pk.steadyStateTrough).toBeCloseTo(reference((left + right) / 2), 8);
  });
});

  describe('PK numerical robustness and explicit kinetics', () => {
    const event = (overrides: Partial<DoseEvent> = {}): DoseEvent => ({
      id: 'dose', substanceId: drug.id, doseMg: 50, route: 'oral',
      formulation: 'IR', administrationHour: 0, ...overrides,
    });
    const pointAt = (pk: ReturnType<typeof computeEventPK>, hour: number) =>
      pk.series.find((point) => Math.abs(point.hour - hour) < 1e-8)!.concentration;

    it.each([0.001, 0.01, Math.LN2 / 12, (Math.LN2 / 12) * (1 + 1e-10), 1000])(
      'keeps flip-flop/equal/fast absorption finite and samples its analytical peak (ka=%s)', (ka) => {
        const pk = computeEventPK(healthy, { ...drug, absorptionByRoute: { oral: { kaPerHour: ka } } }, [event()]);
        const k = Math.LN2 / pk.effectiveHalfLifeHours;
        const tmax = ka === k ? 1 / k : Math.log1p((ka - k) / k) / (ka - k);
        const expectedPeak = (50 * drug.bioavailability / 70) * Math.exp(-k * tmax);
        expect(pk.series.every((point) => Number.isFinite(point.concentration) && point.concentration >= 0)).toBe(true);
        expect(pk.peakHour).toBeCloseTo(tmax, 5);
        expect(pk.peakConcentration).toBeCloseTo(expectedPeak, 8);
        expect(pk.aucMgHourL).toBeGreaterThan(0);
      },
    );

    it('respects route-specific lag and lets event formation overrides take precedence', () => {
      const specific: Substance = {
        ...drug, absorptionByRoute: { oral: { kaPerHour: 0.2, lagHours: 3 } },
        bioavailabilityByRoute: { oral: 0.5 },
      };
      const pk = computeEventPK(healthy, specific, [event()]);
      expect(pointAt(pk, 3)).toBe(0);
      expect(pk.series.filter((point) => point.hour <= 3).every((point) => point.concentration === 0)).toBe(true);
      const k = Math.LN2 / pk.effectiveHalfLifeHours;
      expect(pk.peakHour).toBeCloseTo(3 + Math.log(0.2 / k) / (0.2 - k), 7);
      const override = computeEventPK(healthy, specific, [event({ kaOverride: 2 })]);
      expect(override.peakHour).toBeLessThan(pk.peakHour);
      expect(override.warnings.join(' ')).toContain('Metabolites');
    });

    it('uses substance-specific release durations and preserves finite-horizon exposure', () => {
      const specific = { ...drug, releaseHoursByFormulation: { ER: 2 } };
      const shorter = computeEventPK(healthy, specific, [event({ formulation: 'ER' })]);
      const generic = computeEventPK(healthy, drug, [event({ formulation: 'ER' })]);
      expect(shorter.peakHour).toBeLessThan(generic.peakHour);
      expect(shorter.peakConcentration).toBeGreaterThan(generic.peakConcentration);
      const totalAuc = 50 * drug.bioavailability / (70 * (Math.LN2 / 12));
      expect(shorter.aucMgHourL / totalAuc).toBeCloseTo(1, 2);
      expect(generic.aucMgHourL / totalAuc).toBeCloseTo(1, 2);
      expect(shorter.warnings.join(' ')).not.toContain('Generic ER release');
      expect(generic.warnings.join(' ')).toContain('Generic ER release');
    });

    it('samples controlled-release peaks and release boundaries after a route-specific lag', () => {
      const specific = {
        ...drug, absorptionByRoute: { oral: { kaPerHour: 0.5, lagHours: 5 } },
        releaseHoursByFormulation: { ER: 4 },
      };
      const delayed = computeEventPK(healthy, specific, [event({ formulation: 'ER' })]);
      const immediate = computeEventPK(healthy, {
        ...specific, absorptionByRoute: { oral: { kaPerHour: 0.5 } },
      }, [event({ formulation: 'ER' })]);
      expect(delayed.series.some((point) => point.hour === 5 && point.concentration === 0)).toBe(true);
      expect(delayed.series.some((point) => point.hour === 9)).toBe(true);
      expect(delayed.peakHour).toBeGreaterThan(9);
      expect(delayed.peakHour - immediate.peakHour).toBeCloseTo(5, 6);
      expect(delayed.peakConcentration).toBeCloseTo(immediate.peakConcentration, 9);
      expect(delayed.aucMgHourL).toBeCloseTo(immediate.aucMgHourL, 8);
    });

    it.each([Math.LN2 / 12, (Math.LN2 / 12) * (1 - 1e-8), 1e-8, 1e8])(
      'keeps controlled release stable with extreme/equal absorption (ka=%s)', (ka) => {
        const pk = computeEventPK(healthy, {
          ...drug, absorptionByRoute: { oral: { kaPerHour: ka } },
        }, [event({ formulation: 'CR' })]);
        expect(pk.series.every((point) => Number.isFinite(point.concentration) && point.concentration >= 0)).toBe(true);
        expect(Number.isFinite(pk.aucMgHourL)).toBe(true);
        expect(pk.peakConcentration).toBeGreaterThan(0);
        const totalAuc = 50 * drug.bioavailability / (70 * (Math.LN2 / 12));
        expect(pk.aucMgHourL).toBeLessThanOrEqual(totalAuc * 1.00001);
      },
    );

    it.each([[0.001, 2], [Math.LN2 / 12, 24], [0.2, 120], [2, 2000]])(
      'matches finite-horizon mass balance for controlled release (ka=%s, release=%s)', (ka, duration) => {
        const pk = computeEventPK(healthy, {
          ...drug, absorptionByRoute: { oral: { kaPerHour: ka } },
          releaseHoursByFormulation: { CR: duration },
        }, [event({ formulation: 'CR' })]);
        const horizon = pk.horizonHours;
        const elapsed = Math.min(horizon, duration);
        const depotFraction = Math.exp(-ka * (horizon - elapsed)) *
          -Math.expm1(-ka * elapsed) / (ka * duration);
        const absorbedFraction = elapsed / duration - depotFraction;
        const last = pk.series[pk.series.length - 1];
        expect(last.hour).toBe(horizon);
        const expectedAuc = ((50 * drug.bioavailability / 70) * absorbedFraction - last.concentration) /
          (Math.LN2 / pk.effectiveHalfLifeHours);
        expect(pk.aucMgHourL).toBeCloseTo(expectedAuc, 7);
      },
    );

    it('remains finite for subnormal release durations and astronomically distant events', () => {
      const specific = {
        ...drug, absorptionByRoute: { oral: { kaPerHour: Math.LN2 / 12 } },
        releaseHoursByFormulation: { CR: Number.MIN_VALUE },
      };
      const pk = computeEventPK(healthy, specific, [
        event({ formulation: 'CR' }),
        event({ formulation: 'CR', administrationHour: Number.MAX_VALUE }),
      ]);
      expect(pk.series.every((point) => Number.isFinite(point.concentration) && point.concentration >= 0)).toBe(true);
      expect([pk.aucMgHourL, pk.peakHour, pk.horizonHours, pk.steadyStateTrough].every(Number.isFinite)).toBe(true);
    });

    it('resolves a narrow controlled-release tail on a much longer overlapping-event horizon', () => {
      const specific = {
        ...drug, halfLifeHours: 1e-4,
        absorptionByRoute: { oral: { kaPerHour: 1e5, lagHours: 2 } },
        releaseHoursByFormulation: { XR: 1e-4 },
      };
      const pk = computeEventPK(healthy, specific, [
        event({ formulation: 'XR' }),
        event({ administrationHour: 31, doseMg: 0 }),
      ]);
      const expected = (50 * drug.bioavailability / 70) * pk.effectiveHalfLifeHours / Math.LN2;
      expect(pk.aucMgHourL / expected).toBeCloseTo(1, 8);
    });

    it('models a constant-rate IV infusion with an exact end-of-infusion peak', () => {
      const duration = 4;
      const pk = computeEventPK(healthy, drug, [event({
        route: 'IV', infusionDurationHours: duration, administrationHour: 2,
      })]);
      const k = Math.LN2 / pk.effectiveHalfLifeHours;
      const peak = (50 / 70) * -Math.expm1(-k * duration) / (k * duration);
      expect(pk.series[0].concentration).toBe(0);
      expect(pointAt(pk, 2)).toBe(0);
      expect(pk.peakHour).toBe(6);
      expect(pk.peakConcentration).toBeCloseTo(peak, 10);
      expect(pk.aucMgHourL).toBeCloseTo((50 / 70 - pointAt(pk, pk.horizonHours)) / k, 7);
    });

    it.each([1e-9, Number.MIN_VALUE])('converges to the IV bolus for a very short infusion (%s h)', (duration) => {
      const bolus = computeEventPK(healthy, drug, [event({ route: 'IV' })]);
      const infusion = computeEventPK(healthy, drug, [event({ route: 'IV', infusionDurationHours: duration })]);
      expect(infusion.peakConcentration).toBeCloseTo(bolus.peakConcentration, 8);
      expect(infusion.aucMgHourL).toBeCloseTo(bolus.aucMgHourL, 7);
    });

    it('reports partial exposure for an infusion continuing beyond the horizon', () => {
      const duration = 1000;
      const pk = computeEventPK(healthy, drug, [event({ route: 'IV', infusionDurationHours: duration })]);
      const k = Math.LN2 / pk.effectiveHalfLifeHours;
      const inputByHorizon = (50 / 70) * pk.horizonHours / duration;
      expect(pk.horizonHours).toBe(720);
      // The plateau becomes indistinguishable from the maximum at floating-point precision.
      expect(pk.peakHour).toBeGreaterThan(600);
      expect(pk.peakHour).toBeLessThanOrEqual(720);
      expect(pk.aucMgHourL).toBeCloseTo((inputByHorizon - pk.peakConcentration) / k, 7);
      expect(pk.warnings.join(' ')).toContain('Horizon truncation');
    });

    it('superposes overlapping infusions without changing the input events', () => {
      const first = event({ route: 'IV', infusionDurationHours: 8 });
      const second = event({ id: 'second', route: 'IV', infusionDurationHours: 4, administrationHour: 2 });
      const events = [first, second];
      const snapshot = JSON.stringify(events);
      const pk = computeEventPK(healthy, drug, events);
      const k = Math.LN2 / pk.effectiveHalfLifeHours;
      const response = (time: number, duration: number) =>
        (50 / 70) * -Math.expm1(-k * Math.min(time, duration)) / (k * duration) *
        Math.exp(-k * Math.max(0, time - duration));
      expect(pointAt(pk, 6)).toBeCloseTo(response(6, 8) + response(4, 4), 10);
      expect(pk.aucMgHourL).toBeCloseTo((100 / 70 - pointAt(pk, pk.horizonHours)) / k, 7);
      expect(JSON.stringify(events)).toBe(snapshot);
    });

    it('computes exact finite-horizon bolus AUC even for off-grid overlapping events', () => {
      const events = [event({ route: 'IV', administrationHour: 1.001 }),
        event({ route: 'IV', administrationHour: 1.002 }),
        event({ route: 'IV', administrationHour: 2000 })];
      const pk = computeEventPK(healthy, drug, events);
      const k = Math.LN2 / pk.effectiveHalfLifeHours;
      const expected = events.reduce((auc, ev) => auc + (ev.administrationHour < pk.horizonHours
        ? (50 / 70) * -Math.expm1(-k * (pk.horizonHours - ev.administrationHour)) / k : 0), 0);
      expect(pk.aucMgHourL).toBeCloseTo(expected, 10);
      expect(pk.series[pk.series.length - 1].hour).toBe(pk.horizonHours);
      expect(pk.horizonHours).toBe(720);
      expect(pk.peakHour).toBe(1.002);
    });

    it('warns about defaults, unsupported routes, discarded events and absent provenance', () => {
      const pk = computeEventPK(healthy, drug, [event({ route: 'inhaled' }), event({ doseMg: -1 })]);
      const warnings = pk.warnings.join(' ');
      expect(warnings).toContain('Generic absorption');
      expect(warnings).toContain('Generic route bioavailability');
      expect(warnings).toContain('Unsupported route');
      expect(warnings).toContain('Invalid dose events');
      expect(warnings).toContain('provenance is absent');
      expect(computePK(healthy, drug, { ...acute, customEvents: [event({ doseMg: -1 })] })
        .warnings.join(' ')).toContain('Invalid dose events');
    });

    it('does not label present provenance as absent', () => {
      const pk = computeEventPK(healthy, {
        ...drug,
        parameterEvidence: {
          halfLifeHours: {
            sourceUrl: 'https://example.org/label', sourceTitle: 'Test label',
            reviewedAt: '2026-01-01', quality: 'high', basis: 'measured', unit: PARAMETER_EVIDENCE_UNITS.halfLifeHours,
          },
        },
      }, [event()]);
      expect(pk.warnings.join(' ')).not.toContain('provenance is absent');
      expect(pk.warnings.join(' ')).toContain('provenance is partial');
      expect(pk.warnings.join(' ')).toContain('vdLKg');
    });

    it('does not warn about partial provenance when all provided PK parameters have evidence', () => {
      const evidence = {
        sourceUrl: 'https://example.org/label', sourceTitle: 'Test label',
        reviewedAt: '2026-01-01', quality: 'high' as const, basis: 'measured' as const,
      };
      const pk = computeEventPK(healthy, {
        ...drug,
        parameterEvidence: {
          halfLifeHours: { ...evidence, unit: PARAMETER_EVIDENCE_UNITS.halfLifeHours },
          vdLKg: { ...evidence, unit: PARAMETER_EVIDENCE_UNITS.vdLKg },
          bioavailability: { ...evidence, unit: PARAMETER_EVIDENCE_UNITS.bioavailability },
        },
      }, [event()]);
      expect(pk.warnings.join(' ')).not.toContain('provenance is');
    });

    it.each(['estimated', 'unknown'] as const)('warns when present PK provenance uses %s parameters', (basis) => {
      const evidence = {
        sourceUrl: 'https://example.org/label', sourceTitle: 'Test label',
        reviewedAt: '2026-01-01', quality: 'low' as const, basis,
      };
      const pk = computeEventPK(healthy, {
        ...drug,
        parameterEvidence: {
          halfLifeHours: { ...evidence, unit: PARAMETER_EVIDENCE_UNITS.halfLifeHours },
          vdLKg: { ...evidence, unit: PARAMETER_EVIDENCE_UNITS.vdLKg },
          bioavailability: { ...evidence, unit: PARAMETER_EVIDENCE_UNITS.bioavailability },
        },
      }, [event()]);
      expect(pk.warnings.join(' ')).toContain('estimated or unknown parameters');
      expect(pk.warnings.join(' ')).not.toContain('provenance is absent');
    });

    it('warns about approximate profiles without changing absent-provenance wording', () => {
      const pk = computeEventPK(healthy, { ...drug, approximate: true }, [event()]);
      expect(pk.warnings.join(' ')).toContain('Approximate substance profile');
      expect(pk.warnings.join(' ')).toContain('Parameter provenance is absent');
    });

    it('warns nonfatally about CL/Vd half-life discrepancies and uses the clearance-derived value', () => {
      const clearance = Math.LN2 * drug.vdLKg / (24 * 0.06);
      const pk = computeEventPK(healthy, { ...drug, clearanceMlMinKg: clearance }, [event()]);
      expect(pk.baseHalfLifeHours).toBeCloseTo(24, 10);
      expect(pk.warnings.join(' ')).toContain('CL/Vd-derived half-life differs');
      const consistent = computeEventPK(healthy, {
        ...drug, halfLifeHours: 24, clearanceMlMinKg: clearance,
      }, [event()]);
      expect(consistent.warnings.join(' ')).not.toContain('CL/Vd-derived half-life differs');
      const invalid = computeEventPK(healthy, {
        ...drug, clearanceMlMinKg: NaN,
      }, [event()]);
      expect(invalid.warnings.join(' ')).not.toContain('CL/Vd-derived half-life differs');
      expect(invalid.baseHalfLifeHours).toBe(12);
    });

    it('rejects invalid infusions instead of silently turning them into boluses', () => {
      const events = [
        event({ route: 'IV', infusionDurationHours: 0 }),
        event({ route: 'IV', infusionDurationHours: -1 }),
        event({ route: 'IV', infusionDurationHours: Infinity }),
        event({ route: 'IV', infusionDurationHours: NaN }),
        event({ route: 'oral', infusionDurationHours: 2 }),
        event({ route: 'IV', infusionDurationHours: 2, kaOverride: 0.5 }),
      ];
      const pk = computeEventPK(healthy, drug, events);
      expect(pk.peakConcentration).toBe(0);
      expect(pk.aucMgHourL).toBe(0);
      expect(pk.peakHour).toBe(0);
      expect(flattenRegimensToEvents({ ...acute, customEvents: events }, drug)).toEqual([]);
    });

    it('bounds malformed and extreme inputs without nonfinite PK results', () => {
      const pk = computeEventPK({ ...healthy, weightKg: NaN, tolerance: Infinity }, {
        ...drug, halfLifeHours: NaN, vdLKg: NaN, bioavailability: NaN,
        absorptionByRoute: { oral: { kaPerHour: Infinity, lagHours: -1 } },
        releaseHoursByFormulation: { CR: NaN },
      }, [event({ doseMg: Number.MAX_VALUE, formulation: 'CR' })]);
      expect(pk.series.every((point) => Number.isFinite(point.concentration) && point.concentration >= 0)).toBe(true);
      expect([pk.aucMgHourL, pk.peakHour, pk.horizonHours, pk.toleranceScalar].every(Number.isFinite)).toBe(true);
      expect(pk.warnings.join(' ')).toContain('Invalid elimination');
      expect(pk.warnings.join(' ')).toContain('Invalid distribution');
      expect(pk.warnings.join(' ')).toContain('Invalid bioavailability');
    });

    it('makes simplified metabolite assumptions explicit, including infused parents', () => {
      const events = generateMetaboliteEvents([event({ route: 'IV', infusionDurationHours: 8 })], 0.01, drug.id, 0.5);
      expect(events[0].infusionDurationHours).toBeUndefined();
      const pk = computeEventPK(healthy, drug, events);
      expect(pk.series[0].concentration).toBe(0);
      expect(pk.warnings.join(' ')).toContain('not fully coupled');
    });

  describe('formatHours', () => {
    it('formats minutes, hours and days', () => {
      expect(formatHours(0.5)).toBe('30 min');
      expect(formatHours(4)).toBe('4.0 h');
      expect(formatHours(72)).toBe('3.0 d');
      expect(formatHours(Infinity)).toBe('∞');
    });
  });
});
