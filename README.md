# Lumière — Wedding Photography CRM

A complete CRM for wedding photography studios — clients, events, vendors, payments, tasks, deliverables, and accounting in one place. Built with React + Vite + Tailwind + Supabase.

---

## Quick Setup (15 minutes)

### Step 1 — Supabase Project

1. Go to https://supabase.com and sign up (free tier is enough).
2. Click **New Project**. Pick any name, set a strong DB password, choose a region close to you (e.g., Mumbai).
3. Wait 2 minutes for the project to provision.
4. In your project dashboard, go to **SQL Editor** → **New query**.
5. Open `supabase_schema.sql` from this folder. Copy the entire contents and paste into the SQL editor.
6. Click **Run** (or press Ctrl/Cmd + Enter). All tables, triggers, indexes, and security policies get created.

### Step 2 — Get your API keys

1. In Supabase dashboard, go to **Project Settings** → **API**.
2. Copy these two values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public key** (long string starting with `eyJ…`)

### Step 3 — Configure email auth (magic link)

1. Go to **Authentication** → **Providers** in Supabase.
2. **Email** should already be enabled — make sure "Enable Email Signup" is on.
3. Go to **Authentication** → **URL Configuration**.
4. Set **Site URL** to `http://localhost:5173` (for development).
5. Add `http://localhost:5173` to **Redirect URLs** as well.

### Step 4 — Invite your team

1. Go to **Authentication** → **Users** → **Add user** → **Send invitation**.
2. Enter your team's email addresses one by one. They'll receive a magic link to sign in.

### Step 5 — Run the app locally

```bash
cd wedding-crm
cp .env.example .env
```

Now open `.env` and paste your two values:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here
```

Install and run:

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser. Enter your email, click "Send magic link", check your inbox, click the link — you're in!

---

## What's inside

```
wedding-crm/
├── supabase_schema.sql      ← Run once in Supabase SQL Editor
├── package.json             ← Dependencies
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── .env.example             ← Copy to .env and fill in
└── src/
    ├── main.jsx             ← Entry point
    ├── App.jsx              ← Auth wrapper + routing
    ├── supabaseClient.js    ← Supabase connection
    ├── dataHooks.js         ← Centralized data fetching
    ├── utils.js             ← Formatters, constants
    ├── index.css            ← Tailwind + fonts
    └── components/
        ├── AuthScreen.jsx   ← Magic link login
        ├── Sidebar.jsx
        ├── UI.jsx           ← Modal, Field, Buttons, etc.
        ├── Forms.jsx        ← All add/edit forms
        └── Views.jsx        ← All section views
```

---

## Features

**Dashboard** — Income/expense/profit stats, upcoming events grouped by date with assigned photographer, recent activity feed (auto-populated), overdue and upcoming tasks.

**Clients** — Project list with wedding date, photographer, booking, received, pending. Click any client → detail page with 6 tabs (Overview, Events, Payments, Vendors, Tasks, Deliverables). Add/edit/delete everything.

**Vendors** — List with billed/paid/pending. Click any vendor → full project history with payment timeline.

**Tasks** — Filterable by status, scope (project/internal), assignee. Toggle deliverable from any task. Project tasks and internal tasks both supported.

**Deliverables** — All deliverables in one place (standalone + tasks marked as deliverable). Click client name → jump to client project.

**Accounting** — Combined income/expense ledger with full filtering (type, client, vendor, date range). Professional report-style layout. Print to PDF via browser.

**Auto activity log** — Every payment, vendor payment, task completion, and delivery automatically gets logged via Postgres triggers.

---

## Common tasks

**Add a new team member** — Supabase dashboard → Authentication → Users → Add user (send invite). They'll get a magic link.

**Reset everything** — In Supabase SQL Editor, run `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` then re-run `supabase_schema.sql`. ⚠️ This deletes all data.

**Deploy to production** — Easy options: Vercel, Netlify, Cloudflare Pages. Connect this folder, set the same `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` env vars in the host's dashboard. Don't forget to update Supabase Site URL + Redirect URLs to your production domain too.

---

## Tech stack

- **React 18** + **Vite** — fast dev server, hot reload
- **Tailwind CSS** — utility classes for styling
- **Supabase** — Postgres database + magic link auth + Row Level Security
- **lucide-react** — icons
- **Fraunces + Instrument Sans** — typography (loaded from Google Fonts)

---

## Troubleshooting

**"Supabase env vars missing" in console** → Check `.env` exists in the project root with correct values, then restart `npm run dev`.

**Magic link doesn't arrive** → Check spam folder. Verify Site URL in Supabase Auth settings includes `http://localhost:5173`.

**"Permission denied" errors when saving** → User isn't logged in, OR Row Level Security policies didn't get created. Re-run the SQL schema.

**Cannot delete vendor** → They have project assignments. Delete the assignments first, or use a different vendor.

**Date filter on clients page shows nothing** → Clients without an associated event won't match date filters. Add a Wedding event first.
