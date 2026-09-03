-- ISR Workspace — Cloudflare D1 schema
-- Run: npm run db:init  (local)  |  npm run db:init:remote  (production)

CREATE TABLE IF NOT EXISTS team (
  id    TEXT PRIMARY KEY,
  name  TEXT NOT NULL,
  role  TEXT NOT NULL,          -- 'ISR' | 'Sales'
  email TEXT
);

CREATE TABLE IF NOT EXISTS companies (
  id        TEXT PRIMARY KEY,
  name      TEXT NOT NULL,
  website   TEXT,
  city      TEXT,
  focus     INTEGER NOT NULL DEFAULT 0,
  notes     TEXT,
  createdAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);

CREATE TABLE IF NOT EXISTS customers (
  id            TEXT PRIMARY KEY,
  name          TEXT,
  email         TEXT,
  phone         TEXT,
  company       TEXT,           -- display name (kept for import fidelity)
  companyId     TEXT,           -- FK -> companies.id (interlink)
  title         TEXT,
  city          TEXT,
  website       TEXT,
  source        TEXT,
  status        TEXT NOT NULL DEFAULT 'New',
  focus         INTEGER NOT NULL DEFAULT 0,
  assignedIsrId TEXT,           -- FK -> team.id
  notes         TEXT,
  createdAt     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(companyId);
CREATE INDEX IF NOT EXISTS idx_customers_isr ON customers(assignedIsrId);

CREATE TABLE IF NOT EXISTS deals (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  company     TEXT NOT NULL,
  companyId   TEXT,             -- FK -> companies.id
  customerId  TEXT,             -- FK -> customers.id
  value       REAL NOT NULL DEFAULT 0,
  stage       TEXT NOT NULL,
  probability INTEGER NOT NULL DEFAULT 0,
  isrId       TEXT,             -- FK -> team.id
  salesId     TEXT,             -- FK -> team.id
  startDate   TEXT NOT NULL,
  closeDate   TEXT NOT NULL,
  notes       TEXT,
  createdAt   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_deals_company ON deals(companyId);

-- Audit / change log — every create, update, delete is recorded here.
CREATE TABLE IF NOT EXISTS activity_log (
  id       TEXT PRIMARY KEY,
  ts       TEXT NOT NULL,
  actor    TEXT,                -- who made the change
  action   TEXT NOT NULL,       -- 'create' | 'update' | 'delete' | 'import' | 'reset'
  entity   TEXT NOT NULL,       -- 'company' | 'customer' | 'deal' | 'team' | 'dataset'
  entityId TEXT,
  summary  TEXT
);
CREATE INDEX IF NOT EXISTS idx_log_ts ON activity_log(ts);
