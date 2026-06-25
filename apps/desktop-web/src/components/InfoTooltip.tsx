import { useState, useRef, useId } from 'react';
import { Info } from 'lucide-react';

/**
 * Accessible info tooltip. Opens on hover and on focus/click (keyboard +
 * touch). Renders an absolutely-positioned bubble that does not shift layout.
 */
export function InfoTooltip({ text, label }: { text: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const closeTimer = useRef<number | null>(null);

  const show = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const hide = () => {
    closeTimer.current = window.setTimeout(() => setOpen(false), 80);
  };

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label={label ? `Info: ${label}` : 'More information'}
        aria-describedby={open ? id : undefined}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-ink-faint transition-colors hover:text-accent focus:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onClick={(e) => {
          e.preventDefault();
          setOpen((v) => !v);
        }}
        data-testid="info-tooltip-trigger"
      >
        <Info className="h-3.5 w-3.5" strokeWidth={2.25} />
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="animate-fade-in pointer-events-none absolute left-1/2 top-6 z-50 w-60 -translate-x-1/2 rounded-lg border border-border bg-bg-raised px-3 py-2 text-xs leading-relaxed text-ink-muted shadow-panel"
        >
          {text}
        </span>
      )}
    </span>
  );
}
