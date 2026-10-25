import { conditions } from '../data/conditions';
import type { Substance } from '../data/types';
import { PARAMETER_EVIDENCE_UNITS } from '../data/types';
import type { ConditionWarning } from './conditionWarnings';
import type { Interaction } from './interactions';
import type { PatientProfile, PKResult, PlasmaPoint } from './pharmacokinetics';
import { formatHours } from './pharmacokinetics';
import type { ToxicityAlert } from './toxicity';

/**
 * Shared report generation and alert wording for every PharmaSim client
 * (Linux desktop, React Native CLI mobile, DesktopNative). Centralizing this keeps the
 * clients from drifting apart and keeps simulation wording qualified as
 * educational estimates rather than clinical statements.
 */

export const REPORT_DISCLAIMER =
  'Disclaimer: Educational simulation only. Not health or medical advice, diagnosis, treatment, prescribing, or dosing guidance. Do not use this report for real-world drug decisions.';

export const INTERACTION_COVERAGE_NOTICE =
  'Rule-based interaction coverage is incomplete. No interactions detected does not mean no risk or complete coverage. Unlisted combinations and mechanisms may still pose risks.';

/** Identical finite-horizon metrics for reports and client plot summaries. */
export function formatPKSummary(pk: PKResult, showTrough = pk.steadyStateTrough > 0): string[] {
  const peakHour = Number(pk.peakHour.toFixed(2));
  const horizonHours = Number(pk.horizonHours.toFixed(2));
  const lines = [
    `Modeled Peak Concentration: ${pk.peakConcentration.toFixed(2)} mg/L at T+${peakHour}h`,
    `Modeled AUC (0–${horizonHours} h, finite horizon): ${pk.aucMgHourL.toFixed(2)} mg·h/L (not AUC to infinity)`,
  ];
  if (showTrough) {
    lines.push(`Modeled steady-state trough: ${pk.steadyStateTrough.toFixed(2)} mg/L (periodic-regimen estimate)`);
  }
  return lines;
}

const PARAMETER_UNITS: Record<string, string> = {
  ...PARAMETER_EVIDENCE_UNITS,
  bindingAffinities: 'nM / intrinsic activity',
  toxicity: 'mg/L',
};

/** Missing provenance never promotes a legacy numeric value to measured evidence. */
export function getParameterEvidenceLines(substance: Substance): string[] {
  const fields = new Set([
    ...Object.keys(PARAMETER_UNITS).filter((field) => field in substance),
    ...Object.keys(substance.parameterEvidence ?? {}),
  ]);
  const values = substance as unknown as Record<string, unknown>;
  return Array.from(fields, (field) => {
    const evidence = substance.parameterEvidence?.[field as keyof NonNullable<Substance['parameterEvidence']>];
    const value = field.split('.').reduce<unknown>((current, key) =>
      current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined,
    values);
    const displayed = value === undefined ? 'not supplied' : typeof value === 'object' ? JSON.stringify(value) : String(value);
    const unit = evidence?.unit ?? PARAMETER_UNITS[field] ?? 'unit unknown';
    const prefix = `${field}: ${displayed} ${unit}`;
    if (!evidence) {
      return `${prefix} — basis unknown; quality unknown; source unknown (legacy/unprovenanced value).`;
    }
    return `${prefix} — basis ${evidence.basis}; quality ${evidence.quality}; source: ${evidence.sourceTitle || 'unknown'} (${evidence.sourceUrl || 'URL unknown'}); reviewed: ${evidence.reviewedAt || 'unknown'}${evidence.notes ? `; ${evidence.notes}` : ''}`;
  });
}

/** Peak of a plasma series; mirrors the peak the PK engine reports. */
export function findSeriesPeak(series: PlasmaPoint[]): { concentration: number; hour: number } {
  let concentration = 0;
  let hour = 0;
  for (const pt of series) {
    if (pt.concentration > concentration) {
      concentration = pt.concentration;
      hour = pt.hour;
    }
  }
  return { concentration, hour };
}

/**
 * Qualified, non-clinical label for a modeled toxicity status. Modeled
 * thresholds are simplifications — the wording must never read as a
 * patient-specific prediction.
 */
