import type { Substance, SubstanceTag } from '@/data/types';

export type Severity = 'minor' | 'moderate' | 'major' | 'contraindicated';

export interface Interaction {
  id: string;
  severity: Severity;
  title: string;
  mechanism: string;
  recommendation: string;
  substances: [string, string]; // substance ids
  substanceNames: [string, string];
}

const SEVERITY_RANK: Record<Severity, number> = {
  minor: 0,
  moderate: 1,
  major: 2,
  contraindicated: 3,
};

export function severityRank(s: Severity): number {
  return SEVERITY_RANK[s];
}

function has(s: Substance, tag: SubstanceTag): boolean {
  return !!s.tags?.includes(tag);
}

function sharedCyp(a: string[] | undefined, b: string[] | undefined): string[] {
  if (!a || !b) return [];
  const setB = new Set(b);
  return a.filter((x) => setB.has(x));
}

interface Rule {
  id: string;
  /** Evaluate a pair; return an interaction (in one direction) or null. */
  evaluate: (a: Substance, b: Substance) => Omit<
    Interaction,
    'substances' | 'substanceNames' | 'id'
  > | null;
}

const RULES: Rule[] = [
  // --- Serotonin syndrome ---------------------------------------------------
  {
    id: 'serotonin-syndrome',
    evaluate: (a, b) => {
      const aSero = has(a, 'serotonergic') || has(a, 'serotonin-releaser') || has(a, 'maoi');
      const bSero = has(b, 'serotonergic') || has(b, 'serotonin-releaser') || has(b, 'maoi');
      if (!aSero || !bSero) return null;
      const maoiInvolved = has(a, 'maoi') || has(b, 'maoi');
      const releaserInvolved =
        has(a, 'serotonin-releaser') || has(b, 'serotonin-releaser');
      const severity: Severity = maoiInvolved
        ? 'contraindicated'
        : releaserInvolved
          ? 'major'
          : 'major';
      return {
        severity,
        title: 'Serotonin syndrome risk',
        mechanism:
          'Additive serotonergic activity. Excess synaptic serotonin can cause agitation, hyperthermia, clonus, autonomic instability and, in severe cases, rhabdomyolysis.' +
          (maoiInvolved
            ? ' An MAOI is involved — combination can be life-threatening.'
            : ''),
        recommendation: maoiInvolved
          ? 'Contraindicated. Observe required washout periods (often 2 weeks) between agents.'
          : 'Avoid combining or monitor closely for serotonergic toxicity; reduce doses where possible.',
      };
    },
  },

  // --- CNS / respiratory depression ----------------------------------------
  {
    id: 'cns-respiratory-depression',
    evaluate: (a, b) => {
      const aDep =
        has(a, 'cns-depressant') ||
        has(a, 'respiratory-depressant') ||
        has(a, 'opioid') ||
        has(a, 'benzodiazepine') ||
        has(a, 'alcohol');
      const bDep =
        has(b, 'cns-depressant') ||
        has(b, 'respiratory-depressant') ||
        has(b, 'opioid') ||
        has(b, 'benzodiazepine') ||
        has(b, 'alcohol');
      if (!aDep || !bDep) return null;
      const opioidInvolved = has(a, 'opioid') || has(b, 'opioid');
      const benzoInvolved = has(a, 'benzodiazepine') || has(b, 'benzodiazepine');
      const respInvolved =
        has(a, 'respiratory-depressant') || has(b, 'respiratory-depressant');
      const severe = (opioidInvolved && benzoInvolved) || (opioidInvolved && respInvolved);
      return {
        severity: severe ? 'major' : 'moderate',
        title: 'Additive CNS / respiratory depression',
        mechanism:
          'Combined sedative effects depress the central nervous system and respiratory drive. Opioid + benzodiazepine + alcohol combinations carry a high risk of fatal respiratory depression.',
        recommendation: severe
          ? 'Avoid concurrent use. If unavoidable, use lowest doses, monitor sedation/respiration, and consider naloxone access.'
          : 'Use caution; additive sedation and impairment likely. Avoid driving and operating machinery.',
      };
    },
  },

  // --- CYP inhibition: A inhibits an enzyme that metabolises B --------------
  {
    id: 'cyp-inhibition',
    evaluate: (a, b) => {
      const overlap = sharedCyp(a.cypInhibits, b.cypMetabolism);
      if (overlap.length === 0) return null;
      return {
        severity: 'moderate',
        title: `CYP inhibition (${overlap.join(', ')})`,
        mechanism: `${a.name} inhibits ${overlap.join(', ')}, the enzyme(s) that clear ${b.name}. Plasma levels of ${b.name} may rise, increasing effect and toxicity risk.`,
        recommendation: `Monitor for ${b.name} toxicity; a dose reduction of ${b.name} may be required.`,
      };
    },
  },

  // --- CYP induction: A induces an enzyme that metabolises B ----------------
  {
    id: 'cyp-induction',
    evaluate: (a, b) => {
      const overlap = sharedCyp(a.cypInduces, b.cypMetabolism);
      if (overlap.length === 0) return null;
      return {
        severity: 'moderate',
        title: `CYP induction (${overlap.join(', ')})`,
        mechanism: `${a.name} induces ${overlap.join(', ')}, accelerating clearance of ${b.name}. Plasma levels of ${b.name} may fall, risking therapeutic failure.`,
        recommendation: `Monitor ${b.name} efficacy; a dose increase may be needed. Watch for loss of effect on withdrawal of ${a.name}.`,
      };
    },
  },

  // --- QT prolongation ------------------------------------------------------
  {
    id: 'qt-prolongation',
    evaluate: (a, b) => {
      if (!has(a, 'qt-prolonging') || !has(b, 'qt-prolonging')) return null;
      return {
        severity: 'major',
        title: 'Additive QT prolongation',
        mechanism:
          'Both agents prolong the cardiac QT interval. Combined use increases the risk of torsades de pointes, a potentially fatal ventricular arrhythmia.',
        recommendation:
          'Avoid combination where possible. If required, obtain baseline/follow-up ECGs and correct electrolytes (K⁺, Mg²⁺).',
      };
    },
  },

  // --- Bleeding risk --------------------------------------------------------
  {
    id: 'bleeding-risk',
    evaluate: (a, b) => {
      const aBleed = has(a, 'anticoagulant') || has(a, 'antiplatelet') || has(a, 'nsaid');
      const bBleed = has(b, 'anticoagulant') || has(b, 'antiplatelet') || has(b, 'nsaid');
      if (!aBleed || !bBleed) return null;
      const anticoagInvolved = has(a, 'anticoagulant') || has(b, 'anticoagulant');
      return {
        severity: anticoagInvolved ? 'major' : 'moderate',
        title: 'Increased bleeding risk',
        mechanism:
          'Combined effects on coagulation and/or platelet function and GI mucosa increase the risk of bleeding, including GI haemorrhage.',
        recommendation: anticoagInvolved
          ? 'Avoid or monitor closely (INR/clinical signs of bleeding); consider gastroprotection.'
          : 'Use the lowest effective NSAID dose; consider gastroprotection and monitor for bleeding.',
      };
    },
  },

  // --- Sympathomimetic / hypertensive crisis with MAOI ----------------------
  {
    id: 'maoi-sympathomimetic',
    evaluate: (a, b) => {
      const aMao = has(a, 'maoi');
      const bSymp = has(b, 'sympathomimetic') || has(b, 'serotonin-releaser');
      if (!aMao || !bSymp) return null;
      return {
        severity: 'contraindicated',
        title: 'MAOI + sympathomimetic — hypertensive crisis',
        mechanism:
          'MAO inhibition prevents breakdown of catecholamines; adding a sympathomimetic/releaser can trigger a hypertensive crisis (severe headache, stroke risk).',
        recommendation: 'Contraindicated. Do not combine; observe MAOI washout periods.',
      };
    },
  },

  // --- Additive anticholinergic burden --------------------------------------
  {
    id: 'anticholinergic-burden',
    evaluate: (a, b) => {
      if (!has(a, 'anticholinergic') || !has(b, 'anticholinergic')) return null;
      return {
        severity: 'moderate',
        title: 'Additive anticholinergic burden',
        mechanism:
          'Combined antimuscarinic activity can cause confusion, urinary retention, constipation, blurred vision, tachycardia and hyperthermia — especially in the elderly.',
        recommendation:
          'Minimise total anticholinergic load; monitor cognition and for delirium in older patients.',
      };
    },
  },

  // --- Additive hepatotoxicity ----------------------------------------------
  {
    id: 'hepatotoxicity',
    evaluate: (a, b) => {
      const aHep = has(a, 'hepatotoxic') || has(a, 'alcohol');
      const bHep = has(b, 'hepatotoxic') || has(b, 'alcohol');
      if (!aHep || !bHep) return null;
      return {
        severity: 'moderate',
        title: 'Additive hepatotoxicity',
        mechanism:
          'Both agents stress hepatic function (direct toxicity and/or CYP-mediated reactive metabolites). Combined use raises the risk of liver injury, especially with alcohol.',
        recommendation:
          'Limit doses and duration; avoid alcohol; monitor LFTs if used together long-term.',
      };
    },
  },

  // --- Additive nephrotoxicity ----------------------------------------------
  {
    id: 'nephrotoxicity',
    evaluate: (a, b) => {
      if (!has(a, 'nephrotoxic') || !has(b, 'nephrotoxic')) return null;
      return {
        severity: 'moderate',
        title: 'Additive nephrotoxicity',
        mechanism:
          'Combined nephrotoxic potential can reduce renal perfusion / cause tubular injury, increasing the risk of acute kidney injury.',
        recommendation: 'Ensure hydration, monitor renal function, and avoid in volume depletion.',
      };
    },
  },
];

