import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type {
  Company,
  Customer,
  Deal,
  TeamMember,
  WorkspaceData,
} from './types'
import { uid } from './id'
import { api } from './api'

const EMPTY: WorkspaceData = { team: [], companies: [], customers: [], deals: [], log: [] }

type Status = 'loading' | 'ready' | 'error'

interface Store {
  data: WorkspaceData
  status: Status
  error: string | null
  refresh: () => Promise<void>
  // team
  addMember: (m: Omit<TeamMember, 'id'>) => void
  removeMember: (id: string) => void
  // companies
  addCompany: (c: Omit<Company, 'id' | 'createdAt' | 'focus'> & Partial<Pick<Company, 'focus'>>) => Company
  updateCompany: (id: string, patch: Partial<Company>) => void
  removeCompany: (id: string) => void
  // customers
  addCustomer: (
    c: Omit<Customer, 'id' | 'createdAt' | 'status' | 'focus' | 'companyId'> &
      Partial<Pick<Customer, 'status' | 'focus'>>,
  ) => Customer
  updateCustomer: (id: string, patch: Partial<Customer>) => void
  removeCustomer: (id: string) => void
  // deals
  addDeal: (d: Omit<Deal, 'id' | 'createdAt' | 'companyId'>) => Deal
  updateDeal: (id: string, patch: Partial<Deal>) => void
  removeDeal: (id: string) => void
  // dataset control
  importData: (data: WorkspaceData) => void
  resetAll: () => void
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<WorkspaceData>(EMPTY)
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState<string | null>(null)
  const dataRef = useRef(data)
  dataRef.current = data

  const refresh = useCallback(async () => {
    try {
      const next = await api.getState()
      setData({
        team: next.team ?? [],
        companies: next.companies ?? [],
        customers: next.customers ?? [],
        deals: next.deals ?? [],
        log: next.log ?? [],
      })
      setStatus('ready')
      setError(null)
    } catch (e) {
      setStatus('error')
      setError(e instanceof Error ? e.message : 'Failed to reach the server')
    }
  }, [])

  useEffect(() => {
    refresh()
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    const poll = window.setInterval(refresh, 30_000)
    return () => {
      window.removeEventListener('focus', onFocus)
      window.clearInterval(poll)
    }
  }, [refresh])

  const patchLocal = useCallback((updater: (d: WorkspaceData) => WorkspaceData) => {
    setData((d) => updater(d))
  }, [])

  const onError = useCallback(
    (e: unknown) => {
      setError(e instanceof Error ? e.message : 'Sync failed')
      refresh()
    },
    [refresh],
  )

  const resolveCompany = useCallback(
    (name?: string): { companyId?: string; newCompany?: Company } => {
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
    },
    [],
  )

  const store = useMemo<Store>(() => {
    return {
      data,
      status,
      error,
      refresh,

      addMember(m) {
        const member: TeamMember = { ...m, id: uid('tm-') }
        patchLocal((d) => ({ ...d, team: [...d.team, member] }))
        api.create('team', member).then(refresh).catch(onError)
      },
      removeMember(id) {
        patchLocal((d) => ({
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
        api.remove('team', id).then(refresh).catch(onError)
      },

      addCompany(c) {
        const company: Company = {
          focus: false,
          ...c,
          id: uid('cmp-'),
          createdAt: new Date().toISOString(),
        }
        patchLocal((d) => ({ ...d, companies: [...d.companies, company] }))
        api.create('companies', company).then(refresh).catch(onError)
        return company
      },
      updateCompany(id, patch) {
        patchLocal((d) => ({
          ...d,
          companies: d.companies.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        }))
        api.patch('companies', id, patch).catch(onError)
      },
      removeCompany(id) {
        patchLocal((d) => ({
          ...d,
          companies: d.companies.filter((c) => c.id !== id),
          customers: d.customers.map((c) =>
            c.companyId === id ? { ...c, companyId: undefined } : c,
          ),
          deals: d.deals.map((deal) =>
            deal.companyId === id ? { ...deal, companyId: undefined } : deal,
          ),
        }))
        api.remove('companies', id).then(refresh).catch(onError)
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
        patchLocal((d) => ({
          ...d,
          companies: newCompany ? [...d.companies, newCompany] : d.companies,
          customers: [customer, ...d.customers],
        }))
        api.create('customers', customer).then(refresh).catch(onError)
        return customer
      },
      updateCustomer(id, patch) {
        const next = { ...patch }
        if (patch.company) {
          const { companyId } = resolveCompany(patch.company)
          next.companyId = companyId
        }
        patchLocal((d) => ({
          ...d,
          customers: d.customers.map((c) => (c.id === id ? { ...c, ...next } : c)),
        }))
        api.patch('customers', id, next).catch(onError)
      },
      removeCustomer(id) {
        patchLocal((d) => ({ ...d, customers: d.customers.filter((c) => c.id !== id) }))
        api.remove('customers', id).catch(onError)
      },

      addDeal(deal) {
        const { companyId, newCompany } = resolveCompany(deal.company)
        const created: Deal = {
          ...deal,
          companyId,
          id: uid('d-'),
          createdAt: new Date().toISOString(),
        }
        patchLocal((d) => ({
          ...d,
          companies: newCompany ? [...d.companies, newCompany] : d.companies,
          deals: [created, ...d.deals],
        }))
        api.create('deals', created).then(refresh).catch(onError)
        return created
      },
      updateDeal(id, patch) {
        const next = { ...patch }
        if (patch.company) {
          const { companyId } = resolveCompany(patch.company)
          next.companyId = companyId
        }
        patchLocal((d) => ({
          ...d,
          deals: d.deals.map((deal) => (deal.id === id ? { ...deal, ...next } : deal)),
        }))
        api.patch('deals', id, next).catch(onError)
      },
      removeDeal(id) {
        patchLocal((d) => ({ ...d, deals: d.deals.filter((deal) => deal.id !== id) }))
        api.remove('deals', id).catch(onError)
      },

      importData(next) {
        setData(next)
        api.replaceState(next).then(refresh).catch(onError)
      },
      resetAll() {
        setData(EMPTY)
        api.reset().then(refresh).catch(onError)
      },
    }
  }, [data, status, error, refresh, patchLocal, onError, resolveCompany])

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
