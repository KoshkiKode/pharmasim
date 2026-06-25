import { describe, expect, it } from 'vitest';
import type { Substance, SubstanceTag } from '../data/types';
import {
  computeBodySystemImpact,
  computeInteractions,
  severityRank,
} from './interactions';

let counter = 0;
function mk(tags: SubstanceTag[], extra: Partial<Substance> = {}): Substance {
  return {
    id: `sub-${counter++}`,
    name: `Sub ${counter}`,
    brandNames: [],
    category: 'pharmaceutical',
    drugClass: 'Test',
    halfLifeHours: 6,
    routes: ['oral'],
    mechanism: 'test',
    bodySystems: ['CNS'],
    tags,
    bioavailability: 0.7,
    vdLKg: 1.0,
    ...extra,
  };
}

describe('computeInteractions', () => {
  it('returns nothing for a single substance', () => {
    expect(computeInteractions([mk(['serotonergic'])])).toEqual([]);
  });

  it('detects serotonin syndrome between two serotonergic agents', () => {
    const res = computeInteractions([mk(['serotonergic']), mk(['serotonergic'])]);
    expect(res.some((r) => r.id.startsWith('serotonin-syndrome'))).toBe(true);
  });

  it('escalates MAOI + serotonergic to contraindicated', () => {
    const res = computeInteractions([mk(['maoi']), mk(['serotonergic'])]);
    const sero = res.find((r) => r.id.startsWith('serotonin-syndrome'));
    expect(sero?.severity).toBe('contraindicated');
  });

  it('detects CYP inhibition when an inhibitor meets a substrate', () => {
    const inhibitor = mk([], { cypInhibits: ['CYP3A4'] });
    const substrate = mk([], { cypMetabolism: ['CYP3A4'] });
    const res = computeInteractions([inhibitor, substrate]);
    expect(res.some((r) => r.id.startsWith('cyp-inhibition'))).toBe(true);
  });

  it('flags additive QT prolongation', () => {
    const res = computeInteractions([mk(['qt-prolonging']), mk(['qt-prolonging'])]);
    const qt = res.find((r) => r.id.startsWith('qt-prolongation'));
    expect(qt?.severity).toBe('major');
  });

  it('sorts results worst-first by severity', () => {
    const res = computeInteractions([
      mk(['maoi']),
      mk(['serotonergic', 'qt-prolonging', 'anticholinergic']),
    ]);
    for (let i = 1; i < res.length; i++)
      expect(severityRank(res[i - 1].severity)).toBeGreaterThanOrEqual(
        severityRank(res[i].severity),
      );
  });

  it('does not duplicate a rule for the same pair', () => {
    const res = computeInteractions([mk(['serotonergic']), mk(['serotonergic'])]);
    const seroHits = res.filter((r) => r.id.startsWith('serotonin-syndrome'));
    expect(seroHits.length).toBe(1);
  });
});

describe('computeBodySystemImpact', () => {
  it('aggregates and ranks affected body systems', () => {
    const a = mk([], { bodySystems: ['CNS', 'Hepatic'] });
    const b = mk([], { bodySystems: ['CNS'] });
    const impact = computeBodySystemImpact([a, b]);
    expect(impact[0].system).toBe('CNS');
    expect(impact[0].load).toBe(2);
  });
});
