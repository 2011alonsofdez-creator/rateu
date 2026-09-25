/* Iconos en SVG, sin librería externa: pesan nada y heredan el color
   del texto, así funcionan igual en tema claro y oscuro. */

type P = { className?: string; style?: React.CSSProperties };

const base = (className = "h-5 w-5") => ({
  className,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export const Sparkle = ({ className, style }: P) => (
  <svg {...base(className)} style={style} fill="currentColor" stroke="none">
    <path d="M12 2.5l2.1 5.6 5.6 2.1-5.6 2.1L12 17.9l-2.1-5.6-5.6-2.1 5.6-2.1L12 2.5zM19 16l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9.9-2.3z" />
  </svg>
);
export const Plus = ({ className, style }: P) => (
  <svg {...base(className)} style={style}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const Chat = ({ className, style }: P) => (
  <svg {...base(className)} style={style}>
    <path d="M21 11.5a8.4 8.4 0 01-9 8.4L4 21l1.1-3.9A8.4 8.4 0 1121 11.5z" />
  </svg>
);
export const Brain = ({ className, style }: P) => (
  <svg {...base(className)} style={style}>
    <path d="M9.5 3.5A2.5 2.5 0 007 6a2.5 2.5 0 00-1.5 4.5A2.5 2.5 0 007 15a2.5 2.5 0 002.5 2.5V20M14.5 3.5A2.5 2.5 0 0117 6a2.5 2.5 0 011.5 4.5A2.5 2.5 0 0117 15a2.5 2.5 0 01-2.5 2.5V20M12 4v16" />
  </svg>
);
export const Clock = ({ className, style }: P) => (
  <svg {...base(className)} style={style}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 1.8" />
  </svg>
);
export const Code = ({ className, style }: P) => (
  <svg {...base(className)} style={style}>
    <path d="M9 17l-5-5 5-5M15 7l5 5-5 5" />
  </svg>
);
export const Plug = ({ className, style }: P) => (
  <svg {...base(className)} style={style}>
    <path d="M9 3v5M15 3v5M6.5 8h11v3.5a5.5 5.5 0 01-11 0V8zM12 17v4" />
  </svg>
);
export const Settings = ({ className, style }: P) => (
  <svg {...base(className)} style={style}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 14.5a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-2.9 1.2v.2a2 2 0 11-4 0v-.1a1.7 1.7 0 00-2.9-1.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00-1.2-2.9H3a2 2 0 110-4h.1a1.7 1.7 0 001.3-2.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 002.9-1.2V3a2 2 0 114 0v.1a1.7 1.7 0 002.9 1.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 001.2 2.9H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1.4z" />
  </svg>
);
export const Bolt = ({ className, style }: P) => (
  <svg {...base(className)} style={style} fill="currentColor" stroke="none">
    <path d="M13.5 2L4 13.2h6L9.9 22 20 10.5h-6.4L13.5 2z" />
  </svg>
);
export const Clip = ({ className, style }: P) => (
  <svg {...base(className)} style={style}>
    <path d="M20 11.5l-7.8 7.8a4.6 4.6 0 01-6.5-6.5l8-8a3.1 3.1 0 014.4 4.4l-7.9 7.9a1.5 1.5 0 01-2.2-2.2l7.2-7.2" />
  </svg>
);
export const Mic = ({ className, style }: P) => (
  <svg {...base(className)} style={style}>
    <rect x="9" y="2.5" width="6" height="11" rx="3" />
    <path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21" />
  </svg>
);
export const Send = ({ className, style }: P) => (
  <svg {...base(className)} style={style}>
    <path d="M12 19.5V5M5.5 11.5L12 5l6.5 6.5" />
  </svg>
);
export const Copy = ({ className, style }: P) => (
  <svg {...base(className)} style={style}>
    <rect x="9" y="9" width="11" height="11" rx="2.5" />
    <path d="M5.5 15H5a1.5 1.5 0 01-1.5-1.5V5A1.5 1.5 0 015 3.5h8.5A1.5 1.5 0 0115 5v.5" />
  </svg>
);
export const Refresh = ({ className, style }: P) => (
  <svg {...base(className)} style={style}>
    <path d="M20 12a8 8 0 11-2.6-5.9M20 4v4.5h-4.5" />
  </svg>
);
export const Sun = ({ className, style }: P) => (
  <svg {...base(className)} style={style}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4" />
  </svg>
);
export const Moon = ({ className, style }: P) => (
  <svg {...base(className)} style={style}>
    <path d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z" />
  </svg>
);
export const Globe = ({ className, style }: P) => (
  <svg {...base(className)} style={style}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.2 2.4 3.3 5.4 3.3 8.5S14.2 18.1 12 20.5c-2.2-2.4-3.3-5.4-3.3-8.5S9.8 5.9 12 3.5z" />
  </svg>
);
export const Menu = ({ className, style }: P) => (
  <svg {...base(className)} style={style}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);
export const Close = ({ className, style }: P) => (
  <svg {...base(className)} style={style}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const Check = ({ className, style }: P) => (
  <svg {...base(className)} style={style}>
    <path d="M4.5 12.5l5 5 10-11" />
  </svg>
);
export const Arrow = ({ className, style }: P) => (
  <svg {...base(className)} style={style}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
export const Image = ({ className, style }: P) => (
  <svg {...base(className)} style={style}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="M4 17l4.5-4.5 3.5 3.5 3-3L20 17" />
  </svg>
);
export const Chevron = ({ className, style }: P) => (
  <svg {...base(className)} style={style}>
    <path d="M6 9.5l6 6 6-6" />
  </svg>
);
export const Team = ({ className, style }: P) => (
  <svg {...base(className)} style={style}>
    <circle cx="9" cy="8" r="3.4" />
    <path d="M3 20c0-3.3 2.7-5.4 6-5.4s6 2.1 6 5.4" />
    <path d="M16.5 6.2a3.4 3.4 0 010 6.6M17.5 14.9c2.2.6 3.5 2.3 3.5 4.6" />
  </svg>
);
export const Shield = ({ className, style }: P) => (
  <svg {...base(className)} style={style}>
    <path d="M12 3l7.5 3v5.5c0 4.5-3.1 8.2-7.5 9.5-4.4-1.3-7.5-5-7.5-9.5V6L12 3z" />
  </svg>
);

export const Pencil = ({ className, style }: P) => (
  <svg {...base(className)} style={style}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" />
  </svg>
);
export const Trash = ({ className, style }: P) => (
  <svg {...base(className)} style={style}>
    <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
  </svg>
);

export const Altavoz = ({ className, style }: P) => (
  <svg {...base(className)} style={style}>
    <path d="M11 5 6 9H3v6h3l5 4V5z" />
    <path d="M15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13" />
  </svg>
);
export const Stop = ({ className, style }: P) => (
  <svg {...base(className)} style={style}>
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);
