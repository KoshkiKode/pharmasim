import { useMemo, useState } from 'react';
import { Pill, ShieldAlert, Github } from 'lucide-react';
import { Logo } from './components/Logo';
import { PatientPanel } from './components/PatientPanel';
import { SubstanceSearch } from './components/SubstanceSearch';
import { SubstanceCard } from './components/SubstanceCard';
import { ResultsPanel } from './components/ResultsPanel';
import type { Substance } from './data/types';
import { substances as ALL } from './data/substances';
import type { PatientProfile, RegimenConfig } from './lib/pharmacokinetics';
import { defaultRegimen, type AddedSubstance } from './lib/state';

const DEFAULT_PATIENT: PatientProfile = {
  ageYears: 35,
  weightKg: 75,
  heightCm: 175,
  bodyFatPct: 22,
  tolerance: 0,
  liver: 'normal',
  kidney: 'normal',
  hydrationPct: 50,
  metabolizer: 'normal',
};

export default function App() {
  const [patient, setPatient] = useState<PatientProfile>(DEFAULT_PATIENT);
  const [added, setAdded] = useState<AddedSubstance[]>([]);

  const addedIds = useMemo(() => new Set(added.map((a) => a.substance.id)), [added]);
  const activeSubstances = useMemo(() => added.map((a) => a.substance), [added]);

  const addSubstance = (s: Substance) => {
    if (addedIds.has(s.id)) return;
    setAdded((prev) => [...prev, { substance: s, regimen: defaultRegimen(s), advancedOpen: false }]);
  };
  const removeSubstance = (id: string) =>
    setAdded((prev) => prev.filter((a) => a.substance.id !== id));
  const updateRegimen = (id: string, r: RegimenConfig) =>
    setAdded((prev) => prev.map((a) => (a.substance.id === id ? { ...a, regimen: r } : a)));
  const toggleAdvanced = (id: string) =>
    setAdded((prev) =>
      prev.map((a) => (a.substance.id === id ? { ...a, advancedOpen: !a.advancedOpen } : a)),
    );

  return (
    <div className="min-h-screen bg-bg text-ink">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5 text-ink">
            <Logo size={26} />
            <div className="leading-none">
              <span className="block text-sm font-semibold tracking-tight">PharmaSim</span>
              <span className="block text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                Interaction Simulator
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 text-xs text-ink-faint sm:flex">
              <Pill className="h-3.5 w-3.5 text-accent" />
              <span className="tabular">{ALL.length}</span> substances
            </span>
            <a
              href="https://github.com/dogeisbae"
              target="_blank"
              rel="noreferrer"
              className="rounded-md p-1.5 text-ink-faint transition-colors hover:text-ink"
              aria-label="GitHub"
            >
              <Github className="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      {/* Disclaimer */}
      <div className="border-b border-sev-moderate/20 bg-sev-moderate/5">
        <div className="mx-auto flex max-w-[1400px] items-start gap-2 px-4 py-2 sm:px-6">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sev-moderate" />
          <p className="text-[11px] leading-relaxed text-ink-muted">
            <span className="font-semibold text-sev-moderate">Educational / simulation use only.</span>{' '}
            PharmaSim is a pharmacology sandbox. It is <em>not</em> medical advice, not a substitute
            for a clinician or pharmacist, and must never guide real dosing or drug-combination
            decisions.
          </p>
        </div>
      </div>

      {/* Main grid */}
      <main className="mx-auto grid max-w-[1400px] grid-cols-1 gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[300px_minmax(0,1fr)_360px]">
        {/* Left: patient */}
        <div className="lg:sticky lg:top-[104px] lg:self-start">
          <PatientPanel patient={patient} onChange={setPatient} />
        </div>

        {/* Center: substances */}
        <div className="space-y-4">
          <SubstanceSearch addedIds={addedIds} onAdd={addSubstance} />

          {added.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-bg-panel/50 px-6 py-16 text-center">
              <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Pill className="h-6 w-6" />
              </span>
              <h3 className="text-sm font-semibold text-ink">No substances added</h3>
              <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-ink-muted">
                Search above and add a substance. Try “Lexapro”, “tramadol”, or “alcohol”. Add two or
                more to see interactions.
              </p>
            </div>
          ) : (
            <div className="space-y-4" data-testid="substance-cards">
              {added.map((item) => (
                <SubstanceCard
                  key={item.substance.id}
                  item={item}
                  patient={patient}
                  onRegimenChange={(r) => updateRegimen(item.substance.id, r)}
                  onToggleAdvanced={() => toggleAdvanced(item.substance.id)}
                  onRemove={() => removeSubstance(item.substance.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: results */}
        <div className="lg:sticky lg:top-[104px] lg:self-start">
          <ResultsPanel substances={activeSubstances} />
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-[1400px] px-4 py-5 text-[11px] leading-relaxed text-ink-faint sm:px-6">
          PharmaSim · deterministic in-browser pharmacokinetics (R = 1/(1−e^(−kτ))) and a rule-based
          interaction engine. PK values are standard published reference figures; entries marked
          “approx. PK” are estimates. Built by dogeisbae · MIT licensed. Not medical advice.
        </div>
      </footer>
    </div>
  );
}
