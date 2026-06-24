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
};

describe('substance database', () => {
  it('passes validation with no issues', () => {
    expect(validateSubstances(substances)).toEqual([]);
  });

  it('has a meaningful number of entries', () => {
    expect(substances.length).toBeGreaterThan(700);
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
});
