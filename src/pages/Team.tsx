import { useState } from 'react'
import { useStore } from '../lib/store'
import { Avatar, Badge, Button, Card, Field, inputCls } from '../components/ui'
import { IconPlus, IconTrash, IconUsers } from '../components/icons'
import type { TeamRole } from '../lib/types'

export default function Team() {
  const { data, addMember, removeMember } = useStore()
  const [name, setName] = useState('')
  const [role, setRole] = useState<TeamRole>('ISR')
  const [email, setEmail] = useState('')

  const isr = data.team.filter((m) => m.role === 'ISR')
  const sales = data.team.filter((m) => m.role === 'Sales')

  function handleAdd() {
    if (!name.trim()) return
    addMember({ name: name.trim(), role, email: email.trim() || undefined })
    setName('')
    setEmail('')
  }

  return (
    <div>
      <header className="mb-5">
        <h1 className="flex items-center gap-2 text-3xl font-bold text-slate-900">
          <IconUsers width={26} height={26} className="text-slate-700" /> Team
        </h1>
        <p className="mt-1 text-slate-500">
          The ISR and Sales members you assign to contacts and deals. Add a name and it becomes
          selectable across the app.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Add member */}
        <Card className="p-5">
          <h2 className="mb-3 text-lg font-bold text-slate-900">Add member</h2>
          <div className="space-y-3">
            <Field label="Name">
              <input
                className={inputCls}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
            </Field>
            <Field label="Email (optional)">
              <input className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Team">
              <select className={inputCls} value={role} onChange={(e) => setRole(e.target.value as TeamRole)}>
                <option value="ISR">ISR (inside sales rep)</option>
                <option value="Sales">Sales (closer)</option>
              </select>
            </Field>
            <Button onClick={handleAdd} disabled={!name.trim()} className="w-full justify-center">
              <IconPlus width={16} height={16} /> Add member
            </Button>
          </div>
        </Card>

        {/* Rosters */}
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-3 text-lg font-bold text-slate-900">Roster</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Roster title="ISR — Inside Sales Reps" tone="blue" members={isr} onRemove={removeMember} />
            <Roster title="Sales — Closers" tone="violet" members={sales} onRemove={removeMember} />
          </div>
        </Card>
      </div>
    </div>
  )
}

function Roster({
  title,
  tone,
  members,
  onRemove,
}: {
  title: string
  tone: 'blue' | 'violet'
  members: { id: string; name: string; email?: string }[]
  onRemove: (id: string) => void
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        <Badge tone={tone}>{members.length}</Badge>
      </div>
      <ul className="space-y-2">
        {members.map((m) => (
          <li
            key={m.id}
            className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2"
          >
            <Avatar name={m.name} />
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-slate-800">{m.name}</div>
              {m.email && <div className="truncate text-xs text-slate-400">{m.email}</div>}
            </div>
            <button
              onClick={() => onRemove(m.id)}
              className="rounded-md p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500"
              title="Remove"
            >
              <IconTrash width={16} height={16} />
            </button>
          </li>
        ))}
        {members.length === 0 && <li className="text-sm text-slate-400">No members yet.</li>}
      </ul>
    </div>
  )
}
