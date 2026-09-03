/// <reference types="@cloudflare/workers-types" />
import { ensureSchema, logActivity, type Env } from './db'

const COLUMNS: Record<string, string[]> = {
  team: ['id', 'name', 'role', 'email'],
  companies: ['id', 'name', 'website', 'city', 'focus', 'notes', 'createdAt'],
  customers: [
    'id', 'name', 'email', 'phone', 'company', 'companyId', 'title', 'city',
    'website', 'source', 'status', 'focus', 'assignedIsrId', 'notes', 'createdAt',
  ],
  deals: [
    'id', 'title', 'company', 'companyId', 'customerId', 'value', 'stage',
    'probability', 'isrId', 'salesId', 'startDate', 'closeDate', 'notes', 'createdAt',
  ],
}
const BOOL_COLS = new Set(['focus'])

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

function coerceForWrite(table: string, body: Record<string, unknown>) {
  const cols = COLUMNS[table]
  const present = cols.filter((c) => c in body)
  const values = present.map((c) => {
    let v = body[c]
    if (BOOL_COLS.has(c)) v = v ? 1 : 0
    if (v === undefined) v = null
    return v as D1Type
  })
  return { present, values }
}
type D1Type = string | number | null

function mapRow<T extends Record<string, unknown>>(row: T): T {
  const out: Record<string, unknown> = { ...row }
  for (const b of BOOL_COLS) if (b in out) out[b] = !!out[b]
  return out as T
}

async function insert(db: D1Database, table: string, body: Record<string, unknown>) {
  const { present, values } = coerceForWrite(table, body)
  const placeholders = present.map(() => '?').join(',')
  await db
    .prepare(`INSERT INTO ${table} (${present.join(',')}) VALUES (${placeholders})`)
    .bind(...values)
    .run()
}

async function update(
  db: D1Database,
  table: string,
  id: string,
  body: Record<string, unknown>,
) {
  const patch = { ...body }
  delete patch.id
  const { present, values } = coerceForWrite(table, patch)
  if (present.length === 0) return
  const setClause = present.map((c) => `${c}=?`).join(',')
  await db
    .prepare(`UPDATE ${table} SET ${setClause} WHERE id=?`)
    .bind(...values, id)
    .run()
}

/** Resolve or create a company by name, returning its id (interlinking). */
async function upsertCompanyByName(
  db: D1Database,
  name: string | undefined | null,
): Promise<string | null> {
  const clean = (name ?? '').trim()
  if (!clean) return null
  const existing = await db
    .prepare(`SELECT id FROM companies WHERE lower(name)=lower(?) LIMIT 1`)
    .bind(clean)
    .first<{ id: string }>()
  if (existing) return existing.id
  const id = 'cmp-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  await db
    .prepare(`INSERT INTO companies (id,name,focus,createdAt) VALUES (?,?,?,?)`)
    .bind(id, clean, 0, new Date().toISOString())
    .run()
  await logActivity(db, {
    action: 'create',
    entity: 'company',
    entityId: id,
    summary: `Auto-created company “${clean}” from a linked record`,
  })
  return id
}

async function getState(db: D1Database) {
  const [team, companies, customers, deals, log] = await Promise.all([
    db.prepare(`SELECT * FROM team ORDER BY role, name`).all(),
    db.prepare(`SELECT * FROM companies ORDER BY name`).all(),
    db.prepare(`SELECT * FROM customers ORDER BY createdAt DESC`).all(),
    db.prepare(`SELECT * FROM deals ORDER BY startDate`).all(),
    db.prepare(`SELECT * FROM activity_log ORDER BY ts DESC LIMIT 500`).all(),
  ])
  return {
    team: team.results ?? [],
    companies: (companies.results ?? []).map(mapRow),
    customers: (customers.results ?? []).map(mapRow),
    deals: (deals.results ?? []).map(mapRow),
    log: log.results ?? [],
  }
}

