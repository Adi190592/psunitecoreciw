import { BAND_TONE, type CompanyScore, type ScoreBand } from '../lib/scoring'

const RING_COLOR: Record<ScoreBand, string> = {
  Excellent: '#059669',
  Good: '#0284c7',
  Fair: '#d97706',
  Poor: '#e11d48',
}

export function ScoreRing({ score, band, size = 64 }: { score: number; band: ScoreBand; size?: number }) {
  const stroke = size * 0.11
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={RING_COLOR[band]}
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        fontSize={size * 0.3}
        fontWeight={700}
        fill="#0f172a"
      >
        {score}
      </text>
    </svg>
  )
}

export function ScoreBadge({ score, band }: { score: number; band: ScoreBand }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold ${BAND_TONE[band]}`}
    >
      {score} · {band}
    </span>
  )
}

export function FactorList({ score }: { score: CompanyScore }) {
  return (
    <ul className="grid gap-1.5 sm:grid-cols-2">
      {score.factors.map((fac) => (
        <li
          key={fac.label}
          className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-1.5 text-sm"
        >
          <span
            className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
              fac.got ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'
            }`}
          >
            {fac.got ? '✓' : '–'}
          </span>
          <span className={fac.got ? 'text-slate-700' : 'text-slate-400'}>{fac.label}</span>
          {fac.detail && <span className="ml-auto text-xs text-slate-400">{fac.detail}</span>}
          <span className="ml-1 text-xs font-semibold text-slate-400">
            {fac.points}/{fac.max}
          </span>
        </li>
      ))}
    </ul>
  )
}
