/** Inline SVG icons for build tools & UI. Each renders at 1em by default. */

type IconProps = {
  size?: number | string;
  className?: string;
};

const defaults = (p: IconProps) => ({
  width: p.size ?? "1em",
  height: p.size ?? "1em",
  className: p.className,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

/* ── General ──────────────────────────────────────────────────────── */

export function IconSearch(p: IconProps = {}) {
  return (
    <svg {...defaults(p)}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

export function IconCursor(p: IconProps = {}) {
  return (
    <svg {...defaults(p)}>
      <path d="M5 3l14 8-6.5 1.5L11 19z" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ── Structure ────────────────────────────────────────────────────── */

export function IconPillar(p: IconProps = {}) {
  return (
    <svg {...defaults(p)}>
      <rect x="8" y="2" width="8" height="20" rx="1" />
      <path d="M6 2h12M6 22h12" />
    </svg>
  );
}

export function IconWall(p: IconProps = {}) {
  return (
    <svg {...defaults(p)}>
      <rect x="2" y="4" width="20" height="16" rx="1" />
      <path d="M2 10h20M2 16h20M8 4v6M16 4v6M12 10v6M8 16v6M16 16v6" />
    </svg>
  );
}

export function IconSteelBar(p: IconProps = {}) {
  return (
    <svg {...defaults(p)}>
      <path d="M4 20L20 4" strokeWidth="3" />
      <circle cx="4" cy="20" r="2" fill="currentColor" stroke="none" />
      <circle cx="20" cy="4" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ── Openings ─────────────────────────────────────────────────────── */

export function IconDoor(p: IconProps = {}) {
  return (
    <svg {...defaults(p)}>
      <rect x="5" y="2" width="14" height="20" rx="1" />
      <path d="M5 22h14" />
      <circle cx="15" cy="13" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconWindow(p: IconProps = {}) {
  return (
    <svg {...defaults(p)}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M12 4v16M3 12h18" />
    </svg>
  );
}

/* ── Finishing ─────────────────────────────────────────────────────── */

export function IconRoof(p: IconProps = {}) {
  return (
    <svg {...defaults(p)}>
      <path d="M2 20L12 4l10 16H2z" />
      <path d="M6 20v-6h4v6M14 14h4" />
    </svg>
  );
}

export function IconFurniture(p: IconProps = {}) {
  return (
    <svg {...defaults(p)}>
      <path d="M4 16V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8" />
      <rect x="2" y="14" width="20" height="4" rx="1" />
      <path d="M4 18v2M20 18v2" />
    </svg>
  );
}

/* ── Actions / UI ─────────────────────────────────────────────────── */

export function IconDelete(p: IconProps = {}) {
  return (
    <svg {...defaults(p)}>
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export function IconUndo(p: IconProps = {}) {
  return (
    <svg {...defaults(p)}>
      <path d="M3 7v6h6" />
      <path d="M3 13a9 9 0 0 1 15.36-6.36" />
      <path d="M21 12a9 9 0 0 1-15 6.7" />
    </svg>
  );
}

export function IconSave(p: IconProps = {}) {
  return (
    <svg {...defaults(p)}>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <path d="M17 21v-8H7v8M7 3v5h8" />
    </svg>
  );
}

export function IconLoad(p: IconProps = {}) {
  return (
    <svg {...defaults(p)}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5M12 15V3" />
    </svg>
  );
}

export function IconHide(p: IconProps = {}) {
  return (
    <svg {...defaults(p)}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export function IconArrowRight(p: IconProps = {}) {
  return (
    <svg {...defaults(p)}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

/* ── Character avatar ─────────────────────────────────────────────── */

export function IconHardHat(p: IconProps = {}) {
  return (
    <svg {...defaults(p)} viewBox="0 0 48 48" strokeWidth="2.5">
      {/* Hat brim */}
      <ellipse cx="24" cy="30" rx="20" ry="5" fill="#f5b73d" stroke="#c6842a" />
      {/* Hat dome */}
      <path
        d="M10 30c0-10 6-18 14-18s14 8 14 18"
        fill="#ffd97a"
        stroke="#c6842a"
      />
      {/* Center stripe */}
      <path
        d="M18 30V16a6 6 0 0 1 12 0v14"
        fill="none"
        stroke="#c6842a"
        strokeWidth="2"
      />
      {/* Face */}
      <circle cx="18" cy="37" r="1.5" fill="#4a3826" stroke="none" />
      <circle cx="30" cy="37" r="1.5" fill="#4a3826" stroke="none" />
      <path d="M21 41q3 2 6 0" stroke="#4a3826" fill="none" strokeWidth="1.5" />
    </svg>
  );
}
