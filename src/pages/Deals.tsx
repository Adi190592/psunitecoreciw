import { useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import { Button, Card, Field, inputCls, Modal } from '../components/ui'
import { IconChart, IconPlus, IconTrash } from '../components/icons'
import { DEAL_STAGES, type Deal, type DealStage } from '../lib/types'
import { formatCurrency } from '../lib/format'
import { defaultDealDates, Gantt, StageLegend } from '../components/Gantt'

export default function Deals() {
  const { data, addDeal, updateDeal, removeDeal } = useStore()
  const [editing, setEditing] = useState<Deal | 'new' | null>(null)

  const isrMembers = data.team.filter((m) => m.role === 'ISR')
  const salesMembers = data.team.filter((m) => m.role === 'Sales')

  const stats = useMemo(() => {
    const open = data.deals.filter((d) => d.stage !== 'Won' && d.stage !== 'Lost')
    const openValue = open.reduce((s, d) => s + d.value, 0)
    const weighted = open.reduce((s, d) => s + (d.value * d.probability) / 100, 0)
    const won = data.deals.filter((d) => d.stage === 'Won').reduce((s, d) => s + d.value, 0)
    return { openValue, weighted, won, openCount: open.length }
  }, [data.deals])

  return (
    <div>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-slate-900">
            <IconChart width={26} height={26} className="text-slate-700" /> Deals
          </h1>
          <p className="mt-1 text-slate-500">
            Every deal mapped on a timeline — track it from first touch to close, with an ISR and a
            Sales owner on each.
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

      <Card className="p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold text-slate-800">Timeline</h2>
          <StageLegend />
        </div>
        <Gantt
          deals={data.deals}
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
      <div className={`text-2xl font-bold ${accent === 'green' ? 'text-emerald-600' : 'text-slate-900'}`}>
        {value}
      </div>
      <div className="text-xs font-medium text-slate-500">{label}</div>
      {sub && <div className="text-[11px] text-slate-400">{sub}</div>}
    </Card>
  )
}

type DealPayload = Omit<Deal, 'id' | 'createdAt'>

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
  const set = <K extends keyof DealPayload>(k: K, v: DealPayload[K]) =>
    setF((p) => ({ ...p, [k]: v }))

  const invalid = !f.title || !f.company || f.closeDate < f.startDate

  return (
    <Modal title={deal ? 'Edit deal' : 'Register deal'} onClose={onClose} wide>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Field label="Deal name">
            <input
              className={inputCls}
              value={f.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. KEC — Email security rollout"
            />
          </Field>
        </div>
        <Field label="Company">
          <input className={inputCls} value={f.company} onChange={(e) => set('company', e.target.value)} />
        </Field>
        <Field label="Deal value (₹)">
          <input
            type="number"
            className={inputCls}
            value={f.value}
            onChange={(e) => set('value', Number(e.target.value))}
          />
        </Field>
        <Field label="Stage">
          <select
            className={inputCls}
            value={f.stage}
            onChange={(e) => set('stage', e.target.value as DealStage)}
          >
            {DEAL_STAGES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label={`Probability — ${f.probability}%`}>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={f.probability}
            onChange={(e) => set('probability', Number(e.target.value))}
            className="mt-2 w-full accent-slate-700"
          />
        </Field>
        <Field label="ISR owner">
          <select
            className={inputCls}
            value={f.isrId ?? ''}
            onChange={(e) => set('isrId', e.target.value || undefined)}
          >
            <option value="">Unassigned</option>
            {isrMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Sales owner">
          <select
            className={inputCls}
            value={f.salesId ?? ''}
            onChange={(e) => set('salesId', e.target.value || undefined)}
          >
            <option value="">Unassigned</option>
            {salesMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Start date">
          <input
            type="date"
            className={inputCls}
            value={f.startDate}
            onChange={(e) => set('startDate', e.target.value)}
          />
        </Field>
        <Field label="Expected close" hint={f.closeDate < f.startDate ? 'Close must be after start' : undefined}>
          <input
            type="date"
            className={inputCls}
            value={f.closeDate}
            onChange={(e) => set('closeDate', e.target.value)}
          />
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
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={invalid} onClick={() => onSave(f)}>
            {deal ? 'Save changes' : 'Register deal'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
