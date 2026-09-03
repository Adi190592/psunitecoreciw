import { useMemo } from 'react'
import { useStore } from '../lib/store'
import { buildRelations } from '../lib/relations'
import { Card } from '../components/ui'
import { ScoreBadge } from '../components/Score'
import { IconGauge } from '../components/icons'
import { formatCurrency } from '../lib/format'
import type { ScoreBand } from '../lib/scoring'

const BAND_BAR: Record<ScoreBand, string> = {
  Excellent: 'bg-emerald-500',
  Good: 'bg-sky-500',
  Fair: 'bg-amber-500',
  Poor: 'bg-rose-500',
}
const BANDS: ScoreBand[] = ['Excellent', 'Good', 'Fair', 'Poor']

export default function Scoring() {
  const { data } = useStore()
  const { scored } = useMemo(() => buildRelations(data), [data])

  const stats = useMemo(() => {
    const total = scored.length || 1
    const avg = Math.round(scored.reduce((s, x) => s + x.score.score, 0) / total)
    const dist: Record<ScoreBand, number> = { Excellent: 0, Good: 0, Fair: 0, Poor: 0 }
    for (const s of scored) dist[s.score.band]++
    const pipeline = scored.reduce((s, x) => s + x.score.metrics.openValue, 0)

    // Portfolio factor coverage (% of companies passing each factor)
    const factorLabels = scored[0]?.score.factors.map((f) => f.label) ?? []
    const coverage = factorLabels.map((label) => {
      const got = scored.filter((s) => s.score.factors.find((f) => f.label === label)?.got).length
      return { label, pct: Math.round((got / total) * 100) }
    })

    const top = [...scored].sort((a, b) => b.score.score - a.score.score).slice(0, 6)
    const attention = [...scored]
      .filter((s) => s.score.metrics.contacts > 0)
      .sort((a, b) => a.score.score - b.score.score)
      .slice(0, 6)

    return { avg, dist, pipeline, coverage, top, attention, total: scored.length }
  }, [scored])

  return (
    <div>
      <header className="mb-5">
        <h1 className="flex items-center gap-2 text-3xl font-bold text-slate-900">
          <IconGauge width={26} height={26} className="text-slate-700" /> Scoring
        </h1>
        <p className="mt-1 text-slate-500">
          Comprehensive account scoring across the portfolio — data quality plus pipeline
          engagement, so you know where to focus outreach.
        </p>
      </header>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Average score" value={`${stats.avg}`} sub="out of 100" />
        <Tile label="Excellent + Good" value={`${stats.dist.Excellent + stats.dist.Good}`} sub={`of ${stats.total} companies`} accent="emerald" />
        <Tile label="Needs work (Fair + Poor)" value={`${stats.dist.Fair + stats.dist.Poor}`} accent="amber" />
        <Tile label="Open pipeline" value={formatCurrency(stats.pipeline)} />
      </div>

      <Card className="mb-4 p-5">
        <h2 className="mb-3 font-bold text-slate-800">Quality distribution</h2>
        <div className="flex h-4 w-full overflow-hidden rounded-full bg-slate-100">
          {BANDS.map((b) =>
            stats.dist[b] > 0 ? (
              <div
                key={b}
                className={BAND_BAR[b]}
                style={{ width: `${(stats.dist[b] / stats.total) * 100}%` }}
                title={`${b}: ${stats.dist[b]}`}
              />
            ) : null,
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-4">
          {BANDS.map((b) => (
            <span key={b} className="inline-flex items-center gap-2 text-sm">
              <span className={`h-3 w-3 rounded-full ${BAND_BAR[b]}`} />
              <span className="font-semibold text-slate-700">{b}</span>
              <span className="text-slate-400">{stats.dist[b]}</span>
            </span>
          ))}
        </div>
      </Card>

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <RankCard title="Top accounts" subtitle="Highest quality + engagement" rows={stats.top} />
        <RankCard title="Needs attention" subtitle="Lowest score among accounts with contacts" rows={stats.attention} />
      </div>

      <Card className="p-5">
        <h2 className="mb-1 font-bold text-slate-800">Portfolio data-quality coverage</h2>
        <p className="mb-4 text-sm text-slate-500">
          Share of companies satisfying each scoring factor — the low bars are your dataset gaps.
        </p>
        <div className="space-y-2.5">
          {stats.coverage.map((c) => (
            <div key={c.label} className="flex items-center gap-3">
              <span className="w-44 shrink-0 text-sm text-slate-600">{c.label}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${c.pct >= 60 ? 'bg-emerald-500' : c.pct >= 30 ? 'bg-amber-500' : 'bg-rose-500'}`}
                  style={{ width: `${c.pct}%` }}
                />
              </div>
              <span className="w-10 text-right text-sm font-semibold text-slate-500">{c.pct}%</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function Tile({
  label,
  value,
  sub,
  accent = 'slate',
}: {
  label: string
  value: string
  sub?: string
  accent?: 'slate' | 'emerald' | 'amber'
}) {
  const color = accent === 'emerald' ? 'text-emerald-600' : accent === 'amber' ? 'text-amber-600' : 'text-slate-900'
  return (
    <Card className="px-4 py-3">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs font-medium text-slate-500">{label}</div>
      {sub && <div className="text-[11px] text-slate-400">{sub}</div>}
    </Card>
  )
}

function RankCard({
  title,
  subtitle,
  rows,
}: {
  title: string
  subtitle: string
  rows: ReturnType<typeof buildRelations>['scored']
}) {
  return (
    <Card className="p-5">
      <h2 className="font-bold text-slate-800">{title}</h2>
      <p className="mb-3 text-xs text-slate-400">{subtitle}</p>
      <ul className="space-y-2">
        {rows.map((s) => (
          <li key={s.company.id} className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-slate-800">{s.company.name}</div>
              <div className="text-xs text-slate-400">
                {s.score.metrics.contacts} contacts · {s.score.metrics.openDeals} deals
              </div>
            </div>
            <ScoreBadge score={s.score.score} band={s.score.band} />
          </li>
        ))}
        {rows.length === 0 && <li className="text-sm text-slate-400">No data.</li>}
      </ul>
    </Card>
  )
}
