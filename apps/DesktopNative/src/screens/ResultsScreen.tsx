import * as React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, useTheme, Chip, IconButton } from 'react-native-paper';
import { 
  substances, 
  conditions,
  computePK, 
  evaluateToxicity, 
  computeReceptorState, 
  computeConditionWarnings, 
  computeInteractions, 
  computeBodySystemImpact, 
  computeRiskScores, 
  getRiskLevel, 
  SEVERITY_META 
} from '@pharmasim/engine';

function Sparkline({ series, color }: { series: any[]; color: string }) {
  const step = Math.max(1, Math.floor(series.length / 40));
  const sampled = [];
  for (let i = 0; i < series.length; i += step) {
    sampled.push(series[i]);
    if (sampled.length >= 40) break;
  }

  const maxVal = Math.max(...series.map(pt => pt.concentration), 0.001);

  return (
    <View style={styles.sparklineContainer}>
      {sampled.map((pt, idx) => {
        const heightPct = (pt.concentration / maxVal) * 100;
        return (
          <View
            key={idx}
            style={{
              flex: 1,
              height: `${Math.max(4, heightPct)}%`,
              backgroundColor: pt.concentration > 0 ? color : 'rgba(255,255,255,0.05)',
              marginHorizontal: 1,
              borderRadius: 1,
            }}
          />
        );
      })}
    </View>
  );
}

