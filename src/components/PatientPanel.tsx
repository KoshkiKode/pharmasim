import type { PatientProfile, MetabolizerStatus, OrganHealth } from '@/lib/pharmacokinetics';
import { InfoTooltip } from './InfoTooltip';
import { User } from 'lucide-react';

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

      {/* Metabolizer */}
      <div className="mt-4">
        <Label info={FIELD_INFO.metabolizer}>CYP metabolizer status</Label>
        <div className="grid grid-cols-3 gap-2" data-testid="select-metabolizer">
          {(['poor', 'normal', 'rapid'] as MetabolizerStatus[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => set('metabolizer', m)}
              className={
                'rounded-lg border px-2 py-1.5 text-xs font-medium capitalize transition-colors ' +
                (patient.metabolizer === m
                  ? 'border-accent/60 bg-accent/10 text-accent'
                  : 'border-border bg-bg-inset text-ink-muted hover:border-border hover:text-ink')
              }
              data-testid={`metabolizer-${m}`}
            >
              {m}
            </button>
          ))}
        </div>
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
