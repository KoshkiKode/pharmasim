import * as React from 'react';
import { StatusBar } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer, DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationLightTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { darkTheme, lightTheme, SettingsProvider, useSettings } from '@pharmasim/ui';

// Screen Imports
import { SubstanceSearchScreen, TimelineScreen, ResultsScreen, PatientProfileScreen, SettingsScreen } from '@pharmasim/ui';

const Stack = createNativeStackNavigator();

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
            contentStyle: { backgroundColor: activeTheme.colors.background }
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
      <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} />
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
