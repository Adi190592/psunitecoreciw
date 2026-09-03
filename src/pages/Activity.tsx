import { useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import { Badge, Card, inputCls } from '../components/ui'
import { IconClock, IconSearch } from '../components/icons'

const ACTION_TONE: Record<string, Parameters<typeof Badge>[0]['tone']> = {
  create: 'green',
  update: 'blue',
  delete: 'red',
  import: 'violet',
  reset: 'amber',
}

export default function Activity() {
  const { data } = useStore()
  const [query, setQuery] = useState('')
  const [action, setAction] = useState('all')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return data.log.filter((l) => {
      if (action !== 'all' && l.action !== action) return false
      if (!q) return true
      return [l.summary, l.entity, l.actor].filter(Boolean).some((v) => v!.toLowerCase().includes(q))
    })
  }, [data.log, query, action])

  return (
    <div>
      <header className="mb-5">
        <h1 className="flex items-center gap-2 text-3xl font-bold text-slate-900">
          <IconClock width={26} height={26} className="text-slate-700" /> Activity Log
        </h1>
        <p className="mt-1 text-slate-500">
          Every change to the dataset — who did what, and when. Full audit trail for the ISR
          workspace.
        </p>
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
              placeholder="Search the log…"
              className={`${inputCls} pl-9`}
            />
          </div>
          <select value={action} onChange={(e) => setAction(e.target.value)} className={`${inputCls} w-auto`}>
            <option value="all">All actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="import">Import</option>
            <option value="reset">Reset</option>
          </select>
          <span className="ml-auto text-sm text-slate-400">{rows.length} entries</span>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto scroll-slim">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">When</th>
                <th className="px-2 py-3">Actor</th>
                <th className="px-2 py-3">Action</th>
                <th className="px-2 py-3">Entity</th>
                <th className="px-2 py-3">Detail</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id} className="border-b border-slate-100 last:border-0">
                  <td className="whitespace-nowrap px-4 py-2.5 text-slate-500">
                    {new Date(l.ts).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-2 py-2.5 text-slate-700">{l.actor || '—'}</td>
                  <td className="px-2 py-2.5">
                    <Badge tone={ACTION_TONE[l.action] ?? 'slate'}>{l.action}</Badge>
                  </td>
                  <td className="px-2 py-2.5 text-slate-500">{l.entity}</td>
                  <td className="px-2 py-2.5 text-slate-700">{l.summary}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                    No log entries yet. Changes you make will appear here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
