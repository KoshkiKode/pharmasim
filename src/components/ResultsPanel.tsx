import { useMemo } from 'react';
import { ShieldAlert, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Substance } from '@/data/types';
import {
  computeInteractions,
  computeBodySystemImpact,
  SEVERITY_META,
  severityRank,
} from '@/lib/interactions';

export function ResultsPanel({ substances }: { substances: Substance[] }) {
  const interactions = useMemo(() => computeInteractions(substances), [substances]);
  const systems = useMemo(() => computeBodySystemImpact(substances), [substances]);

  const worst = interactions[0];
  const counts = useMemo(() => {
    const c = { minor: 0, moderate: 0, major: 0, contraindicated: 0 };
    interactions.forEach((i) => c[i.severity]++);
    return c;
  }, [interactions]);

  return (
    <div className="space-y-4">
      {/* Interactions */}
      <section
        className="rounded-xl border border-border bg-bg-panel shadow-panel"
        aria-label="Drug interactions"
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
              <ul className="space-y-2" data-testid="interaction-list">
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
    </div>
  );
}

export { severityRank };

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-ink-faint">
      {text}
    </div>
  );
}
