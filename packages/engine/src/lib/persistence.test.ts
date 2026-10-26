import { beforeEach, describe, expect, it, vi } from 'vitest';
import { saveSession, loadSession, clearSession } from './persistence';
import type { PatientProfile } from './pharmacokinetics';
import type { AddedSubstance } from './state';
import { substances } from '../data/substances';

// Mock localStorage on globalThis for vitest Node.js environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

const DEFAULT_PATIENT: PatientProfile = {
  biologicalSex: 'M',
  ageYears: 35,
  weightKg: 75,
  heightCm: 175,
  bodyFatPct: 22,
  tolerance: 0,
  liver: 'normal',
  kidney: 'normal',
  hydrationPct: 50,
  genetics: {},
  conditions: [],
};

describe('session persistence', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('saves and loads session state correctly', () => {
    const testSubstance = substances[0]; // Fentanyl
    const added: AddedSubstance[] = [
      {
        substance: testSubstance,
        regimen: {
          mode: 'acute',
          doseMg: 0.1,
          dailyDoseMg: 0.1,
          daysOnRegimen: 1,
          frequency: 'QD',
          toleranceOverride: null,
        },
        advancedOpen: true,
      },
    ];

    saveSession(DEFAULT_PATIENT, added);
    expect(JSON.parse(localStorageMock.getItem('pharmasim:session:v1')!).version).toBe(1);
    const result = loadSession(DEFAULT_PATIENT);

    expect(result.patient).toEqual(DEFAULT_PATIENT);
    expect(result.added.length).toBe(1);
    expect(result.added[0].substance.id).toBe(testSubstance.id);
    expect(result.added[0].regimen.doseMg).toBe(0.1);
    expect(result.added[0].advancedOpen).toBe(true);
  });

  it('handles empty local storage by returning defaults', () => {
    const result = loadSession(DEFAULT_PATIENT);
    expect(result.patient).toEqual(DEFAULT_PATIENT);
    expect(result.added).toEqual([]);
  });

  it('handles invalid or corrupted JSON in local storage gracefully', () => {
    localStorageMock.setItem('pharmasim:session:v1', '{invalid-json');
    const result = loadSession(DEFAULT_PATIENT);
    expect(result.patient).toEqual(DEFAULT_PATIENT);
    expect(result.added).toEqual([]);
  });

  it('rejects unsupported saved-state versions', () => {
    localStorageMock.setItem(
      'pharmasim:session:v1',
      JSON.stringify({ version: 99, patient: DEFAULT_PATIENT, added: [] }),
    );
    const result = loadSession(DEFAULT_PATIENT);
    expect(result.patient).toEqual(DEFAULT_PATIENT);
    expect(result.added).toEqual([]);
  });

  it.each(['null', '42', '"session"', '[]', '{"added":{}}'])(
    'restores defaults for malformed root payload %s',
    (raw) => {
      localStorageMock.setItem('pharmasim:session:v1', raw);
      const restored = loadSession(DEFAULT_PATIENT);
      expect(restored.patient).toEqual(DEFAULT_PATIENT);
      expect(restored.added).toEqual([]);
    },
  );

  it('bounds restored collections and sanitizes nested regimens', () => {
    localStorageMock.setItem('pharmasim:session:v1', JSON.stringify({
      version: 1,
      patient: { ...DEFAULT_PATIENT, weightKg: -500, conditions: ['unknown-condition'] },
      added: Array.from({ length: 150 }, () => ({
        id: substances[0].id,
        regimen: {
          mode: 'acute',
          doseMg: -50,
          customEvents: [null, { doseMg: -1, route: 'unknown', administrationHour: -1 }],
        },
      })),
    }));
    const restored = loadSession(DEFAULT_PATIENT);
    expect(restored.added).toHaveLength(100);
    expect(restored.patient.weightKg).toBeGreaterThan(0);
    expect(restored.patient.conditions).toEqual([]);
    for (const entry of restored.added) {
      expect(entry.substance).toBe(substances[0]);
      expect(entry.regimen.doseMg).toBeGreaterThanOrEqual(0);
      expect(entry.regimen.customEvents ?? []).toEqual([]);
    }
  });

  it('survives unavailable storage without losing the fallback profile', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const read = vi.spyOn(localStorageMock, 'getItem').mockImplementation(() => {
      throw new Error('Storage access denied');
    });
    try {
      expect(loadSession(DEFAULT_PATIENT)).toEqual({ patient: DEFAULT_PATIENT, added: [] });
    } finally {
      read.mockRestore();
      warn.mockRestore();
    }
  });

  it('drops added substances if their IDs no longer exist in the database', () => {
    const payload = {
      patient: DEFAULT_PATIENT,
      added: [
        {
          id: 'non-existent-substance-id',
          regimen: {
            mode: 'acute',
            doseMg: 10,
            dailyDoseMg: 10,
            daysOnRegimen: 1,
            frequency: 'QD',
            toleranceOverride: null,
          },
          advancedOpen: false,
        },
      ],
    };
    localStorageMock.setItem('pharmasim:session:v1', JSON.stringify(payload));

    const result = loadSession(DEFAULT_PATIENT);
    expect(result.added).toEqual([]);
  });

  it('clears session correctly', () => {
    const testSubstance = substances[0];
    const added: AddedSubstance[] = [
      {
        substance: testSubstance,
        regimen: {
          mode: 'acute',
          doseMg: 0.1,
          dailyDoseMg: 0.1,
          daysOnRegimen: 1,
          frequency: 'QD',
          toleranceOverride: null,
        },
        advancedOpen: false,
      },
    ];

    saveSession(DEFAULT_PATIENT, added);
    expect(localStorageMock.getItem('pharmasim:session:v1')).toBeTypeOf('string');

    clearSession();
    expect(localStorageMock.getItem('pharmasim:session:v1')).toBeNull();
  });
});