async function handleApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const parts = url.pathname.replace(/^\/api\//, '').split('/').filter(Boolean)
  const [resource, id] = parts
  const method = request.method
  const db = env.DB

  const body: Record<string, unknown> =
    method === 'POST' || method === 'PUT' || method === 'PATCH'
      ? ((await request.json().catch(() => ({}))) as Record<string, unknown>)
      : {}

  // GET /api/state
  if (resource === 'state' && method === 'GET') {
    return json(await getState(db))
  }

  // PUT /api/state — replace whole dataset (JSON import)
  if (resource === 'state' && method === 'PUT') {
    const b = body as {
      team?: Record<string, unknown>[]
      companies?: Record<string, unknown>[]
      customers?: Record<string, unknown>[]
      deals?: Record<string, unknown>[]
    }
    await db.batch([
      db.prepare('DELETE FROM deals'),
      db.prepare('DELETE FROM customers'),
      db.prepare('DELETE FROM companies'),
      db.prepare('DELETE FROM team'),
    ])
    for (const t of b.team ?? []) await insert(db, 'team', t)
    for (const c of b.companies ?? []) await insert(db, 'companies', c)
    for (const c of b.customers ?? []) await insert(db, 'customers', c)
    for (const d of b.deals ?? []) await insert(db, 'deals', d)
    await logActivity(db, {
      action: 'import',
      entity: 'dataset',
      summary: `Imported dataset: ${(b.companies ?? []).length} companies, ${(b.customers ?? []).length} contacts, ${(b.deals ?? []).length} deals`,
    })
    return json(await getState(db))
  }

  // POST /api/reset — clear everything
  if (resource === 'reset' && method === 'POST') {
    await db.batch([
      db.prepare('DELETE FROM deals'),
      db.prepare('DELETE FROM customers'),
      db.prepare('DELETE FROM companies'),
      db.prepare('DELETE FROM activity_log'),
    ])
    await logActivity(db, { action: 'reset', entity: 'dataset', summary: 'Cleared all customers, companies and deals' })
    return json(await getState(db))
  }

  if (!(resource in COLUMNS)) return json({ error: 'not found' }, 404)

  // CREATE
  if (method === 'POST') {
    if ((resource === 'customers' || resource === 'deals') && !body.companyId && body.company) {
      body.companyId = await upsertCompanyByName(db, body.company as string)
    }
    await insert(db, resource, body)
    await logActivity(db, {
      action: 'create',
      entity: resource.replace(/s$/, ''),
      entityId: String(body.id ?? ''),
      summary: `Added ${resource.replace(/s$/, '')} ${describeName(resource, body)}`,
    })
    return json({ ok: true, item: body }, 201)
  }

  // UPDATE
  if (method === 'PATCH' && id) {
    if ((resource === 'customers' || resource === 'deals') && body.company && !body.companyId) {
      body.companyId = await upsertCompanyByName(db, body.company as string)
    }
    await update(db, resource, id, body)
    await logActivity(db, {
      action: 'update',
      entity: resource.replace(/s$/, ''),
      entityId: id,
      summary: `Updated ${resource.replace(/s$/, '')} ${summarizePatch(body)}`,
    })
    return json({ ok: true })
  }

  // DELETE
  if (method === 'DELETE' && id) {
    if (resource === 'team') {
      // Cascade: unassign this member everywhere
      await db.batch([
        db.prepare('UPDATE customers SET assignedIsrId=NULL WHERE assignedIsrId=?').bind(id),
        db.prepare('UPDATE deals SET isrId=NULL WHERE isrId=?').bind(id),
        db.prepare('UPDATE deals SET salesId=NULL WHERE salesId=?').bind(id),
      ])
    }
    if (resource === 'companies') {
      await db.batch([
        db.prepare('UPDATE customers SET companyId=NULL WHERE companyId=?').bind(id),
        db.prepare('UPDATE deals SET companyId=NULL WHERE companyId=?').bind(id),
      ])
    }
    await db.prepare(`DELETE FROM ${resource} WHERE id=?`).bind(id).run()
    await logActivity(db, {
      action: 'delete',
      entity: resource.replace(/s$/, ''),
      entityId: id,
      summary: `Deleted ${resource.replace(/s$/, '')} ${id}`,
    })
    return json({ ok: true })
  }

  return json({ error: 'method not allowed' }, 405)
}

function describeName(resource: string, body: Record<string, unknown>): string {
  if (resource === 'deals') return `“${body.title ?? ''}”`
  return `${body.name ?? body.company ?? ''}`.trim()
}
function summarizePatch(body: Record<string, unknown>): string {
  const keys = Object.keys(body).filter((k) => k !== 'id' && k !== 'company')
  return keys.length ? `(${keys.slice(0, 4).join(', ')})` : ''
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname.startsWith('/api/')) {
      try {
        await ensureSchema(env.DB)
        return await handleApi(request, env)
      } catch (err) {
        return json({ error: String(err instanceof Error ? err.message : err) }, 500)
      }
    }
    // Everything else → static SPA assets
    return env.ASSETS.fetch(request)
  },
} satisfies ExportedHandler<Env>
