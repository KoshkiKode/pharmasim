import { describe, it, expect } from 'vitest';
import { computePK } from './pharmacokinetics';
import type { Substance, Route } from '../data/types';
import type { PatientProfile, RegimenConfig } from './pharmacokinetics';

describe('Route Modifiers (ROA)', () => {
  const patient: PatientProfile = {
    biologicalSex: 'M', ageYears: 30, weightKg: 70, heightCm: 175,
    bodyFatPct: 15, tolerance: 0, liver: 'normal', kidney: 'normal',
    hydrationPct: 50, genetics: {}, conditions: []
  };

  const dummyDrug: Substance = {
    id: 'dummy', name: 'Dummy', brandNames: [], category: 'pharmaceutical', drugClass: 'Test',
    halfLifeHours: 10, routes: ['oral'], mechanism: '', bodySystems: [], tags: [],
    bioavailability: 0.5, vdLKg: 1.0,
  };

  it('oral is the default and applies baseline parameters', () => {
    const regimen: RegimenConfig = { mode: 'acute', doseMg: 100, dailyDoseMg: 100, daysOnRegimen: 1, frequency: 'QD', toleranceOverride: null };
    const oralPK = computePK(patient, dummyDrug, regimen);
    expect(oralPK.peakConcentration).toBeGreaterThan(0);
  });

  it('IV route has 1.0 bioavailability and much faster Tmax', () => {
    const oralRegimen: RegimenConfig = { mode: 'acute', doseMg: 100, dailyDoseMg: 100, daysOnRegimen: 1, frequency: 'QD', toleranceOverride: null, route: 'oral' };
    const ivRegimen: RegimenConfig = { mode: 'acute', doseMg: 100, dailyDoseMg: 100, daysOnRegimen: 1, frequency: 'QD', toleranceOverride: null, route: 'IV' };
    
    const oralPK = computePK(patient, dummyDrug, oralRegimen);
    const ivPK = computePK(patient, dummyDrug, ivRegimen);

    // IV bioavailability is 1.0 vs oral 0.5, so IV peak should be significantly higher.
    // IV also hits much faster, so peak is higher anyway.
    expect(ivPK.peakConcentration).toBeGreaterThan(oralPK.peakConcentration * 1.5);
  });

  it('inhaled route is faster than oral', () => {
    const oralRegimen: RegimenConfig = { mode: 'acute', doseMg: 100, dailyDoseMg: 100, daysOnRegimen: 1, frequency: 'QD', toleranceOverride: null, route: 'oral' };
    const smokedRegimen: RegimenConfig = { mode: 'acute', doseMg: 100, dailyDoseMg: 100, daysOnRegimen: 1, frequency: 'QD', toleranceOverride: null, route: 'inhaled' };
    
    const oralPK = computePK(patient, dummyDrug, oralRegimen);
    const smokedPK = computePK(patient, dummyDrug, smokedRegimen);

    // Smoked should spike higher and faster than oral
    expect(smokedPK.peakConcentration).toBeGreaterThan(oralPK.peakConcentration);
  });
  
  it('transdermal route absorbs much slower', () => {
    const oralRegimen: RegimenConfig = { mode: 'acute', doseMg: 100, dailyDoseMg: 100, daysOnRegimen: 1, frequency: 'QD', toleranceOverride: null, route: 'oral' };
    const patchRegimen: RegimenConfig = { mode: 'acute', doseMg: 100, dailyDoseMg: 100, daysOnRegimen: 1, frequency: 'QD', toleranceOverride: null, route: 'transdermal' };
    
    const oralPK = computePK(patient, dummyDrug, oralRegimen);
    const patchPK = computePK(patient, dummyDrug, patchRegimen);

    // Transdermal (Tmax 8h) has a much lower peak because it absorbs so slowly compared to elimination
    expect(patchPK.peakConcentration).toBeLessThan(oralPK.peakConcentration);
  });
});
