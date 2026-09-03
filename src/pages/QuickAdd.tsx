import { useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import { EXAMPLE_PASTE, parseCustomer, type ParsedCustomer } from '../lib/parse'
import { Button, Card, Field, inputCls } from '../components/ui'
import { IconBolt, IconWand } from '../components/icons'
import { CUSTOMER_STATUSES, type CustomerStatus } from '../lib/types'

type Draft = ParsedCustomer & {
  status: CustomerStatus
  assignedIsrId?: string
  focus: boolean
}

const EMPTY: Draft = { status: 'New', focus: false }

export default function QuickAdd() {
  const { data, addCustomer } = useStore()
  const [raw, setRaw] = useState('')
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  const isrMembers = useMemo(() => data.team.filter((m) => m.role === 'ISR'), [data.team])

  function handleParse(text: string) {
    const parsed = parseCustomer(text)
    setDraft({ ...EMPTY, ...parsed })
    setSaved(null)
  }

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => (d ? { ...d, [key]: value } : d))
  }

  function handleSave() {
    if (!draft || (!draft.name && !draft.email && !draft.company)) return
    addCustomer({
      name: draft.name ?? '',
      email: draft.email,
      phone: draft.phone,
      company: draft.company,
      title: draft.title,
      city: draft.city,
      website: draft.website,
      status: draft.status,
      focus: draft.focus,
      assignedIsrId: draft.assignedIsrId,
      source: 'Quick Add',
    })
    setSaved(draft.name || draft.company || draft.email || 'Record')
    setDraft(null)
    setRaw('')
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="flex items-center gap-2 text-3xl font-bold text-slate-900">
          <IconBolt className="text-amber-500" width={26} height={26} /> Quick Add
        </h1>
        <p className="mt-1 text-slate-500">
          Paste any customer details as free text — a signature, an email footer, a note — and the
          workspace extracts and maps them into a record.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Paste side */}
        <Card className="p-5">
          <h2 className="mb-3 text-lg font-bold text-slate-900">Paste details</h2>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={EXAMPLE_PASTE}
            spellCheck={false}
            className={`${inputCls} h-56 resize-y font-mono text-[13px] leading-relaxed`}
          />
          <div className="mt-3 flex items-center gap-3">
            <Button onClick={() => handleParse(raw)} disabled={!raw.trim()}>
              <IconWand width={16} height={16} /> Parse text
            </Button>
            <button
              onClick={() => {
                setRaw(EXAMPLE_PASTE)
                handleParse(EXAMPLE_PASTE)
              }}
              className="text-sm font-semibold text-slate-700 hover:underline"
            >
              Use example
            </button>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-slate-400">
            Recognizes labeled lines (Company:, Email:, Phone:…) and, when unlabeled, detects emails,
            phones, websites, a person name, a company (by legal suffix), and a job title.
          </p>
        </Card>

        {/* Review side */}
        <Card className="p-5">
          <h2 className="mb-3 text-lg font-bold text-slate-900">Review &amp; save</h2>
          {!draft && !saved && (
            <p className="text-slate-500">
              Parse some text to see the extracted fields here. You can edit anything before saving.
            </p>
          )}
          {saved && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Saved <strong>{saved}</strong> to the customer dataset.
            </div>
          )}
          {draft && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Name">
                <input
                  className={inputCls}
                  value={draft.name ?? ''}
                  onChange={(e) => set('name', e.target.value)}
                />
              </Field>
              <Field label="Job title">
                <input
                  className={inputCls}
                  value={draft.title ?? ''}
                  onChange={(e) => set('title', e.target.value)}
                />
              </Field>
              <Field label="Company">
                <input
                  className={inputCls}
                  value={draft.company ?? ''}
                  onChange={(e) => set('company', e.target.value)}
                />
              </Field>
              <Field label="City">
                <input
                  className={inputCls}
                  value={draft.city ?? ''}
                  onChange={(e) => set('city', e.target.value)}
                />
              </Field>
              <Field label="Email">
                <input
                  className={inputCls}
                  value={draft.email ?? ''}
                  onChange={(e) => set('email', e.target.value)}
                />
              </Field>
              <Field label="Contact number">
                <input
                  className={inputCls}
                  value={draft.phone ?? ''}
                  onChange={(e) => set('phone', e.target.value)}
                />
              </Field>
              <Field label="Website">
                <input
                  className={inputCls}
                  value={draft.website ?? ''}
                  onChange={(e) => set('website', e.target.value)}
                />
              </Field>
              <Field label="Status">
                <select
                  className={inputCls}
                  value={draft.status}
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
                  value={draft.assignedIsrId ?? ''}
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
              <label className="col-span-1 flex items-end gap-2 pb-2">
                <input
                  type="checkbox"
                  checked={draft.focus}
                  onChange={(e) => set('focus', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <span className="text-sm font-medium text-slate-600">Mark as focus account</span>
              </label>
              <div className="col-span-2 flex justify-end gap-2 pt-1">
                <Button variant="outline" onClick={() => setDraft(null)}>
                  Discard
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!draft.name && !draft.email && !draft.company}
                >
                  Save to dataset
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
