const SETTINGS_STORAGE_KEY = 'pharmasim:settings:v1';

export type ThemeSetting = 'system' | 'light' | 'dark';
export type UnitSystem = 'metric' | 'imperial';

export interface AppSettings {
  theme: ThemeSetting;
  unitSystem: UnitSystem;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  unitSystem: 'metric',
};

// In-memory fallback
let memoryStorage: AppSettings = { ...DEFAULT_SETTINGS };

export function getSettings(): AppSettings {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (raw) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
      }
    }
  } catch {
    // Ignore storage errors
  }
  return memoryStorage;
}

export function saveSettings(settings: Partial<AppSettings>): AppSettings {
  const current = getSettings();
  const updated = { ...current, ...settings };
  memoryStorage = updated;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch {
    // Ignore storage errors
  }
  return updated;
}

// Unit Conversion Utils
export const kgToLbs = (kg: number): number => kg * 2.20462;
export const lbsToKg = (lbs: number): number => lbs / 2.20462;
export const cmToInches = (cm: number): number => cm / 2.54;
export const inchesToCm = (inches: number): number => inches * 2.54;
