export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-label="PharmaSim logo"
      role="img"
    >
      <g transform="rotate(-45 32 32)">
        <rect x="18" y="22" width="28" height="20" rx="10" fill="#2dd4bf" />
        <path d="M32 22 a10 10 0 0 0 -10 10 v0 a10 10 0 0 0 10 10 z" fill="#0f766e" />
      </g>
      <circle cx="46" cy="18" r="4.5" fill="currentColor" />
      <circle cx="18" cy="46" r="4.5" fill="currentColor" />
      <line x1="46" y1="18" x2="32" y2="32" stroke="#9fb0c8" strokeWidth="2.5" />
      <line x1="18" y1="46" x2="32" y2="32" stroke="#9fb0c8" strokeWidth="2.5" />
    </svg>
  );
}
