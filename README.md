# ISR Workspace — Outreach & Conversation Tracking

A simple, single-user web app to **store customer details and track
conversations**. It's a static single-page app — no server, no database to
manage. Everything is saved in your browser, with JSON export/import for backup
or moving between devices.

## What's inside

| Area | What it does |
|------|--------------|
| ⚡ **Quick Add** | Paste free text (a signature, a footer, a note) → it extracts name, title, company, email, phone, city into a record you review and save. |
| 🏢 **Companies** | The company list. Each account gets a simple quality score from how complete its data is and its pipeline, with a breakdown and its linked contacts/deals. |
| 👥 **Customers** | Your contact list. Search, filter, set status, mark focus, export CSV. |
| 📊 **Deals — Gantt** | Deals on a timeline from first touch to expected close, grouped by stage / owner, with a *today* marker. |
| 📈 **Scoring** | A roll-up of data quality across all companies. |
| 🕑 **Activity** | A log of every change you make (add / edit / delete / import). |
| 🎯 **Team** | Optional ISR/Sales names for assignment; export / import / clear your data. |

The starter dataset (221 companies · 373 contacts · 69 deals) is imported from
the *Focused List — PhishSheriff* sheet and loaded on first run. Your edits
after that are kept in the browser.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build to ./dist
npm run preview    # preview the production build
```

## Deploy to Cloudflare

It's a static site, so hosting is trivial — no database, no bindings, no secrets.

```bash
npm run deploy     # builds ./dist and publishes it with Wrangler
```

If you deploy via Cloudflare's Git integration, set:

- **Build command:** `npm run build`
- **Deploy command:** `npx wrangler deploy`  (or **build output directory** `dist` for a Pages project)

## Where's my data?

In your browser's `localStorage` (key `isr-workspace:v2`). It stays on this
device and this browser. Use **Team → Export** to download a JSON backup, and
**Import** to restore it or move it to another device.

## Tech stack

React 18 · TypeScript · Vite 6 · Tailwind CSS v4. No backend, no database, no
runtime UI libraries — icons, the Gantt chart, the scoring and the free-text
parser are all hand-built.

## Project layout

```
src/
  lib/
    types.ts        data model
    store.tsx       state + localStorage persistence + change log
    seed.json       starter dataset (imported from the Focused List sheet)
    scoring.ts      company quality score
    relations.ts    links companies ↔ contacts ↔ deals
    parse.ts        free-text → contact fields (Quick Add)
  components/       ui, icons, Gantt, Score
  pages/            QuickAdd, Companies, Customers, Deals, Scoring, Activity, Team
  App.tsx           shell + navigation
wrangler.jsonc      static-assets hosting config (no server)
```
