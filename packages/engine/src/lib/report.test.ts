import { describe, expect, it } from 'vitest';
import type { Substance } from '../data/types';
import type { PatientProfile, PKResult } from './pharmacokinetics';
import {
  findSeriesPeak,
  formatPKSummary,
  generateMarkdownReport,
  getParameterEvidenceLines,
  getToxicityAlertLabel,
  INTERACTION_COVERAGE_NOTICE,
  REPORT_DISCLAIMER,
} from './report';

const substance: Substance = {
  id: 'test-sub',
  name: 'Test Substance',
  brandNames: [],
  category: 'pharmaceutical',
  drugClass: 'Test class',
  halfLifeHours: 4,
  routes: ['oral'],
  mechanism: 'Does a thing.',
  bodySystems: ['CNS'],
  bioavailability: 0.7,
  vdLKg: 1.0,
};

const patient: PatientProfile = {
  biologicalSex: 'F',
  ageYears: 29,
  weightKg: 62,
  heightCm: 168,
  bodyFatPct: 25,
  tolerance: 0,
  liver: 'normal',
  kidney: 'normal',
  hydrationPct: 50,
  genetics: { CYP2D6: 'poor' },
  conditions: [],
};

const pk: PKResult = {
  substanceId: 'test-sub',
  effectiveHalfLifeHours: 5,
  baseHalfLifeHours: 4,
  clearanceMultiplier: 0.8,
  clearanceFactors: [],
  accumulationRatio: 1.2,
  daysToSteadyState: 1.5,
  tauHours: 24,
  series: [
    { hour: 0, concentration: 0 },
    { hour: 2, concentration: 1.5 },
    { hour: 8, concentration: 0.4 },
  ],
  peakConcentration: 1.5,
  steadyStateTrough: 0.2,
  toleranceScalar: 1,
  aucMgHourL: 7.25,
  peakHour: 2,
  horizonHours: 8,
  warnings: [],
};

describe('findSeriesPeak', () => {
  it('returns the maximum concentration and its hour', () => {
    expect(findSeriesPeak(pk.series)).toEqual({ concentration: 1.5, hour: 2 });
  });

  it('returns zeros for an empty series', () => {
    expect(findSeriesPeak([])).toEqual({ concentration: 0, hour: 0 });
  });
});

describe('getToxicityAlertLabel', () => {
  it('uses qualified, non-clinical wording for every status', () => {
    expect(getToxicityAlertLabel('lethal')).toMatch(/estimate only/i);
    expect(getToxicityAlertLabel('toxic')).toMatch(/estimate only/i);
    expect(getToxicityAlertLabel('safe')).toMatch(/below modeled/i);
    // Regression: never reintroduce predictive clinical phrasing.
    expect(getToxicityAlertLabel('lethal')).not.toMatch(/FATAL OVERDOSE EXPECTED/i);
    expect(getToxicityAlertLabel('lethal')).not.toMatch(/POTENTIALLY LETHAL OVERDOSE/i);
  });
});

describe('generateMarkdownReport', () => {
  const report = generateMarkdownReport({
    patient,
    entries: [{ substance, pk, regimenLines: ['Mode: Acute (Single Dose)'] }],
    conditionWarnings: [],
    interactions: [],
    generatedAt: new Date('2026-01-01T00:00:00Z'),
  });

  it('includes patient, substance, and peak statistics', () => {
    expect(report).toContain('Age: 29 years');
    expect(report).toContain('CYP2D6: poor');
    expect(report).toContain('### Test Substance (Test class)');
    expect(report).toContain('Mode: Acute (Single Dose)');
    expect(report).toContain('Peak Concentration: 1.50 mg/L at T+2h');
    expect(report).toContain('Modeled AUC (0–8 h, finite horizon): 7.25 mg·h/L (not AUC to infinity)');
    expect(report).toContain('Modeled steady-state trough: 0.20 mg/L');
  });

  it('always carries the educational disclaimer and never clinical framing', () => {
    expect(report).toContain(REPORT_DISCLAIMER);
    expect(report).toContain('Educational simulation output');
    expect(report).not.toContain('CLINICAL SUMMARY REPORT');
  });

  it('notes when no warnings or interactions are present', () => {
    expect(report).toContain('No active condition contraindications detected.');
    expect(report).toContain('No drug-drug interactions detected.');
    expect(report).toContain(INTERACTION_COVERAGE_NOTICE);
    expect(report).toContain('No interactions detected does not mean no risk or complete coverage.');
  });

  it('does not treat legacy parameter values as measured evidence', () => {
    expect(report).toContain('halfLifeHours: 4 h — basis unknown; quality unknown; source unknown');
    expect(report).toContain('bioavailability: 0.7 fraction — basis unknown');
    expect(report).toContain('vdLKg: 1 L/kg — basis unknown');
  });

  it('includes measured, estimated and unknown parameter evidence without upgrading quality', () => {
    const withEvidence: Substance = {
      ...substance,
      parameterEvidence: {
        halfLifeHours: {
          sourceTitle: 'Example reference',
          sourceUrl: 'https://example.org/reference',
          reviewedAt: '2026-01-01',
          quality: 'high',
          basis: 'measured',
          unit: 'h',
        },
        vdLKg: {
          sourceTitle: 'Model assumptions',
          sourceUrl: 'https://example.org/assumptions',
          reviewedAt: '2026-01-01',
          quality: 'low',
          basis: 'estimated',
          unit: 'L/kg',
          notes: 'Not a patient-specific measurement.',
        },
        bioavailability: {
          sourceTitle: '',
          sourceUrl: '',
          reviewedAt: '',
          quality: 'low',
          basis: 'unknown',
          unit: 'fraction',
        },
      },
    };
    const evidenceReport = generateMarkdownReport({
      patient,
      entries: [{ substance: withEvidence, pk: { ...pk, warnings: ['Absorption is estimated.'] } }],
      conditionWarnings: [],
      interactions: [],
    });
    expect(evidenceReport).toContain('basis measured; quality high; source: Example reference (https://example.org/reference); reviewed: 2026-01-01');
    expect(evidenceReport).toContain('basis estimated; quality low; source: Model assumptions');
    expect(evidenceReport).toContain('Not a patient-specific measurement.');
    expect(evidenceReport).toContain('basis unknown; quality low; source: unknown (URL unknown); reviewed: unknown');
    expect(evidenceReport).toContain('Absorption is estimated.');
    expect(getParameterEvidenceLines(withEvidence)).toHaveLength(3);
  });

  it('retains the incomplete-coverage notice even when interactions are found', () => {
    const positiveReport = generateMarkdownReport({
      patient,
      entries: [],
      conditionWarnings: [],
      interactions: [{
        id: 'example',
        substanceIds: ['a', 'b'],
        substanceNames: ['A', 'B'],
        severity: 'moderate',
        title: 'Example interaction',
        mechanism: 'Example mechanism',
        recommendation: 'Educational warning.',
      }],
    });
    expect(positiveReport).toContain('Example interaction');
    expect(positiveReport).toContain(INTERACTION_COVERAGE_NOTICE);
  });

  it('does not label an acute result as a steady-state trough', () => {
    expect(formatPKSummary({ ...pk, steadyStateTrough: 0 }).join('\n')).not.toContain('trough');
    expect(formatPKSummary({ ...pk, steadyStateTrough: 0 }, true).join('\n')).toContain('trough: 0.00 mg/L');
  });
});
