import { useMemo } from 'react'
import type { Deal, DealStage, TeamMember } from '../lib/types'
import { addDays, daysBetween, formatCurrency, formatDate, todayISO } from '../lib/format'
import { Avatar } from './ui'

const STAGE_COLOR: Record<DealStage, string> = {
  Prospecting: '#94a3b8',
  Qualification: '#38bdf8',
  Demo: '#818cf8',
  Proposal: '#a78bfa',
  Negotiation: '#fbbf24',
  Won: '#34d399',
  Lost: '#f87171',
}

export interface GanttGroup {
  label?: string
  deals: Deal[]
}

interface MonthTick {
  label: string
  x: number
  width: number
  major: boolean
}

const LABEL_W = 264

export function Gantt({
  groups,
  team,
  onSelect,
}: {
  groups: GanttGroup[]
  team: TeamMember[]
  onSelect: (id: string) => void
}) {
  const member = (id?: string) => team.find((m) => m.id === id)
  const allDeals = useMemo(() => groups.flatMap((g) => g.deals), [groups])

  const model = useMemo(() => {
    if (allDeals.length === 0) return null
    let min = allDeals[0].startDate
    let max = allDeals[0].closeDate
    for (const d of allDeals) {
      if (d.startDate < min) min = d.startDate
      if (d.closeDate > max) max = d.closeDate
    }
    const today = todayISO()
    if (today < min) min = today
    if (today > max) max = today

    const start = new Date(min)
    start.setDate(1)
    const end = new Date(max)
    end.setMonth(end.getMonth() + 1, 0)

    const rangeStart = start.toISOString().slice(0, 10)
    const rangeEnd = end.toISOString().slice(0, 10)
    const totalDays = Math.max(1, daysBetween(rangeStart, rangeEnd) + 1)
    const pxPerDay = Math.max(3.5, Math.min(14, 1000 / totalDays))
    const width = totalDays * pxPerDay

    const months: MonthTick[] = []
    const cur = new Date(start)
    while (cur <= end) {
      const monthStart = cur.toISOString().slice(0, 10)
      const next = new Date(cur)
      next.setMonth(next.getMonth() + 1)
      const daysInMonth = daysBetween(monthStart, next.toISOString().slice(0, 10))
      months.push({
        label: cur.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        x: daysBetween(rangeStart, monthStart) * pxPerDay,
        width: daysInMonth * pxPerDay,
        major: cur.getMonth() % 3 === 0,
      })
      cur.setMonth(cur.getMonth() + 1)
    }

    const todayX = daysBetween(rangeStart, today) * pxPerDay
    return { rangeStart, pxPerDay, width, months, todayX }
  }, [allDeals])

  if (!model) {
    return (
      <div className="flex h-48 items-center justify-center text-slate-400">
        No deals match — register one or clear the filters to see the timeline.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto scroll-slim">
      <div style={{ width: LABEL_W + model.width }}>
        {/* Header */}
        <div className="sticky top-0 z-10 flex border-b border-slate-200 bg-white">
          <div
            className="shrink-0 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500"
            style={{ width: LABEL_W }}
          >
            Deal · owners
          </div>
          <div className="relative" style={{ width: model.width, height: 34 }}>
            {model.months.map((m, i) => (
              <div
                key={i}
                className={`absolute top-0 h-full border-l px-2 text-xs font-medium ${
                  m.major ? 'border-slate-200 text-slate-500' : 'border-slate-100 text-slate-400'
                }`}
                style={{ left: m.x, width: m.width }}
              >
                {m.label}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="relative">
          {model.todayX >= 0 && model.todayX <= model.width && (
            <div
              className="pointer-events-none absolute z-20 border-l-2 border-dashed border-rose-400"
              style={{ left: LABEL_W + model.todayX, top: 0, bottom: 0 }}
            >
              <span className="absolute left-1 top-0 text-[10px] font-bold text-rose-500">today</span>
            </div>
          )}

          {groups.map((group, gi) => (
            <div key={group.label ?? gi}>
              {group.label && (
                <div
                  className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"
                  style={{ width: LABEL_W + model.width }}
                >
                  {group.label}
                  <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-500">
                    {group.deals.length}
                  </span>
                </div>
              )}
              {group.deals.map((d) => {
                const offset = daysBetween(model.rangeStart, d.startDate) * model.pxPerDay
                const span = Math.max(
                  model.pxPerDay * 3,
                  (daysBetween(d.startDate, d.closeDate) + 1) * model.pxPerDay,
                )
                const color = STAGE_COLOR[d.stage]
                const isr = member(d.isrId)
                const sales = member(d.salesId)
                return (
                  <div key={d.id} className="flex items-stretch border-b border-slate-100 last:border-0">
                    <button
                      onClick={() => onSelect(d.id)}
                      className="shrink-0 px-4 py-2 text-left hover:bg-slate-50"
                      style={{ width: LABEL_W }}
                    >
                      <div className="truncate text-sm font-semibold text-slate-800">{d.title}</div>
                      <div className="mt-0.5 flex items-center gap-1">
                        {isr && <Avatar name={isr.name} size={18} />}
                        {sales && <Avatar name={sales.name} size={18} />}
                        <span className="ml-1 truncate text-[11px] text-slate-400">
                          {isr?.name?.split(' ')[0] ?? '—'} · {sales?.name?.split(' ')[0] ?? '—'}
                        </span>
                      </div>
                    </button>
                    <div className="relative flex-1 py-2" style={{ width: model.width }}>
                      <button
                        onClick={() => onSelect(d.id)}
                        className="group absolute top-1/2 flex h-6 -translate-y-1/2 items-center gap-1.5 rounded-full px-2 text-[11px] font-semibold text-white shadow-sm transition-transform hover:scale-y-110"
                        style={{ left: offset, width: span, background: color }}
                        title={`${d.title}\n${d.stage} · ${formatCurrency(d.value)} · ${d.probability}%\n${formatDate(d.startDate)} → ${formatDate(d.closeDate)}`}
                      >
                        <span className="truncate">{formatCurrency(d.value)}</span>
                        {span > 90 && (
                          <span className="shrink-0 rounded-full bg-white/25 px-1.5">{d.probability}%</span>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function StageLegend() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {(Object.keys(STAGE_COLOR) as DealStage[]).map((s) => (
        <span key={s} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: STAGE_COLOR[s] }} />
          {s}
        </span>
      ))}
    </div>
  )
}

export { STAGE_COLOR }
export const defaultDealDates = () => ({
  startDate: todayISO(),
  closeDate: addDays(todayISO(), 45),
})
