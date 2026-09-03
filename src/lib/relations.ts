import type { Company, Customer, Deal, WorkspaceData } from './types'
import { scoreCompany, type CompanyScore } from './scoring'

export interface ScoredCompany {
  company: Company
  contacts: Customer[]
  deals: Deal[]
  score: CompanyScore
}

/** Resolve a customer/deal to a company id, falling back to a name match. */
function companyIdFor(
  rec: { companyId?: string; company?: string },
  nameToId: Map<string, string>,
): string | undefined {
  if (rec.companyId) return rec.companyId
  const name = rec.company?.trim().toLowerCase()
  return name ? nameToId.get(name) : undefined
}

export function buildRelations(data: WorkspaceData): {
  scored: ScoredCompany[]
  contactsByCompany: Map<string, Customer[]>
  dealsByCompany: Map<string, Deal[]>
} {
  const nameToId = new Map<string, string>()
  for (const c of data.companies) nameToId.set(c.name.trim().toLowerCase(), c.id)

  const contactsByCompany = new Map<string, Customer[]>()
  for (const cust of data.customers) {
    const id = companyIdFor(cust, nameToId)
    if (!id) continue
    const list = contactsByCompany.get(id) ?? []
    list.push(cust)
    contactsByCompany.set(id, list)
  }

  const dealsByCompany = new Map<string, Deal[]>()
  for (const deal of data.deals) {
    const id = companyIdFor(deal, nameToId)
    if (!id) continue
    const list = dealsByCompany.get(id) ?? []
    list.push(deal)
    dealsByCompany.set(id, list)
  }

  const scored: ScoredCompany[] = data.companies.map((company) => {
    const contacts = contactsByCompany.get(company.id) ?? []
    const deals = dealsByCompany.get(company.id) ?? []
    return { company, contacts, deals, score: scoreCompany(company, contacts, deals) }
  })

  return { scored, contactsByCompany, dealsByCompany }
}
