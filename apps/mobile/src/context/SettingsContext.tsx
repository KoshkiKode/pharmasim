import * as React from 'react';
import { getSettings, saveSettings, type AppSettings, type ThemeSetting, type UnitSystem } from '@pharmasim/engine';
import { useColorScheme } from 'react-native';

interface SettingsContextType {
  settings: AppSettings;
  updateTheme: (theme: ThemeSetting) => void;
  updateUnitSystem: (system: UnitSystem) => void;
  isDarkTheme: boolean;
}

export const SettingsContext = React.createContext<SettingsContextType>({
  settings: getSettings(),
  updateTheme: () => {},
  updateUnitSystem: () => {},
  isDarkTheme: true,
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = React.useState<AppSettings>(getSettings());
  const systemColorScheme = useColorScheme();

  const updateTheme = (theme: ThemeSetting) => {
    setSettings(saveSettings({ theme }));
  };

  const updateUnitSystem = (unitSystem: UnitSystem) => {
    setSettings(saveSettings({ unitSystem }));
  };

  const isDarkTheme = React.useMemo(() => {
    if (settings.theme === 'system') return systemColorScheme === 'dark';
    return settings.theme === 'dark';
  }, [settings.theme, systemColorScheme]);

  return (
    <SettingsContext.Provider value={{ settings, updateTheme, updateUnitSystem, isDarkTheme }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return React.useContext(SettingsContext);
}
