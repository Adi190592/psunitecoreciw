# ISR Workspace — Customer Outreach & Deal Tracking

A single-page workspace for an ISR (Inside Sales Rep) team: capture customer
details quickly, own a master dataset you assign out for outreach, and track
every deal on a Gantt timeline with an ISR and a Sales owner on each.

## Features

### ⚡ Quick Add
Paste any free text — an email signature, a footer, a note — and the workspace
extracts and maps it into a customer record. It recognizes labeled lines
(`Company:`, `Email:`, `Phone:` …) and, when unlabeled, detects emails, phones,
websites, a person's name, a company (by legal suffix), and a job title. Review
and edit every field before saving, assign it to an ISR, and mark focus accounts.

### 👥 Customer Dataset
The master outreach repository you control. Search and filter by ISR owner,
status, or focus; assign each record to an ISR team member to build their
activity list (assigning auto-moves a *New* record to *Assigned*); flip status
inline; and **export to CSV**. Summary tiles show total, assigned, unassigned,
and focus counts.

### 📊 Deals (Gantt)
Every deal mapped on a timeline from first touch to expected close, colored by
stage, with a "today" marker. Each deal carries an **ISR owner** and a **Sales
owner**. Pipeline tiles show open, probability-weighted, and won value. Click any
bar to edit; register new deals with value, stage, probability, owners, and dates.

### 🎯 Team & Dataset control
Manage ISR and Sales members (they populate every assignment dropdown). As the
dataset owner you can **export the whole workspace to JSON**, **import** a
controlled copy to distribute to the team, or reset to sample data.

## Data & persistence
All data lives in the browser's `localStorage` (key `isr-workspace:v1`) and is
seeded with sample records on first load. Use **Team & Dataset → Export** to back
it up or share, and **Import** to load a controlled dataset. No backend required.

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build to dist/
npm run preview  # preview the production build
```

## Tech stack
React 18 · TypeScript · Vite · Tailwind CSS v4. No runtime UI libraries — icons,
the Gantt chart, and the free-text parser are all hand-built and dependency-free.

## Project layout

```
src/
  lib/
    types.ts        # data model (TeamMember, Customer, Deal)
    store.tsx       # React context + localStorage persistence + CRUD
    seed.ts         # sample data
    parse.ts        # free-text → customer field extraction (Quick Add)
    format.ts       # currency, dates, initials, date math
    exporters.ts    # CSV / JSON export
  components/
    ui.tsx          # Button, Card, Avatar, Badge, Field, Modal
    icons.tsx       # inline SVG icon set
    Gantt.tsx       # timeline chart + stage legend
  pages/
    QuickAdd.tsx    # paste-to-parse capture
    Customers.tsx   # master dataset + ISR assignment
    Deals.tsx       # pipeline stats + Gantt + deal editor
    Team.tsx        # roster + dataset export/import/reset
  App.tsx           # shell + navigation
```
