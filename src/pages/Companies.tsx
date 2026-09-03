import { useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import { buildRelations, type ScoredCompany } from '../lib/relations'
import { Avatar, Badge, Button, Card, Field, inputCls, Modal } from '../components/ui'
import { FactorList, ScoreBadge, ScoreRing } from '../components/Score'
import {
  IconBuilding,
  IconDownload,
  IconPlus,
  IconSearch,
  IconStar,
  IconTrash,
} from '../components/icons'
import { formatCurrency } from '../lib/format'
import { exportCompaniesCsv } from '../lib/exporters'

type SortKey = 'name' | 'score' | 'contacts' | 'pipeline'

export default function Companies() {
  const { data, addCompany } = useStore()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('score')
  const [band, setBand] = useState<string>('all')
  const [focusOnly, setFocusOnly] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const { scored } = useMemo(() => buildRelations(data), [data])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = scored.filter((s) => {
      if (focusOnly && !s.company.focus) return false
      if (band !== 'all' && s.score.band !== band) return false
      if (!q) return true
      return s.company.name.toLowerCase().includes(q)
    })
    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'name':
          return a.company.name.localeCompare(b.company.name)
        case 'contacts':
          return b.score.metrics.contacts - a.score.metrics.contacts
        case 'pipeline':
          return b.score.metrics.openValue - a.score.metrics.openValue
        default:
          return b.score.score - a.score.score
      }
    })
    return list
  }, [scored, query, sort, band, focusOnly])

  const open = openId ? scored.find((s) => s.company.id === openId) ?? null : null

  return (
    <div>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-slate-900">
            <IconBuilding width={26} height={26} className="text-slate-700" /> Companies
          </h1>
          <p className="mt-1 text-slate-500">
            The master company repository — every account scored on data quality and pipeline
            engagement, interlinked with its contacts and deals.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportCompaniesCsv(filtered)}>
            <IconDownload width={16} height={16} /> Export scored list
          </Button>
          <Button onClick={() => setAdding(true)}>
            <IconPlus width={16} height={16} /> New company
          </Button>
        </div>
      </header>

      <Card className="mb-4 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <IconSearch
              width={16}
              height={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter companies…"
              className={`${inputCls} pl-9`}
            />
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={`${inputCls} w-auto`}>
            <option value="score">Sort: Score</option>
            <option value="name">Sort: Name</option>
            <option value="contacts">Sort: Contacts</option>
            <option value="pipeline">Sort: Pipeline</option>
          </select>
          <select value={band} onChange={(e) => setBand(e.target.value)} className={`${inputCls} w-auto`}>
            <option value="all">All bands</option>
            <option>Excellent</option>
            <option>Good</option>
            <option>Fair</option>
            <option>Poor</option>
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
          <span className="ml-auto text-sm text-slate-400">{filtered.length} companies</span>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto scroll-slim">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="w-8 px-4 py-3"></th>
                <th className="px-2 py-3">Company</th>
                <th className="px-2 py-3">Location</th>
                <th className="px-2 py-3 text-center">Contacts</th>
                <th className="px-2 py-3 text-right">Open pipeline</th>
                <th className="px-2 py-3 text-right">Quality</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.company.id}
                  onClick={() => setOpenId(s.company.id)}
                  className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
                >
                  <td className="px-4 py-3">
                    <IconStar
                      width={18}
                      height={18}
                      filled={s.company.focus}
                      className={s.company.focus ? 'text-amber-400' : 'text-slate-300'}
                    />
                  </td>
                  <td className="px-2 py-3">
                    <div className="font-semibold text-slate-800">{s.company.name}</div>
                    <div className="text-xs text-slate-400">
                      {s.score.metrics.withEmail} emails · {s.score.metrics.withPhone} phones
                    </div>
                  </td>
                  <td className="px-2 py-3 text-slate-600">{s.company.city || '—'}</td>
                  <td className="px-2 py-3 text-center text-slate-700">{s.score.metrics.contacts}</td>
                  <td className="px-2 py-3 text-right text-slate-700">
                    {s.score.metrics.openValue ? formatCurrency(s.score.metrics.openValue) : '—'}
                  </td>
                  <td className="px-2 py-3 text-right">
                    <ScoreBadge score={s.score.score} band={s.score.band} />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    No companies match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {open && <CompanyDetail entry={open} onClose={() => setOpenId(null)} />}
      {adding && (
        <NewCompanyModal
          onClose={() => setAdding(false)}
          onCreate={(name, website, city, focus) => {
            addCompany({ name, website, city, focus })
            setAdding(false)
          }}
        />
      )}
    </div>
  )
}

