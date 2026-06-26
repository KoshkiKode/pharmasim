import * as React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { theme } from './src/theme';

// Screen Imports
import { SubstanceSearchScreen } from './src/screens/SubstanceSearchScreen';
import { TimelineScreen } from './src/screens/TimelineScreen';
import { ResultsScreen } from './src/screens/ResultsScreen';
import { PatientProfileScreen } from './src/screens/PatientProfileScreen';

const Stack = createNativeStackNavigator();

const navTheme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    primary: theme.colors.primary,
    background: theme.colors.background,
    card: theme.colors.surface,
    text: theme.colors.onSurface,
    border: theme.colors.outline,
    notification: theme.colors.error,
  },
};

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator 
          initialRouteName="Timeline"
          screenOptions={{
            headerStyle: { backgroundColor: theme.colors.surface },
            headerTintColor: theme.colors.onSurface,
            contentStyle: { backgroundColor: theme.colors.background }
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
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </PaperProvider>
  );
}
