import { describe, expect, it } from 'vitest';
import type { Substance } from './types';
import { substances } from './substances';
import { validateSubstances } from './validate';

const base: Substance = {
  id: 'test-sub',
  name: 'Test Substance',
  brandNames: ['Testol'],
  category: 'pharmaceutical',
  drugClass: 'Test class',
  halfLifeHours: 4,
  typicalDoseMg: 50,
  doseRangeMg: [25, 100],
  routes: ['oral'],
  mechanism: 'Does a thing.',
  bodySystems: ['CNS'],
  bioavailability: 0.7,
  vdLKg: 1.0,
};

describe('substance database', () => {
  it('passes validation with no issues', () => {
    expect(validateSubstances(substances)).toEqual([]);
  });

  it('has a meaningful number of entries', () => {
    expect(substances.length).toBeGreaterThan(880);
  });

  it('has globally unique ids', () => {
    const ids = substances.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('validateSubstances', () => {
  it('accepts a well-formed entry', () => {
    expect(validateSubstances([base])).toEqual([]);
  });

  it('flags duplicate ids', () => {
    const issues = validateSubstances([base, { ...base, name: 'Clone' }]);
    expect(issues.some((i) => i.field === 'id' && /duplicate/.test(i.message))).toBe(true);
  });

  it('rejects NaN dose values and ranges that comparisons alone would pass', () => {
    const issues = validateSubstances([
      { ...base, id: 'nan-dose', typicalDoseMg: Number.NaN, doseRangeMg: [Number.NaN, 100] },
    ]);
    const fields = issues.map((i) => i.field);
    expect(fields).toEqual(expect.arrayContaining(['doseRangeMg', 'typicalDoseMg']));
  });

  it('validates optional molarMassGPerMol when present', () => {
    expect(validateSubstances([{ ...base, id: 'mm-ok', molarMassGPerMol: 350 }])).toEqual([]);
    const issues = validateSubstances([{ ...base, id: 'mm-bad', molarMassGPerMol: Number.NaN }]);
    expect(issues.some((i) => i.field === 'molarMassGPerMol')).toBe(true);
    const zero = validateSubstances([{ ...base, id: 'mm-zero', molarMassGPerMol: 0 }]);
    expect(zero.some((i) => i.field === 'molarMassGPerMol')).toBe(true);
  });

  it('flags malformed ids', () => {
    const issues = validateSubstances([{ ...base, id: 'Bad Id!' }]);
    expect(issues.some((i) => i.field === 'id')).toBe(true);
  });

  it('flags inverted dose ranges', () => {
    const issues = validateSubstances([{ ...base, doseRangeMg: [100, 25] }]);
    expect(issues.some((i) => i.field === 'doseRangeMg')).toBe(true);
  });

  it('flags a typical dose outside the dose range', () => {
    const issues = validateSubstances([{ ...base, typicalDoseMg: 500 }]);
    expect(issues.some((i) => i.field === 'typicalDoseMg')).toBe(true);
  });

  it('flags a non-positive half-life', () => {
    const issues = validateSubstances([{ ...base, halfLifeHours: 0 }]);
    expect(issues.some((i) => i.field === 'halfLifeHours')).toBe(true);
  });

  it('flags empty routes and body systems', () => {
    const issues = validateSubstances([{ ...base, routes: [], bodySystems: [] }]);
    expect(issues.some((i) => i.field === 'routes')).toBe(true);
    expect(issues.some((i) => i.field === 'bodySystems')).toBe(true);
  });

  it('flags malformed advanced simulation fields', () => {
    const issues = validateSubstances([
      {
        ...base,
        bioavailability: 1.5,
        vdLKg: 0,
        toxicity: { toxicConcentrationMgL: 10, lethalConcentrationMgL: 5 },
        activeIngredients: [{ id: 'a', ratio: 0.8 }, { id: 'b', ratio: 0.4 }],
        metabolites: [{ targetId: '', conversionFraction: 2, enzyme: '' }],
        bindingAffinities: { MOR: { kiNm: 0, intrinsicActivity: 2 } },
      },
    ]);
    expect(issues.some((i) => i.field === 'bioavailability')).toBe(true);
    expect(issues.some((i) => i.field === 'vdLKg')).toBe(true);
    expect(issues.some((i) => i.field.startsWith('toxicity.'))).toBe(true);
    expect(issues.some((i) => i.field === 'activeIngredients')).toBe(true);
    expect(issues.some((i) => i.field.startsWith('metabolites.'))).toBe(true);
    expect(issues.some((i) => i.field.startsWith('bindingAffinities.'))).toBe(true);
  });
});