export function getToxicityAlertLabel(status: ToxicityAlert['status']): string {
  switch (status) {
    case 'lethal':
      return 'Modeled lethal-range exposure (estimate only)';
    case 'toxic':
      return 'Modeled toxic-range exposure (estimate only)';
    default:
      return 'Below modeled toxicity thresholds';
  }
}

export interface ReportSubstanceEntry {
  substance: Substance;
  pk: PKResult;
  /** Optional caller-supplied regimen lines (e.g. mode/dose) shown under the substance heading. */
  regimenLines?: string[];
}

export interface MarkdownReportInput {
  patient: PatientProfile;
  entries: ReportSubstanceEntry[];
  conditionWarnings: ConditionWarning[];
  interactions: Interaction[];
  generatedAt?: Date;
}

export function generateMarkdownReport(input: MarkdownReportInput): string {
  const { patient, entries, conditionWarnings, interactions } = input;
  const generatedAt = input.generatedAt ?? new Date();

  let report = `# PHARMASIM SIMULATION SUMMARY REPORT\n`;
  report += `Generated: ${generatedAt.toLocaleString()}\n`;
  report += `Educational simulation output — not a clinical document.\n\n`;

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
  report += `- CYP Metabolizer Status: ${geneticsStr || 'Normal'}\n`;
  const condNames = patient.conditions
    .map((id) => conditions.find((c) => c.id === id)?.name)
    .filter(Boolean);
  report += `- Preexisting Conditions: ${condNames.length > 0 ? condNames.join(', ') : 'None'}\n\n`;

  report += `## ACTIVE SIMULATED SUBSTANCES\n`;
  for (const { substance, pk, regimenLines } of entries) {
    report += `### ${substance.name} (${substance.drugClass})\n`;
    for (const line of regimenLines ?? []) {
      report += `- ${line}\n`;
    }
    for (const line of formatPKSummary(pk)) report += `- ${line}\n`;
    report += `- Effective Half-life: ${formatHours(pk.effectiveHalfLifeHours)} (Base: ${formatHours(pk.baseHalfLifeHours)})\n`;
    report += `- Combined modeled clearance multiplier: ${pk.clearanceMultiplier.toFixed(2)}× baseline (model adjustment, not a measured clearance)\n`;
    for (const factor of pk.clearanceFactors) {
      report += `- Modeled clearance factor: ${factor.label} — ${factor.effect.toFixed(2)}×\n`;
    }
    report += `- Modeled Time to Steady State: ${pk.daysToSteadyState.toFixed(1)} days (periodic regimen only)\n`;
    report += `#### Model warnings\n`;
    for (const warning of pk.warnings) report += `- ${warning}\n`;
    if (pk.warnings.length === 0) report += `- No model warnings returned; this does not establish safety or accuracy.\n`;
    if (substance.approximate) report += `- Approximate PK parameters; modeled results are uncertain.\n`;
    report += `#### Parameter evidence (input values, not patient-specific measurements)\n`;
    for (const line of getParameterEvidenceLines(substance)) report += `- ${line}\n`;
    report += '\n';
  }

  report += `## SIMULATION WARNINGS\n`;
  if (conditionWarnings.length === 0) {
    report += `No active condition contraindications detected.\n\n`;
  } else {
    for (const w of conditionWarnings) {
      report += `### [${w.severity.toUpperCase()}] ${w.title}\n`;
      report += `- Condition: ${w.conditionName}\n`;
      if (w.substanceName) report += `- Substance: ${w.substanceName}\n`;
      if (w.substanceNames) report += `- Combination: ${w.substanceNames.join(' + ')}\n`;
      report += `- Mechanism: ${w.mechanism}\n`;
      report += `- Recommendation: ${w.recommendation}\n\n`;
    }
  }

  report += `## DRUG-DRUG INTERACTIONS\n`;
  report += `${INTERACTION_COVERAGE_NOTICE}\n\n`;
  if (interactions.length === 0) {
    report += `No drug-drug interactions detected.\n\n`;
  } else {
    for (const i of interactions) {
      report += `### [${i.severity.toUpperCase()}] ${i.title}\n`;
      report += `- Combination: ${i.substanceNames[0]} + ${i.substanceNames[1]}\n`;
      report += `- Mechanism: ${i.mechanism}\n`;
      report += `- Recommendation: ${i.recommendation}\n\n`;
    }
  }

  report += `***\n${REPORT_DISCLAIMER}`;
  return report;
}
