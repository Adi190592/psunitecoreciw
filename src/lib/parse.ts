import type { Customer } from './types'

export type ParsedCustomer = Partial<
  Pick<Customer, 'name' | 'email' | 'phone' | 'company' | 'title' | 'city' | 'website'>
>

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i
const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/
const URL_RE = /\b((https?:\/\/)?(www\.)?[a-z0-9-]+\.(com|in|io|net|org|co|ai)(\.[a-z]{2,})?)\b/i

const COMPANY_SUFFIX_RE =
  /\b(ltd|limited|inc|incorporated|llc|llp|pvt|private|plc|gmbh|corp|corporation|co|company|technologies|industries|solutions|systems|enterprises)\b/i

const TITLE_RE =
  /\b(chief|ceo|cto|cfo|ciso|cio|coo|vp|vice president|head|associate head|director|manager|lead|engineer|architect|analyst|officer|president|founder|consultant|specialist|administrator|executive)\b/i

const LABELS: Record<string, keyof ParsedCustomer> = {
  name: 'name',
  'full name': 'name',
  contact: 'name',
  email: 'email',
  'e-mail': 'email',
  'email id': 'email',
  mail: 'email',
  phone: 'phone',
  mobile: 'phone',
  tel: 'phone',
  'contact number': 'phone',
  cell: 'phone',
  company: 'company',
  organisation: 'company',
  organization: 'company',
  org: 'company',
  title: 'title',
  designation: 'title',
  role: 'title',
  city: 'city',
  location: 'city',
  website: 'website',
  site: 'website',
  web: 'website',
  url: 'website',
}

function cleanPhone(raw: string): string {
  return raw.replace(/[^\d+]/g, (ch) => (ch === '+' ? '+' : '')).length >= 8
    ? raw.trim()
    : raw.trim()
}

/**
 * Extract structured customer fields from a pasted block of free text — an
 * email signature, footer, or a few labeled lines. Labeled lines win; the rest
 * is detected heuristically.
 */
export function parseCustomer(input: string): ParsedCustomer {
  const out: ParsedCustomer = {}
  const lines = input
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  const unlabeled: string[] = []

  for (const line of lines) {
    const labelMatch = line.match(/^([a-z /-]+?)\s*[:\-–]\s*(.+)$/i)
    if (labelMatch) {
      const key = labelMatch[1].trim().toLowerCase()
      const field = LABELS[key]
      if (field && labelMatch[2].trim()) {
        out[field] = labelMatch[2].trim()
        continue
      }
    }
    unlabeled.push(line)
  }

  const remaining: string[] = []
  for (const line of unlabeled) {
    if (!out.email) {
      const m = line.match(EMAIL_RE)
      if (m) {
        out.email = m[0]
        // if the whole line is just the email, don't reuse it
        if (line.replace(m[0], '').trim().length === 0) continue
      }
    }
    if (!out.phone) {
      const m = line.match(PHONE_RE)
      if (m && (m[0].replace(/\D/g, '').length >= 8)) {
        out.phone = cleanPhone(m[0])
        if (line.replace(m[0], '').trim().length === 0) continue
      }
    }
    if (!out.website) {
      const m = line.match(URL_RE)
      if (m && !EMAIL_RE.test(line)) {
        out.website = m[0]
        if (line.replace(m[0], '').trim().length === 0) continue
      }
    }
    remaining.push(line)
  }

  // Company by legal suffix
  if (!out.company) {
    const companyLine = remaining.find((l) => COMPANY_SUFFIX_RE.test(l) && l.length < 60)
    if (companyLine) out.company = companyLine
  }

  // Title by keyword
  if (!out.title) {
    const titleLine = remaining.find(
      (l) => TITLE_RE.test(l) && l !== out.company && l.length < 60,
    )
    if (titleLine) out.title = titleLine
  }

  // Name: first remaining line that isn't company/title, looks like a person
  if (!out.name) {
    const nameLine = remaining.find(
      (l) =>
        l !== out.company &&
        l !== out.title &&
        !COMPANY_SUFFIX_RE.test(l) &&
        !TITLE_RE.test(l) &&
        /^[a-z][a-z.'-]+(\s+[a-z][a-z.'-]+){0,3}$/i.test(l),
    )
    if (nameLine) out.name = nameLine
  }

  // City: a short remaining line (often "Mumbai, India")
  if (!out.city) {
    const cityLine = remaining.find(
      (l) =>
        l !== out.name &&
        l !== out.company &&
        l !== out.title &&
        l.split(/\s+/).length <= 4 &&
        /^[a-z ,.'-]+$/i.test(l),
    )
    if (cityLine) out.city = cityLine.split(',')[0].trim()
  }

  return out
}

export const EXAMPLE_PASTE = `Rohit Vishwakarma
Associate Head - IT
Perfetti Van Melle
rohit.vishwakarma@perfetti.com
+91 97110 03473
Mumbai, India`