/**
 * Compute all interactions between the supplied substances. Each unordered pair
 * is evaluated against every rule; the worst representative result per rule is
 * kept (rules are directional, so both orders are checked).
 */
export function computeInteractions(substances: Substance[]): Interaction[] {
  const results: Interaction[] = [];
  for (let i = 0; i < substances.length; i++) {
    for (let j = i + 1; j < substances.length; j++) {
      const a = substances[i];
      const b = substances[j];
      const seenRules = new Set<string>();
      for (const rule of RULES) {
        if (seenRules.has(rule.id)) continue;
        const forward = rule.evaluate(a, b);
        const backward = rule.evaluate(b, a);
        const chosen =
          forward && backward
            ? severityRank(forward.severity) >= severityRank(backward.severity)
              ? { res: forward, pair: [a, b] as const }
              : { res: backward, pair: [b, a] as const }
            : forward
              ? { res: forward, pair: [a, b] as const }
              : backward
                ? { res: backward, pair: [b, a] as const }
                : null;
        if (chosen) {
          seenRules.add(rule.id);
          results.push({
            id: `${rule.id}:${a.id}:${b.id}`,
            ...chosen.res,
            substances: [chosen.pair[0].id, chosen.pair[1].id],
            substanceNames: [chosen.pair[0].name, chosen.pair[1].name],
          });
        }
      }
    }
  }
  return results.sort((x, y) => severityRank(y.severity) - severityRank(x.severity));
}

