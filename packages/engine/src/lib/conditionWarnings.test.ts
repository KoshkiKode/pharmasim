import { describe, expect, it } from 'vitest';
import type { Substance, SubstanceTag } from '../data/types';
import { computeConditionWarnings, type ConditionWarning } from './conditionWarnings';

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

describe('computeConditionWarnings', () => {
  it('returns empty warnings for a patient with no conditions', () => {
    const s = mk(['nsaid']);
    expect(computeConditionWarnings([s], [], 'normal', 'normal')).toEqual([]);
  });

  it('triggers a warning for NSAID in asthma', () => {
    const s = mk(['nsaid']);
    const res = computeConditionWarnings([s], ['asthma'], 'normal', 'normal');
    expect(res.length).toBe(1);
    expect(res[0].conditionId).toBe('asthma');
    expect(res[0].severity).toBe('major');
    expect(res[0].title).toContain('NSAID');
  });

  it('triggers a contraindicated warning for Beta-blocker in asthma', () => {
    const s = mk([], { drugClass: 'Beta-blocker', brandNames: ['Metoprolol'] });
    const res = computeConditionWarnings([s], ['asthma'], 'normal', 'normal');
    expect(res.length).toBe(1);
    expect(res[0].severity).toBe('contraindicated');
    expect(res[0].isLifeThreatening).toBe(true);
  });

  it('triggers pregnancy category X warning', () => {
    const s = mk([], { pregnancyCategory: 'X' });
    const res = computeConditionWarnings([s], ['pregnancy'], 'normal', 'normal');
    expect(res.length).toBe(1);
    expect(res[0].severity).toBe('contraindicated');
    expect(res[0].isLifeThreatening).toBe(true);
  });

  it('triggers combined respiratory depression in sleep-apnea-copd', () => {
    const s1 = mk(['cns-depressant']);
    const s2 = mk(['opioid']);
    const res = computeConditionWarnings([s1, s2], ['sleep-apnea-copd'], 'normal', 'normal');
    // It should have the single warnings and the combined warning
    const combo = res.find(r => r.id.startsWith('cond-combo:'));
    expect(combo).toBeDefined();
    expect(combo?.severity).toBe('contraindicated');
    expect(combo?.isLifeThreatening).toBe(true);
  });

  it('automatically triggers ckd warnings when kidney function is impaired', () => {
    const s = mk(['nephrotoxic']);
    const res = computeConditionWarnings([s], [], 'normal', 'impaired');
    expect(res.length).toBe(1);
    expect(res[0].conditionId).toBe('ckd');
    expect(res[0].severity).toBe('contraindicated');
  });

  it('counts alcohol-tagged substances as depressants in sleep apnea/COPD combinations', () => {
    const res = computeConditionWarnings([mk(['cns-depressant']), mk(['alcohol'])], ['sleep-apnea-copd'], 'normal', 'normal');
    expect(res.some(r => r.id.startsWith('cond-combo:sleep-apnea-copd:'))).toBe(true);
  });

  describe('liver cirrhosis combination rule', () => {
    const cirrhosisCombo = (res: ConditionWarning[]) =>
      res.find(r => r.id.startsWith('cond-combo:liver-cirrhosis:'));

    it('flags a life-threatening combination when two hepatotoxins are present', () => {
      const a = mk(['hepatotoxic']);
      const b = mk(['hepatotoxic']);
      const combo = cirrhosisCombo(computeConditionWarnings([a, b], ['liver-cirrhosis'], 'normal', 'normal'));
      expect(combo?.severity).toBe('contraindicated');
      expect(combo?.isLifeThreatening).toBe(true);
      expect(combo?.title).toBe('Life-Threatening Combination: Acute Liver Failure');
      expect(combo?.substanceIds).toEqual([a.id, b.id]);
    });

    it('does not raise the combination for a single hepatotoxin', () => {
      const res = computeConditionWarnings([mk(['hepatotoxic'])], ['liver-cirrhosis'], 'normal', 'normal');
      expect(cirrhosisCombo(res)).toBeUndefined();
    });

    it('applies the combination when liver function is impaired without a cirrhosis condition', () => {
      const res = computeConditionWarnings([mk(['hepatotoxic']), mk(['hepatotoxic'])], [], 'impaired', 'normal');
      expect(cirrhosisCombo(res)).toBeDefined();
    });

    it('counts alcohol-tagged substances toward the combination', () => {
      const drug = mk(['hepatotoxic']);
      const alcohol = mk(['alcohol']);
      const combo = cirrhosisCombo(computeConditionWarnings([drug, alcohol], ['liver-cirrhosis'], 'normal', 'normal'));
      expect(combo?.substanceIds).toEqual([drug.id, alcohol.id]);
    });

    it('gives alcohol-specific advice for an alcohol-tagged substance', () => {
      const ethanol = mk(['hepatotoxic', 'alcohol'], { id: 'ethanol', name: 'Ethanol' });
      const res = computeConditionWarnings([ethanol], ['liver-cirrhosis'], 'normal', 'normal');
      expect(res).toHaveLength(1);
      expect(res[0].recommendation).toBe('Contraindicated. Completely avoid alcohol.');
    });
  });
});
