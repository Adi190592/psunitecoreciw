import type { Company, Customer, Deal } from './types'

export type ScoreBand = 'Excellent' | 'Good' | 'Fair' | 'Poor'

export interface ScoreFactor {
  label: string
  got: boolean
  points: number
  max: number
  detail?: string
}

export interface CompanyScore {
  score: number
  band: ScoreBand
  factors: ScoreFactor[]
  metrics: {
    contacts: number
    withEmail: number
    withPhone: number
    openDeals: number
    openValue: number
    weighted: number
    wonValue: number
  }
}

export function bandFor(score: number): ScoreBand {
  if (score >= 85) return 'Excellent'
  if (score >= 65) return 'Good'
  if (score >= 45) return 'Fair'
  return 'Poor'
}

export const BAND_TONE: Record<ScoreBand, string> = {
  Excellent: 'text-emerald-700 bg-emerald-100',
  Good: 'text-sky-700 bg-sky-100',
  Fair: 'text-amber-700 bg-amber-100',
  Poor: 'text-rose-700 bg-rose-100',
}

/**
 * Comprehensive company quality score (0–100) from data completeness, contact
 * depth, and pipeline engagement — the signals that make an account actionable.
 */
export function scoreCompany(
  company: Company,
  contacts: Customer[],
  deals: Deal[],
): CompanyScore {
  const withEmail = contacts.filter((c) => !!c.email).length
  const withPhone = contacts.filter((c) => !!c.phone).length
  const withTitle = contacts.filter((c) => !!c.title).length
  const withIsr = contacts.filter((c) => !!c.assignedIsrId).length
  const open = deals.filter((d) => d.stage !== 'Won' && d.stage !== 'Lost')
  const openValue = open.reduce((s, d) => s + d.value, 0)
  const weighted = open.reduce((s, d) => s + (d.value * d.probability) / 100, 0)
  const wonValue = deals.filter((d) => d.stage === 'Won').reduce((s, d) => s + d.value, 0)

  const factors: ScoreFactor[] = [
    f('Website on file', !!company.website, 8),
    f('Location known', !!company.city, 7),
    f('Has a contact', contacts.length > 0, 10, `${contacts.length} contact(s)`),
    f('Contact with email', withEmail > 0, 10, `${withEmail} with email`),
    f('Contact with phone', withPhone > 0, 8, `${withPhone} with phone`),
    f('Contact with designation', withTitle > 0, 7, `${withTitle} with title`),
    f('Multiple contacts (3+)', contacts.length >= 3, 10, `${contacts.length} contact(s)`),
    f('Open deal in pipeline', open.length > 0, 12, `${open.length} open`),
    f('Weighted pipeline > 0', weighted > 0, 8),
    f('Closed-won history', wonValue > 0, 10),
    f('Focus account', company.focus, 5),
    f('ISR engaged', withIsr > 0, 5, `${withIsr} assigned`),
  ]

  const score = factors.reduce((s, x) => s + x.points, 0)
  return {
    score,
    band: bandFor(score),
    factors,
    metrics: {
      contacts: contacts.length,
      withEmail,
      withPhone,
      openDeals: open.length,
      openValue,
      weighted,
      wonValue,
    },
  }
}

function f(label: string, got: boolean, max: number, detail?: string): ScoreFactor {
  return { label, got, points: got ? max : 0, max, detail }
}
