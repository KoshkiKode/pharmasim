import { MD3DarkTheme as DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
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
