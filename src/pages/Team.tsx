import { useRef, useState } from 'react'
import { useStore } from '../lib/store'
import { Avatar, Badge, Button, Card, Field, inputCls } from '../components/ui'
import { IconDownload, IconPlus, IconTrash, IconUpload, IconUsers } from '../components/icons'
import type { TeamRole, WorkspaceData } from '../lib/types'
import { exportWorkspaceJson } from '../lib/exporters'

export default function Team() {
  const { data, addMember, removeMember, replaceAll, resetToSeed } = useStore()
  const [name, setName] = useState('')
  const [role, setRole] = useState<TeamRole>('ISR')
  const [email, setEmail] = useState('')
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const isr = data.team.filter((m) => m.role === 'ISR')
  const sales = data.team.filter((m) => m.role === 'Sales')

  function handleAdd() {
    if (!name.trim()) return
    addMember({ name: name.trim(), role, email: email.trim() || undefined })
    setName('')
    setEmail('')
  }

  function handleImport(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as WorkspaceData
        if (!parsed.team && !parsed.customers && !parsed.deals) throw new Error('bad shape')
        replaceAll(parsed)
        setImportMsg(
          `Imported ${parsed.customers?.length ?? 0} customers, ${parsed.deals?.length ?? 0} deals, ${parsed.team?.length ?? 0} members.`,
        )
      } catch {
        setImportMsg('Could not read that file — expected an ISR Workspace JSON export.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div>
      <header className="mb-5">
        <h1 className="flex items-center gap-2 text-3xl font-bold text-slate-900">
          <IconUsers width={26} height={26} className="text-slate-700" /> Team &amp; Dataset
        </h1>
        <p className="mt-1 text-slate-500">
          Manage the ISR and Sales members you assign work to, and control the dataset as the owner.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Add member */}
        <Card className="p-5">
          <h2 className="mb-3 text-lg font-bold text-slate-900">Add member</h2>
          <div className="space-y-3">
            <Field label="Name">
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Email">
              <input className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Role">
              <select
                className={inputCls}
                value={role}
                onChange={(e) => setRole(e.target.value as TeamRole)}
              >
                <option value="ISR">ISR (outreach)</option>
                <option value="Sales">Sales (closing)</option>
              </select>
            </Field>
            <Button onClick={handleAdd} disabled={!name.trim()} className="w-full justify-center">
              <IconPlus width={16} height={16} /> Add to team
            </Button>
          </div>
        </Card>

        {/* Roster */}
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-3 text-lg font-bold text-slate-900">Roster</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Roster title="ISR — Inside Sales Reps" tone="blue" members={isr} onRemove={removeMember} />
            <Roster title="Sales — Closers" tone="violet" members={sales} onRemove={removeMember} />
          </div>
        </Card>
      </div>

      {/* Dataset control */}
      <Card className="mt-6 p-5">
        <h2 className="mb-1 text-lg font-bold text-slate-900">Dataset control</h2>
        <p className="mb-4 text-sm text-slate-500">
          You own the master dataset. Export it to share or back up, import a controlled copy to
          distribute to the team, or reset to sample data.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => exportWorkspaceJson(data)}>
            <IconDownload width={16} height={16} /> Export dataset (JSON)
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <IconUpload width={16} height={16} /> Import dataset
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleImport(file)
              e.target.value = ''
            }}
          />
          <Button
            variant="danger"
            onClick={() => {
              if (confirm('Reset to sample data? This replaces the current dataset.')) {
                resetToSeed()
                setImportMsg('Reset to sample data.')
              }
            }}
          >
            Reset to sample
          </Button>
        </div>
        {importMsg && (
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
            {importMsg}
          </div>
        )}
      </Card>
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