function CompanyDetail({ entry, onClose }: { entry: ScoredCompany; onClose: () => void }) {
  const { data, updateCompany, removeCompany } = useStore()
  const { company, contacts, deals, score } = entry
  const isrName = (id?: string) => data.team.find((m) => m.id === id)?.name

  return (
    <Modal title={company.name} onClose={onClose} wide>
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
        <ScoreRing score={score.score} band={score.band} />
        <div className="flex-1">
          <ScoreBadge score={score.score} band={score.band} />
          <div className="mt-1 text-sm text-slate-500">
            {score.metrics.contacts} contacts · {score.metrics.openDeals} open deals ·{' '}
            {formatCurrency(score.metrics.weighted)} weighted
          </div>
        </div>
        <button
          onClick={() => {
            if (confirm(`Delete ${company.name}? Contacts and deals will be unlinked.`)) {
              removeCompany(company.id)
              onClose()
            }
          }}
          className="rounded-md p-2 text-slate-300 hover:bg-red-50 hover:text-red-500"
          title="Delete company"
        >
          <IconTrash width={18} height={18} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Field label="Website">
          <input
            className={inputCls}
            defaultValue={company.website ?? ''}
            onBlur={(e) => updateCompany(company.id, { website: e.target.value || undefined })}
          />
        </Field>
        <Field label="City">
          <input
            className={inputCls}
            defaultValue={company.city ?? ''}
            onBlur={(e) => updateCompany(company.id, { city: e.target.value || undefined })}
          />
        </Field>
        <label className="flex items-end gap-2 pb-2">
          <input
            type="checkbox"
            checked={company.focus}
            onChange={(e) => updateCompany(company.id, { focus: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300"
          />
          <span className="text-sm font-medium text-slate-600">Focus account</span>
        </label>
      </div>

      <h4 className="mt-5 mb-2 text-sm font-bold text-slate-700">Score breakdown</h4>
      <FactorList score={score} />

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <h4 className="mb-2 text-sm font-bold text-slate-700">Contacts ({contacts.length})</h4>
          <ul className="max-h-56 space-y-1.5 overflow-y-auto scroll-slim pr-1">
            {contacts.map((c) => (
              <li key={c.id} className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2">
                <Avatar name={c.name} size={26} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-800">{c.name || '—'}</div>
                  <div className="truncate text-xs text-slate-400">{c.title || c.email || ''}</div>
                </div>
                {c.assignedIsrId && <Badge tone="blue">{isrName(c.assignedIsrId)?.split(' ')[0]}</Badge>}
              </li>
            ))}
            {contacts.length === 0 && <li className="text-sm text-slate-400">No contacts linked.</li>}
          </ul>
        </div>
        <div>
          <h4 className="mb-2 text-sm font-bold text-slate-700">Deals ({deals.length})</h4>
          <ul className="max-h-56 space-y-1.5 overflow-y-auto scroll-slim pr-1">
            {deals.map((d) => (
              <li key={d.id} className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-800">{d.title}</div>
                  <div className="text-xs text-slate-400">{d.stage}</div>
                </div>
                <span className="text-sm font-semibold text-slate-600">{formatCurrency(d.value)}</span>
              </li>
            ))}
            {deals.length === 0 && <li className="text-sm text-slate-400">No deals linked.</li>}
          </ul>
        </div>
      </div>
    </Modal>
  )
}

function NewCompanyModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (name: string, website: string | undefined, city: string | undefined, focus: boolean) => void
}) {
  const [name, setName] = useState('')
  const [website, setWebsite] = useState('')
  const [city, setCity] = useState('')
  const [focus, setFocus] = useState(false)
  return (
    <Modal title="New company" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Company name">
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Website">
          <input className={inputCls} value={website} onChange={(e) => setWebsite(e.target.value)} />
        </Field>
        <Field label="City">
          <input className={inputCls} value={city} onChange={(e) => setCity(e.target.value)} />
        </Field>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={focus} onChange={(e) => setFocus(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
          <span className="text-sm font-medium text-slate-600">Mark as focus account</span>
        </label>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button disabled={!name.trim()} onClick={() => onCreate(name.trim(), website || undefined, city || undefined, focus)}>
          Create company
        </Button>
      </div>
    </Modal>
  )
}
