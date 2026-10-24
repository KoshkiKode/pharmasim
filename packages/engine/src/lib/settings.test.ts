import { afterEach, describe, expect, it } from 'vitest';
import { getSettings, saveSettings } from './settings';

// In-memory localStorage stub so the persisted-JSON path is exercised.
const store = new Map<string, string>();
const localStorageStub = {
  getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
  setItem: (key: string, value: string) => void store.set(key, value),
  removeItem: (key: string) => void store.delete(key),
  clear: () => store.clear(),
};

(globalThis as { localStorage?: unknown }).localStorage = localStorageStub;

afterEach(() => {
  store.clear();
});

describe('settings persistence hardening', () => {
  it('falls back to defaults when persisted values are outside the allowed unions', () => {
    store.set('pharmasim:settings:v1', JSON.stringify({ theme: 'neon', unitSystem: 42 }));
    expect(getSettings()).toEqual({ theme: 'system', unitSystem: 'metric' });
  });

  it('keeps valid persisted values', () => {
    store.set('pharmasim:settings:v1', JSON.stringify({ theme: 'dark', unitSystem: 'imperial' }));
    expect(getSettings()).toEqual({ theme: 'dark', unitSystem: 'imperial' });
  });

  it('falls back to defaults on malformed JSON', () => {
    store.set('pharmasim:settings:v1', '{not json');
    expect(getSettings()).toEqual({ theme: 'system', unitSystem: 'metric' });
  });

  it('rejects invalid values passed to saveSettings', () => {
    const updated = saveSettings({ theme: 'bogus' as never, unitSystem: 'imperial' });
    expect(updated).toEqual({ theme: 'system', unitSystem: 'imperial' });
  });
});
