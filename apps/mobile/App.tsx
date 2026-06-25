import * as React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { theme } from './src/theme';

// Screen Imports
import { SubstanceSearchScreen } from './src/screens/SubstanceSearchScreen';
import { TimelineScreen } from './src/screens/TimelineScreen';
// import { ResultsScreen } from './src/screens/ResultsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <NavigationContainer theme={theme}>
        <Stack.Navigator 
          initialRouteName="Search"
          screenOptions={{
            headerStyle: { backgroundColor: theme.colors.surface },
            headerTintColor: theme.colors.onSurface,
            contentStyle: { backgroundColor: theme.colors.background }
          }}
        >
          <Stack.Screen 
            name="Search" 
            component={SubstanceSearchScreen} 
            options={{ title: 'PharmaSim Native' }} 
          />
          <Stack.Screen 
            name="Timeline" 
            component={TimelineScreen} 
            options={{ title: 'Custom Timeline' }} 
          />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </PaperProvider>
  );
}
