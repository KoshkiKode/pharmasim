import type { Substance } from '@/data/types';
import { substances as ALL } from '@/data/substances';
import type { PatientProfile, RegimenConfig } from './pharmacokinetics';
import { defaultRegimen, type AddedSubstance } from './state';

const STORAGE_KEY = 'pharmasim:session:v1';

interface PersistedState {
  patient: PatientProfile;
  added: { id: string; regimen: RegimenConfig; advancedOpen: boolean }[];
}

const byId = new Map<string, Substance>(ALL.map((s) => [s.id, s]));

/** Serialise the session to localStorage. Substances are stored by id only. */
export function saveSession(patient: PatientProfile, added: AddedSubstance[]): void {
  try {
    const payload: PersistedState = {
      patient,
      added: added.map((a) => ({
        id: a.substance.id,
        regimen: a.regimen,
        advancedOpen: a.advancedOpen,
      })),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Storage may be unavailable (private mode, quota) — persistence is best-effort.
  }
}

/** Restore a previously saved session, rehydrating substances by id. */
export function loadSession(
  fallbackPatient: PatientProfile,
): { patient: PatientProfile; added: AddedSubstance[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { patient: fallbackPatient, added: [] };
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    const patient = { ...fallbackPatient, ...(parsed.patient ?? {}) };
    const added: AddedSubstance[] = [];
    for (const entry of parsed.added ?? []) {
      const substance = byId.get(entry.id);
      if (!substance) continue; // dropped if the substance no longer exists
      added.push({
        substance,
        regimen: { ...defaultRegimen(substance), ...entry.regimen },
        advancedOpen: !!entry.advancedOpen,
      });
    }
    return { patient, added };
  } catch {
    return { patient: fallbackPatient, added: [] };
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
