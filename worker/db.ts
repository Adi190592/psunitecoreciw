/// <reference types="@cloudflare/workers-types" />

export interface Env {
  DB: D1Database
  ASSETS: Fetcher
}

let schemaReady = false

/** Idempotent schema creation so the API works before `db:init` is run. */
export async function ensureSchema(db: D1Database): Promise<void> {
  if (schemaReady) return
  const stmts = [
    `CREATE TABLE IF NOT EXISTS team (id TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL, email TEXT)`,
    `CREATE TABLE IF NOT EXISTS companies (id TEXT PRIMARY KEY, name TEXT NOT NULL, website TEXT, city TEXT, focus INTEGER NOT NULL DEFAULT 0, notes TEXT, createdAt TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS customers (id TEXT PRIMARY KEY, name TEXT, email TEXT, phone TEXT, company TEXT, companyId TEXT, title TEXT, city TEXT, website TEXT, source TEXT, status TEXT NOT NULL DEFAULT 'New', focus INTEGER NOT NULL DEFAULT 0, assignedIsrId TEXT, notes TEXT, createdAt TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS deals (id TEXT PRIMARY KEY, title TEXT NOT NULL, company TEXT NOT NULL, companyId TEXT, customerId TEXT, value REAL NOT NULL DEFAULT 0, stage TEXT NOT NULL, probability INTEGER NOT NULL DEFAULT 0, isrId TEXT, salesId TEXT, startDate TEXT NOT NULL, closeDate TEXT NOT NULL, notes TEXT, createdAt TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS activity_log (id TEXT PRIMARY KEY, ts TEXT NOT NULL, actor TEXT, action TEXT NOT NULL, entity TEXT NOT NULL, entityId TEXT, summary TEXT)`,
  ]
  for (const sql of stmts) await db.exec(sql.replace(/\s+/g, ' '))
  schemaReady = true
}

export async function logActivity(
  db: D1Database,
  entry: { actor?: string; action: string; entity: string; entityId?: string; summary: string },
): Promise<void> {
  const id = 'log-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
  await db
    .prepare(
      `INSERT INTO activity_log (id, ts, actor, action, entity, entityId, summary) VALUES (?,?,?,?,?,?,?)`,
    )
    .bind(
      id,
      new Date().toISOString(),
      entry.actor ?? 'Owner',
      entry.action,
      entry.entity,
      entry.entityId ?? null,
      entry.summary,
    )
    .run()
}
