import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type {
  ActivityEntry,
  Company,
  Customer,
  Deal,
  TeamMember,
  WorkspaceData,
} from './types'
import { uid } from './id'
import { SEED } from './seed'

const STORAGE_KEY = 'isr-workspace:v2'

function load(): WorkspaceData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const p = JSON.parse(raw) as Partial<WorkspaceData>
      return {
        team: p.team ?? [],
        companies: p.companies ?? [],
        customers: p.customers ?? [],
        deals: p.deals ?? [],
        log: p.log ?? [],
      }
    }
  } catch {
    // fall through to seed
  }
  return SEED
}

interface Store {
  data: WorkspaceData
  status: 'ready'
  error: null
  refresh: () => void
  addMember: (m: Omit<TeamMember, 'id'>) => void
  removeMember: (id: string) => void
  addCompany: (c: Omit<Company, 'id' | 'createdAt' | 'focus'> & Partial<Pick<Company, 'focus'>>) => Company
  updateCompany: (id: string, patch: Partial<Company>) => void
  removeCompany: (id: string) => void
  addCustomer: (
    c: Omit<Customer, 'id' | 'createdAt' | 'status' | 'focus' | 'companyId'> &
      Partial<Pick<Customer, 'status' | 'focus'>>,
  ) => Customer
  updateCustomer: (id: string, patch: Partial<Customer>) => void
  removeCustomer: (id: string) => void
  addDeal: (d: Omit<Deal, 'id' | 'createdAt' | 'companyId'>) => Deal
  updateDeal: (id: string, patch: Partial<Deal>) => void
  removeDeal: (id: string) => void
  importData: (data: WorkspaceData) => void
  resetAll: () => void
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<WorkspaceData>(load)
  const dataRef = useRef(data)
  dataRef.current = data

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // storage may be unavailable (private mode); keep working in-memory
    }
  }, [data])

  const store = useMemo<Store>(() => {
    const logEntry = (action: string, entity: string, summary: string, entityId?: string): ActivityEntry => ({
      id: uid('log-'),
      ts: new Date().toISOString(),
      actor: 'You',
      action,
      entity,
      entityId,
      summary,
    })
    const withLog = (d: WorkspaceData, e: ActivityEntry): WorkspaceData => ({
      ...d,
      log: [e, ...d.log].slice(0, 500),
    })

    const resolveCompany = (name?: string): { companyId?: string; newCompany?: Company } => {
      const clean = (name ?? '').trim()
      if (!clean) return {}
      const existing = dataRef.current.companies.find(
        (c) => c.name.toLowerCase() === clean.toLowerCase(),
      )
      if (existing) return { companyId: existing.id }
      const newCompany: Company = {
        id: uid('cmp-'),
        name: clean,
        focus: false,
        createdAt: new Date().toISOString(),
      }
      return { companyId: newCompany.id, newCompany }
    }

    return {
      data,
      status: 'ready',
      error: null,
      refresh() {
        setData(load())
      },

      addMember(m) {
        const member: TeamMember = { ...m, id: uid('tm-') }
        setData((d) => withLog({ ...d, team: [...d.team, member] }, logEntry('create', 'team', `Added ${member.role} ${member.name}`, member.id)))
      },
      removeMember(id) {
        setData((d) =>
          withLog(
            {
              ...d,
              team: d.team.filter((m) => m.id !== id),
              customers: d.customers.map((c) => (c.assignedIsrId === id ? { ...c, assignedIsrId: undefined } : c)),
              deals: d.deals.map((deal) => ({
                ...deal,
                isrId: deal.isrId === id ? undefined : deal.isrId,
                salesId: deal.salesId === id ? undefined : deal.salesId,
              })),
            },
            logEntry('delete', 'team', `Removed team member ${id}`, id),
          ),
        )
      },

      addCompany(c) {
        const company: Company = { focus: false, ...c, id: uid('cmp-'), createdAt: new Date().toISOString() }
        setData((d) => withLog({ ...d, companies: [...d.companies, company] }, logEntry('create', 'company', `Added company ${company.name}`, company.id)))
        return company
      },
      updateCompany(id, patch) {
        setData((d) =>
          withLog(
            { ...d, companies: d.companies.map((c) => (c.id === id ? { ...c, ...patch } : c)) },
            logEntry('update', 'company', `Updated company (${Object.keys(patch).join(', ')})`, id),
          ),
        )
      },
      removeCompany(id) {
        setData((d) =>
          withLog(
            {
              ...d,
              companies: d.companies.filter((c) => c.id !== id),
              customers: d.customers.map((c) => (c.companyId === id ? { ...c, companyId: undefined } : c)),
              deals: d.deals.map((deal) => (deal.companyId === id ? { ...deal, companyId: undefined } : deal)),
            },
            logEntry('delete', 'company', `Deleted company ${id}`, id),
          ),
        )
      },

      addCustomer(c) {
        const { companyId, newCompany } = resolveCompany(c.company)
        const customer: Customer = {
          status: 'New',
          focus: false,
          ...c,
          companyId,
          id: uid('c-'),
          createdAt: new Date().toISOString(),
        }
        setData((d) =>
          withLog(
            {
              ...d,
              companies: newCompany ? [...d.companies, newCompany] : d.companies,
              customers: [customer, ...d.customers],
            },
            logEntry('create', 'customer', `Added contact ${customer.name || customer.email || ''}`, customer.id),
          ),
        )
        return customer
      },
      updateCustomer(id, patch) {
        const next = { ...patch }
        if (patch.company) next.companyId = resolveCompany(patch.company).companyId
        setData((d) =>
          withLog(
            { ...d, customers: d.customers.map((c) => (c.id === id ? { ...c, ...next } : c)) },
            logEntry('update', 'customer', `Updated contact (${Object.keys(patch).join(', ')})`, id),
          ),
        )
      },
      removeCustomer(id) {
        setData((d) =>
          withLog({ ...d, customers: d.customers.filter((c) => c.id !== id) }, logEntry('delete', 'customer', `Deleted contact ${id}`, id)),
        )
      },

      addDeal(deal) {
        const { companyId, newCompany } = resolveCompany(deal.company)
        const created: Deal = { ...deal, companyId, id: uid('d-'), createdAt: new Date().toISOString() }
        setData((d) =>
          withLog(
            {
              ...d,
              companies: newCompany ? [...d.companies, newCompany] : d.companies,
              deals: [created, ...d.deals],
            },
            logEntry('create', 'deal', `Added deal “${created.title}”`, created.id),
          ),
        )
        return created
      },
      updateDeal(id, patch) {
        const next = { ...patch }
        if (patch.company) next.companyId = resolveCompany(patch.company).companyId
        setData((d) =>
          withLog(
            { ...d, deals: d.deals.map((deal) => (deal.id === id ? { ...deal, ...next } : deal)) },
            logEntry('update', 'deal', `Updated deal (${Object.keys(patch).join(', ')})`, id),
          ),
        )
      },
      removeDeal(id) {
        setData((d) => withLog({ ...d, deals: d.deals.filter((deal) => deal.id !== id) }, logEntry('delete', 'deal', `Deleted deal ${id}`, id)))
      },

      importData(next) {
        setData(withLog(
          { team: next.team ?? [], companies: next.companies ?? [], customers: next.customers ?? [], deals: next.deals ?? [], log: next.log ?? [] },
          logEntry('import', 'dataset', `Imported ${(next.companies ?? []).length} companies, ${(next.customers ?? []).length} contacts, ${(next.deals ?? []).length} deals`),
        ))
      },
      resetAll() {
        setData({ team: [], companies: [], customers: [], deals: [], log: [logEntry('reset', 'dataset', 'Cleared all data')] })
      },
    }
  }, [data])

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
