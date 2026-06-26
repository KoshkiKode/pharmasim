import * as React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Card, Text, IconButton, Chip, useTheme, Divider } from 'react-native-paper';
import { conditions as ALL_CONDITIONS, type PatientProfile, type OrganHealth, type MetabolizerPhenotype } from '@pharmasim/engine';

export function PatientProfileScreen({ route, navigation }: any) {
  const theme = useTheme();
  const { currentPatient } = route.params;

  const [patient, setPatient] = React.useState<PatientProfile>(currentPatient);
  const [condQuery, setCondQuery] = React.useState('');
  const [showDropdown, setShowDropdown] = React.useState(false);

  const set = <K extends keyof PatientProfile>(key: K, value: PatientProfile[K]) => {
    setPatient(prev => ({ ...prev, [key]: value }));
  };

  const filteredConditions = React.useMemo(() => {
    const q = condQuery.trim().toLowerCase();
    if (!q) return [];
    return ALL_CONDITIONS.filter(
      c =>
        !patient.conditions.includes(c.id) &&
        (c.name.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q))
    ).slice(0, 10); // Limit to top 10 results for performance
  }, [condQuery, patient.conditions]);

  const addCondition = (id: string) => {
    set('conditions', [...patient.conditions, id]);
    setCondQuery('');
    setShowDropdown(false);
  };

  const removeCondition = (id: string) => {
    set('conditions', patient.conditions.filter(x => x !== id));
  };

  const setGenetics = (cyp: string, phenotype: MetabolizerPhenotype) => {
    set('genetics', { ...patient.genetics, [cyp]: phenotype });
  };

  const handleSave = () => {
    navigation.navigate('Timeline', { updatedPatient: patient });
  };

  const hydrationLabel = (p: number) => {
    if (p < 35) return 'Dehydrated';
    if (p > 70) return 'Well Hydrated';
    return 'Euhydrated';
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Sex Selection */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>Biological Sex</Text>
            <Text variant="bodySmall" style={styles.subtitle}>
              Affects volume of distribution and creatinine clearance calculations.
            </Text>
            <View style={styles.row}>
              <Button
                mode={patient.biologicalSex === 'M' ? 'contained' : 'outlined'}
                onPress={() => set('biologicalSex', 'M')}
                style={styles.flexBtn}
              >
                Male
              </Button>
              <Button
                mode={patient.biologicalSex === 'F' ? 'contained' : 'outlined'}
                onPress={() => set('biologicalSex', 'F')}
                style={[styles.flexBtn, { marginLeft: 12 }]}
              >
                Female
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Demographics Grid */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>Vitals & Body Composition</Text>
            <View style={styles.grid}>
              <View style={styles.gridCol}>
                <TextInput
                  label="Age (yrs)"
                  value={patient.ageYears.toString()}
                  keyboardType="numeric"
                  onChangeText={val => set('ageYears', Math.max(0, Math.min(120, parseInt(val) || 0)))}
                  mode="outlined"
                />
              </View>
              <View style={[styles.gridCol, { marginLeft: 12 }]}>
                <TextInput
                  label="Weight (kg)"
                  value={patient.weightKg.toString()}
                  keyboardType="numeric"
                  onChangeText={val => set('weightKg', Math.max(1, Math.min(300, parseInt(val) || 0)))}
                  mode="outlined"
                />
              </View>
            </View>
            <View style={[styles.grid, { marginTop: 12 }]}>
              <View style={styles.gridCol}>
                <TextInput
                  label="Height (cm)"
                  value={patient.heightCm.toString()}
                  keyboardType="numeric"
                  onChangeText={val => set('heightCm', Math.max(50, Math.min(250, parseInt(val) || 0)))}
                  mode="outlined"
                />
              </View>
              <View style={[styles.gridCol, { marginLeft: 12 }]}>
                <TextInput
                  label="Body Fat (%)"
                  value={patient.bodyFatPct.toString()}
                  keyboardType="numeric"
                  onChangeText={val => set('bodyFatPct', Math.max(2, Math.min(70, parseInt(val) || 0)))}
                  mode="outlined"
                />
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Clearance Factors */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>Tolerance & Hydration</Text>
            
            {/* Tolerance */}
            <View style={styles.sliderHeader}>
              <Text variant="bodyMedium">Tolerance</Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>{patient.tolerance}%</Text>
            </View>
            <View style={styles.stepperRow}>
              <IconButton icon="minus" size={20} onPress={() => set('tolerance', Math.max(0, patient.tolerance - 5))} />
              <Text variant="bodyLarge" style={{ flex: 1, textAlign: 'center' }}>{patient.tolerance}%</Text>
              <IconButton icon="plus" size={20} onPress={() => set('tolerance', Math.min(100, patient.tolerance + 5))} />
            </View>

            <Divider style={styles.divider} />

            {/* Hydration */}
            <View style={styles.sliderHeader}>
              <Text variant="bodyMedium">Hydration Status</Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>{hydrationLabel(patient.hydrationPct)}</Text>
            </View>
            <View style={styles.row}>
              <Button
                mode={patient.hydrationPct <= 30 ? 'contained' : 'outlined'}
                onPress={() => set('hydrationPct', 20)}
                style={styles.triBtn}
                labelStyle={{ fontSize: 10 }}
              >
                Dehydrated
              </Button>
              <Button
                mode={patient.hydrationPct > 30 && patient.hydrationPct <= 70 ? 'contained' : 'outlined'}
                onPress={() => set('hydrationPct', 50)}
                style={[styles.triBtn, { marginLeft: 6 }]}
                labelStyle={{ fontSize: 10 }}
              >
                Euhydrated
              </Button>
              <Button
                mode={patient.hydrationPct > 70 ? 'contained' : 'outlined'}
                onPress={() => set('hydrationPct', 80)}
                style={[styles.triBtn, { marginLeft: 6 }]}
                labelStyle={{ fontSize: 10 }}
              >
                Hydrated
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Organ Health */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>Organ Clearance Function</Text>
            
            {/* Liver */}
            <Text variant="bodyMedium" style={{ marginTop: 8, marginBottom: 4 }}>Liver Health</Text>
            <View style={styles.row}>
              {(['normal', 'reduced', 'impaired'] as OrganHealth[]).map((h, i) => (
                <Button
                  key={h}
                  mode={patient.liver === h ? 'contained' : 'outlined'}
                  onPress={() => set('liver', h)}
                  style={[styles.triBtn, i > 0 && { marginLeft: 6 }]}
                  labelStyle={{ fontSize: 10 }}
                >
                  {h}
                </Button>
              ))}
            </View>

            {/* Kidney */}
            <Text variant="bodyMedium" style={{ marginTop: 16, marginBottom: 4 }}>Kidney Health</Text>
            <View style={styles.row}>
              {(['normal', 'reduced', 'impaired'] as OrganHealth[]).map((h, i) => (
                <Button
                  key={h}
                  mode={patient.kidney === h ? 'contained' : 'outlined'}
                  onPress={() => set('kidney', h)}
                  style={[styles.triBtn, i > 0 && { marginLeft: 6 }]}
                  labelStyle={{ fontSize: 10 }}
                >
                  {h}
                </Button>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Pharmacogenomics */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>Pharmacogenomics (CYP450)</Text>
            <Text variant="bodySmall" style={styles.subtitle}>
              Configure genetic metabolizer status for key clearance enzymes.
            </Text>
            {['CYP2D6', 'CYP3A4', 'CYP2C19', 'CYP2C9', 'CYP1A2'].map((cyp) => {
              const current = patient.genetics[cyp] || 'normal';
              return (
                <View key={cyp} style={styles.cypRow}>
                  <Text variant="bodyMedium" style={styles.cypLabel}>{cyp}</Text>
                  <View style={styles.cypActions}>
                    {(['poor', 'normal', 'rapid', 'ultrarapid'] as MetabolizerPhenotype[]).map((m) => (
                      <Button
                        key={m}
                        mode={current === m ? 'contained' : 'outlined'}
                        onPress={() => setGenetics(cyp, m)}
                        compact
                        style={styles.cypBtn}
                        labelStyle={{ fontSize: 8 }}
                      >
                        {m === 'ultrarapid' ? 'Ultra' : m}
                      </Button>
                    ))}
                  </View>
                </View>
              );
            })}
          </Card.Content>
        </Card>

        {/* Pre-existing Conditions */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>Preexisting Conditions</Text>
            
            {/* Selected Conditions chips */}
            {patient.conditions.length > 0 && (
              <View style={styles.chipContainer}>
                {patient.conditions.map((id) => {
                  const cond = ALL_CONDITIONS.find(c => c.id === id);
                  if (!cond) return null;
                  return (
                    <Chip
                      key={id}
                      onClose={() => removeCondition(id)}
                      style={styles.chip}
                      textStyle={{ fontSize: 11 }}
                    >
                      {cond.name}
                    </Chip>
                  );
                })}
              </View>
            )}

            {/* Condition Search */}
            <TextInput
              label="Add Medical Condition..."
              value={condQuery}
              onChangeText={val => {
                setCondQuery(val);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              mode="outlined"
              right={<TextInput.Icon icon="magnify" />}
              style={{ marginTop: 8 }}
            />

            {/* Dropdown list */}
            {showDropdown && condQuery.trim().length > 0 && (
              <View style={[styles.dropdown, { backgroundColor: theme.colors.surfaceVariant }]}>
                {filteredConditions.length === 0 ? (
                  <Text style={styles.dropdownEmpty}>No conditions match.</Text>
                ) : (
                  filteredConditions.map(c => (
                    <View key={c.id}>
                      <Divider />
                      <Button
                        mode="text"
                        onPress={() => addCondition(c.id)}
                        contentStyle={styles.dropdownBtnContent}
                        style={styles.dropdownBtn}
                      >
                        <View style={styles.dropdownTextCol}>
                          <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>{c.name}</Text>
                          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{c.category}</Text>
                        </View>
                      </Button>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* Justifications Box */}
            {patient.conditions.some(id => ALL_CONDITIONS.find(c => c.id === id)?.pkModifiers?.justification) && (
              <View style={[styles.justificationBox, { backgroundColor: 'rgba(56,189,248,0.05)', borderColor: theme.colors.outline }]}>
                <Text variant="labelSmall" style={{ color: theme.colors.primary, fontWeight: 'bold', marginBottom: 6 }}>
                  PHYSIOLOGICAL MODIFIERS APPLIED
                </Text>
                {patient.conditions.map(id => {
                  const cond = ALL_CONDITIONS.find(c => c.id === id);
                  if (!cond || !cond.pkModifiers?.justification) return null;
                  return (
                    <Text key={`justification-${id}`} variant="bodySmall" style={styles.justificationText}>
                      <Text style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>{cond.name}:</Text>{' '}
                      {cond.pkModifiers.justification}
                    </Text>
                  );
                })}
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Save Button Footer */}
      <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outline }]}>
        <Button mode="contained" onPress={handleSave} style={styles.saveBtn}>
          Save Profile
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    marginBottom: 12,
    opacity: 0.7,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  flexBtn: {
    flex: 1,
  },
  triBtn: {
    flex: 1,
    paddingHorizontal: 0,
  },
  grid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridCol: {
    flex: 1,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  divider: {
    marginVertical: 12,
  },
  cypRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  cypLabel: {
    fontWeight: 'bold',
    width: 60,
  },
  cypActions: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'flex-end',
  },
  cypBtn: {
    marginHorizontal: 1,
    minWidth: 46,
    paddingHorizontal: 0,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  chip: {
    margin: 4,
  },
  dropdown: {
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#404040',
    overflow: 'hidden',
  },
  dropdownEmpty: {
    padding: 16,
    textAlign: 'center',
    fontSize: 12,
    opacity: 0.6,
  },
  dropdownBtn: {
    borderRadius: 0,
  },
  dropdownBtnContent: {
    justifyContent: 'flex-start',
    paddingVertical: 4,
  },
  dropdownTextCol: {
    alignItems: 'flex-start',
  },
  justificationBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  justificationText: {
    marginTop: 4,
    lineHeight: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  saveBtn: {
    paddingVertical: 6,
  },
});
