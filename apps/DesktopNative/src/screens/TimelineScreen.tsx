import * as React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, TextInput, IconButton, useTheme } from 'react-native-paper';
import { substances, type DoseEvent } from '@pharmasim/engine';

export function TimelineScreen({ route, navigation }: any) {
  const { substanceId } = route.params;
  const theme = useTheme();
  const substance = substances.find(s => s.id === substanceId);
  
  const [events, setEvents] = React.useState<DoseEvent[]>([
    {
      id: Date.now().toString(),
      substanceId,
      doseMg: substance?.typicalDoseMg || 10,
      administrationHour: 0,
      route: substance?.routes?.[0] || 'oral',
      formulation: 'IR'
    }
  ]);

  if (!substance) return null;

  const addEvent = () => {
    const lastHour = events.length > 0 ? events[events.length - 1].administrationHour : 0;
    setEvents([...events, {
      id: Date.now().toString(),
      substanceId,
      doseMg: substance.typicalDoseMg || 10,
      administrationHour: lastHour + 4,
      route: substance.routes?.[0] || 'oral',
      formulation: 'IR'
    }]);
  };

  const removeEvent = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
  };

  const updateEvent = (id: string, field: keyof DoseEvent, value: any) => {
    setEvents(events.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={{ color: theme.colors.primary }}>{substance.name}</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>{substance.drugClass}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {events.map((evt, idx) => (
          <Card key={evt.id} style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Card.Content style={styles.eventRow}>
              <View style={styles.timeCol}>
                <Text variant="labelSmall" style={{ color: theme.colors.primary }}>TIME</Text>
                <View style={styles.inputRow}>
                  <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>T+</Text>
                  <TextInput
                    mode="flat"
                    keyboardType="numeric"
                    value={evt.administrationHour.toString()}
                    onChangeText={(val) => updateEvent(evt.id, 'administrationHour', parseInt(val) || 0)}
                    style={styles.inlineInput}
                    textColor={theme.colors.onSurface}
                  />
                  <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>h</Text>
                </View>
              </View>

              <View style={styles.doseCol}>
                <Text variant="labelSmall" style={{ color: theme.colors.primary }}>DOSE</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    mode="flat"
                    keyboardType="numeric"
                    value={evt.doseMg.toString()}
                    onChangeText={(val) => updateEvent(evt.id, 'doseMg', parseFloat(val) || 0)}
                    style={[styles.inlineInput, { width: 60 }]}
                    textColor={theme.colors.onSurface}
                  />
                  <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>mg</Text>
                </View>
              </View>

              <IconButton 
                icon="close" 
                iconColor={theme.colors.error} 
                onPress={() => removeEvent(evt.id)}
                style={styles.deleteBtn}
              />
            </Card.Content>
          </Card>
        ))}

        <Button 
          mode="outlined" 
          icon="plus" 
          onPress={addEvent}
          style={styles.addBtn}
          textColor={theme.colors.primary}
        >
          Add Dose Event
        </Button>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outline }]}>
        <Button 
          mode="contained" 
          onPress={() => navigation.navigate('Results', { substanceId, events })}
          style={styles.runBtn}
          disabled={events.length === 0}
        >
          Run Simulation
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    marginBottom: 12,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeCol: {
    flex: 1,
  },
  doseCol: {
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  inlineInput: {
    height: 40,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    marginHorizontal: 4,
    width: 40,
    textAlign: 'center',
    fontSize: 18,
  },
  deleteBtn: {
    margin: 0,
  },
  addBtn: {
    marginTop: 8,
    borderStyle: 'dashed',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  runBtn: {
    paddingVertical: 6,
  }
});
