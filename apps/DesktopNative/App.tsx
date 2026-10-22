import * as React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer, DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationLightTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { darkTheme, lightTheme } from './src/theme';
import { SettingsProvider, useSettings } from './src/context/SettingsContext';

// Screen Imports
import { SubstanceSearchScreen } from './src/screens/SubstanceSearchScreen';
import { TimelineScreen } from './src/screens/TimelineScreen';
import { ResultsScreen } from './src/screens/ResultsScreen';
import { PatientProfileScreen } from './src/screens/PatientProfileScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

const Stack = createStackNavigator();

function AppContent() {
  const { isDarkTheme } = useSettings();
  const activeTheme = isDarkTheme ? darkTheme : lightTheme;
  const baseNavTheme = isDarkTheme ? NavigationDarkTheme : NavigationLightTheme;

  const navTheme = {
    ...baseNavTheme,
    colors: {
      ...baseNavTheme.colors,
      primary: activeTheme.colors.primary,
      background: activeTheme.colors.background,
      card: activeTheme.colors.surface,
      text: activeTheme.colors.onSurface,
      border: activeTheme.colors.outline,
      notification: activeTheme.colors.error,
    },
  };

  return (
    <PaperProvider theme={activeTheme}>
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator 
          initialRouteName="Timeline"
          screenOptions={{
            headerStyle: { backgroundColor: activeTheme.colors.surface },
            headerTintColor: activeTheme.colors.onSurface,
            cardStyle: { backgroundColor: activeTheme.colors.background }
          }}
        >
          <Stack.Screen 
            name="Timeline" 
            component={TimelineScreen} 
            options={{ title: 'Dose Timeline' }} 
          />
          <Stack.Screen 
            name="Search" 
            component={SubstanceSearchScreen} 
            options={{ title: 'Select Substance' }} 
          />
          <Stack.Screen 
            name="Results" 
            component={ResultsScreen} 
            options={{ title: 'Simulation Results' }} 
          />
          <Stack.Screen 
            name="PatientProfile" 
            component={PatientProfileScreen} 
            options={{ title: 'Patient Profile' }} 
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen} 
            options={{ title: 'Settings' }} 
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}

