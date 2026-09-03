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
  const { data } = useStore()

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
              <div className="text-[11px] text-slate-400">Outreach &amp; conversations</div>
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
          <div className="ml-auto hidden text-xs text-slate-400 sm:block">
            {data.companies.length} companies · {data.customers.length} contacts · {data.deals.length} deals
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {tab === 'quick' && <QuickAdd />}
        {tab === 'companies' && <Companies />}
        {tab === 'customers' && <Customers />}
        {tab === 'deals' && <Deals />}
        {tab === 'scoring' && <Scoring />}
        {tab === 'activity' && <Activity />}
        {tab === 'team' && <Team />}
      </main>
    </div>
  )
}
