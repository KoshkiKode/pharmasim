import { useMemo, useState, useRef, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import { substances } from '@pharmasim/engine';
import type { Substance } from '@pharmasim/engine';
import { CATEGORY_LABELS, CATEGORY_COLOR } from '@pharmasim/engine';

interface Props {
  addedIds: Set<string>;
  onAdd: (s: Substance) => void;
}

export function SubstanceSearch({ addedIds, onAdd }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const scored = substances
      .map((s) => {
        const name = s.name.toLowerCase();
        const brands = s.brandNames.map((b) => b.toLowerCase());
        let score = -1;
        if (name === q || brands.includes(q)) score = 100;
        else if (name.startsWith(q)) score = 80;
        else if (brands.some((b) => b.startsWith(q))) score = 70;
        else if (name.includes(q)) score = 50;
        else if (brands.some((b) => b.includes(q))) score = 40;
        else if (s.drugClass.toLowerCase().includes(q)) score = 20;
        return { s, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 30)
      .map((x) => x.s);
    return scored;
  }, [query]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const handleAdd = (s: Substance) => {
    onAdd(s);
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex items-center gap-2 rounded-xl border border-border bg-bg-inset px-3 py-2.5 focus-within:border-accent/60 focus-within:ring-1 focus-within:ring-accent/40">
        <Search className="h-4 w-4 shrink-0 text-ink-faint" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => query && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, results.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === 'Enter' && results[active]) {
              e.preventDefault();
              handleAdd(results[active]);
            } else if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
          placeholder={`Search ${substances.length.toLocaleString()} substances by generic or brand name…`}
          className="w-full bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
          data-testid="input-substance-search"
          aria-label="Search substances"
          autoComplete="off"
        />
      </div>

      {open && query && (
        <ul
          className="scroll-thin absolute z-40 mt-2 max-h-80 w-full overflow-y-auto rounded-xl border border-border bg-bg-raised p-1.5 shadow-panel"
          role="listbox"
          data-testid="search-results"
        >
          {results.length === 0 && (
            <li className="px-3 py-4 text-center text-sm text-ink-faint">
              No substances match “{query}”.
            </li>
          )}
          {results.map((s, i) => {
            const added = addedIds.has(s.id);
            return (
              <li key={s.id}>
                <button
                  type="button"
                  disabled={added}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => handleAdd(s)}
                  className={
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ' +
                    (added
                      ? 'cursor-not-allowed opacity-40'
                      : i === active
                        ? 'bg-accent/10'
                        : 'hover:bg-bg-panel')
                  }
                  data-testid={`search-result-${s.id}`}
                >
                  <span
                    className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLOR[s.category] }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className="truncate text-sm font-medium text-ink">{s.name}</span>
                      {s.brandNames[0] && (
                        <span className="truncate text-xs text-ink-faint">
                          {s.brandNames.join(', ')}
                        </span>
                      )}
                    </span>
                    <span className="block truncate text-xs text-ink-muted">
                      <span className="font-semibold text-accent/80">{s.drugClass}</span> · {CATEGORY_LABELS[s.category]}
                    </span>
                  </span>
                  {added ? (
                    <span className="shrink-0 text-xs text-ink-faint">Added</span>
                  ) : (
                    <Plus className="h-4 w-4 shrink-0 text-accent" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
