import { useState, useMemo, useRef, useEffect } from 'react';
import type { PatientProfile, MetabolizerPhenotype, OrganHealth } from '@/lib/pharmacokinetics';
import { InfoTooltip } from './InfoTooltip';
import { User, Search, Plus, X } from 'lucide-react';
import { conditions as ALL_CONDITIONS } from '@/data/conditions';

interface Props {
  patient: PatientProfile;
  onChange: (p: PatientProfile) => void;
}

const FIELD_INFO = {
  age: 'Age alters drug clearance. Hepatic and renal function decline with age, so the elderly often accumulate drugs (lower clearance, longer half-life). Children may clear some drugs faster.',
  weight:
    'Body weight scales clearance allometrically (≈ weight^0.75) and changes the volume of distribution. It directly affects steady-state exposure and dosing.',
  height:
    'Height combines with weight to estimate body composition and ideal body weight, which influences distribution of lipophilic vs hydrophilic drugs.',
  bodyFat:
    'Body-fat percentage governs how lipophilic drugs (e.g. THC, diazepam) distribute and accumulate in adipose tissue, prolonging their effective half-life.',
  tolerance:
    'Pharmacodynamic tolerance reduces the perceived effect at a given plasma concentration. It does not change clearance — only the response.',
  liver:
    'Hepatic function determines metabolism of CYP-cleared drugs. Impaired liver function slows clearance, raising plasma levels and the risk of toxicity.',
  kidney:
    'Renal function determines elimination of renally-cleared drugs (e.g. digoxin, gabapentin, vancomycin). Impairment causes accumulation.',
  hydration:
    'Hydration status affects renal perfusion and volume of distribution. Dehydration reduces renal clearance and can concentrate plasma drug levels.',
  metabolizer:
    'CYP metabolizer phenotype (genetic). Poor metabolizers clear CYP substrates slowly (higher levels); rapid/ultrarapid metabolizers clear them quickly (lower levels, possible prodrug over-activation).',
} as const;

function Label({ children, info }: { children: React.ReactNode; info: string }) {
  return (
    <div className="mb-1.5 flex items-center gap-1.5">
      <span className="text-xs font-medium text-ink-muted">{children}</span>
      <InfoTooltip text={info} label={String(children)} />
    </div>
  );
}

const organOptions: { value: OrganHealth; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'reduced', label: 'Reduced' },
  { value: 'impaired', label: 'Impaired' },
];

