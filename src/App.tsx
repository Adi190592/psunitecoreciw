import { useState, type JSX } from 'react'
import QuickAdd from './pages/QuickAdd'
import Customers from './pages/Customers'
import Companies from './pages/Companies'
import Deals from './pages/Deals'
import Scoring from './pages/Scoring'
import Activity from './pages/Activity'
import Team from './pages/Team'
import { useStore } from './lib/store'
import {
  IconBolt,
  IconBuilding,
  IconChart,
  IconClock,
  IconGauge,
  IconTarget,
  IconUsers,
} from './components/icons'

type Tab = 'quick' | 'companies' | 'customers' | 'deals' | 'scoring' | 'activity' | 'team'

const NAV: { id: Tab; label: string; icon: JSX.Element }[] = [
  { id: 'quick', label: 'Quick Add', icon: <IconBolt width={17} height={17} /> },
  { id: 'companies', label: 'Companies', icon: <IconBuilding width={17} height={17} /> },
  { id: 'customers', label: 'Customers', icon: <IconUsers width={17} height={17} /> },
  { id: 'deals', label: 'Deals', icon: <IconChart width={17} height={17} /> },
  { id: 'scoring', label: 'Scoring', icon: <IconGauge width={17} height={17} /> },
  { id: 'activity', label: 'Activity', icon: <IconClock width={17} height={17} /> },
  { id: 'team', label: 'Team', icon: <IconTarget width={17} height={17} /> },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('companies')
  const { data, status, error } = useStore()

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-900 text-white">
              <IconTarget width={20} height={20} />
            </span>
            <div className="leading-tight">
              <div className="text-sm font-bold text-slate-900">ISR Workspace</div>
              <div className="text-[11px] text-slate-400">Outreach · scoring · deals</div>
            </div>
          </div>
          <nav className="flex items-center gap-1 overflow-x-auto">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => setTab(n.id)}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  tab === n.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {n.icon}
                {n.label}
              </button>
            ))}
          </nav>
          <div className="ml-auto">
            <StatusPill status={status} counts={{ c: data.companies.length, k: data.customers.length, d: data.deals.length }} />
          </div>
        </div>
      </header>

      {status === 'error' && (
        <div className="mx-auto max-w-7xl px-4 pt-3 sm:px-6">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
            Couldn't reach the database API. Showing what loaded; changes will retry.{' '}
            {error && <span className="text-amber-500">({error})</span>}
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {status === 'loading' ? (
          <div className="flex h-64 items-center justify-center text-slate-400">Loading dataset…</div>
        ) : (
          <>
            {tab === 'quick' && <QuickAdd />}
            {tab === 'companies' && <Companies />}
            {tab === 'customers' && <Customers />}
            {tab === 'deals' && <Deals />}
            {tab === 'scoring' && <Scoring />}
            {tab === 'activity' && <Activity />}
            {tab === 'team' && <Team />}
          </>
        )}
      </main>
    </div>
  )
}

function StatusPill({
  status,
  counts,
}: {
  status: 'loading' | 'ready' | 'error'
  counts: { c: number; k: number; d: number }
}) {
  const color =
    status === 'ready' ? 'bg-emerald-500' : status === 'loading' ? 'bg-amber-400' : 'bg-rose-500'
  return (
    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      <span className="hidden sm:inline">
        {counts.c} companies · {counts.k} contacts · {counts.d} deals
      </span>
      <span className="sm:hidden">D1</span>
    </div>
  )
}
