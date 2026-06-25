import * as React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, useTheme } from 'react-native-paper';
import { substances, computePK, evaluateToxicity, computeReceptorState } from '@pharmasim/engine';

export function ResultsScreen({ route }: any) {
  const { substanceId, events } = route.params;
  const theme = useTheme();
  
  const patient = {
    weightKg: 70,
    tolerance: 0,
    liver: 100,
    kidney: 100,
    conditions: []
  };

  const substance = substances.find(s => s.id === substanceId);
  
  if (!substance) return null;

  const regimen = {
    mode: 'acute' as const,
    doseMg: 0,
    dailyDoseMg: 0,
    daysOnRegimen: 1,
    frequency: 'QD' as const,
    toleranceOverride: null,
    customEvents: events
  };

  const pkResult = computePK(patient, substance, regimen, substances);
  const toxAlerts = evaluateToxicity([pkResult], substances);

  let peakHour = 0;
  let maxC = 0;
  for (const pt of pkResult.series) {
    if (pt.concentration > maxC) {
      maxC = pt.concentration;
      peakHour = pt.hour;
    }
  }

  const receptorsToCheck = ['MOR', 'TAAR1', 'VMAT2', 'GABA_A', 'NMDA', '5HT2A'];
  const receptorStates = receptorsToCheck
    .map(rec => computeReceptorState(rec, [pkResult], substances, peakHour))
    .filter(rs => rs.totalOccupancy > 0.01);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {toxAlerts.some(t => t.status === 'lethal' || t.status === 'toxic') && (
        <Card style={[styles.card, { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: theme.colors.error, borderWidth: 1 }]}>
          <Card.Title 
            title="TOXICITY WARNING" 
            titleStyle={{ color: theme.colors.error, fontWeight: 'bold' }}
            left={(props) => <Text style={{ fontSize: 24 }}>⚠️</Text>}
          />
          <Card.Content>
            {toxAlerts.map((tox, idx) => (
              <View key={idx} style={styles.toxRow}>
                <Text style={{ color: theme.colors.error, fontWeight: 'bold' }}>{tox.name}</Text>
                <Text style={{ color: theme.colors.error }}>
                  {tox.peakConcentration.toFixed(2)} mg/L (Limit: {tox.status === 'lethal' ? tox.lethalThreshold : tox.toxicThreshold})
                </Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {receptorStates.length > 0 && (
        <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Card.Title title="Receptor Activity" titleStyle={{ color: theme.colors.primary }} />
          <Card.Content>
            {receptorStates.map(rs => (
              <View key={rs.receptor} style={styles.receptorRow}>
                <View style={styles.receptorHeader}>
                  <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>{rs.receptor}</Text>
                  <Text style={{ color: theme.colors.onSurfaceVariant }}>{rs.dominantLigand}</Text>
                </View>
                <View style={styles.barContainer}>
                  <View style={[styles.barBg, { backgroundColor: theme.colors.outline }]}>
                    <View style={[styles.barFill, { backgroundColor: theme.colors.primary, width: `${Math.min(100, rs.netActivity * 100)}%` }]} />
                    <View style={[styles.barOcc, { backgroundColor: 'rgba(255,255,255,0.2)', width: `${Math.min(100, rs.totalOccupancy * 100)}%` }]} />
                  </View>
                  <Text style={{ width: 40, textAlign: 'right', color: theme.colors.primary }}>
                    {(rs.netActivity * 100).toFixed(0)}%
                  </Text>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}>
        <Card.Title title="PK Simulation Complete" titleStyle={{ color: theme.colors.primary }} />
        <Card.Content>
          <Text style={{ color: theme.colors.onSurface }}>
            Successfully simulated {events.length} doses of {substance.name} across the timeline.
          </Text>
          <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
            Peak plasma concentration: {maxC.toFixed(2)} mg/L at T+{peakHour}h
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  toxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  receptorRow: {
    marginBottom: 12,
  },
  receptorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  barFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 2,
  },
  barOcc: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 1,
  }
});
