# ISR Workspace — Outreach, Scoring & Deals on Cloudflare

A shared workspace for an ISR (Inside Sales Rep) team, running as a single
**Cloudflare Worker** that serves a React SPA **and** a JSON API backed by a
**Cloudflare D1** database. Everyone on the team works off one dataset the owner
controls — customers, companies, deals and assignments stay in sync, and every
change is written to an audit log.

## What's inside

| Area | What it does |
|------|--------------|
| ⚡ **Quick Add** | Paste free text (a signature, a footer, a note) → it extracts name, title, company, email, phone, city, website into a record. Assign an ISR and save. |
| 🏢 **Companies** | The master company repository. Every account gets a **comprehensive quality score** (0–100, banded Excellent → Poor) from data completeness + pipeline engagement, with a full factor breakdown, and its linked contacts and deals. |
| 👥 **Customers** | The outreach dataset. Filter by ISR / status / focus, assign records to ISR members (auto-moves *New* → *Assigned*), edit status inline, export CSV. |
| 📊 **Deals — Gantt** | Every deal on a timeline from first touch to expected close, colored by stage with a *today* marker. Group by **stage / ISR / Sales**, filter, and give each deal an **ISR owner and a Sales owner**. |
| 📈 **Scoring** | Portfolio scoring dashboard — average score, quality distribution, top accounts, accounts needing attention, and data-quality coverage across every scoring factor. |
| 🕑 **Activity** | Full audit log — every create / update / delete / import, who and when. |
| 🎯 **Team** | Manage ISR & Sales members; export/import the whole dataset as JSON; clear the database. |

## Interlinking

Companies, contacts and deals are linked by `companyId`. When you add a customer
or a deal with a company name that doesn't exist yet, the API **auto-creates the
company** and links it — so the master repository always reflects what you enter,
and every change lands in the audit log.

## Data model (D1)

`team`, `companies`, `customers`, `deals`, `activity_log` — see
[`schema.sql`](./schema.sql). The seeded dataset in [`seed.sql`](./seed.sql) was
generated from the *Focused List — PhishSheriff* contact sheet
(221 companies · 373 contacts · 69 deals).

## Local development

```bash
npm install
npm run db:init          # create tables in the local D1
npx wrangler d1 execute isr-workspace --local --file=./seed.sql   # load the dataset
npm run dev              # Vite + Worker + local D1 at http://localhost:5173
```

The Vite dev server runs the Worker with a local D1 (Miniflare) — the `/api`
routes and the SPA are served together, exactly as in production.

## Deploy to Cloudflare

1. **Create the D1 database** (once):
   ```bash
   npx wrangler d1 create isr-workspace
   ```
   Copy the printed `database_id` into [`wrangler.jsonc`](./wrangler.jsonc)
   (replace `REPLACE_WITH_YOUR_D1_DATABASE_ID`).

2. **Create the schema and load the data** in the remote database:
   ```bash
   npm run db:init:remote
   npx wrangler d1 execute isr-workspace --remote --file=./seed.sql   # optional seed
   ```

3. **Deploy** the Worker + assets:
   ```bash
   npm run deploy
   ```

That publishes the SPA and the API to your Worker URL, backed by D1. To update,
run `npm run deploy` again. If you connect the repo to Cloudflare's Git
integration instead, set the build command to `npm run build` and the Worker is
built from `wrangler.jsonc`.

## API (served by the Worker)

```
GET    /api/state                 → { team, companies, customers, deals, log }
POST   /api/{companies|customers|deals|team}      create (auto-links company)
PATCH  /api/{...}/:id             update
DELETE /api/{...}/:id             delete (cascades unlink)
PUT    /api/state                 replace whole dataset (JSON import)
POST   /api/reset                 clear companies, customers, deals
```

## Tech stack

React 18 · TypeScript · Vite 6 · Tailwind CSS v4 · Cloudflare Workers · D1 ·
`@cloudflare/vite-plugin`. No runtime UI libraries — icons, the Gantt chart, the
scoring engine and the free-text parser are all hand-built.

## Project layout

```
worker/            Cloudflare Worker: API router (index.ts) + D1 helpers (db.ts)
schema.sql         D1 tables
seed.sql           Imported Focused List dataset
src/
  lib/             types, api client, store (API-backed), scoring, relations, parse
  components/      ui, icons, Gantt, Score (ring/badge/factors)
  pages/           QuickAdd, Companies, Customers, Deals, Scoring, Activity, Team
  App.tsx          shell + navigation + live D1 status
wrangler.jsonc     Worker + assets + D1 binding
```