export function PatientPanel({ patient, onChange }: Props) {
  const [condQuery, setCondQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const condRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (condRef.current && !condRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const filteredConditions = useMemo(() => {
    const q = condQuery.trim().toLowerCase();
    return ALL_CONDITIONS.filter(
      (c) =>
        !patient.conditions.includes(c.id) &&
        (c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q) || c.description.toLowerCase().includes(q))
    );
  }, [condQuery, patient.conditions]);

  const set = <K extends keyof PatientProfile>(key: K, value: PatientProfile[K]) =>
    onChange({ ...patient, [key]: value });

  return (
    <section
      className="rounded-xl border border-border bg-bg-panel p-4 shadow-panel"
      aria-label="Patient profile"
    >
      <header className="mb-4 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <User className="h-4 w-4" />
        </span>
        <h2 className="text-sm font-semibold tracking-tight text-ink">Patient Profile</h2>
      </header>

      <div className="grid grid-cols-2 gap-x-4 gap-y-4">
        {/* Sex */}
        <div className="col-span-2 sm:col-span-1">
          <Label info="Biological sex affects volume of distribution and creatinine clearance (females typically have ~85% the clearance of males of the same age/weight).">Biological sex</Label>
          <div className="grid grid-cols-2 gap-2" data-testid="select-sex">
            <button
              type="button"
              onClick={() => set('biologicalSex', 'M')}
              className={'rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ' + (patient.biologicalSex === 'M' ? 'border-accent/60 bg-accent/10 text-accent' : 'border-border bg-bg-inset text-ink-muted hover:border-border hover:text-ink')}
            >Male</button>
            <button
              type="button"
              onClick={() => set('biologicalSex', 'F')}
              className={'rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ' + (patient.biologicalSex === 'F' ? 'border-accent/60 bg-accent/10 text-accent' : 'border-border bg-bg-inset text-ink-muted hover:border-border hover:text-ink')}
            >Female</button>
          </div>
        </div>
        {/* Age */}
        <div>
          <Label info={FIELD_INFO.age}>Age (years)</Label>
          <input
            type="number"
            min={0}
            max={120}
            value={patient.ageYears}
            onChange={(e) => set('ageYears', clamp(+e.target.value, 0, 120))}
            className="numeric-input"
            data-testid="input-age"
          />
        </div>
        {/* Weight */}
        <div>
          <Label info={FIELD_INFO.weight}>Weight (kg)</Label>
          <input
            type="number"
            min={1}
            max={300}
            value={patient.weightKg}
            onChange={(e) => set('weightKg', clamp(+e.target.value, 1, 300))}
            className="numeric-input"
            data-testid="input-weight"
          />
        </div>
        {/* Height */}
        <div>
          <Label info={FIELD_INFO.height}>Height (cm)</Label>
          <input
            type="number"
            min={50}
            max={250}
            value={patient.heightCm}
            onChange={(e) => set('heightCm', clamp(+e.target.value, 50, 250))}
            className="numeric-input"
            data-testid="input-height"
          />
        </div>
        {/* Body fat */}
        <div>
          <Label info={FIELD_INFO.bodyFat}>Body fat (%)</Label>
          <input
            type="number"
            min={2}
            max={70}
            value={patient.bodyFatPct}
            onChange={(e) => set('bodyFatPct', clamp(+e.target.value, 2, 70))}
            className="numeric-input"
            data-testid="input-bodyfat"
          />
        </div>
      </div>

      {/* Tolerance slider */}
      <div className="mt-4">
        <Label info={FIELD_INFO.tolerance}>
          Tolerance — <span className="tabular text-accent">{patient.tolerance}%</span>
        </Label>
        <input
          type="range"
          min={0}
          max={100}
          value={patient.tolerance}
          onChange={(e) => set('tolerance', +e.target.value)}
          className="w-full"
          data-testid="input-tolerance"
        />
      </div>

      {/* Hydration slider */}
      <div className="mt-4">
        <Label info={FIELD_INFO.hydration}>
          Hydration — <span className="tabular text-accent">{hydrationLabel(patient.hydrationPct)}</span>
        </Label>
        <input
          type="range"
          min={0}
          max={100}
          value={patient.hydrationPct}
          onChange={(e) => set('hydrationPct', +e.target.value)}
          className="w-full"
          data-testid="input-hydration"
        />
      </div>

      {/* Liver / Kidney */}
      <div className="mt-4 grid grid-cols-1 gap-y-4">
        <div>
          <Label info={FIELD_INFO.liver}>Liver health</Label>
          <SegOrgan
            value={patient.liver}
            onChange={(v) => set('liver', v)}
            testid="select-liver"
          />
        </div>
        <div>
          <Label info={FIELD_INFO.kidney}>Kidney health</Label>
          <SegOrgan
            value={patient.kidney}
            onChange={(v) => set('kidney', v)}
            testid="select-kidney"
          />
        </div>
      </div>

      {/* Pharmacogenomics */}
      <div className="mt-5 border-t border-border pt-4">
        <Label info={FIELD_INFO.metabolizer}>Pharmacogenomics (CYP450)</Label>
        <div className="mt-2 space-y-2">
          {['CYP2D6', 'CYP3A4', 'CYP2C19', 'CYP2C9', 'CYP1A2'].map((cyp) => {
            const current = patient.genetics[cyp] || 'normal';
            return (
              <div key={cyp} className="flex items-center justify-between text-xs">
                <span className="font-medium text-ink-muted w-16">{cyp}</span>
                <div className="flex gap-1">
                  {(['poor', 'normal', 'rapid', 'ultrarapid'] as MetabolizerPhenotype[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() =>
                        set('genetics', { ...patient.genetics, [cyp]: m })
                      }
                      className={
                        'rounded border px-1.5 py-1 text-[10px] capitalize transition-colors ' +
                        (current === m
                          ? 'border-accent/60 bg-accent/10 text-accent font-medium'
                          : 'border-border bg-bg-inset text-ink-muted hover:border-border hover:text-ink')
                      }
                      data-testid={`genetics-${cyp}-${m}`}
                    >
                      {m === 'ultrarapid' ? 'Ultra' : m}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Preexisting Conditions */}
      <div ref={condRef} className="mt-5 border-t border-border pt-4">
        <Label info="Selecting preexisting conditions enables the clinical warning engine to check for drug-condition contraindications and combined life-threatening risks.">
          Preexisting Conditions
        </Label>
        
        {/* Search input */}
        <div className="relative mt-2">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-inset px-2.5 py-1.5 focus-within:border-accent/60 focus-within:ring-1 focus-within:ring-accent/40">
            <Search className="h-3.5 w-3.5 text-ink-faint" />
            <input
              type="text"
              placeholder="Search medical conditions..."
              value={condQuery}
              onChange={(e) => {
                setCondQuery(e.target.value);
                setDropdownOpen(true);
              }}
              onFocus={() => setDropdownOpen(true)}
              className="w-full bg-transparent text-xs text-ink placeholder:text-ink-faint focus:outline-none"
              data-testid="input-condition-search"
            />
          </div>

          {dropdownOpen && (
            <ul className="scroll-thin absolute z-40 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-border bg-bg-raised p-1 shadow-panel" data-testid="condition-dropdown">
              {filteredConditions.length === 0 ? (
                <li className="px-2 py-3 text-center text-xs text-ink-faint">
                  {condQuery.trim() ? 'No conditions match.' : 'Type to search...'}
                </li>
              ) : (
                filteredConditions.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => {
                        set('conditions', [...patient.conditions, c.id]);
                        setCondQuery('');
                        setDropdownOpen(false);
                      }}
                      className="flex w-full items-center justify-between rounded px-2.5 py-1.5 text-left text-xs text-ink hover:bg-accent/10 hover:text-accent"
                      data-testid={`add-condition-${c.id}`}
                    >
                      <div>
                        <span className="font-medium">{c.name}</span>
                        <span className="block text-[10px] text-ink-faint">{c.category}</span>
                      </div>
                      <Plus className="h-3 w-3 text-accent" />
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>

        {/* Selected Conditions Pills */}
        {patient.conditions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5" data-testid="selected-conditions">
            {patient.conditions.map((id) => {
              const cond = ALL_CONDITIONS.find((c) => c.id === id);
              if (!cond) return null;
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 rounded bg-accent/10 border border-accent/30 px-1.5 py-0.5 text-[11px] font-medium text-accent"
                  data-testid={`condition-badge-${id}`}
                >
                  {cond.name}
                  <button
                    type="button"
                    onClick={() => set('conditions', patient.conditions.filter((x) => x !== id))}
                    className="rounded-full hover:bg-accent/20 p-0.5 text-accent hover:text-ink-muted"
                    aria-label={`Remove ${cond.name}`}
                    data-testid={`remove-condition-${id}`}
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function SegOrgan({
  value,
  onChange,
  testid,
}: {
  value: OrganHealth;
  onChange: (v: OrganHealth) => void;
  testid: string;
}) {
  return (
    <div className="grid grid-cols-3 gap-1" data-testid={testid}>
      {organOptions.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={
            'rounded-md border px-1 py-1.5 text-center text-[11px] font-medium leading-none transition-colors ' +
            (value === o.value
              ? o.value === 'normal'
                ? 'border-sev-minor/50 bg-sev-minor/10 text-sev-minor'
                : o.value === 'reduced'
                  ? 'border-sev-moderate/50 bg-sev-moderate/10 text-sev-moderate'
                  : 'border-sev-contra/50 bg-sev-contra/10 text-sev-contra'
              : 'border-border bg-bg-inset text-ink-muted hover:text-ink')
          }
          data-testid={`${testid}-${o.value}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function clamp(n: number, lo: number, hi: number) {
  if (Number.isNaN(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}

function hydrationLabel(p: number) {
  if (p < 35) return 'Dehydrated';
  if (p > 70) return 'Well hydrated';
  return 'Euhydrated';
}
