import { useState, useMemo } from 'react';
import { X, Printer, Copy, Check, FileText } from 'lucide-react';
import type { Substance } from '@pharmasim/engine';
import type { PatientProfile } from '@pharmasim/engine';
import { computePK, formatHours } from '@pharmasim/engine';
import { computeInteractions, SEVERITY_META } from '@pharmasim/engine';
import { computeConditionWarnings } from '@pharmasim/engine';
import { conditions as ALL_CONDITIONS } from '@pharmasim/engine';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientProfile;
  substances: Substance[];
  addedRegimens: { substance: Substance; regimen: any }[];
}

export function SummaryModal({ isOpen, onClose, patient, substances, addedRegimens }: Props) {
  const [copied, setCopied] = useState(false);

  const interactions = useMemo(() => computeInteractions(substances), [substances]);
  const conditionWarnings = useMemo(
    () => computeConditionWarnings(substances, patient.conditions, patient.liver, patient.kidney),
    [substances, patient.conditions, patient.liver, patient.kidney]
  );

  const pKeys = addedRegimens.map((item) => {
    const pk = computePK(patient, item.substance, item.regimen);
    return { sub: item.substance, reg: item.regimen, pk };
  });

  const generateMarkdownReport = () => {
    let report = `# PHARMASIM CLINICAL SUMMARY REPORT\n`;
    report += `Generated: ${new Date().toLocaleString()}\n\n`;

    report += `## PATIENT PROFILE\n`;
    report += `- Age: ${patient.ageYears} years\n`;
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
      .map((id) => ALL_CONDITIONS.find((c) => c.id === id)?.name)
      .filter(Boolean);
    report += `- Preexisting Conditions: ${condNames.length > 0 ? condNames.join(', ') : 'None'}\n\n`;

    report += `## ACTIVE SUBSTANCES & REGIMENS\n`;
    pKeys.forEach(({ sub, reg, pk }) => {
      report += `### ${sub.name} (${sub.drugClass})\n`;
      report += `- Mode: ${reg.mode === 'acute' ? 'Acute (Single Dose)' : 'Daily (Maintenance)'}\n`;
      report += `- Dose: ${reg.mode === 'acute' ? `${reg.doseMg} mg` : `${reg.dailyDoseMg} mg/day (${reg.frequency})`}\n`;
      report += `- Effective Half-life: ${formatHours(pk.effectiveHalfLifeHours)} (Base: ${formatHours(pk.baseHalfLifeHours)})\n`;
      report += `- Accumulation Ratio: ${reg.mode === 'daily' ? `${pk.accumulationRatio.toFixed(2)}x` : 'N/A'}\n`;
      report += `- Time to Steady State: ${pk.daysToSteadyState.toFixed(1)} days\n\n`;
    });

    report += `## CLINICAL CONTRAINDICATIONS & WARNINGS\n`;
    if (conditionWarnings.length === 0) {
      report += `No active condition contraindications detected.\n\n`;
    } else {
      conditionWarnings.forEach((w) => {
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
      interactions.forEach((i) => {
        report += `### [${i.severity.toUpperCase()}] ${i.title}\n`;
        report += `- Combination: ${i.substanceNames[0]} + ${i.substanceNames[1]}\n`;
        report += `- Mechanism: ${i.mechanism}\n`;
        report += `- Recommendation: ${i.recommendation}\n\n`;
      });
    }

    report += `***\nDisclaimer: Educational / simulation use only. Not medical advice.`;
    return report;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateMarkdownReport());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm print:absolute print:inset-0 print:bg-white print:p-0 print:text-black">
      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #clinical-report-printarea, #clinical-report-printarea * {
            visibility: visible;
          }
          #clinical-report-printarea {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div
        id="clinical-report-printarea"
        className="flex h-full max-h-[85vh] w-full max-w-3xl flex-col rounded-xl border border-border bg-bg-panel shadow-2xl print:max-h-none print:w-full print:border-none print:bg-white print:shadow-none"
      >
        {/* Modal Header */}
        <header className="flex items-center justify-between border-b border-border px-6 py-4 print:border-black print:pb-2">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-accent print:hidden" />
            <h2 className="text-base font-bold text-ink print:text-xl print:text-black">
              Clinical Summary Report
            </h2>
          </div>
          <div className="flex items-center gap-2 no-print">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-inset px-3 py-1.5 text-xs font-medium text-ink-muted hover:text-ink transition-colors"
              title="Copy markdown report"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-green-400" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copy
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-inset px-3 py-1.5 text-xs font-medium text-ink-muted hover:text-ink transition-colors"
            >
              <Printer className="h-3.5 w-3.5" /> Print
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-ink-faint hover:bg-bg-inset hover:text-ink transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Modal Body */}
        <div className="scroll-thin flex-1 overflow-y-auto p-6 space-y-6 print:overflow-visible print:p-0 print:text-black">
          {/* Header watermark in print */}
          <div className="hidden print:block text-center border-b border-gray-300 pb-4 mb-4">
            <h1 className="text-2xl font-bold tracking-tight">PHARMASIM SUMMARY REPORT</h1>
            <p className="text-xs text-gray-500 mt-1">
              Educational Sandbox Pharmacology Simulation &copy; {new Date().getFullYear()}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              Generated on: {new Date().toLocaleString()}
            </p>
          </div>

          {/* Grid Patient & Regimens */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
            {/* Patient Card */}
            <div className="rounded-lg border border-border bg-bg-inset p-4 print:border-gray-300 print:bg-white">
              <h3 className="text-xs font-bold uppercase tracking-wider text-accent mb-3 print:text-black print:border-b print:pb-1">
                Patient Metrics
              </h3>
              <ul className="space-y-1.5 text-xs">
                <li className="flex justify-between">
                  <span className="text-ink-muted print:text-gray-600">Age:</span>
                  <span className="font-semibold text-ink print:text-black">{patient.ageYears} yrs</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-ink-muted print:text-gray-600">Weight / Height:</span>
                  <span className="font-semibold text-ink print:text-black">
                    {patient.weightKg} kg / {patient.heightCm} cm
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-ink-muted print:text-gray-600">Body Fat / Hydration:</span>
                  <span className="font-semibold text-ink print:text-black">
                    {patient.bodyFatPct}% / {patient.hydrationPct}%
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-ink-muted print:text-gray-600">Liver Clearance:</span>
                  <span className="font-semibold capitalize text-ink print:text-black">{patient.liver}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-ink-muted print:text-gray-600">Renal Clearance:</span>
                  <span className="font-semibold capitalize text-ink print:text-black">{patient.kidney}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-ink-muted print:text-gray-600">CYP Metabolizer:</span>
                  <span className="font-semibold capitalize text-ink print:text-black">
                    {Object.entries(patient.genetics).map(([cyp, pheno]) => `${cyp} ${pheno}`).join(', ') || 'Normal'}
                  </span>
                </li>
                <li className="border-t border-border pt-1.5 mt-1.5 print:border-gray-200">
                  <span className="block text-[10px] text-ink-faint print:text-gray-500 uppercase font-bold tracking-wider mb-1">
                    Preexisting Conditions
                  </span>
                  <span className="text-xs text-ink print:text-black font-semibold">
                    {patient.conditions.length > 0
                      ? patient.conditions
                          .map((id) => ALL_CONDITIONS.find((c) => c.id === id)?.name)
                          .join(', ')
                      : 'None selected'}
                  </span>
                </li>
              </ul>
            </div>

            {/* Regimens summary */}
            <div className="rounded-lg border border-border bg-bg-inset p-4 print:border-gray-300 print:bg-white">
              <h3 className="text-xs font-bold uppercase tracking-wider text-accent mb-3 print:text-black print:border-b print:pb-1">
                Active Regimens
              </h3>
              {pKeys.length === 0 ? (
                <p className="text-xs text-ink-faint">No active substances.</p>
              ) : (
                <ul className="space-y-3 text-xs max-h-48 overflow-y-auto scroll-thin print:max-h-none print:overflow-visible">
                  {pKeys.map(({ sub, reg, pk }) => (
                    <li key={sub.id} className="border-b border-border/40 last:border-0 pb-2 last:pb-0 print:border-gray-100">
                      <div className="font-semibold text-ink print:text-black">{sub.name}</div>
                      <div className="text-[10px] text-ink-muted print:text-gray-600">
                        {reg.mode === 'acute'
                          ? `Single dose: ${reg.doseMg} mg`
                          : `Maintenance: ${reg.dailyDoseMg} mg/day (${reg.frequency})`}
                      </div>
                      <div className="text-[10px] text-ink-faint print:text-gray-500 flex justify-between mt-0.5">
                        <span>Half-life: {formatHours(pk.effectiveHalfLifeHours)}</span>
                        {reg.mode === 'daily' && <span>Accumulation: {pk.accumulationRatio.toFixed(1)}x</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Condition Warnings */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2 print:text-black print:border-b print:pb-1">
              Clinical Contraindications & Preexisting Condition Risks
            </h3>
            {conditionWarnings.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-bg-inset/40 p-4 text-center text-xs text-ink-faint print:border-gray-300 print:text-gray-500">
                No active condition contraindications detected.
              </div>
            ) : (
              <ul className="space-y-3">
                {conditionWarnings.map((w) => {
                  const meta = SEVERITY_META[w.severity];
                  return (
                    <li
                      key={w.id}
                      className="rounded-lg border bg-bg-inset/30 p-3 print:border-gray-300 print:text-black"
                      style={{ borderColor: meta.ring }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-ink print:text-black">
                            [{w.severity.toUpperCase()}] {w.title}
                          </h4>
                          <div className="text-[10px] text-ink-muted print:text-gray-600 mt-0.5">
                            Condition: {w.conditionName}
                            {w.substanceName && ` · Drug: ${w.substanceName}`}
                            {w.substanceNames && ` · Combination: ${w.substanceNames.join(' + ')}`}
                          </div>
                        </div>
                        {w.isLifeThreatening && (
                          <span className="shrink-0 rounded bg-red-500/10 border border-red-500/30 px-1.5 py-0.5 text-[9px] font-bold text-red-400 uppercase tracking-wider animate-pulse print:border-red-600 print:text-red-600">
                            Life Threatening
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-xs text-ink-muted print:text-gray-700 leading-relaxed">
                        {w.mechanism}
                      </p>
                      <p className="mt-1 text-xs text-ink font-medium print:text-black">
                        Recommendation: {w.recommendation}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Drug-Drug Interactions */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2 print:text-black print:border-b print:pb-1">
              Drug-Drug Interactions
            </h3>
            {interactions.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-bg-inset/40 p-4 text-center text-xs text-ink-faint print:border-gray-300 print:text-gray-500">
                No drug-drug interactions detected.
              </div>
            ) : (
              <ul className="space-y-3">
                {interactions.map((i) => {
                  const meta = SEVERITY_META[i.severity];
                  return (
                    <li
                      key={i.id}
                      className="rounded-lg border bg-bg-inset/30 p-3 print:border-gray-300 print:text-black"
                      style={{ borderColor: meta.ring }}
                    >
                      <h4 className="text-xs font-bold text-ink print:text-black">
                        [{i.severity.toUpperCase()}] {i.title}
                      </h4>
                      <div className="text-[10px] text-ink-muted print:text-gray-600 mt-0.5">
                        Combination: {i.substanceNames[0]} + {i.substanceNames[1]}
                      </div>
                      <p className="mt-1.5 text-xs text-ink-muted print:text-gray-700 leading-relaxed">
                        {i.mechanism}
                      </p>
                      <p className="mt-1 text-xs text-ink font-medium print:text-black">
                        Recommendation: {i.recommendation}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Print Disclaimer */}
          <div className="hidden print:block border-t border-gray-300 pt-3 mt-6 text-[9px] text-gray-500 text-center leading-relaxed">
            <strong>Disclaimer:</strong> Educational and simulation use only. PharmaSim is a sandbox pharmacology simulator. It is not medical advice, not a clinical diagnostic tool, and must never guide real dosing or therapy decisions.
          </div>
        </div>

        {/* Modal Footer */}
        <footer className="border-t border-border px-6 py-4 flex items-center justify-between text-[10px] text-ink-faint no-print">
          <span>PharmaSim Clinical Report</span>
          <span>Simulation Mode</span>
        </footer>
      </div>
    </div>
  );
}
