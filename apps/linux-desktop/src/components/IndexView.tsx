import { useState, useMemo } from 'react';
import { Search, Info, ShieldAlert, Activity, BookOpen, AlertTriangle } from 'lucide-react';
import { substances as ALL, CATEGORY_LABELS, CATEGORY_COLOR } from '@pharmasim/engine';

export function IndexView() {
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fast filter
  const filtered = useMemo(() => {
    if (!query) return ALL;
    const q = query.toLowerCase();
    return ALL.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.drugClass.toLowerCase().includes(q) ||
        s.brandNames.some((b) => b.toLowerCase().includes(q)),
    );
  }, [query]);

  return (
    <div className="mx-auto max-w-[900px] px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Drug Encyclopedia</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Search our highly curated database of {ALL.length.toLocaleString()} compounds,
            including pharmaceuticals, ethnobotanicals, and research chemicals.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative flex items-center rounded-xl border border-border bg-bg-panel px-4 py-3 shadow-sm focus-within:border-accent focus-within:ring-1 focus-within:ring-accent">
          <Search className="mr-3 h-5 w-5 text-ink-faint" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${ALL.length.toLocaleString()} substances by generic or brand name…`}
            className="w-full bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
            data-testid="index-search"
          />
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.slice(0, 50).map((s) => {
          const isExpanded = expandedId === s.id;
          const accent = CATEGORY_COLOR[s.category] || '#64748b';

          return (
            <div
              key={s.id}
              className={`overflow-hidden rounded-xl border transition-colors ${
                isExpanded ? 'border-accent/50 bg-bg-panel shadow-panel' : 'border-border bg-bg-panel hover:border-accent/30'
              }`}
            >
              {/* Header / Condensed Row */}
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : s.id)}
                className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-bg-inset/50"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: accent }}
                  />
                  <div>
                    <div className="flex items-baseline gap-2">
                      <h2 className="text-sm font-bold text-ink">{s.name}</h2>
                      {s.brandNames.length > 0 && (
                        <span className="text-[11px] text-ink-faint">
                          {s.brandNames.join(', ')}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {s.drugClass} · {CATEGORY_LABELS[s.category]}
                    </p>
                  </div>
                </div>
                <div className="text-ink-faint">
                  {isExpanded ? (
                    <span className="text-xs font-medium text-accent">Close</span>
                  ) : (
                    <BookOpen className="h-4 w-4" />
                  )}
                </div>
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="animate-fade-in border-t border-border bg-bg-inset/20 p-4">
                  <div className="grid gap-6 md:grid-cols-2">
                    
                    {/* Left Col: Clinical / Mechanism */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                          <Info className="h-3.5 w-3.5" /> Encyclopedic Blurb
                        </h3>
                        <p className="text-sm leading-relaxed text-ink-muted">
                          {s.encyclopediaEntry || s.mechanism || 'No description available.'}
                        </p>
                      </div>

                      {s.warnings && s.warnings.length > 0 && (
                        <div>
                          <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                            <ShieldAlert className="h-3.5 w-3.5 text-sev-moderate" /> Top Side Effects
                          </h3>
                          <ul className="list-inside list-disc space-y-1 text-sm text-ink-muted">
                            {s.warnings.map((w, idx) => (
                              <li key={idx}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Right Col: Recreational / Profile */}
                    <div className="space-y-4 rounded-lg border border-border bg-bg p-3 shadow-inner">
                      <div>
                        <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                          <Activity className="h-3.5 w-3.5 text-accent" /> Pharmacodynamics
                        </h3>
                        
                        {s.tags && s.tags.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {s.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center rounded-md border border-border bg-bg-panel px-2 py-1 text-[11px] font-medium capitalize text-ink-muted"
                              >
                                {tag.replace('-', ' ')}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-2 text-sm text-ink-muted">No specific pharmacodynamic tags assigned.</p>
                        )}
                        
                        {s.tags?.includes('psychosis-risk') && (
                          <div className="mt-3 flex items-start gap-2 rounded-md border border-red-500/20 bg-red-500/5 p-2 text-xs text-red-400">
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <p>High risk of drug-induced psychosis or delirium at high or recreational doses.</p>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length > 50 && (
          <p className="py-4 text-center text-xs text-ink-faint">
            Showing top 50 results. Refine your search to see more.
          </p>
        )}
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-ink-muted">
            No substances found matching "{query}".
          </p>
        )}
      </div>
    </div>
  );
}
