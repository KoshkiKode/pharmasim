import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#38bdf8', // accent
    secondary: '#a78bfa',
    error: '#f87171',
    background: '#0a0a0a',
    surface: '#171717',
    surfaceVariant: '#262626',
    onSurface: '#f5f5f5',
    onSurfaceVariant: '#a3a3a3',
    outline: '#404040',
  },
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#0284c7', // darker accent for light mode
    secondary: '#7c3aed',
    error: '#dc2626',
    background: '#f9fafb',
    surface: '#ffffff',
    surfaceVariant: '#f3f4f6',
    onSurface: '#111827',
    onSurfaceVariant: '#4b5563',
    outline: '#d1d5db',
  },
};
