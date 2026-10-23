import { describe, expect, it } from 'vitest';
import { computeRiskScores, getRiskLevel } from './riskScoring';
import type { Substance } from '../data/types';

describe('risk scoring', () => {
  it('returns zeroes for an empty list of substances', () => {
    const scores = computeRiskScores([]);
    expect(scores).toEqual({
      anticholinergicBurden: 0,
      serotoninBurden: 0,
      qtProlongationRisk: 0,
    });
  });

  it('correctly calculates anticholinergic burden', () => {
    const strongAnticholinergic: Substance = {
      id: 'sub-ac-strong',
      name: 'StrongAC',
      brandNames: [],
      category: 'pharmaceutical',
      drugClass: 'TCA',
      halfLifeHours: 12,
      routes: ['oral'],
      mechanism: '',
      bodySystems: ['CNS'],
      bioavailability: 1.0,
      vdLKg: 1.0,
      tags: ['anticholinergic'],
    };

    const weakAnticholinergic: Substance = {
      id: 'sub-ac-weak',
      name: 'WeakAC',
      brandNames: [],
      category: 'pharmaceutical',
      drugClass: 'SSRI',
      halfLifeHours: 12,
      routes: ['oral'],
      mechanism: '',
      bodySystems: ['CNS'],
      bioavailability: 1.0,
      vdLKg: 1.0,
      tags: ['anticholinergic'],
    };

    const scoresStrong = computeRiskScores([strongAnticholinergic]);
    expect(scoresStrong.anticholinergicBurden).toBe(3);

    const scoresWeak = computeRiskScores([weakAnticholinergic]);
    expect(scoresWeak.anticholinergicBurden).toBe(1);

    const scoresCombined = computeRiskScores([strongAnticholinergic, weakAnticholinergic]);
    expect(scoresCombined.anticholinergicBurden).toBe(4);
  });

  it('correctly calculates serotonin burden', () => {
    const maoi: Substance = {
      id: 'sub-maoi',
      name: 'MAOI',
      brandNames: [],
      category: 'pharmaceutical',
      drugClass: 'MAOI Class',
      halfLifeHours: 12,
      routes: ['oral'],
      mechanism: '',
      bodySystems: ['CNS'],
      bioavailability: 1.0,
      vdLKg: 1.0,
      tags: ['maoi'],
    };

    const ssri: Substance = {
      id: 'sub-ssri',
      name: 'SSRI',
      brandNames: [],
      category: 'pharmaceutical',
      drugClass: 'SSRI Class',
      halfLifeHours: 12,
      routes: ['oral'],
      mechanism: '',
      bodySystems: ['CNS'],
      bioavailability: 1.0,
      vdLKg: 1.0,
      tags: ['serotonergic'],
    };

    const scoresMaoi = computeRiskScores([maoi]);
    expect(scoresMaoi.serotoninBurden).toBe(3);

    const scoresSsri = computeRiskScores([ssri]);
    expect(scoresSsri.serotoninBurden).toBe(2);

    const scoresCombined = computeRiskScores([maoi, ssri]);
    expect(scoresCombined.serotoninBurden).toBe(5);
  });

  it('correctly calculates QT prolongation risk', () => {
    const strongQt: Substance = {
      id: 'sub-qt-strong',
      name: 'StrongQT',
      brandNames: [],
      category: 'pharmaceutical',
      drugClass: 'Antiarrhythmic Class',
      halfLifeHours: 12,
      routes: ['oral'],
      mechanism: '',
      bodySystems: ['CNS'],
      bioavailability: 1.0,
      vdLKg: 1.0,
      tags: ['qt-prolonging'],
    };

    const weakQt: Substance = {
      id: 'sub-qt-weak',
      name: 'WeakQT',
      brandNames: [],
      category: 'pharmaceutical',
      drugClass: 'Other Class',
      halfLifeHours: 12,
      routes: ['oral'],
      mechanism: '',
      bodySystems: ['CNS'],
      bioavailability: 1.0,
      vdLKg: 1.0,
      tags: ['qt-prolonging'],
    };

    const scoresStrong = computeRiskScores([strongQt]);
    expect(scoresStrong.qtProlongationRisk).toBe(3);

    const scoresWeak = computeRiskScores([weakQt]);
    expect(scoresWeak.qtProlongationRisk).toBe(1);
  });

  it('maps scores to correct risk levels', () => {
    expect(getRiskLevel(0)).toBe('low');
    expect(getRiskLevel(1)).toBe('moderate');
    expect(getRiskLevel(2)).toBe('moderate');
    expect(getRiskLevel(3)).toBe('high');
    expect(getRiskLevel(5)).toBe('high');
  });
});
