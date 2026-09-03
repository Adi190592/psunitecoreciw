import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Customer, Deal, TeamMember, WorkspaceData } from './types'
import { SEED } from './seed'
import { uid } from './id'

const STORAGE_KEY = 'isr-workspace:v1'

function load(): WorkspaceData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<WorkspaceData>
      return {
        team: parsed.team ?? [],
        customers: parsed.customers ?? [],
        deals: parsed.deals ?? [],
      }
    }
  } catch {
    // fall through to seed on any parse/storage error
  }
  return SEED
}

interface Store {
  data: WorkspaceData
  // team
  addMember: (m: Omit<TeamMember, 'id'>) => TeamMember
  updateMember: (id: string, patch: Partial<TeamMember>) => void
  removeMember: (id: string) => void
  // customers
  addCustomer: (c: Omit<Customer, 'id' | 'createdAt' | 'status' | 'focus'> & Partial<Pick<Customer, 'status' | 'focus'>>) => Customer
  updateCustomer: (id: string, patch: Partial<Customer>) => void
  removeCustomer: (id: string) => void
  // deals
  addDeal: (d: Omit<Deal, 'id' | 'createdAt'>) => Deal
  updateDeal: (id: string, patch: Partial<Deal>) => void
  removeDeal: (id: string) => void
  // dataset control
  replaceAll: (data: WorkspaceData) => void
  resetToSeed: () => void
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<WorkspaceData>(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // storage may be unavailable (private mode); keep working in-memory
    }
  }, [data])

  const store = useMemo<Store>(() => {
    return {
      data,
      addMember(m) {
        const member: TeamMember = { ...m, id: uid('tm-') }
        setData((d) => ({ ...d, team: [...d.team, member] }))
        return member
      },
      updateMember(id, patch) {
        setData((d) => ({
          ...d,
          team: d.team.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        }))
      },
      removeMember(id) {
        setData((d) => ({
          ...d,
          team: d.team.filter((m) => m.id !== id),
          customers: d.customers.map((c) =>
            c.assignedIsrId === id ? { ...c, assignedIsrId: undefined } : c,
          ),
          deals: d.deals.map((deal) => ({
            ...deal,
            isrId: deal.isrId === id ? undefined : deal.isrId,
            salesId: deal.salesId === id ? undefined : deal.salesId,
          })),
        }))
      },
      addCustomer(c) {
        const customer: Customer = {
          status: 'New',
          focus: false,
          ...c,
          id: uid('c-'),
          createdAt: new Date().toISOString(),
        }
        setData((d) => ({ ...d, customers: [customer, ...d.customers] }))
        return customer
      },
      updateCustomer(id, patch) {
        setData((d) => ({
          ...d,
          customers: d.customers.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        }))
      },
      removeCustomer(id) {
        setData((d) => ({
          ...d,
          customers: d.customers.filter((c) => c.id !== id),
        }))
      },
      addDeal(deal) {
        const created: Deal = {
          ...deal,
          id: uid('d-'),
          createdAt: new Date().toISOString(),
        }
        setData((d) => ({ ...d, deals: [created, ...d.deals] }))
        return created
      },
      updateDeal(id, patch) {
        setData((d) => ({
          ...d,
          deals: d.deals.map((deal) => (deal.id === id ? { ...deal, ...patch } : deal)),
        }))
      },
      removeDeal(id) {
        setData((d) => ({ ...d, deals: d.deals.filter((deal) => deal.id !== id) }))
      },
      replaceAll(next) {
        setData({
          team: next.team ?? [],
          customers: next.customers ?? [],
          deals: next.deals ?? [],
        })
      },
      resetToSeed() {
        setData(SEED)
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
