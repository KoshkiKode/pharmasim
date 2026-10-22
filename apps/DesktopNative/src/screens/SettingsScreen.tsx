import * as React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, SegmentedButtons, useTheme } from 'react-native-paper';
import { useSettings } from '../context/SettingsContext';

export function SettingsScreen() {
  const theme = useTheme();
  const { settings, updateTheme, updateUnitSystem } = useSettings();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>Appearance</Text>
            <SegmentedButtons
              value={settings.theme}
              onValueChange={val => updateTheme(val as any)}
              buttons={[
                { value: 'system', label: 'System' },
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ]}
              style={styles.segmented}
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>Unit System</Text>
            <SegmentedButtons
              value={settings.unitSystem}
              onValueChange={val => updateUnitSystem(val as any)}
              buttons={[
                { value: 'metric', label: 'Metric (kg, cm)' },
                { value: 'imperial', label: 'Imperial (lbs, in)' },
              ]}
              style={styles.segmented}
            />
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  segmented: {
    marginBottom: 8,
  }
});