export function ResultsScreen({ route }: any) {
  const { events, patient } = route.params;
  const theme = useTheme();

  // Group events by substance
  const eventsBySubstance: Record<string, any[]> = {};
  for (const evt of events) {
    if (!eventsBySubstance[evt.substanceId]) {
      eventsBySubstance[evt.substanceId] = [];
    }
    eventsBySubstance[evt.substanceId].push(evt);
  }

  const pkResults = Object.keys(eventsBySubstance).map(substanceId => {
    const substance = substances.find(s => s.id === substanceId);
    if (!substance) return null;
    
    const regimen = {
      mode: 'acute' as const,
      doseMg: 0,
      dailyDoseMg: 0,
      daysOnRegimen: 1,
      frequency: 'QD' as const,
      toleranceOverride: null,
      customEvents: eventsBySubstance[substanceId]
    };

    return computePK(patient, substance, regimen, substances);
  }).filter(Boolean) as any[];

  if (pkResults.length === 0) return null;

  const activeSubstanceIds = Object.keys(eventsBySubstance);
  const activeSubstances = activeSubstanceIds.map(id => substances.find(s => s.id === id)).filter(Boolean) as any[];

  const toxAlerts = evaluateToxicity(pkResults, substances);
  const conditionWarnings = computeConditionWarnings(activeSubstances, patient.conditions, patient.liver, patient.kidney);
  const interactions = computeInteractions(activeSubstances);
  const bodySystemImpact = computeBodySystemImpact(activeSubstances);
  const riskScores = computeRiskScores(activeSubstances);

  // Find global peak hour
  let peakHour = 0;
  let maxC = 0;
  for (const pk of pkResults) {
    for (const pt of pk.series) {
      if (pt.concentration > maxC) {
        maxC = pt.concentration;
        peakHour = pt.hour;
      }
    }
  }

  const receptorsToCheck = ['MOR', 'TAAR1', 'VMAT2', 'GABA_A', 'NMDA', '5HT2A'];
  const receptorStates = receptorsToCheck
    .map(rec => computeReceptorState(rec, pkResults, substances, peakHour))
    .filter(rs => rs.totalOccupancy > 0.01);

  const getRiskColor = (score: number) => {
    const lvl = getRiskLevel(score);
    if (lvl === 'high') return theme.colors.error;
    if (lvl === 'moderate') return '#fb923c';
    return '#34d399';
  };

  const generateMarkdownReport = () => {
    let report = `# PHARMASIM CLINICAL SUMMARY REPORT\n`;
    report += `Generated: ${new Date().toLocaleString()}\n\n`;

    report += `## PATIENT PROFILE\n`;
    report += `- Age: ${patient.ageYears} years\n`;
    report += `- Sex: ${patient.biologicalSex === 'M' ? 'Male' : 'Female'}\n`;
    report += `- Weight: ${patient.weightKg} kg | Height: ${patient.heightCm} cm\n`;
    report += `- Body Fat: ${patient.bodyFatPct}%\n`;
    report += `- Hydration: ${patient.hydrationPct}%\n`;
    report += `- Tolerance Level: ${patient.tolerance}%\n`;
    report += `- Hepatic Clearance: ${patient.liver.toUpperCase()}\n`;
    report += `- Renal Clearance: ${patient.kidney.toUpperCase()}\n`;
    const geneticsStr = Object.entries(patient.genetics)
      .map(([cyp, pheno]) => `${cyp}: ${pheno}`)
      .join(', ');
    report += `- CYP Status: ${geneticsStr || 'Normal'}\n`;
    
    const condNames = patient.conditions
      .map((id: string) => conditions.find((c: any) => c.id === id)?.name)
      .filter(Boolean);
    report += `- Preexisting Conditions: ${condNames.length > 0 ? condNames.join(', ') : 'None'}\n\n`;

    report += `## ACTIVE SIMULATED SUBSTANCES\n`;
    pkResults.forEach((pk) => {
      const sub = substances.find((s) => s.id === pk.substanceId);
      if (!sub) return;
      report += `### ${sub.name} (${sub.drugClass})\n`;
      let peakC = 0;
      let peakH = 0;
      for (const pt of pk.series) {
        if (pt.concentration > peakC) {
          peakC = pt.concentration;
          peakH = pt.hour;
        }
      }
      report += `- Peak Concentration: ${peakC.toFixed(2)} mg/L at T+${peakH}h\n`;
      report += `- Effective Half-life: ${pk.effectiveHalfLifeHours.toFixed(1)}h (Base: ${pk.baseHalfLifeHours.toFixed(1)}h)\n\n`;
    });

    report += `## CLINICAL WARNINGS & ALERTS\n`;
    if (conditionWarnings.length === 0) {
      report += `No active condition contraindications detected.\n\n`;
    } else {
      conditionWarnings.forEach((w: any) => {
        report += `### [${w.severity.toUpperCase()}] ${w.title}\n`;
        report += `- Condition: ${w.conditionName}\n`;
        if (w.substanceName) report += `- Substance: ${w.substanceName}\n`;
        if (w.substanceNames) report += `- Combination: ${w.substanceNames.join(' + ')}\n`;
        report += `- Mechanism: ${w.mechanism}\n`;
        report += `- Recommendation: ${w.recommendation}\n\n`;
      });
    }

    report += `## DRUG-DRUG INTERACTIONS\n`;
    if (interactions.length === 0) {
      report += `No drug-drug interactions detected.\n\n`;
    } else {
      interactions.forEach((i: any) => {
        report += `### [${i.severity.toUpperCase()}] ${i.title}\n`;
        report += `- Combination: ${i.substanceNames[0]} + ${i.substanceNames[1]}\n`;
        report += `- Mechanism: ${i.mechanism}\n`;
        report += `- Recommendation: ${i.recommendation}\n\n`;
      });
    }

    report += `***\nDisclaimer: Educational / simulation use only. Not medical advice.`;
    return report;
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      
      {/* Patient Settings Info card */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}>
        <Card.Title title="Simulation Patient" titleStyle={{ fontWeight: 'bold' }} />
        <Card.Content>
          <Text variant="bodyMedium">
            {patient.ageYears}yo {patient.biologicalSex === 'M' ? 'Male' : 'Female'} • {patient.weightKg}kg • {patient.heightCm}cm • {patient.tolerance}% Tolerance
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
            Liver: {patient.liver} • Kidney: {patient.kidney} • Conditions: {patient.conditions.length} active
          </Text>
        </Card.Content>
      </Card>

      {/* Toxicity Overdose Warnings */}
      {toxAlerts.some(t => t.status === 'lethal' || t.status === 'toxic') && (
        <Card style={[styles.card, { backgroundColor: 'rgba(248,113,113,0.12)', borderColor: theme.colors.error, borderWidth: 1 }]}>
          <Card.Title 
            title="TOXICITY ALERT" 
            titleStyle={{ color: theme.colors.error, fontWeight: 'bold' }}
            left={(props) => <Text style={{ fontSize: 24 }}>⚠️</Text>}
          />
          <Card.Content>
            {toxAlerts.map((tox, idx) => (
              <View key={idx} style={styles.alertRow}>
                <View>
                  <Text style={{ color: theme.colors.error, fontWeight: 'bold' }}>{tox.name}</Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.error, opacity: 0.8 }}>
                    {tox.status === 'lethal' ? 'POTENTIALLY LETHAL OVERDOSE' : 'SEVERE TOXICITY'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: theme.colors.error, fontWeight: 'bold' }}>
                    {tox.peakConcentration.toFixed(2)} mg/L
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.error, opacity: 0.6 }}>
                    Limit: {tox.status === 'lethal' ? tox.lethalThreshold : tox.toxicThreshold}
                  </Text>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Pre-existing Condition Warnings */}
      {conditionWarnings.length > 0 && (
        <Card style={styles.card}>
          <Card.Title 
            title="Clinical Warnings" 
            titleStyle={{ fontWeight: 'bold', color: theme.colors.error }}
            left={(props) => <IconButton icon="shield-alert" iconColor={theme.colors.error} />}
          />
          <Card.Content>
            {conditionWarnings.map((w, idx) => {
              const meta = SEVERITY_META[w.severity];
              const isLifeThreatening = w.isLifeThreatening;
              return (
                <View key={w.id} style={[styles.warningItem, idx > 0 && { marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.outline }]}>
                  <View style={styles.warningHeader}>
                    <Text variant="bodyMedium" style={{ fontWeight: 'bold', color: isLifeThreatening ? theme.colors.error : meta.color, flex: 1 }}>
                      {w.title}
                    </Text>
                    <Chip style={{ backgroundColor: isLifeThreatening ? 'rgba(248,113,113,0.15)' : meta.bg }} textStyle={{ fontSize: 9, color: isLifeThreatening ? theme.colors.error : meta.color, fontWeight: 'bold' }}>
                      {isLifeThreatening ? 'CRITICAL' : meta.label.toUpperCase()}
                    </Chip>
                  </View>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginVertical: 4 }}>
                    {w.conditionName} {w.substanceName ? `· ${w.substanceName}` : ''}
                    {w.substanceNames && ` · Combo: ${w.substanceNames.join(' + ')}`}
                  </Text>
                  <Text variant="bodySmall" style={styles.warningMechanism}>{w.mechanism}</Text>
                  <View style={styles.warningRecommendation}>
                    <IconButton icon="alert" size={14} iconColor={isLifeThreatening ? theme.colors.error : meta.color} style={{ margin: 0, padding: 0 }} />
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurface, flex: 1, marginLeft: 4 }}>{w.recommendation}</Text>
                  </View>
                </View>
              );
            })}
          </Card.Content>
        </Card>
      )}

      {/* Polypharmacy Risk Score Card */}
      {activeSubstances.length > 1 && (
        <Card style={styles.card}>
          <Card.Title title="Toxicity Risk Index" titleStyle={{ fontWeight: 'bold' }} />
          <Card.Content style={styles.riskGrid}>
            <View style={[styles.riskBox, { borderColor: getRiskColor(riskScores.anticholinergicBurden) }]}>
              <Text variant="labelSmall" style={styles.riskBoxLabel}>Anticholinergic</Text>
              <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: getRiskColor(riskScores.anticholinergicBurden) }}>
                {riskScores.anticholinergicBurden}
              </Text>
              <Text variant="labelSmall" style={{ color: getRiskColor(riskScores.anticholinergicBurden), fontWeight: 'bold' }}>
                {getRiskLevel(riskScores.anticholinergicBurden).toUpperCase()}
              </Text>
            </View>
            <View style={[styles.riskBox, { borderColor: getRiskColor(riskScores.serotoninBurden), marginLeft: 8 }]}>
              <Text variant="labelSmall" style={styles.riskBoxLabel}>Serotonin</Text>
              <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: getRiskColor(riskScores.serotoninBurden) }}>
                {riskScores.serotoninBurden}
              </Text>
              <Text variant="labelSmall" style={{ color: getRiskColor(riskScores.serotoninBurden), fontWeight: 'bold' }}>
                {getRiskLevel(riskScores.serotoninBurden).toUpperCase()}
              </Text>
            </View>
            <View style={[styles.riskBox, { borderColor: getRiskColor(riskScores.qtProlongationRisk), marginLeft: 8 }]}>
              <Text variant="labelSmall" style={styles.riskBoxLabel}>QT Prolongation</Text>
              <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: getRiskColor(riskScores.qtProlongationRisk) }}>
                {riskScores.qtProlongationRisk}
              </Text>
              <Text variant="labelSmall" style={{ color: getRiskColor(riskScores.qtProlongationRisk), fontWeight: 'bold' }}>
                {getRiskLevel(riskScores.qtProlongationRisk).toUpperCase()}
              </Text>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Drug Interactions */}
      {activeSubstances.length >= 2 && (
        <Card style={styles.card}>
          <Card.Title 
            title="Drug Interactions" 
            titleStyle={{ fontWeight: 'bold' }}
            left={(props) => <IconButton icon="swap-horizontal" />}
          />
          <Card.Content>
            {interactions.length === 0 ? (
              <Text variant="bodyMedium" style={{ color: '#34d399', textAlign: 'center' }}>
                No interactions detected between selected drugs.
              </Text>
            ) : (
              interactions.map((i, idx) => {
                const meta = SEVERITY_META[i.severity];
                return (
                  <View key={i.id} style={[styles.interactionItem, idx > 0 && { marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.outline }]}>
                    <View style={styles.warningHeader}>
                      <Text variant="bodyMedium" style={{ fontWeight: 'bold', color: meta.color, flex: 1 }}>{i.title}</Text>
                      <Chip style={{ backgroundColor: meta.bg }} textStyle={{ fontSize: 9, color: meta.color, fontWeight: 'bold' }}>{meta.label.toUpperCase()}</Chip>
                    </View>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginVertical: 4 }}>
                      {i.substanceNames[0]} + {i.substanceNames[1]}
                    </Text>
                    <Text variant="bodySmall" style={styles.warningMechanism}>{i.mechanism}</Text>
                    <View style={styles.warningRecommendation}>
                      <IconButton icon="alert-decagram" size={14} iconColor={meta.color} style={{ margin: 0, padding: 0 }} />
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurface, flex: 1, marginLeft: 4 }}>{i.recommendation}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </Card.Content>
        </Card>
      )}

      {/* PK Simulation Sparklines */}
      <Card style={styles.card}>
        <Card.Title title="Pharmacokinetics Timeline" titleStyle={{ fontWeight: 'bold' }} />
        <Card.Content>
          {pkResults.map(pk => {
            const sub = substances.find(s => s.id === pk.substanceId);
            if (!sub) return null;
            let peakC = 0;
            let peakH = 0;
            for (const pt of pk.series) {
              if (pt.concentration > peakC) {
                peakC = pt.concentration;
                peakH = pt.hour;
              }
            }
            return (
              <View key={pk.substanceId} style={styles.pkRow}>
                <View style={styles.pkHeader}>
                  <View>
                    <Text variant="bodyMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
                      {sub.name}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {sub.drugClass}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>
                      {peakC.toFixed(2)} mg/L
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      at T+{peakH}h
                    </Text>
                  </View>
                </View>

                {/* Patient vs Base half life */}
                <View style={styles.halfLifeRow}>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Half-life: {pk.baseHalfLifeHours.toFixed(1)}h (base) ➔{' '}
                    <Text style={{ fontWeight: 'bold', color: theme.colors.primary }}>
                      {pk.effectiveHalfLifeHours.toFixed(1)}h (effective)
                    </Text>
                  </Text>
                </View>

                {/* Clearance Factors */}
                {pk.clearanceFactors.length > 0 && (
                  <View style={styles.factorsRow}>
                    {pk.clearanceFactors.map((f: any, idx: number) => (
                      <Chip key={idx} compact style={styles.factorChip} textStyle={{ fontSize: 8 }}>
                        {f.label}: {(f.effect * 100).toFixed(0)}%
                      </Chip>
                    ))}
                  </View>
                )}

                {/* Sparkline chart */}
                <Sparkline series={pk.series} color={theme.colors.primary} />
              </View>
            );
          })}
        </Card.Content>
      </Card>

      {/* Receptor Bindings Card */}
      {receptorStates.length > 0 && (
        <Card style={styles.card}>
          <Card.Title title="Peak Receptor Activation" titleStyle={{ fontWeight: 'bold' }} />
          <Card.Content>
            {receptorStates.map(rs => (
              <View key={rs.receptor} style={styles.receptorRow}>
                <View style={styles.receptorHeader}>
                  <Text variant="bodyMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
                    {rs.receptor}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Dominant: {rs.dominantLigand || 'N/A'}
                  </Text>
                </View>

                <View style={styles.barContainer}>
                  {/* Total Occupancy Gray Backbar */}
                  <View style={[styles.barBg, { backgroundColor: theme.colors.outline }]}>
                    {/* Competitive Antagonism Total Occupancy block */}
                    <View style={[styles.barOcc, { backgroundColor: 'rgba(167,139,250,0.3)', width: `${Math.min(100, rs.totalOccupancy * 100)}%` }]} />
                    {/* Net activity filling */}
                    <View style={[styles.barFill, { backgroundColor: theme.colors.primary, width: `${Math.min(100, rs.netActivity * 100)}%` }]} />
                  </View>
                  <Text variant="bodyMedium" style={styles.barText}>
                    {(rs.netActivity * 100).toFixed(0)}%
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, fontSize: 10 }}>
                    Occupancy: {(rs.totalOccupancy * 100).toFixed(0)}%
                  </Text>
                  {rs.totalOccupancy > rs.netActivity && (
                    <Text variant="bodySmall" style={{ color: '#fb923c', fontSize: 10, fontWeight: 'bold' }}>
                      Antagonism Effect
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Body System Impact */}
      <Card style={styles.card}>
        <Card.Title title="Body System Impact" titleStyle={{ fontWeight: 'bold' }} />
        <Card.Content>
          {bodySystemImpact.map((sys, idx) => {
            const max = bodySystemImpact[0]?.load || 1;
            return (
              <View key={sys.system} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                  <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>{sys.system}</Text>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>{sys.load}</Text>
                </View>
                <View style={{ height: 6, width: '100%', backgroundColor: theme.colors.outline, borderRadius: 3, overflow: 'hidden' }}>
                  <View style={{ height: '100%', backgroundColor: theme.colors.secondary, width: `${(sys.load / max) * 100}%`, borderRadius: 3 }} />
                </View>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, fontSize: 10, marginTop: 2 }}>
                  {sys.substances.join(', ')}
                </Text>
              </View>
            );
          })}
        </Card.Content>
      </Card>

      {/* Clinical Summary Report Card */}
      <Card style={styles.card}>
        <Card.Title 
          title="Clinical Summary Report" 
          titleStyle={{ fontWeight: 'bold' }}
          left={(props) => <IconButton icon="file-document-outline" />}
        />
        <Card.Content>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12 }}>
            Long-press the text below to select and copy the full clinical summary report to your clipboard:
          </Text>
          <View style={{ backgroundColor: '#171717', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#262626' }}>
            <Text selectable={true} style={{ fontFamily: 'System', fontSize: 11, color: '#e5e5e5', lineHeight: 16 }}>
              {generateMarkdownReport()}
            </Text>
          </View>
        </Card.Content>
      </Card>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    marginBottom: 16,
  },
  alertRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  warningItem: {
    paddingBottom: 4,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  warningMechanism: {
    color: '#a3a3a3',
    lineHeight: 16,
    fontSize: 12,
  },
  warningRecommendation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  riskGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  riskBox: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riskBoxLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#a3a3a3',
    textAlign: 'center',
    marginBottom: 4,
  },
  interactionItem: {
    paddingBottom: 4,
  },
  pkRow: {
    marginBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#404040',
    paddingBottom: 16,
  },
  pkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  halfLifeRow: {
    marginVertical: 4,
  },
  factorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 4,
  },
  factorChip: {
    margin: 2,
    height: 20,
  },
  sparklineContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 70,
    width: '100%',
    marginTop: 10,
    backgroundColor: '#171717',
    borderRadius: 8,
    padding: 6,
    borderWidth: 1,
    borderColor: '#262626',
  },
  receptorRow: {
    marginBottom: 16,
  },
  receptorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barBg: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    position: 'relative',
  },
  barFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 2,
    borderRadius: 5,
  },
  barOcc: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 1,
    borderRadius: 5,
  },
  barText: {
    width: 44,
    textAlign: 'right',
    fontWeight: 'bold',
  },
});
