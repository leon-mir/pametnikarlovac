// Linijske SVG ikone (bez vanjskih ovisnosti). Sve nasljeđuju currentColor.
import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;
const base = (size: number): P => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'aria-hidden': true,
  focusable: false,
});

export const Star = ({ filled = false, size = 20, ...p }: P & { filled?: boolean; size?: number }) => (
  <svg {...base(size)} fill={filled ? 'currentColor' : 'none'} strokeWidth={2} strokeLinejoin="round" {...p}>
    <path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-2.9-5.4 2.9 1.1-6L3.2 9.4l6.1-.8Z" />
  </svg>
);

export const Pin = ({ size = 20, ...p }: P & { size?: number }) => (
  <svg {...base(size)} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M12 21s-6.5-5.5-6.5-10A6.5 6.5 0 0 1 12 4.5 6.5 6.5 0 0 1 18.5 11c0 4.5-6.5 10-6.5 10Z" />
    <circle cx="12" cy="11" r="2.4" />
  </svg>
);

export const Search = ({ size = 22, ...p }: P & { size?: number }) => (
  <svg {...base(size)} strokeWidth={2} strokeLinecap="round" {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.8-3.8" />
  </svg>
);

export const Locate = ({ size = 20, ...p }: P & { size?: number }) => (
  <svg {...base(size)} strokeWidth={2} strokeLinecap="round" {...p}>
    <circle cx="12" cy="12" r="7" />
    <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
  </svg>
);

export const MapIcon = ({ size = 20, ...p }: P & { size?: number }) => (
  <svg {...base(size)} strokeWidth={2} strokeLinejoin="round" {...p}>
    <path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4Zm0 0v14m6-12v14" />
  </svg>
);

export const Back = ({ size = 20, ...p }: P & { size?: number }) => (
  <svg {...base(size)} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

export const Chevron = ({ size = 22, ...p }: P & { size?: number }) => (
  <svg {...base(size)} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);

export const Warn = ({ size = 20, ...p }: P & { size?: number }) => (
  <svg {...base(size)} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M10.3 4.2 2.9 17a2 2 0 0 0 1.7 3h14.8a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4" />
    <circle cx="12" cy="16.5" r=".5" fill="currentColor" />
  </svg>
);

export const Clock = ({ size = 18, ...p }: P & { size?: number }) => (
  <svg {...base(size)} strokeWidth={2} strokeLinecap="round" {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const Swap = ({ size = 20, ...p }: P & { size?: number }) => (
  <svg {...base(size)} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M7 4 3 8l4 4M3 8h13a5 5 0 0 1 0 10h-3" />
  </svg>
);

export const Close = ({ size = 22, ...p }: P & { size?: number }) => (
  <svg {...base(size)} strokeWidth={2.5} strokeLinecap="round" {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const Check = ({ size = 18, ...p }: P & { size?: number }) => (
  <svg {...base(size)} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="m4 12 5 5L20 7" />
  </svg>
);

export const Calendar = ({ size = 18, ...p }: P & { size?: number }) => (
  <svg {...base(size)} strokeWidth={2} strokeLinecap="round" {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
);

// Tab ikone
export const TabStation = ({ size = 26, ...p }: P & { size?: number }) => (
  <svg {...base(size)} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M12 21s-6.5-5.5-6.5-10A6.5 6.5 0 0 1 12 4.5 6.5 6.5 0 0 1 18.5 11c0 4.5-6.5 10-6.5 10Z" />
    <circle cx="12" cy="11" r="2.4" />
  </svg>
);

export const TabLines = ({ size = 26, ...p }: P & { size?: number }) => (
  <svg {...base(size)} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M5 17V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10" />
    <path d="M5 12h14" />
    <path d="M5 17h14v1.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 18.5Z" />
    <circle cx="8.2" cy="17.8" r=".4" fill="currentColor" />
    <circle cx="15.8" cy="17.8" r=".4" fill="currentColor" />
  </svg>
);

export const TabInfo = ({ size = 26, ...p }: P & { size?: number }) => (
  <svg {...base(size)} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5" />
    <circle cx="12" cy="8" r=".5" fill="currentColor" />
  </svg>
);

// Logo — tlocrt karlovačke Zvijezde (šesterokraka tvrđava)
export const StarLogo = ({ size = 34 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden focusable="false">
    <path
      d="M50 4 L61 31 L89 26 L72 50 L89 74 L61 69 L50 96 L39 69 L11 74 L28 50 L11 26 L39 31 Z"
      stroke="#D89F1F"
      strokeWidth={6}
      strokeLinejoin="round"
    />
    <circle cx="50" cy="50" r="7" fill="#D89F1F" />
  </svg>
);
