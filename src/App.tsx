import { useState } from 'react'
import QuickAdd from './pages/QuickAdd'
import Customers from './pages/Customers'
import Deals from './pages/Deals'
import Team from './pages/Team'
import { IconBolt, IconChart, IconTarget, IconUsers } from './components/icons'
import type { JSX } from 'react'

type Tab = 'quick' | 'customers' | 'deals' | 'team'

const NAV: { id: Tab; label: string; icon: JSX.Element }[] = [
  { id: 'quick', label: 'Quick Add', icon: <IconBolt width={18} height={18} /> },
  { id: 'customers', label: 'Customers', icon: <IconUsers width={18} height={18} /> },
  { id: 'deals', label: 'Deals', icon: <IconChart width={18} height={18} /> },
  { id: 'team', label: 'Team & Dataset', icon: <IconTarget width={18} height={18} /> },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('quick')

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-900 text-white">
              <IconTarget width={20} height={20} />
            </span>
            <div className="leading-tight">
              <div className="text-sm font-bold text-slate-900">ISR Workspace</div>
              <div className="text-[11px] text-slate-400">Outreach &amp; deal tracking</div>
            </div>
          </div>
          <nav className="flex items-center gap-1 overflow-x-auto">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => setTab(n.id)}
                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  tab === n.id
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {n.icon}
                {n.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {tab === 'quick' && <QuickAdd />}
        {tab === 'customers' && <Customers />}
        {tab === 'deals' && <Deals />}
        {tab === 'team' && <Team />}
      </main>
    </div>
  )
}
