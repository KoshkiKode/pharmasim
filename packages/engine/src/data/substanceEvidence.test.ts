import { describe, expect, it } from 'vitest';
import { computeInteractions } from '../lib/interactions';
import { computePK } from '../lib/pharmacokinetics';
import { PARAMETER_EVIDENCE_UNITS } from './types';
import { substances } from './substances';
import { validateSubstances } from './validate';

const reviewedIds = ['levocetirizine', 'ketoprofen', 'oxaprozin'];
const get = (id: string) => {
  const substance = substances.find((entry) => entry.id === id);
  expect(substance, `Missing substance ${id}`).toBeDefined();
  return substance!;
};

describe('reviewed substance expansion', () => {
  it.each(reviewedIds)('includes a unique, validated %s without dose guidance', (id) => {
    const entry = get(id);
    expect(substances.filter((substance) => substance.id === id)).toHaveLength(1);
    expect(validateSubstances([entry])).toEqual([]);
    expect(entry.typicalDoseMg).toBeUndefined();
    expect(entry.doseRangeMg).toBeUndefined();
  });

  it.each(reviewedIds)('documents every supplied PK parameter and interaction tag for %s', (id) => {
    const entry = get(id);
    for (const field of ['halfLifeHours', 'bioavailability', 'vdLKg', 'tags'] as const) {
      expect(entry.parameterEvidence?.[field], `${id}.${field}`).toBeDefined();
    }
    for (const field of Object.keys(PARAMETER_EVIDENCE_UNITS) as (keyof typeof PARAMETER_EVIDENCE_UNITS)[]) {
      if (entry[field] === undefined) continue;
      const evidence = entry.parameterEvidence?.[field];
      expect(evidence, `${id}.${field} lacks evidence`).toBeDefined();
      expect(evidence!.sourceUrl).toMatch(/^https:\/\/dailymed\.nlm\.nih\.gov\//);
      expect(evidence!.sourceTitle).toMatch(/DailyMed/);
      expect(evidence!.reviewedAt).toBe('2026-10-25');
      expect(evidence!.unit).toBe(PARAMETER_EVIDENCE_UNITS[field]);
      expect(['high', 'moderate', 'low']).toContain(evidence!.quality);
      expect(['measured', 'estimated', 'unknown']).toContain(evidence!.basis);
      expect(evidence!.notes?.length).toBeGreaterThan(0);
    }
  });

  it('does not misrepresent assumed oral availability or normalized apparent volume as measured', () => {
    const levocetirizine = get('levocetirizine');
    expect(levocetirizine.approximate).toBe(true);
    expect(levocetirizine.parameterEvidence?.bioavailability).toMatchObject({
      basis: 'estimated', quality: 'low', unit: 'fraction',
    });
    expect(levocetirizine.parameterEvidence?.bioavailability?.notes).toContain('not a measured absolute F');
    const oxaprozin = get('oxaprozin');
    expect(oxaprozin.parameterEvidence?.vdLKg?.basis).toBe('estimated');
    expect(oxaprozin.vdLKg).toBeCloseTo((14 / 70) * oxaprozin.bioavailability);
    expect(oxaprozin.halfLifeHours).toBe(41.4);
  });

  it.each(['ketoprofen', 'oxaprozin'])('connects %s to existing bleeding-risk rules', (id) => {
    const entry = get(id);
    expect(entry.tags).toEqual(expect.arrayContaining(['nsaid', 'nephrotoxic']));
    const interactions = computeInteractions([entry, get('warfarin')]);
    expect(interactions.some((interaction) => interaction.id.startsWith('bleeding'))).toBe(true);
  });

  it('preserves the antihistamine CNS-depressant interaction signal', () => {
    expect(get('levocetirizine').tags).toEqual(
      expect.arrayContaining(['antihistamine', 'cns-depressant']),
    );
    const interactions = computeInteractions([get('levocetirizine'), get('ethanol')]);
    expect(interactions.some((interaction) => interaction.id.startsWith('cns-respiratory-depression'))).toBe(true);
  });

  it.each(reviewedIds)('integrates %s into finite, positive oral PK predictions', (id) => {
    const result = computePK({
      biologicalSex: 'M', ageYears: 35, weightKg: 70, heightCm: 175,
      bodyFatPct: 22, tolerance: 0, liver: 'normal', kidney: 'normal',
      hydrationPct: 50, genetics: {}, conditions: [],
    }, get(id), {
      mode: 'acute', doseMg: 1, dailyDoseMg: 1, daysOnRegimen: 1,
      frequency: 'QD', toleranceOverride: null,
    });
    expect(result.series.length).toBeGreaterThan(0);
    expect(result.series.every(({ concentration }) =>
      Number.isFinite(concentration) && concentration >= 0,
    )).toBe(true);
    expect(result.peakConcentration).toBeGreaterThan(0);
    expect(Number.isFinite(result.aucMgHourL)).toBe(true);
    expect(result.aucMgHourL).toBeGreaterThan(0);
  });
});
