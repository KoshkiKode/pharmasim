const USAGE_STORAGE_KEY = 'pharmasim:usage:v1';
const MAX_FREE_RUNS = 3;
const PRO_LICENSE_KEY_DEMO = 'PHARMASIM-PRO-2026';

export interface UsageState {
  runsExecuted: number;
  isProUnlocked: boolean;
  licenseKey?: string;
}

// In-memory fallback for environments without localStorage
let memoryStorage: UsageState = {
  runsExecuted: 0,
  isProUnlocked: false,
};

function getStorage(): UsageState {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(USAGE_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    }
  } catch {
    // Ignore storage errors
  }
  return memoryStorage;
}

function saveStorage(state: UsageState): void {
  memoryStorage = state;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(state));
    }
  } catch {
    // Ignore storage errors
  }
}

export function getUsageState(): UsageState {
  return getStorage();
}

export function getRemainingFreeRuns(): number {
  const state = getStorage();
  if (state.isProUnlocked) return Infinity;
  const remaining = MAX_FREE_RUNS - state.runsExecuted;
  return remaining > 0 ? remaining : 0;
}

export function canRunSimulation(): boolean {
  const state = getStorage();
  if (state.isProUnlocked) return true;
  return state.runsExecuted < MAX_FREE_RUNS;
}

export function recordSimulationRun(): UsageState {
  const state = getStorage();
  if (!state.isProUnlocked) {
    state.runsExecuted += 1;
    saveStorage(state);
  }
  return state;
}

export function unlockPro(licenseKey: string): { success: boolean; message: string } {
  const cleanKey = licenseKey.trim().toUpperCase();
  if (cleanKey === PRO_LICENSE_KEY_DEMO || cleanKey.startsWith('PRO-')) {
    const state = getStorage();
    state.isProUnlocked = true;
    state.licenseKey = cleanKey;
    saveStorage(state);
    return { success: true, message: 'Pro features unlocked successfully!' };
  }
  return { success: false, message: 'Invalid license key. Please check and try again.' };
}

export function resetUsageForTesting(): void {
  saveStorage({ runsExecuted: 0, isProUnlocked: false });
}
