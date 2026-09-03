import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>
const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export const IconBolt = (p: P) => (
  <svg {...base} {...p}>
    <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />
  </svg>
)
export const IconUsers = (p: P) => (
  <svg {...base} {...p}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)
export const IconChart = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3 3v18h18" />
    <rect x="7" y="10" width="3" height="7" rx="1" />
    <rect x="13" y="6" width="3" height="11" rx="1" />
  </svg>
)
export const IconTarget = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.5" />
  </svg>
)
export const IconStar = (p: P & { filled?: boolean }) => (
  <svg {...base} fill={p.filled ? 'currentColor' : 'none'} {...p}>
    <path d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.4l1.1-6.5L2.6 9.3l6.5-.9L12 2.5Z" />
  </svg>
)
export const IconPlus = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)
export const IconTrash = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  </svg>
)
export const IconDownload = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 21h16" />
  </svg>
)
export const IconUpload = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 21V9m0 0 4 4m-4-4-4 4M4 3h16" />
  </svg>
)
export const IconWand = (p: P) => (
  <svg {...base} {...p}>
    <path d="M15 4V2m0 20v-2M9 9l-5 5m0-5 5 5m11-6 2-2M4 4l2 2m10-2-9 9a2 2 0 0 0 0 3l1 1a2 2 0 0 0 3 0l9-9a2 2 0 0 0 0-3l-1-1a2 2 0 0 0-3 0Z" />
  </svg>
)
export const IconSearch = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
)
export const IconX = (p: P) => (
  <svg {...base} {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)
export const IconBuilding = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3 21h18M5 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M15 21V9h3a1 1 0 0 1 1 1v11" />
    <path d="M8 8h1M8 12h1M11 8h1M11 12h1" />
  </svg>
)
export const IconGauge = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
    <path d="m13.4 12.6 3.6-3.6" />
    <path d="M4 18a9 9 0 1 1 16 0" />
  </svg>
)
export const IconClock = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
)
export const IconLink = (p: P) => (
  <svg {...base} {...p}>
    <path d="M9 15l6-6M10 6l1-1a4 4 0 0 1 6 6l-1 1M14 18l-1 1a4 4 0 0 1-6-6l1-1" />
  </svg>
)
