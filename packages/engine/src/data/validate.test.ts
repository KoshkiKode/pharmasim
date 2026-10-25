import { describe, expect, it } from 'vitest';
import { PARAMETER_EVIDENCE_UNITS, type ParameterEvidence, type Substance } from './types';
import { substances } from './substances';
import { assertValidSubstances, auditSubstanceConsistency, validateSubstances } from './validate';

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

const evidence: ParameterEvidence = {
  sourceUrl: 'https://example.org/reference',
  sourceTitle: 'Clinical reference',
  reviewedAt: '2024-02-29',
  quality: 'high',
  basis: 'measured',
  unit: PARAMETER_EVIDENCE_UNITS.halfLifeHours,
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

  it.each([Number.NaN, Infinity, -Infinity])('rejects nonfinite half-life %s', (halfLifeHours) => {
    expect(validateSubstances([{ ...base, halfLifeHours }])).toEqual([
      expect.objectContaining({ field: 'halfLifeHours' }),
    ]);
  });

  it('accepts route absorption and formulation release parameters', () => {
    expect(validateSubstances([{
      ...base,
      absorptionByRoute: { oral: { kaPerHour: 1.2, lagHours: 0 }, IM: { kaPerHour: 0.4 } },
      releaseHoursByFormulation: { IR: 0.25, ER: 12, XR: 24, CR: 8 },
    }])).toEqual([]);
  });

  it.each([0, -1, Infinity, Number.NaN])('rejects invalid absorption rate and release duration %s', (value) => {
    const fields = validateSubstances([{
      ...base,
      absorptionByRoute: { oral: { kaPerHour: value } },
      releaseHoursByFormulation: { ER: value },
    }]).map((i) => i.field);
    expect(fields).toContain('absorptionByRoute.oral.kaPerHour');
    expect(fields).toContain('releaseHoursByFormulation.ER');
  });

  it.each([-1, Infinity, Number.NaN])('rejects invalid absorption lag %s', (lagHours) => {
    expect(validateSubstances([{
      ...base, absorptionByRoute: { oral: { kaPerHour: 1, lagHours } },
    }])).toEqual([expect.objectContaining({ field: 'absorptionByRoute.oral.lagHours' })]);
  });

  it('rejects unknown route/formulation keys and malformed absorption objects', () => {
    const s = {
      ...base,
      absorptionByRoute: { teleport: { kaPerHour: 1 }, oral: null },
      releaseHoursByFormulation: { depot: 24 },
    } as unknown as Substance;
    expect(validateSubstances([s]).map((i) => i.field)).toEqual(expect.arrayContaining([
      'absorptionByRoute.teleport', 'absorptionByRoute.oral', 'releaseHoursByFormulation.depot',
    ]));
  });

  it('accepts evidence for each supported present field with canonical units', () => {
    const s: Substance = {
      ...base,
      clearanceMlMinKg: 2,
      proteinBindingPct: 50,
      bioavailabilityByRoute: { oral: 0.7 },
      absorptionByRoute: { oral: { kaPerHour: 1 } },
      releaseHoursByFormulation: { ER: 12 },
      molarMassGPerMol: 250,
      tags: ['serotonergic'],
      metabolites: [{ targetId: 'metabolite', conversionFraction: 0.2, enzyme: 'CYP3A4' }],
      parameterEvidence: Object.fromEntries(Object.entries(PARAMETER_EVIDENCE_UNITS)
        .map(([parameter, unit]) => [parameter, { ...evidence, unit }])),
    };
    expect(validateSubstances([s, { ...base, id: 'metabolite' }])).toEqual([]);
  });

  it.each(['high', 'moderate', 'low'] as const)('accepts evidence quality %s', (quality) => {
    expect(validateSubstances([{
      ...base, parameterEvidence: { halfLifeHours: { ...evidence, quality } },
    }])).toEqual([]);
  });

  it.each(['measured', 'estimated', 'unknown'] as const)('accepts basis %s for a present value', (basis) => {
    expect(validateSubstances([{
      ...base, parameterEvidence: { halfLifeHours: { ...evidence, basis } },
    }])).toEqual([]);
  });

  it.each(['2023-02-29', '2024-02-30', '2024-04-31', '2024-13-01', '2024-00-01', '2024-1-01', '', 'not-a-date'])(
    'rejects invalid reviewedAt date %s', (reviewedAt) => {
      expect(validateSubstances([{
        ...base, parameterEvidence: { halfLifeHours: { ...evidence, reviewedAt } },
      }])).toEqual([expect.objectContaining({ field: 'parameterEvidence.halfLifeHours.reviewedAt' })]);
    },
  );

  it.each(['http://example.org', 'ftp://example.org', '/relative', 'https://', 'https:example.org', '', 'not-a-url'])(
    'rejects invalid source URL %s', (sourceUrl) => {
      expect(validateSubstances([{
        ...base, parameterEvidence: { halfLifeHours: { ...evidence, sourceUrl } },
      }])).toEqual([expect.objectContaining({ field: 'parameterEvidence.halfLifeHours.sourceUrl' })]);
    },
  );

  it('rejects invalid evidence enums, missing strings, incorrect units, and empty notes', () => {
    const s = {
      ...base,
      parameterEvidence: {
        halfLifeHours: { ...evidence, quality: 'excellent', basis: 'assumed', unit: 'minutes', sourceTitle: ' ', notes: '' },
      },
    } as unknown as Substance;
    expect(validateSubstances([s]).map((i) => i.field)).toEqual(expect.arrayContaining([
      'parameterEvidence.halfLifeHours.quality', 'parameterEvidence.halfLifeHours.basis',
      'parameterEvidence.halfLifeHours.unit', 'parameterEvidence.halfLifeHours.sourceTitle',
      'parameterEvidence.halfLifeHours.notes',
    ]));
  });

  it('rejects unknown evidence parameters and malformed evidence objects', () => {
    for (const parameterEvidence of [null, [], { halfLifeHours: null }, { unknown: evidence }, { toString: evidence }]) {
      expect(validateSubstances([{ ...base, parameterEvidence } as unknown as Substance]).length).toBeGreaterThan(0);
    }
  });

  it('rejects evidence for absent or empty fields, even with unknown basis', () => {
    const issues = validateSubstances([{
      ...base,
      tags: [],
      absorptionByRoute: {},
      parameterEvidence: {
        clearanceMlMinKg: { ...evidence, basis: 'unknown', unit: PARAMETER_EVIDENCE_UNITS.clearanceMlMinKg },
        tags: { ...evidence, unit: PARAMETER_EVIDENCE_UNITS.tags },
        absorptionByRoute: { ...evidence, unit: PARAMETER_EVIDENCE_UNITS.absorptionByRoute },
      },
    }]);
    expect(issues.map((i) => i.field)).toEqual(expect.arrayContaining([
      'parameterEvidence.clearanceMlMinKg', 'parameterEvidence.tags', 'parameterEvidence.absorptionByRoute',
    ]));
  });

  it('accepts evidence for legitimate zero values', () => {
    expect(validateSubstances([{
      ...base, bioavailability: 0, clearanceMlMinKg: 0, proteinBindingPct: 0,
      parameterEvidence: {
        bioavailability: { ...evidence, unit: PARAMETER_EVIDENCE_UNITS.bioavailability },
        clearanceMlMinKg: { ...evidence, unit: PARAMETER_EVIDENCE_UNITS.clearanceMlMinKg },
        proteinBindingPct: { ...evidence, unit: PARAMETER_EVIDENCE_UNITS.proteinBindingPct },
      },
    }])).toEqual([]);
  });

  it('rejects missing mixture/metabolite targets and self references', () => {
    const issues = validateSubstances([{
      ...base,
      activeIngredients: [{ id: 'missing', ratio: 0.5 }, { id: base.id, ratio: 0.5 }],
      metabolites: [
        { targetId: 'missing', conversionFraction: 0.1, enzyme: 'CYP3A4' },
        { targetId: base.id, conversionFraction: 0.1, enzyme: 'CYP3A4' },
      ],
    }]);
    expect(issues.filter((i) => /unknown/.test(i.message))).toHaveLength(2);
    expect(issues.filter((i) => /itself/.test(i.message))).toHaveLength(2);
  });

  it.each(['mixture', 'metabolite', 'mixed'])('rejects indirect %s cycles', (kind) => {
    const a: Substance = { ...base, id: 'a' };
    const b: Substance = { ...base, id: 'b' };
    if (kind === 'mixture' || kind === 'mixed') a.activeIngredients = [{ id: 'b', ratio: 1 }];
    else a.metabolites = [{ targetId: 'b', conversionFraction: 1, enzyme: 'CYP3A4' }];
    if (kind === 'mixture') b.activeIngredients = [{ id: 'a', ratio: 1 }];
    else b.metabolites = [{ targetId: 'a', conversionFraction: 1, enzyme: 'CYP3A4' }];
    expect(validateSubstances([a, b]).some((i) => /cyclic/.test(i.message))).toBe(true);
  });

  it('accepts acyclic references to a shared target', () => {
    expect(validateSubstances([
      { ...base, id: 'a', activeIngredients: [{ id: 'target', ratio: 1 }] },
      { ...base, id: 'b', metabolites: [{ targetId: 'target', conversionFraction: 1, enzyme: 'CYP3A4' }] },
      { ...base, id: 'target' },
    ])).toEqual([]);
  });

  it('flags empty routes and body systems', () => {
    const issues = validateSubstances([{ ...base, routes: [], bodySystems: [] }]);
    expect(issues.some((i) => i.field === 'routes')).toBe(true);
    expect(issues.some((i) => i.field === 'bodySystems')).toBe(true);
  });

  describe('auditSubstanceConsistency', () => {
    const consistent: Substance = { ...base, clearanceMlMinKg: Math.LN2 / (4 * 0.06) };

    it('converts clearance units and accepts matching PK values', () => {
      expect(auditSubstanceConsistency([consistent])).toEqual([]);
    });

    it('reports a >25% discrepancy without making validation fatal', () => {
      const inconsistent = { ...consistent, clearanceMlMinKg: consistent.clearanceMlMinKg! / 2 };
      expect(auditSubstanceConsistency([inconsistent])).toEqual([
        expect.objectContaining({ substanceId: base.id, field: 'halfLifeHours', message: expect.stringContaining('>25%') }),
      ]);
      expect(validateSubstances([inconsistent])).toEqual([]);
      expect(() => assertValidSubstances([inconsistent])).not.toThrow();
    });

    it('accepts discrepancies below the threshold and flags either direction above it', () => {
      for (const multiplier of [0.76, 1.24]) {
        expect(auditSubstanceConsistency([{
          ...consistent, halfLifeHours: 4 / multiplier,
        }])).toEqual([]);
      }
      for (const multiplier of [0.74, 1.26]) {
        expect(auditSubstanceConsistency([{
          ...consistent, halfLifeHours: 4 / multiplier,
        }])).toHaveLength(1);
      }
    });

    it('skips missing, zero, negative and nonfinite clearance and invalid inputs', () => {
      for (const clearanceMlMinKg of [undefined, 0, -1, Infinity, Number.NaN])
        expect(auditSubstanceConsistency([{ ...base, clearanceMlMinKg }])).toEqual([]);
      expect(auditSubstanceConsistency([
        { ...consistent, halfLifeHours: 0 }, { ...consistent, vdLKg: Infinity },
      ])).toEqual([]);
    });
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
