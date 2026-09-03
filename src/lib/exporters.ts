import type { Customer, TeamMember, WorkspaceData } from './types'

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function csvCell(v: unknown): string {
  const s = v == null ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function exportCustomersCsv(customers: Customer[], team: TeamMember[]) {
  const byId = new Map(team.map((m) => [m.id, m.name]))
  const headers = [
    'Name',
    'Title',
    'Company',
    'Email',
    'Phone',
    'City',
    'Website',
    'Status',
    'Focus',
    'Assigned ISR',
    'Source',
    'Created',
  ]
  const rows = customers.map((c) => [
    c.name,
    c.title,
    c.company,
    c.email,
    c.phone,
    c.city,
    c.website,
    c.status,
    c.focus ? 'Yes' : 'No',
    c.assignedIsrId ? byId.get(c.assignedIsrId) ?? '' : '',
    c.source,
    c.createdAt.slice(0, 10),
  ])
  const csv = [headers, ...rows].map((r) => r.map(csvCell).join(',')).join('\n')
  download('customers.csv', csv, 'text/csv;charset=utf-8')
}

export function exportWorkspaceJson(data: WorkspaceData) {
  download('isr-workspace.json', JSON.stringify(data, null, 2), 'application/json')
}