export interface BodySystemImpact {
  system: string;
  substances: string[];
  load: number; // count weighted
}

export function computeBodySystemImpact(substances: Substance[]): BodySystemImpact[] {
  const map = new Map<string, Set<string>>();
  for (const s of substances) {
    for (const sys of s.bodySystems) {
      const key = sys.trim();
      if (!map.has(key)) map.set(key, new Set());
      map.get(key)!.add(s.name);
    }
  }
  return Array.from(map.entries())
    .map(([system, set]) => ({ system, substances: Array.from(set), load: set.size }))
    .sort((a, b) => b.load - a.load);
}

export const SEVERITY_META: Record<
  Severity,
  { label: string; color: string; bg: string; ring: string }
> = {
  minor: { label: 'Minor', color: '#34d399', bg: 'rgba(52,211,153,0.10)', ring: 'rgba(52,211,153,0.35)' },
  moderate: {
    label: 'Moderate',
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.10)',
    ring: 'rgba(251,191,36,0.35)',
  },
  major: { label: 'Major', color: '#fb923c', bg: 'rgba(251,146,60,0.10)', ring: 'rgba(251,146,60,0.35)' },
  contraindicated: {
    label: 'Contraindicated',
    color: '#f87171',
    bg: 'rgba(248,113,113,0.12)',
    ring: 'rgba(248,113,113,0.40)',
  },
};
