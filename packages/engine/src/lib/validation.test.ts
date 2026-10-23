import { describe, expect, it } from 'vitest';
import type { PatientProfile } from './pharmacokinetics';
import { substances } from '../data/substances';
import {
  sanitizePatientProfile,
  sanitizeRegimenConfig,
  validatePatientProfile,
  validateRegimenConfig,
} from './validation';

const patient: PatientProfile = {
  biologicalSex: 'M',
  ageYears: 35,
  weightKg: 75,
  heightCm: 175,
  bodyFatPct: 22,
  tolerance: 0,
  liver: 'normal',
  kidney: 'normal',
  hydrationPct: 50,
  genetics: {},
  conditions: [],
};

describe('runtime input validation', () => {
  it('reports invalid patient values', () => {
    const invalid = { ...patient, ageYears: Number.NaN, weightKg: -1, conditions: ['missing'] };
    expect(validatePatientProfile(invalid).map((issue) => issue.field)).toEqual(
      expect.arrayContaining(['ageYears', 'weightKg', 'conditions']),
    );
  });

  it('sanitizes persisted patient values without producing non-finite numbers', () => {
    const result = sanitizePatientProfile(patient, {
      ageYears: Number.POSITIVE_INFINITY,
      weightKg: -10,
      bodyFatPct: 45,
      conditions: ['missing'],
      genetics: { CYP2D6: 'not-real' as never, CYP3A4: 'rapid' },
    });
    expect(result.ageYears).toBe(patient.ageYears);
    expect(result.weightKg).toBe(0.1);
    expect(result.conditions).toEqual([]);
    expect(result.genetics).toEqual({ CYP3A4: 'rapid' });
    expect(validatePatientProfile(result)).toEqual([]);
  });

  it('sanitizes malformed regimen values and custom events', () => {
    const substance = substances[0];
    const regimen = sanitizeRegimenConfig(substance, {
      doseMg: Number.NaN,
      daysOnRegimen: 999,
      frequency: 'monthly' as never,
      customEvents: [
        { doseMg: 10, administrationHour: 2, route: 'oral', formulation: 'IR' } as never,
        { doseMg: 10, administrationHour: -1, route: 'oral', formulation: 'IR' } as never,
      ],
    });
    expect(regimen.doseMg).toBe(substance.typicalDoseMg ?? 100);
    expect(regimen.daysOnRegimen).toBe(365);
    expect(regimen.customEvents).toHaveLength(1);
    expect(validateRegimenConfig(regimen)).toEqual([]);
  });
});
