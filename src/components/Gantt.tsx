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

interface MonthTick {
  label: string
  x: number
  width: number
}

export function Gantt({
  deals,
  team,
  onSelect,
}: {
  deals: Deal[]
  team: TeamMember[]
  onSelect: (id: string) => void
}) {
  const member = (id?: string) => team.find((m) => m.id === id)

  const model = useMemo(() => {
    if (deals.length === 0) return null
    // Overall range, padded to whole months.
    let min = deals[0].startDate
    let max = deals[0].closeDate
    for (const d of deals) {
      if (d.startDate < min) min = d.startDate
      if (d.closeDate > max) max = d.closeDate
    }
    const today = todayISO()
    if (today < min) min = today
    if (today > max) max = today

    const start = new Date(min)
    start.setDate(1)
    const end = new Date(max)
    end.setMonth(end.getMonth() + 1, 0) // last day of max's month

    const rangeStart = start.toISOString().slice(0, 10)
    const rangeEnd = end.toISOString().slice(0, 10)
    const totalDays = Math.max(1, daysBetween(rangeStart, rangeEnd) + 1)
    const pxPerDay = Math.max(5, Math.min(16, 1100 / totalDays))
    const width = totalDays * pxPerDay

    // Month ticks
    const months: MonthTick[] = []
    const cur = new Date(start)
    while (cur <= end) {
      const monthStart = cur.toISOString().slice(0, 10)
      const nextMonth = new Date(cur)
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      const daysInMonth = daysBetween(monthStart, nextMonth.toISOString().slice(0, 10))
      months.push({
        label: cur.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        x: daysBetween(rangeStart, monthStart) * pxPerDay,
        width: daysInMonth * pxPerDay,
      })
      cur.setMonth(cur.getMonth() + 1)
    }

    const todayX = daysBetween(rangeStart, today) * pxPerDay

    return { rangeStart, totalDays, pxPerDay, width, months, todayX }
  }, [deals])

  if (!model) {
    return (
      <div className="flex h-48 items-center justify-center text-slate-400">
        No deals yet — register one to see it on the timeline.
      </div>
    )
  }

  const LABEL_W = 260

  return (
    <div className="overflow-x-auto scroll-slim">
      <div style={{ width: LABEL_W + model.width }}>
        {/* Header */}
        <div className="flex border-b border-slate-200">
          <div
            className="shrink-0 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500"
            style={{ width: LABEL_W }}
          >
            Deal
          </div>
          <div className="relative" style={{ width: model.width, height: 32 }}>
            {model.months.map((m, i) => (
              <div
                key={i}
                className="absolute top-0 h-full border-l border-slate-100 px-2 text-xs font-medium text-slate-400"
                style={{ left: m.x, width: m.width }}
              >
                {m.label}
              </div>
            ))}
          </div>
        </div>

        {/* Rows */}
        <div className="relative">
          {/* Today marker spanning all rows */}
          {model.todayX >= 0 && model.todayX <= model.width && (
            <div
              className="pointer-events-none absolute z-10 border-l-2 border-dashed border-rose-400"
              style={{ left: LABEL_W + model.todayX, top: 0, bottom: 0 }}
            >
              <span className="absolute -top-0 left-1 text-[10px] font-bold text-rose-500">
                today
              </span>
            </div>
          )}

          {deals.map((d) => {
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
                {/* Label cell */}
                <button
                  onClick={() => onSelect(d.id)}
                  className="shrink-0 px-4 py-3 text-left hover:bg-slate-50"
                  style={{ width: LABEL_W }}
                >
                  <div className="truncate font-semibold text-slate-800">{d.title}</div>
                  <div className="truncate text-xs text-slate-500">{d.company}</div>
                  <div className="mt-1 flex items-center gap-1">
                    {isr && <Avatar name={isr.name} size={20} />}
                    {sales && <Avatar name={sales.name} size={20} />}
                    <span className="ml-1 text-xs text-slate-400">
                      {isr?.name?.split(' ')[0] ?? '—'} · {sales?.name?.split(' ')[0] ?? '—'}
                    </span>
                  </div>
                </button>
                {/* Timeline cell */}
                <div className="relative flex-1 py-3" style={{ width: model.width }}>
                  <button
                    onClick={() => onSelect(d.id)}
                    className="group absolute top-1/2 flex h-7 -translate-y-1/2 items-center gap-1.5 rounded-full px-2 text-xs font-semibold text-white shadow-sm transition-transform hover:scale-[1.01]"
                    style={{ left: offset, width: span, background: color }}
                    title={`${d.title}\n${formatDate(d.startDate)} → ${formatDate(d.closeDate)}\n${formatCurrency(d.value)} · ${d.probability}%`}
                  >
                    <span className="truncate">{formatCurrency(d.value)}</span>
                    <span className="shrink-0 rounded-full bg-white/25 px-1.5">{d.probability}%</span>
                  </button>
                </div>
              </div>
            )
          })}
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
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: STAGE_COLOR[s] }}
          />
          {s}
        </span>
      ))}
    </div>
  )
}

export { STAGE_COLOR }
// re-export a helper used by the deals form for default dates
export const defaultDealDates = () => ({
  startDate: todayISO(),
  closeDate: addDays(todayISO(), 45),
})
