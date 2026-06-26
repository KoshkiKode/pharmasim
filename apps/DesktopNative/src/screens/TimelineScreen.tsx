import * as React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, TextInput, IconButton, useTheme } from 'react-native-paper';
import { substances, type DoseEvent, type PatientProfile } from '@pharmasim/engine';

const DEFAULT_PATIENT: PatientProfile = {
  biologicalSex: 'M',
  ageYears: 35,
  weightKg: 75,
  heightCm: 175,
  bodyFatPct: 22,
  tolerance: 0,
  liver: 'normal',
  kidney: 'normal',
  hydrationPct: 50,
  genetics: {},
  conditions: [],
};

export function TimelineScreen({ route, navigation }: any) {
  const theme = useTheme();
  
  const [events, setEvents] = React.useState<DoseEvent[]>([]);
  const [patient, setPatient] = React.useState<PatientProfile>(DEFAULT_PATIENT);
  const [expandedEvents, setExpandedEvents] = React.useState<Record<string, boolean>>({});

  // When returning from Search screen, add the selected substance
  React.useEffect(() => {
    if (route.params?.newSubstanceId) {
      const substanceId = route.params.newSubstanceId;
      const substance = substances.find(s => s.id === substanceId);
      
      if (substance) {
        const lastHour = events.length > 0 ? events[events.length - 1].administrationHour : 0;
        setEvents(prev => [...prev, {
          id: Date.now().toString(),
          substanceId,
          doseMg: substance.typicalDoseMg || 10,
          administrationHour: lastHour > 0 ? lastHour + 2 : 0,
          route: substance.routes?.[0] || 'oral',
          formulation: 'IR'
        }]);
      }
      
      // Clear the param
      navigation.setParams({ newSubstanceId: undefined });
    }
  }, [route.params?.newSubstanceId]);

  // When returning from Patient Profile screen, update the patient details
  React.useEffect(() => {
    if (route.params?.updatedPatient) {
      setPatient(route.params.updatedPatient);
      // Clear the param
      navigation.setParams({ updatedPatient: undefined });
    }
  }, [route.params?.updatedPatient]);

  const removeEvent = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
  };

  const loadPreset = (presetType: string) => {
    if (presetType === 'cns') {
      setEvents([
        { id: '1', substanceId: 'fentanyl', doseMg: 0.1, administrationHour: 0, route: 'IV', formulation: 'IR' },
        { id: '2', substanceId: 'alprazolam', doseMg: 1, administrationHour: 1, route: 'oral', formulation: 'IR' },
        { id: '3', substanceId: 'ethanol', doseMg: 14000, administrationHour: 2, route: 'oral', formulation: 'IR' },
      ]);
    } else if (presetType === 'serotonin') {
      setEvents([
        { id: '1', substanceId: 'mdma', doseMg: 100, administrationHour: 0, route: 'oral', formulation: 'IR' },
        { id: '2', substanceId: 'phenelzine', doseMg: 15, administrationHour: 0, route: 'oral', formulation: 'IR' },
      ]);
    } else if (presetType === 'safe') {
      setEvents([
        { id: '1', substanceId: 'ibuprofen', doseMg: 400, administrationHour: 0, route: 'oral', formulation: 'IR' },
        { id: '2', substanceId: 'acetaminophen', doseMg: 500, administrationHour: 0, route: 'oral', formulation: 'IR' },
      ]);
    }
  };

  const updateEvent = (id: string, field: keyof DoseEvent, value: any) => {
    setEvents(events.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  // Helper for UI: separate Day and Hour
  const updateDayHour = (id: string, currentTotalHours: number, newDayStr: string, newHourStr: string) => {
    const currentDay = Math.floor(currentTotalHours / 24);
    const currentHour = currentTotalHours % 24;

    let d = newDayStr === '' ? currentDay : parseInt(newDayStr);
    let h = newHourStr === '' ? currentHour : parseInt(newHourStr);
    
    if (isNaN(d)) d = 0;
    if (isNaN(h)) h = 0;

    const totalHours = (d * 24) + h;
    updateEvent(id, 'administrationHour', totalHours);
  };

  return (
    <View style={styles.container}>
      {/* Patient Profile Summary Banner */}
      <Card style={{ margin: 16, marginBottom: 8, backgroundColor: theme.colors.surfaceVariant }}>
        <Card.Content style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
              Patient Profile
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginTop: 2 }}>
              {patient.ageYears}yo {patient.biologicalSex === 'M' ? 'Male' : 'Female'} • {patient.weightKg}kg • {patient.tolerance}% Tol
            </Text>
            {patient.conditions.length > 0 && (
              <Text variant="bodySmall" style={{ color: theme.colors.secondary, marginTop: 1, fontWeight: 'bold' }}>
                {patient.conditions.length} Medical Condition(s) Active
              </Text>
            )}
          </View>
          <Button 
            mode="contained" 
            onPress={() => navigation.navigate('PatientProfile', { currentPatient: patient })}
            labelStyle={{ fontSize: 11 }}
            style={{ paddingVertical: 0 }}
          >
            Edit
          </Button>
        </Card.Content>
      </Card>

      <View style={styles.header}>
        <Text variant="headlineSmall" style={{ color: theme.colors.primary }}>Dose Timeline</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Add substances to simulate sustained usage or multi-drug combinations.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={{ marginBottom: 16, backgroundColor: theme.colors.surfaceVariant }}>
          <Card.Content>
            <Text variant="labelMedium" style={{ fontWeight: 'bold', color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
              Load Demo Presets:
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Button 
                compact 
                mode="outlined" 
                onPress={() => loadPreset('cns')}
                labelStyle={{ fontSize: 9, marginHorizontal: 2 }}
                textColor="#f87171"
                style={{ borderColor: 'rgba(248,113,113,0.3)', height: 30 }}
              >
                CNS Depressant Overload ⚠️
              </Button>
              <Button 
                compact 
                mode="outlined" 
                onPress={() => loadPreset('serotonin')}
                labelStyle={{ fontSize: 9, marginHorizontal: 2 }}
                textColor="#f87171"
                style={{ borderColor: 'rgba(248,113,113,0.3)', height: 30 }}
              >
                Serotonin Syndrome Risk ⚠️
              </Button>
              <Button 
                compact 
                mode="outlined" 
                onPress={() => loadPreset('safe')}
                labelStyle={{ fontSize: 9, marginHorizontal: 2 }}
                textColor="#4ade80"
                style={{ borderColor: 'rgba(74,222,128,0.3)', height: 30 }}
              >
                Pain Management (Safe) ✓
              </Button>
            </View>
          </Card.Content>
        </Card>

        {events.length === 0 && (
          <View style={styles.emptyState}>
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16 }}>
              No doses added yet.
            </Text>
          </View>
        )}

        {events.map((evt, idx) => {
          const substance = substances.find(s => s.id === evt.substanceId);
          const day = Math.floor(evt.administrationHour / 24);
          const hour = Math.floor(evt.administrationHour % 24);

          return (
            <Card key={evt.id} style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Card.Title 
                title={substance?.name || 'Unknown'} 
                subtitle={`${substance?.drugClass || ''} • ${evt.route}`} 
                titleStyle={{ color: theme.colors.primary }}
                right={(props) => (
                  <IconButton 
                    {...props} 
                    icon="close" 
                    iconColor={theme.colors.error} 
                    onPress={() => removeEvent(evt.id)}
                  />
                )}
              />
              <Card.Content>
                <View style={styles.eventRow}>
                  <View style={styles.timeCol}>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>TIME</Text>
                    <View style={styles.inputRow}>
                      <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>Day</Text>
                      <TextInput
                        mode="flat"
                        keyboardType="numeric"
                        value={day.toString()}
                        onChangeText={(val) => updateDayHour(evt.id, evt.administrationHour, val, '')}
                        style={styles.inlineInput}
                        textColor={theme.colors.onSurface}
                      />
                      <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>Hr</Text>
                      <TextInput
                        mode="flat"
                        keyboardType="numeric"
                        value={hour.toString()}
                        onChangeText={(val) => updateDayHour(evt.id, evt.administrationHour, '', val)}
                        style={styles.inlineInput}
                        textColor={theme.colors.onSurface}
                      />
                    </View>
                  </View>

                  <View style={styles.doseCol}>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>DOSE</Text>
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
                </View>

                {/* Advanced Options Toggle */}
                <Button 
                  mode="text" 
                  compact 
                  onPress={() => {
                    const nextVal = !expandedEvents[evt.id];
                    setExpandedEvents(prev => ({ ...prev, [evt.id]: nextVal }));
                  }}
                  style={{ alignSelf: 'flex-start', marginTop: 8 }}
                  labelStyle={{ fontSize: 11 }}
                >
                  {expandedEvents[evt.id] ? 'Hide Settings' : 'Advanced Settings'}
                </Button>

                {/* Expanded Settings */}
                {expandedEvents[evt.id] && (
                  <View style={{ marginTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.outline, paddingTop: 8 }}>
                    {/* Route of Administration */}
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>
                      ROUTE OF ADMINISTRATION
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 4 }}>
                      {(substance?.routes || ['oral']).map(r => (
                        <Button
                          key={r}
                          mode={evt.route === r ? 'contained' : 'outlined'}
                          onPress={() => updateEvent(evt.id, 'route', r)}
                          compact
                          style={{ marginRight: 6 }}
                          labelStyle={{ fontSize: 9 }}
                        >
                          {r}
                        </Button>
                      ))}
                    </ScrollView>

                    {/* Formulation Release */}
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8, marginBottom: 4 }}>
                      FORMULATION RELEASE
                    </Text>
                    <View style={{ flexDirection: 'row' }}>
                      {(['IR', 'ER', 'XR', 'CR'] as const).map(f => (
                        <Button
                          key={f}
                          mode={evt.formulation === f ? 'contained' : 'outlined'}
                          onPress={() => updateEvent(evt.id, 'formulation', f)}
                          compact
                          style={{ marginRight: 6, flex: 1 }}
                          labelStyle={{ fontSize: 9 }}
                        >
                          {f}
                        </Button>
                      ))}
                    </View>
                  </View>
                )}
              </Card.Content>
            </Card>
          );
        })}

        <Button 
          mode="outlined" 
          icon="plus" 
          onPress={() => navigation.navigate('Search')}
          style={styles.addBtn}
          textColor={theme.colors.primary}
        >
          Add Substance
        </Button>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outline }]}>
        <Button 
          mode="contained" 
          onPress={() => navigation.navigate('Results', { events, patient })}
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
  emptyState: {
    alignItems: 'center',
    padding: 24,
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
    marginTop: 8,
  },
  timeCol: {
    flex: 1.5,
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
    width: 35,
    textAlign: 'center',
    fontSize: 16,
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
