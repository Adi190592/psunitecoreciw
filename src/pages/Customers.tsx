import { useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import { Avatar, Badge, Button, Card, Field, inputCls, Modal } from '../components/ui'
import {
  IconDownload,
  IconPlus,
  IconSearch,
  IconStar,
  IconTrash,
  IconUsers,
} from '../components/icons'
import { CUSTOMER_STATUSES, type Customer, type CustomerStatus } from '../lib/types'
import { exportCustomersCsv } from '../lib/exporters'
import { formatDate } from '../lib/format'

const STATUS_TONE: Record<CustomerStatus, Parameters<typeof Badge>[0]['tone']> = {
  New: 'slate',
  Assigned: 'blue',
  Contacted: 'violet',
  Working: 'amber',
  Qualified: 'green',
  Disqualified: 'red',
}

export default function Customers() {
  const { data, addCustomer, updateCustomer, removeCustomer } = useStore()
  const [query, setQuery] = useState('')
  const [isrFilter, setIsrFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [focusOnly, setFocusOnly] = useState(false)
  const [adding, setAdding] = useState(false)

  const isrMembers = useMemo(() => data.team.filter((m) => m.role === 'ISR'), [data.team])
  const isrName = (id?: string) => data.team.find((m) => m.id === id)?.name

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return data.customers.filter((c) => {
      if (focusOnly && !c.focus) return false
      if (statusFilter !== 'all' && c.status !== statusFilter) return false
      if (isrFilter === 'unassigned' && c.assignedIsrId) return false
      if (isrFilter !== 'all' && isrFilter !== 'unassigned' && c.assignedIsrId !== isrFilter)
        return false
      if (!q) return true
      return [c.name, c.company, c.email, c.city, c.title]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q))
    })
  }, [data.customers, query, isrFilter, statusFilter, focusOnly])

  const assignedCount = data.customers.filter((c) => c.assignedIsrId).length

  return (
    <div>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-slate-900">
            <IconUsers width={26} height={26} className="text-slate-700" /> Customer Dataset
          </h1>
          <p className="mt-1 text-slate-500">
            The master outreach repository. Assign records to ISR team members to build their
            activity list.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportCustomersCsv(filtered, data.team)}>
            <IconDownload width={16} height={16} /> Export CSV
          </Button>
          <Button onClick={() => setAdding(true)}>
            <IconPlus width={16} height={16} /> New customer
          </Button>
        </div>
      </header>

      {/* Assignment summary */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total records" value={data.customers.length} />
        <Stat label="Assigned to ISR" value={assignedCount} />
        <Stat label="Unassigned" value={data.customers.length - assignedCount} accent="amber" />
        <Stat label="Focus accounts" value={data.customers.filter((c) => c.focus).length} accent="indigo" />
      </div>

      {/* Filters */}
      <Card className="mb-4 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <IconSearch
              width={16}
              height={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, company, email, city…"
              className={`${inputCls} pl-9`}
            />
          </div>
          <select
            value={isrFilter}
            onChange={(e) => setIsrFilter(e.target.value)}
            className={`${inputCls} w-auto`}
          >
            <option value="all">All ISR owners</option>
            <option value="unassigned">Unassigned</option>
            {isrMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`${inputCls} w-auto`}
          >
            <option value="all">All statuses</option>
            {CUSTOMER_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <button
            onClick={() => setFocusOnly((v) => !v)}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${
              focusOnly
                ? 'border-amber-300 bg-amber-50 text-amber-700'
                : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <IconStar width={16} height={16} filled={focusOnly} /> Focus only
          </button>
          <span className="ml-auto text-sm text-slate-400">{filtered.length} shown</span>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto scroll-slim">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="w-8 px-4 py-3"></th>
                <th className="px-2 py-3">Customer</th>
                <th className="px-2 py-3">Contact</th>
                <th className="px-2 py-3">City</th>
                <th className="px-2 py-3">Status</th>
                <th className="px-2 py-3">Assigned ISR</th>
                <th className="px-2 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => updateCustomer(c.id, { focus: !c.focus })}
                      className={c.focus ? 'text-amber-400' : 'text-slate-300 hover:text-slate-400'}
                      title={c.focus ? 'Focus account' : 'Mark as focus'}
                    >
                      <IconStar width={18} height={18} filled={c.focus} />
                    </button>
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={c.name} />
                      <div>
                        <div className="font-semibold text-slate-800">{c.name || '—'}</div>
                        <div className="text-xs text-slate-500">
                          {[c.title, c.company].filter(Boolean).join(' · ') || '—'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <div className="text-slate-700">{c.email || '—'}</div>
                    <div className="text-xs text-slate-400">{c.phone || ''}</div>
                  </td>
                  <td className="px-2 py-3 text-slate-600">{c.city || '—'}</td>
                  <td className="px-2 py-3">
                    <select
                      value={c.status}
                      onChange={(e) =>
                        updateCustomer(c.id, { status: e.target.value as CustomerStatus })
                      }
                      className="rounded-md border border-transparent bg-transparent py-1 text-xs font-semibold hover:border-slate-200"
                    >
                      {CUSTOMER_STATUSES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    <div className="mt-0.5">
                      <Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge>
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <select
                      value={c.assignedIsrId ?? ''}
                      onChange={(e) =>
                        updateCustomer(c.id, {
                          assignedIsrId: e.target.value || undefined,
                          status: e.target.value && c.status === 'New' ? 'Assigned' : c.status,
                        })
                      }
                      className={`${inputCls} w-40 py-1.5 text-xs`}
                      title={isrName(c.assignedIsrId)}
                    >
                      <option value="">Unassigned</option>
                      {isrMembers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-3 text-right">
                    <button
                      onClick={() => removeCustomer(c.id)}
                      className="rounded-md p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500"
                      title="Delete"
                    >
                      <IconTrash width={16} height={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    No customers match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {adding && (
        <NewCustomerModal
          isrMembers={isrMembers}
          onClose={() => setAdding(false)}
          onCreate={(c) => {
            addCustomer(c)
            setAdding(false)
          }}
        />
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  accent = 'slate',
}: {
  label: string
  value: number
  accent?: 'slate' | 'amber' | 'indigo'
}) {
  const color =
    accent === 'amber' ? 'text-amber-600' : accent === 'indigo' ? 'text-indigo-600' : 'text-slate-900'
  return (
    <Card className="px-4 py-3">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs font-medium text-slate-500">{label}</div>
    </Card>
  )
}

function NewCustomerModal({
  isrMembers,
  onClose,
  onCreate,
}: {
  isrMembers: { id: string; name: string }[]
  onClose: () => void
  onCreate: (c: Omit<Customer, 'id' | 'createdAt'>) => void
}) {
  const [f, setF] = useState<Omit<Customer, 'id' | 'createdAt'>>({
    name: '',
    email: '',
    phone: '',
    company: '',
    title: '',
    city: '',
    status: 'New',
    focus: false,
    source: 'Manual',
  })
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }))

  return (
    <Modal title="New customer" onClose={onClose} wide>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Name">
          <input className={inputCls} value={f.name} onChange={(e) => set('name', e.target.value)} />
        </Field>
        <Field label="Job title">
          <input className={inputCls} value={f.title} onChange={(e) => set('title', e.target.value)} />
        </Field>
        <Field label="Company">
          <input className={inputCls} value={f.company} onChange={(e) => set('company', e.target.value)} />
        </Field>
        <Field label="City">
          <input className={inputCls} value={f.city} onChange={(e) => set('city', e.target.value)} />
        </Field>
        <Field label="Email">
          <input className={inputCls} value={f.email} onChange={(e) => set('email', e.target.value)} />
        </Field>
        <Field label="Contact number">
          <input className={inputCls} value={f.phone} onChange={(e) => set('phone', e.target.value)} />
        </Field>
        <Field label="Status">
          <select
            className={inputCls}
            value={f.status}
            onChange={(e) => set('status', e.target.value as CustomerStatus)}
          >
            {CUSTOMER_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Assign to ISR">
          <select
            className={inputCls}
            value={f.assignedIsrId ?? ''}
            onChange={(e) => set('assignedIsrId', e.target.value || undefined)}
          >
            <option value="">Unassigned</option>
            {isrMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={() => onCreate(f)}
          disabled={!f.name && !f.email && !f.company}
        >
          Create customer
        </Button>
      </div>
      <p className="mt-2 text-right text-xs text-slate-400">
        Added {formatDate(new Date().toISOString())}
      </p>
    </Modal>
  )
}
