export type TeamRole = 'ISR' | 'Sales'

export interface TeamMember {
  id: string
  name: string
  role: TeamRole
  email?: string
}

export interface Company {
  id: string
  name: string
  website?: string
  city?: string
  focus: boolean
  notes?: string
  createdAt: string
}

export type CustomerStatus =
  | 'New'
  | 'Assigned'
  | 'Contacted'
  | 'Working'
  | 'Qualified'
  | 'Disqualified'

export const CUSTOMER_STATUSES: CustomerStatus[] = [
  'New',
  'Assigned',
  'Contacted',
  'Working',
  'Qualified',
  'Disqualified',
]

export interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  company?: string
  companyId?: string
  title?: string
  city?: string
  website?: string
  source?: string
  status: CustomerStatus
  focus: boolean
  assignedIsrId?: string
  notes?: string
  createdAt: string
}

export type DealStage =
  | 'Prospecting'
  | 'Qualification'
  | 'Demo'
  | 'Proposal'
  | 'Negotiation'
  | 'Won'
  | 'Lost'

export const DEAL_STAGES: DealStage[] = [
  'Prospecting',
  'Qualification',
  'Demo',
  'Proposal',
  'Negotiation',
  'Won',
  'Lost',
]

export interface Deal {
  id: string
  title: string
  company: string
  companyId?: string
  customerId?: string
  value: number
  stage: DealStage
  probability: number
  isrId?: string
  salesId?: string
  startDate: string
  closeDate: string
  notes?: string
  createdAt: string
}

export interface ActivityEntry {
  id: string
  ts: string
  actor?: string
  action: string
  entity: string
  entityId?: string
  summary: string
}

export interface WorkspaceData {
  team: TeamMember[]
  companies: Company[]
  customers: Customer[]
  deals: Deal[]
  log: ActivityEntry[]
}
