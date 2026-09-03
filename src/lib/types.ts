export type TeamRole = 'ISR' | 'Sales'

export interface TeamMember {
  id: string
  name: string
  role: TeamRole
  email?: string
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
  title?: string
  city?: string
  website?: string
  source?: string
  status: CustomerStatus
  focus: boolean
  /** ISR team member this record is assigned to for outreach. */
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
  customerId?: string
  value: number
  stage: DealStage
  probability: number
  /** ISR team member driving early outreach on the deal. */
  isrId?: string
  /** Sales team member owning the close. */
  salesId?: string
  startDate: string // ISO yyyy-mm-dd — when work began
  closeDate: string // ISO yyyy-mm-dd — expected/actual close
  notes?: string
  createdAt: string
}

export interface WorkspaceData {
  team: TeamMember[]
  customers: Customer[]
  deals: Deal[]
}
