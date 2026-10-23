import { describe, it } from 'vitest';
import { computeInteractions } from './interactions';
import { computeRiskScores } from './riskScoring';
import { substances } from '../data/substances';
import { defaultRegimen } from './state';
import type { PatientProfile } from './pharmacokinetics';

const dummyPatient: PatientProfile = {
  biologicalSex: 'M',
  ageYears: 30,
  weightKg: 70,
  heightCm: 175,
  bodyFatPct: 15,
  tolerance: 50,
  liver: 'normal',
  kidney: 'normal',
  hydrationPct: 50,
  genetics: {},
  conditions: [],
};

// Create regimens of different sizes
const active10 = substances.slice(0, 10);
const active50 = substances.slice(0, 50);
const active100 = substances.slice(0, 100);

describe('Polypharmacy Engine Benchmarks', () => {
  it('Interactions - 10 drugs', () => {
    computeInteractions(active10);
  });

  it('Interactions - 50 drugs', () => {
    computeInteractions(active50);
  });

  it('Interactions - 100 drugs', () => {
    computeInteractions(active100);
  });

  it('Risk Scores - 10 drugs', () => {
    computeRiskScores(active10);
  });

  it('Risk Scores - 50 drugs', () => {
    computeRiskScores(active50);
  });

  it('Risk Scores - 100 drugs', () => {
    computeRiskScores(active100);
  });
});
