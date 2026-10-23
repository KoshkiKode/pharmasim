import type { Substance } from '../data/types';
import { substances as ALL } from '../data/substances';
import type { PatientProfile, RegimenConfig } from './pharmacokinetics';
import { defaultRegimen, type AddedSubstance } from './state';
import { sanitizePatientProfile, sanitizeRegimenConfig } from './validation';

const STORAGE_KEY = 'pharmasim:session:v1';
const MAX_SAVED_SUBSTANCES = 100;

interface PersistedState {
  version: 1;
  patient: PatientProfile;
  added: { id: string; regimen: RegimenConfig; advancedOpen: boolean }[];
}

const byId = new Map<string, Substance>(ALL.map((s) => [s.id, s]));

/** Serialise the session to localStorage. Substances are stored by id only. */
export function saveSession(patient: PatientProfile, added: AddedSubstance[]): void {
  try {
    const payload: PersistedState = {
      version: 1,
      patient: sanitizePatientProfile(patient, patient),
      added: added.slice(0, MAX_SAVED_SUBSTANCES).map((a) => ({
        id: a.substance.id,
        regimen: a.regimen,
        advancedOpen: a.advancedOpen,
      })),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('[PharmaSim] Unable to save the local session.', error);
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
    if (parsed.version !== undefined && parsed.version !== 1) {
      console.warn('[PharmaSim] Unsupported saved-session version; using defaults.');
      return { patient: fallbackPatient, added: [] };
    }
    const patient = sanitizePatientProfile(fallbackPatient, parsed.patient);
    const added: AddedSubstance[] = [];
    for (const entry of Array.isArray(parsed.added) ? parsed.added.slice(0, MAX_SAVED_SUBSTANCES) : []) {
      if (!entry || typeof entry !== 'object' || typeof entry.id !== 'string') continue;
      const substance = byId.get(entry.id);
      if (!substance) continue; // dropped if the substance no longer exists
      added.push({
        substance,
        regimen: sanitizeRegimenConfig(substance, entry.regimen),
        advancedOpen: !!entry.advancedOpen,
      });
    }
    return { patient, added };
  } catch (error) {
    console.warn('[PharmaSim] Unable to load the local session; using defaults.', error);
    return { patient: fallbackPatient, added: [] };
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('[PharmaSim] Unable to clear the local session.', error);
  }
}
