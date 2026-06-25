import { useMemo, useState } from 'react';
import { ShieldAlert, Activity, AlertTriangle, CheckCircle2, FileText } from 'lucide-react';
import type { Substance } from '@pharmasim/engine';
import type { PatientProfile } from '@pharmasim/engine';
import {
  computeInteractions,
  computeBodySystemImpact,
  SEVERITY_META,
  severityRank,
} from '@pharmasim/engine';
import { computeConditionWarnings } from '@pharmasim/engine';
import { computeRiskScores, getRiskLevel } from '@pharmasim/engine';
import { computePK, evaluateToxicity, computeReceptorState } from '@pharmasim/engine';
import { SummaryModal } from './SummaryModal';

export function ResultsPanel({
  substances,
  patient,
  addedRegimens,
}: {
  substances: Substance[];
  patient: PatientProfile;
  addedRegimens: { substance: Substance; regimen: any }[];
}) {
  const [summaryOpen, setSummaryOpen] = useState(false);

  const interactions = useMemo(() => computeInteractions(substances), [substances]);
  const conditionWarnings = useMemo(
    () => computeConditionWarnings(substances, patient.conditions, patient.liver, patient.kidney),
    [substances, patient.conditions, patient.liver, patient.kidney]
  );
  const systems = useMemo(() => computeBodySystemImpact(substances), [substances]);
  const riskScores = useMemo(() => computeRiskScores(substances), [substances]);

  const worst = interactions[0];
  const counts = useMemo(() => {
    const c = { minor: 0, moderate: 0, major: 0, contraindicated: 0 };
    interactions.forEach((i) => c[i.severity]++);
    return c;
  }, [interactions]);

  const toxAlerts = useMemo(() => {
    const pks = addedRegimens.map(ar => computePK(patient, ar.substance, ar.regimen, substances));
    return evaluateToxicity(pks, substances);
  }, [addedRegimens, patient, substances]);

  const receptorStates = useMemo(() => {
    const pks = addedRegimens.map(ar => computePK(patient, ar.substance, ar.regimen, substances));
    // Find the global peak hour across all PKs
    let peakHour = 0;
    let maxC = 0;
    for (const pk of pks) {
      for (const pt of pk.series) {
        if (pt.concentration > maxC) {
          maxC = pt.concentration;
          peakHour = pt.hour;
        }
      }
    }
    const receptorsToCheck = ['MOR', 'TAAR1', 'VMAT2', 'GABA_A', 'NMDA', '5HT2A'];
    return receptorsToCheck
      .map(rec => computeReceptorState(rec, pks, substances, peakHour))
      .filter(rs => rs.totalOccupancy > 0.01);
  }, [addedRegimens, patient, substances]);

  return (
    <div className="space-y-4">
      {/* Export Clinical Summary Button */}
      <button
        type="button"
        onClick={() => setSummaryOpen(true)}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-bg-panel py-2.5 text-xs font-semibold text-accent hover:bg-accent/5 hover:text-ink transition-colors shadow-panel"
        data-testid="btn-export-summary"
      >
        <FileText className="h-4 w-4" /> Export Clinical Summary
      </button>

      {/* Lethal Toxicity Alerts */}
      {toxAlerts.length > 0 && toxAlerts.some(t => t.status === 'lethal' || t.status === 'toxic') && (
        <section className="rounded-xl border border-red-500/30 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.15)] animate-pulse" aria-label="Toxicity alerts">
          <header className="flex items-center gap-2 border-b border-red-500/20 px-4 py-3">
            <ShieldAlert className="h-5 w-5 text-red-500" />
            <h2 className="text-sm font-bold text-red-500 uppercase tracking-widest">Lethal Toxicity Warning</h2>
          </header>
          <div className="p-4 space-y-3">
            {toxAlerts.filter(t => t.status === 'lethal' || t.status === 'toxic').map((tox, idx) => (
              <div key={idx} className="flex items-center justify-between bg-black/40 rounded border border-red-500/40 p-3">
                <div>
                  <div className="text-red-400 font-bold">{tox.name}</div>
                  <div className="text-red-500/70 text-[10px] uppercase font-bold tracking-widest mt-0.5">
                    {tox.status === 'lethal' ? 'FATAL OVERDOSE EXPECTED' : 'SEVERE TOXICITY'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-red-400 font-mono font-bold text-lg">{tox.peakConcentration.toFixed(3)} <span className="text-[10px]">mg/L</span></div>
                  <div className="text-red-500/60 text-xs">Threshold: {tox.status === 'lethal' ? tox.lethalThreshold : tox.toxicThreshold} mg/L</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Clinical Warnings / Contraindications */}
      <section
        className="rounded-xl border border-border bg-bg-panel shadow-panel"
        aria-label="Clinical warnings"
      >
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
              <ShieldAlert className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-semibold text-ink">Clinical Warnings</h2>
          </div>
          {conditionWarnings.length > 0 && (
            <span
              className="rounded-full px-2 py-0.5 text-xs font-semibold border"
              style={{
                color: conditionWarnings.some(w => w.isLifeThreatening) ? '#f87171' : '#fb923c',
                borderColor: conditionWarnings.some(w => w.isLifeThreatening) ? 'rgba(248,113,113,0.3)' : 'rgba(251,146,60,0.3)',
                background: conditionWarnings.some(w => w.isLifeThreatening) ? 'rgba(248,113,113,0.1)' : 'rgba(251,146,60,0.1)',
              }}
              data-testid="condition-warning-count"
            >
              {conditionWarnings.some(w => w.isLifeThreatening) ? 'CRITICAL' : `${conditionWarnings.length} alert(s)`}
            </span>
          )}
        </header>

        <div className="p-3">
          {substances.length === 0 ? (
            <Empty text="Add substances to check clinical warnings." />
          ) : conditionWarnings.length === 0 ? (
            <div
              className="flex items-center gap-2 rounded-lg bg-green-500/5 px-3 py-3 text-sm text-green-400 border border-green-500/10"
              data-testid="no-condition-warnings"
            >
              <CheckCircle2 className="h-4 w-4" />
              No clinical contraindications detected for active conditions.
            </div>
          ) : (
            <ul className="space-y-2 max-h-72 overflow-y-auto scroll-thin pr-1" data-testid="condition-warning-list">
              {conditionWarnings.map((w) => {
                const meta = SEVERITY_META[w.severity];
                const isLifeThreatening = w.isLifeThreatening;
                return (
                  <li
                    key={w.id}
                    className={`rounded-lg border p-3 ${isLifeThreatening ? 'bg-red-500/5 border-red-500/20' : 'bg-bg-inset'}`}
                    style={{ borderColor: isLifeThreatening ? undefined : meta.ring }}
                    data-testid={`condition-warning-${w.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ background: isLifeThreatening ? '#f87171' : meta.color }}
                          />
                          <h3 className="text-xs font-bold text-ink truncate">{w.title}</h3>
                        </div>
                        <p className="mt-0.5 text-[10px] text-ink-muted">
                          {w.conditionName} {w.substanceName ? `· ${w.substanceName}` : ''}
                          {w.substanceNames && ` · Combination: ${w.substanceNames.join(' + ')}`}
                        </p>
                      </div>
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                        style={{ color: isLifeThreatening ? '#f87171' : meta.color, background: isLifeThreatening ? 'rgba(248,113,113,0.12)' : meta.bg }}
                      >
                        {isLifeThreatening ? 'CRITICAL' : meta.label}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-ink-muted">{w.mechanism}</p>
                    <p className="mt-1.5 flex items-start gap-1.5 text-xs leading-relaxed text-ink">
                      <AlertTriangle
                        className="mt-0.5 h-3 w-3 shrink-0"
                        style={{ color: isLifeThreatening ? '#f87171' : meta.color }}
                      />
                      <span>{w.recommendation}</span>
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Receptor Binding Profiles */}
      {receptorStates.length > 0 && (
        <section
          className="rounded-xl border border-border bg-bg-panel shadow-panel"
          aria-label="Receptor Binding Profiles"
        >
          <header className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                <Activity className="h-4 w-4" />
              </span>
              <h2 className="text-sm font-semibold text-ink">Peak Receptor Activity</h2>
            </div>
          </header>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {receptorStates.map(rs => (
              <div key={rs.receptor} className="flex flex-col gap-1.5 p-3 rounded-lg border border-indigo-500/20 bg-indigo-500/5">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">{rs.receptor} Receptor</span>
                  <span className="text-[10px] text-ink-muted">Dominant: {rs.dominantLigand || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-bg-inset rounded-full overflow-hidden relative">
                    {/* Activity (Intrinsic) */}
                    <div className="absolute top-0 left-0 h-full bg-indigo-500" style={{ width: `${rs.netActivity * 100}%` }} />
                    {/* Occupied but inactive (Antagonism) */}
                    <div className="absolute top-0 left-0 h-full bg-border" style={{ width: `${rs.totalOccupancy * 100}%`, zIndex: 0 }} />
                  </div>
                  <span className="text-sm font-black tabular-nums min-w-[3rem] text-right text-indigo-300">
                    {(rs.netActivity * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[9px] text-ink-faint">Occupancy: {(rs.totalOccupancy * 100).toFixed(0)}%</span>
                  {rs.totalOccupancy > rs.netActivity && (
                    <span className="text-[9px] text-orange-400 font-bold uppercase tracking-wider">Competitive Antagonism</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Polypharmacy Risk Scoring */}
      {substances.length > 1 && (
        <section
          className="rounded-xl border border-border bg-bg-panel shadow-panel"
          aria-label="Polypharmacy Risk"
        >
          <header className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
                <Activity className="h-4 w-4" />
              </span>
              <h2 className="text-sm font-semibold text-ink">Polypharmacy Toxicity Risk</h2>
            </div>
          </header>
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <RiskMeter label="Anticholinergic Burden" score={riskScores.anticholinergicBurden} />
            <RiskMeter label="Serotonin Toxicity" score={riskScores.serotoninBurden} />
            <RiskMeter label="QT Prolongation" score={riskScores.qtProlongationRisk} />
          </div>
        </section>
      )}

      {/* Interactions */}
      <section
        className="rounded-xl border border-border bg-bg-panel shadow-panel"
        aria-label="Drug drug interactions"
      >
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <ShieldAlert className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-semibold text-ink">Interactions</h2>
          </div>
          {interactions.length > 0 && (
            <span
              className="rounded-full px-2 py-0.5 text-xs font-semibold"
              style={{
                color: SEVERITY_META[worst.severity].color,
                background: SEVERITY_META[worst.severity].bg,
              }}
              data-testid="interaction-count"
            >
              {interactions.length} found
            </span>
          )}
        </header>

        <div className="p-3">
          {substances.length < 2 ? (
            <Empty text="Add two or more substances to evaluate interactions." />
          ) : interactions.length === 0 ? (
            <div
              className="flex items-center gap-2 rounded-lg bg-sev-minor/5 px-3 py-3 text-sm text-sev-minor"
              data-testid="no-interactions"
            >
              <CheckCircle2 className="h-4 w-4" />
              No rule-based interactions detected between the selected substances.
            </div>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {(['contraindicated', 'major', 'moderate', 'minor'] as const).map(
                  (sev) =>
                    counts[sev] > 0 && (
                      <span
                        key={sev}
                        className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                        style={{ color: SEVERITY_META[sev].color, background: SEVERITY_META[sev].bg }}
                      >
                        {counts[sev]} {SEVERITY_META[sev].label.toLowerCase()}
                      </span>
                    ),
                )}
              </div>
              <ul className="space-y-2 max-h-96 overflow-y-auto scroll-thin pr-1" data-testid="interaction-list">
                {interactions.map((i) => {
                  const meta = SEVERITY_META[i.severity];
                  return (
                    <li
                      key={i.id}
                      className="rounded-lg border bg-bg-inset p-3"
                      style={{ borderColor: meta.ring }}
                      data-testid={`interaction-${i.id}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="inline-block h-2 w-2 rounded-full"
                              style={{ background: meta.color }}
                            />
                            <h3 className="text-sm font-semibold text-ink">{i.title}</h3>
                          </div>
                          <p className="mt-0.5 text-xs text-ink-muted">
                            {i.substanceNames[0]} <span className="text-ink-faint">+</span>{' '}
                            {i.substanceNames[1]}
                          </p>
                        </div>
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                          style={{ color: meta.color, background: meta.bg }}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-ink-muted">{i.mechanism}</p>
                      <p className="mt-1.5 flex items-start gap-1.5 text-xs leading-relaxed text-ink">
                        <AlertTriangle
                          className="mt-0.5 h-3 w-3 shrink-0"
                          style={{ color: meta.color }}
                        />
                        <span>{i.recommendation}</span>
                      </p>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </section>

      {/* Body systems */}
      <section
        className="rounded-xl border border-border bg-bg-panel shadow-panel"
        aria-label="Body system impact"
      >
        <header className="flex items-center gap-2 border-b border-border px-4 py-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Activity className="h-4 w-4" />
          </span>
          <h2 className="text-sm font-semibold text-ink">Body-system impact</h2>
        </header>
        <div className="p-3">
          {substances.length === 0 ? (
            <Empty text="Add substances to see which body systems are affected." />
          ) : (
            <ul className="space-y-2" data-testid="bodysystem-list">
              {systems.map((sys) => {
                const max = systems[0]?.load || 1;
                return (
                  <li key={sys.system} data-testid={`bodysystem-${sys.system}`}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-ink">{sys.system}</span>
                      <span className="tabular text-ink-faint">{sys.load}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-inset">
                      <div
                        className="h-full rounded-full bg-accent/70"
                        style={{ width: `${(sys.load / max) * 100}%` }}
                      />
                    </div>
                    <p className="mt-1 truncate text-[11px] text-ink-faint">
                      {sys.substances.join(', ')}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Summary Modal */}
      <SummaryModal
        isOpen={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        patient={patient}
        substances={substances}
        addedRegimens={addedRegimens}
      />
    </div>
  );
}

export { severityRank };

function RiskMeter({ label, score }: { label: string; score: number }) {
  const level = getRiskLevel(score);
  const colorClass = 
    level === 'high' ? 'text-red-500 bg-red-500/10 border-red-500/20' : 
    level === 'moderate' ? 'text-orange-500 bg-orange-500/10 border-orange-500/20' : 
    'text-green-500 bg-green-500/10 border-green-500/20';

  return (
    <div className={`flex flex-col gap-1 p-3 rounded-lg border ${colorClass}`}>
      <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-black">{score}</span>
        <span className="text-xs font-semibold uppercase">{level}</span>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-ink-faint">
      {text}
    </div>
  );
}
