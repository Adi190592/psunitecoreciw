import { useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import { Button, Card, Field, inputCls, Modal } from '../components/ui'
import { IconChart, IconPlus, IconSearch, IconTrash } from '../components/icons'
import { DEAL_STAGES, type Deal, type DealStage } from '../lib/types'
import { formatCurrency } from '../lib/format'
import { defaultDealDates, Gantt, StageLegend, type GanttGroup } from '../components/Gantt'

type GroupBy = 'stage' | 'isr' | 'sales' | 'none'

export default function Deals() {
  const { data, addDeal, updateDeal, removeDeal } = useStore()
  const [editing, setEditing] = useState<Deal | 'new' | null>(null)
  const [query, setQuery] = useState('')
  const [stageFilter, setStageFilter] = useState('all')
  const [isrFilter, setIsrFilter] = useState('all')
  const [groupBy, setGroupBy] = useState<GroupBy>('stage')

  const isrMembers = data.team.filter((m) => m.role === 'ISR')
  const salesMembers = data.team.filter((m) => m.role === 'Sales')
  const nameOf = (id?: string) => data.team.find((m) => m.id === id)?.name ?? 'Unassigned'

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return data.deals.filter((d) => {
      if (stageFilter !== 'all' && d.stage !== stageFilter) return false
      if (isrFilter !== 'all' && d.isrId !== isrFilter) return false
      if (!q) return true
      return [d.title, d.company].some((v) => v.toLowerCase().includes(q))
    })
  }, [data.deals, query, stageFilter, isrFilter])

  const groups: GanttGroup[] = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => a.startDate.localeCompare(b.startDate))
    if (groupBy === 'none') return [{ deals: sorted }]
    const map = new Map<string, Deal[]>()
    const keyOf = (d: Deal) =>
      groupBy === 'stage' ? d.stage : groupBy === 'isr' ? nameOf(d.isrId) : nameOf(d.salesId)
    for (const d of sorted) {
      const k = keyOf(d)
      const arr = map.get(k) ?? []
      arr.push(d)
      map.set(k, arr)
    }
    let entries = [...map.entries()]
    if (groupBy === 'stage') {
      entries = entries.sort(
        (a, b) => DEAL_STAGES.indexOf(a[0] as DealStage) - DEAL_STAGES.indexOf(b[0] as DealStage),
      )
    } else {
      entries = entries.sort((a, b) => a[0].localeCompare(b[0]))
    }
    return entries.map(([label, deals]) => ({ label, deals }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, groupBy, data.team])

  const stats = useMemo(() => {
    const open = data.deals.filter((d) => d.stage !== 'Won' && d.stage !== 'Lost')
    return {
      openValue: open.reduce((s, d) => s + d.value, 0),
      weighted: open.reduce((s, d) => s + (d.value * d.probability) / 100, 0),
      won: data.deals.filter((d) => d.stage === 'Won').reduce((s, d) => s + d.value, 0),
      openCount: open.length,
    }
  }, [data.deals])

  return (
    <div>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-slate-900">
            <IconChart width={26} height={26} className="text-slate-700" /> Deals — Gantt
          </h1>
          <p className="mt-1 text-slate-500">
            Every deal mapped on a timeline from first touch to expected close, grouped and colored
            by stage, each with an ISR and a Sales owner.
          </p>
        </div>
        <Button onClick={() => setEditing('new')}>
          <IconPlus width={16} height={16} /> Register deal
        </Button>
      </header>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Open pipeline" value={formatCurrency(stats.openValue)} />
        <Stat label="Weighted pipeline" sub="probability-adjusted" value={formatCurrency(stats.weighted)} />
        <Stat label="Won" value={formatCurrency(stats.won)} accent="green" />
        <Stat label="Open deals" value={String(stats.openCount)} />
      </div>

      <Card className="mb-4 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <IconSearch width={16} height={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search deals…" className={`${inputCls} pl-9`} />
          </div>
          <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} className={`${inputCls} w-auto`}>
            <option value="all">All stages</option>
            {DEAL_STAGES.map((s) => (<option key={s}>{s}</option>))}
          </select>
          <select value={isrFilter} onChange={(e) => setIsrFilter(e.target.value)} className={`${inputCls} w-auto`}>
            <option value="all">All ISR owners</option>
            {isrMembers.map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
          </select>
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-0.5">
            {(['stage', 'isr', 'sales', 'none'] as GroupBy[]).map((g) => (
              <button
                key={g}
                onClick={() => setGroupBy(g)}
                className={`rounded-md px-2.5 py-1.5 text-xs font-semibold ${
                  groupBy === g ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {g === 'none' ? 'Flat' : g === 'isr' ? 'By ISR' : g === 'sales' ? 'By Sales' : 'By stage'}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold text-slate-800">Timeline · {filtered.length} deals</h2>
          <StageLegend />
        </div>
        <Gantt
          groups={groups}
          team={data.team}
          onSelect={(id) => {
            const d = data.deals.find((x) => x.id === id)
            if (d) setEditing(d)
          }}
        />
      </Card>

      {editing && (
        <DealModal
          deal={editing === 'new' ? null : editing}
          isrMembers={isrMembers}
          salesMembers={salesMembers}
          onClose={() => setEditing(null)}
          onSave={(payload) => {
            if (editing === 'new') addDeal(payload)
            else updateDeal(editing.id, payload)
            setEditing(null)
          }}
          onDelete={
            editing === 'new'
              ? undefined
              : () => {
                  removeDeal(editing.id)
                  setEditing(null)
                }
          }
        />
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  sub,
  accent = 'slate',
}: {
  label: string
  value: string
  sub?: string
  accent?: 'slate' | 'green'
}) {
  return (
    <Card className="px-4 py-3">
      <div className={`text-2xl font-bold ${accent === 'green' ? 'text-emerald-600' : 'text-slate-900'}`}>{value}</div>
      <div className="text-xs font-medium text-slate-500">{label}</div>
      {sub && <div className="text-[11px] text-slate-400">{sub}</div>}
    </Card>
  )
}

type DealPayload = Omit<Deal, 'id' | 'createdAt' | 'companyId'>

function DealModal({
  deal,
  isrMembers,
  salesMembers,
  onClose,
  onSave,
  onDelete,
}: {
  deal: Deal | null
  isrMembers: { id: string; name: string }[]
  salesMembers: { id: string; name: string }[]
  onClose: () => void
  onSave: (d: DealPayload) => void
  onDelete?: () => void
}) {
  const defaults = defaultDealDates()
  const [f, setF] = useState<DealPayload>(
    deal
      ? { ...deal }
      : {
          title: '',
          company: '',
          value: 100000,
          stage: 'Prospecting',
          probability: 20,
          startDate: defaults.startDate,
          closeDate: defaults.closeDate,
        },
  )
  const set = <K extends keyof DealPayload>(k: K, v: DealPayload[K]) => setF((p) => ({ ...p, [k]: v }))
  const invalid = !f.title || !f.company || f.closeDate < f.startDate

  return (
    <Modal title={deal ? 'Edit deal' : 'Register deal'} onClose={onClose} wide>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Field label="Deal name">
            <input className={inputCls} value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. KEC — Email security rollout" />
          </Field>
        </div>
        <Field label="Company">
          <input className={inputCls} value={f.company} onChange={(e) => set('company', e.target.value)} />
        </Field>
        <Field label="Deal value (₹)">
          <input type="number" className={inputCls} value={f.value} onChange={(e) => set('value', Number(e.target.value))} />
        </Field>
        <Field label="Stage">
          <select className={inputCls} value={f.stage} onChange={(e) => set('stage', e.target.value as DealStage)}>
            {DEAL_STAGES.map((s) => (<option key={s}>{s}</option>))}
          </select>
        </Field>
        <Field label={`Probability — ${f.probability}%`}>
          <input type="range" min={0} max={100} step={5} value={f.probability} onChange={(e) => set('probability', Number(e.target.value))} className="mt-2 w-full accent-slate-700" />
        </Field>
        <Field label="ISR owner">
          <select className={inputCls} value={f.isrId ?? ''} onChange={(e) => set('isrId', e.target.value || undefined)}>
            <option value="">Unassigned</option>
            {isrMembers.map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
          </select>
        </Field>
        <Field label="Sales owner">
          <select className={inputCls} value={f.salesId ?? ''} onChange={(e) => set('salesId', e.target.value || undefined)}>
            <option value="">Unassigned</option>
            {salesMembers.map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
          </select>
        </Field>
        <Field label="Start date">
          <input type="date" className={inputCls} value={f.startDate} onChange={(e) => set('startDate', e.target.value)} />
        </Field>
        <Field label="Expected close" hint={f.closeDate < f.startDate ? 'Close must be after start' : undefined}>
          <input type="date" className={inputCls} value={f.closeDate} onChange={(e) => set('closeDate', e.target.value)} />
        </Field>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div>
          {onDelete && (
            <Button variant="danger" onClick={onDelete}>
              <IconTrash width={16} height={16} /> Delete
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={invalid} onClick={() => onSave(f)}>{deal ? 'Save changes' : 'Register deal'}</Button>
        </div>
      </div>
    </Modal>
  )
}
