import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { ChevronDown, X, AlertTriangle, FlaskConical } from 'lucide-react';
import type { AddedSubstance } from '@/lib/state';
import { CATEGORY_LABELS, CATEGORY_COLOR } from '@/lib/state';
import type { PatientProfile, RegimenConfig, Frequency, DosingMode } from '@/lib/pharmacokinetics';
import { computePK, formatHours } from '@/lib/pharmacokinetics';
import { InfoTooltip } from './InfoTooltip';

interface Props {
  item: AddedSubstance;
  patient: PatientProfile;
  onRegimenChange: (r: RegimenConfig) => void;
  onToggleAdvanced: () => void;
  onRemove: () => void;
}

const FREQS: Frequency[] = ['QD', 'BID', 'TID', 'QID'];
const FREQ_LABEL: Record<Frequency, string> = {
  QD: 'QD · once daily',
  BID: 'BID · twice daily',
  TID: 'TID · three times',
  QID: 'QID · four times',
};

export function SubstanceCard({
  item,
  patient,
  onRegimenChange,
  onToggleAdvanced,
  onRemove,
}: Props) {
  const { substance: s, regimen } = item;
  const pk = computePK(patient, s, regimen);
  const accent = CATEGORY_COLOR[s.category];

  const set = <K extends keyof RegimenConfig>(key: K, value: RegimenConfig[K]) =>
    onRegimenChange({ ...regimen, [key]: value });

  return (
    <article
      className="overflow-hidden rounded-xl border border-border bg-bg-panel shadow-panel"
      data-testid={`card-substance-${s.id}`}
    >
      {/* Header */}
      <div className="flex items-start gap-3 p-4">
        <span
          className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: accent }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <h3 className="text-sm font-semibold text-ink">{s.name}</h3>
            {s.brandNames[0] && (
              <span className="text-xs text-ink-faint">{s.brandNames.join(', ')}</span>
            )}
            {s.approximate && (
              <span className="inline-flex items-center gap-1 rounded-full bg-sev-moderate/10 px-1.5 py-0.5 text-[10px] font-medium text-sev-moderate">
                <FlaskConical className="h-2.5 w-2.5" /> approx. PK
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-ink-muted">
            {s.drugClass} · {CATEGORY_LABELS[s.category]}
          </p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${s.name}`}
          className="shrink-0 rounded-md p-1 text-ink-faint transition-colors hover:bg-bg-inset hover:text-sev-contra"
          data-testid={`remove-${s.id}`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Quick PK stats */}
      <div className="grid grid-cols-3 gap-px border-y border-border bg-border text-center">
        <Stat label="Half-life" value={formatHours(pk.effectiveHalfLifeHours)} />
        <Stat
          label="Accumulation"
          value={regimen.mode === 'daily' ? `${pk.accumulationRatio.toFixed(2)}×` : '—'}
        />
        <Stat label="To steady state" value={`${pk.daysToSteadyState.toFixed(1)} d`} />
      </div>

      {/* Advanced toggle */}
      <button
        type="button"
        onClick={onToggleAdvanced}
        className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-medium text-ink-muted transition-colors hover:text-ink"
        aria-expanded={item.advancedOpen}
        data-testid={`advanced-toggle-${s.id}`}
      >
        <span>Advanced dosing</span>
        <ChevronDown
          className={
            'h-4 w-4 transition-transform ' + (item.advancedOpen ? 'rotate-180' : '')
          }
        />
      </button>

      {item.advancedOpen && (
        <div className="animate-fade-in space-y-4 px-4 pb-4" data-testid={`advanced-panel-${s.id}`}>
          {/* Mode toggle */}
          <div>
            <FieldLabel info="Acute models a single dose decaying over time. Daily (maintenance) models repeated dosing so accumulation toward steady state is shown.">
              Dosing regimen
            </FieldLabel>
            <div className="grid grid-cols-2 gap-2">
              {(['acute', 'daily'] as DosingMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => set('mode', m)}
                  className={
                    'rounded-lg border px-2 py-1.5 text-xs font-medium capitalize transition-colors ' +
                    (regimen.mode === m
                      ? 'border-accent/60 bg-accent/10 text-accent'
                      : 'border-border bg-bg-inset text-ink-muted hover:text-ink')
                  }
                  data-testid={`mode-${m}-${s.id}`}
                >
                  {m === 'acute' ? 'Acute (single)' : 'Daily (maintenance)'}
                </button>
              ))}
            </div>
          </div>

          {regimen.mode === 'acute' ? (
            <div>
              <FieldLabel info="Single administered dose in milligrams.">Dose (mg)</FieldLabel>
              <input
                type="number"
                min={0}
                value={regimen.doseMg}
                onChange={(e) => set('doseMg', Math.max(0, +e.target.value))}
                className="numeric-input"
                data-testid={`dose-${s.id}`}
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel info="Total milligrams taken per day across all doses.">
                  Daily dose (mg/day)
                </FieldLabel>
                <input
                  type="number"
                  min={0}
                  value={regimen.dailyDoseMg}
                  onChange={(e) => set('dailyDoseMg', Math.max(0, +e.target.value))}
                  className="numeric-input"
                  data-testid={`daily-dose-${s.id}`}
                />
              </div>
              <div>
                <FieldLabel info="How many days the patient has been on this regimen. Determines how close the plasma level is to steady state.">
                  Days on regimen
                </FieldLabel>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={regimen.daysOnRegimen}
                  onChange={(e) =>
                    set('daysOnRegimen', Math.max(1, Math.min(90, +e.target.value)))
                  }
                  className="numeric-input"
                  data-testid={`days-${s.id}`}
                />
              </div>
            </div>
          )}

          {/* Frequency */}
          <div>
            <FieldLabel info="Dosing frequency sets the interval τ used in the accumulation ratio R = 1 / (1 − e^(−kτ)).">
              Frequency
            </FieldLabel>
            <div className="grid grid-cols-4 gap-1.5">
              {FREQS.map((f) => (
                <button
                  key={f}
                  type="button"
                  title={FREQ_LABEL[f]}
                  onClick={() => set('frequency', f)}
                  className={
                    'rounded-md border px-1 py-1.5 text-xs font-medium transition-colors ' +
                    (regimen.frequency === f
                      ? 'border-accent/60 bg-accent/10 text-accent'
                      : 'border-border bg-bg-inset text-ink-muted hover:text-ink')
                  }
                  data-testid={`freq-${f}-${s.id}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Tolerance override */}
          <div>
            <FieldLabel info="Override the patient's general tolerance for this specific substance. Affects perceived effect, not plasma concentration.">
              Tolerance override —{' '}
              <span className="tabular text-accent">
                {regimen.toleranceOverride === null
                  ? `patient (${patient.tolerance}%)`
                  : `${regimen.toleranceOverride}%`}
              </span>
            </FieldLabel>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={100}
                value={regimen.toleranceOverride ?? patient.tolerance}
                onChange={(e) => set('toleranceOverride', +e.target.value)}
                className="w-full"
                data-testid={`tol-override-${s.id}`}
              />
              {regimen.toleranceOverride !== null && (
                <button
                  type="button"
                  onClick={() => set('toleranceOverride', null)}
                  className="shrink-0 rounded-md border border-border px-2 py-1 text-[11px] text-ink-muted hover:text-ink"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Plasma chart */}
      <div className="border-t border-border px-3 pb-3 pt-3">
        <div className="mb-1 flex items-center justify-between px-1">
          <span className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
            Plasma concentration
          </span>
          <InfoTooltip
            label="Plasma concentration chart"
            text="Relative plasma concentration over time (normalised to a single-dose peak). In daily mode, repeated doses accumulate toward steady state. Clearance is adjusted for this patient's organ function, age, weight, hydration and CYP phenotype."
          />
        </div>
        <div className="h-36 w-full" data-testid={`chart-${s.id}`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={pk.series} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${s.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accent} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={accent} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1e2c44" strokeDasharray="2 4" vertical={false} />
              <XAxis
                dataKey="hour"
                tickFormatter={(h) => (h >= 48 ? `${Math.round(h / 24)}d` : `${Math.round(h)}h`)}
                stroke="#5f708a"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: '#1e2c44' }}
                minTickGap={24}
              />
              <YAxis
                stroke="#5f708a"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={34}
              />
              <RTooltip
                contentStyle={{
                  background: '#101a2c',
                  border: '1px solid #1e2c44',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: '#9fb0c8' }}
                labelFormatter={(h) => `t = ${h} h`}
                formatter={(v: number) => [v.toFixed(3), 'rel. conc.']}
              />
              {regimen.mode === 'daily' && pk.steadyStateTrough > 0 && (
                <ReferenceLine
                  y={pk.accumulationRatio}
                  stroke="#fbbf24"
                  strokeDasharray="4 4"
                  strokeOpacity={0.5}
                />
              )}
              <Area
                type="monotone"
                dataKey="concentration"
                stroke={accent}
                strokeWidth={2}
                fill={`url(#grad-${s.id})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {s.warnings && s.warnings.length > 0 && (
        <div className="flex items-start gap-2 border-t border-border bg-sev-moderate/5 px-4 py-2.5">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sev-moderate" />
          <p className="text-[11px] leading-relaxed text-ink-muted">{s.warnings.join(' · ')}</p>
        </div>
      )}
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-bg-panel px-2 py-2.5">
      <div className="tabular text-sm font-semibold text-ink">{value}</div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wide text-ink-faint">{label}</div>
    </div>
  );
}

function FieldLabel({ children, info }: { children: React.ReactNode; info: string }) {
  return (
    <div className="mb-1.5 flex items-center gap-1.5">
      <span className="text-xs font-medium text-ink-muted">{children}</span>
      <InfoTooltip text={info} />
    </div>
  );
}
