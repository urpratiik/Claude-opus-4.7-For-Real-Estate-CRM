# EstateFlow CRM

A mobile-first real estate CRM built with Next.js 15, Supabase, Twilio, and Tailwind.
Capture leads from any source, **instantly bridge new leads to your sales agent**, share property photos in one tap, and track your team — all from a phone.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Quick start (local dev)](#2-quick-start-local-dev)
3. [Supabase setup](#3-supabase-setup)
4. [Environment variables](#4-environment-variables)
5. [Seeding demo data](#5-seeding-demo-data)
6. [Twilio setup (Voice + WhatsApp + SMS)](#6-twilio-setup-voice--whatsapp--sms)
7. [Email setup (Resend)](#7-email-setup-resend)
8. [Lead webhook — testing with curl & Postman](#8-lead-webhook--testing-with-curl--postman)
9. [Deploying to Vercel](#9-deploying-to-vercel)
10. [Architecture overview](#10-architecture-overview)
11. [Service modes: production vs dry-run](#11-service-modes-production-vs-dry-run)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | 20+ | We tested on 20 and 22. |
| npm / pnpm / yarn | latest | Examples below use `npm`. |
| Supabase project | free tier ok | One project per environment. |
| Supabase CLI *(optional)* | latest | For local migrations and `db push`. |
| Twilio account | trial ok | Voice + (optional) WhatsApp sandbox. |
| Resend account *(optional)* | — | For real email sending. |
| `psql` *(recommended)* | 14+ | For running `seed.sql`. |

---

## 2. Quick start (local dev)

```bash
# 1. Install
npm install

# 2. Copy env file and fill in values (Supabase is the only required block)
cp .env.example .env.local
# edit .env.local

# 3. Run migrations (see "Supabase setup" below for options)

# 4. (Optional) Seed demo data
npm run seed
psql "$SUPABASE_DB_URL" -f supabase/seed.sql

# 5. Start dev server
npm run dev
# open http://localhost:3000
```

Default service mode is `dry-run`, so you can build and demo the entire flow — including the lead-to-agent call bridge — **without configuring Twilio at all**. Calls and messages are simulated and logged to the database.

---

## 3. Supabase setup

### 3a. Create a project

1. Go to <https://supabase.com> and create a new project.
2. From **Project Settings → API**, copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` *(server-only — never expose)*
3. From **Project Settings → Database**, copy the connection string → `SUPABASE_DB_URL`.

### 3b. Run migrations

You have three options. Pick whichever fits your workflow.

**Option A — Supabase CLI (recommended):**

```bash
npm i -g supabase
supabase link --project-ref <your-project-ref>
supabase db push          # applies everything in supabase/migrations/
```

**Option B — `psql`:**

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/0001_init.sql
psql "$SUPABASE_DB_URL" -f supabase/migrations/0002_rls.sql
psql "$SUPABASE_DB_URL" -f supabase/migrations/0003_storage.sql
```

**Option C — Supabase Dashboard SQL Editor:**

Open **SQL Editor → New query**, paste each migration file in order, and run.

### 3c. Verify

In **Table Editor** you should see: `organizations`, `profiles`, `leads`, `properties`, `property_images`, `property_documents`, `lead_property_shares`, `calls`, `messages`, `followups`, `tasks`, `attendance`, `social_posts`, `activities`, `notifications`, `team_invites`, `integration_settings`.

In **Storage** you should see four buckets: `property-images`, `property-documents`, `attendance-selfies`, `social-media`.

### 3d. Auth provider

Supabase Auth comes with email/password enabled by default. No extra config is needed. If you want magic links, OAuth, or phone OTP, configure them under **Authentication → Providers**.

---

## 4. Environment variables

`.env.example` is the source of truth. Here is what each block does:

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | yes | Base URL the app runs at (e.g. `http://localhost:3000` in dev, your Vercel URL in prod). Used for share links and Twilio webhooks. |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Public anon key — used in the browser. |
| `SUPABASE_SERVICE_ROLE_KEY` | yes (server) | Bypasses RLS — used for webhook intake, Twilio callbacks, admin user management. **Never expose.** |
| `SUPABASE_DB_URL` | local only | Postgres connection string for running `seed.sql`. |
| `SERVICE_MODE` | yes | `dry-run` (default, simulates calls/SMS/email) or `production`. |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` | prod | Twilio credentials. |
| `TWILIO_PHONE_NUMBER` | prod | E.164 number (e.g. `+15551234567`). |
| `TWILIO_WHATSAPP_FROM` | optional | e.g. `whatsapp:+14155238886` (Twilio sandbox). |
| `RESEND_API_KEY` | optional | For email. |
| `EMAIL_FROM` | optional | Default sender name/address. |
| `LEAD_WEBHOOK_SECRET` | yes | Required header value for `POST /api/webhooks/leads`. |
| `OPENAI_API_KEY` | optional | For caption / description drafting. |
| `OPENAI_BASE_URL` | optional | Defaults to OpenAI; supports any compatible provider. |
| `OPENAI_MODEL` | optional | e.g. `gpt-4o-mini`. |
| `LEAD_ASSIGNMENT_MODE` | optional | `round-robin` (default), `manual`, or `least-busy`. |

> **Per-organization overrides:** every secret can also be set per organization in the **Integrations** page. The app prefers the org-level setting and falls back to env vars.

---

## 5. Seeding demo data

`npm run seed` does two things:

1. Creates 6 demo auth users (idempotent) via the Supabase admin API.
2. Reminds you to run `supabase/seed.sql` to populate the rest.

```bash
npm run seed
psql "$SUPABASE_DB_URL" -f supabase/seed.sql
```

> If you don't have `psql` locally, paste the contents of `supabase/seed.sql` into the Supabase SQL Editor.

**Demo accounts (password = `Password123!`):**

| Role | Email |
|---|---|
| Admin | `admin@acme.test` |
| Sales Manager | `manager@acme.test` |
| Sales Agent | `anita@acme.test` |
| Sales Agent | `vikram@acme.test` |
| Field Executive | `field@acme.test` |
| Social Media Mgr | `social@acme.test` |

---

## 6. Twilio setup (Voice + WhatsApp + SMS)

Skip this whole section to demo with `SERVICE_MODE=dry-run`.

### 6a. Voice (instant agent-to-lead bridge)

1. **Sign up** at <https://twilio.com> and complete phone verification.
2. **Buy a phone number** with Voice capability (Trial accounts get $15 credit).
3. **Set credentials** in `.env.local`:
   ```env
   TWILIO_ACCOUNT_SID=ACxxxx
   TWILIO_AUTH_TOKEN=xxxx
   TWILIO_PHONE_NUMBER=+15551234567
   SERVICE_MODE=production
   ```
4. **Public URL.** Twilio needs to reach your app via webhooks. In dev, expose localhost:
   ```bash
   npx ngrok http 3000
   # then set NEXT_PUBLIC_APP_URL=https://<your-ngrok-id>.ngrok.app
   ```
   In production this is your Vercel URL.
5. **No console config needed for the bridge.** The app sets the TwiML URL dynamically per call to `/api/twilio/agent-answer` and registers a status callback at `/api/twilio/status`.

**Trial account caveats:**
- You can only call **verified** numbers. Add agent and test-lead numbers under **Phone Numbers → Verified Caller IDs**.
- All Twilio voice messages start with a "trial account" preamble.

### 6b. WhatsApp (sandbox or business)

For development, use the **Twilio WhatsApp Sandbox**:

1. Go to **Messaging → Try it out → Send a WhatsApp message**.
2. Follow the join code instructions on your phone.
3. Set:
   ```env
   TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
   ```
4. The `TWILIO_PHONE_NUMBER` and `TWILIO_AUTH_TOKEN` are reused.

For production: apply for a WhatsApp Business sender via Twilio. Once approved, replace the sandbox number with your business number.

### 6c. SMS

Any Twilio number with SMS capability works automatically — no extra setup. The app uses `TWILIO_PHONE_NUMBER` as the from-address.

---

## 7. Email setup (Resend)

1. Sign up at <https://resend.com>.
2. Verify a sending domain (or use the test domain).
3. Set:
   ```env
   RESEND_API_KEY=re_xxxx
   EMAIL_FROM="EstateFlow <noreply@yourdomain.com>"
   ```

If you'd rather use SMTP, the Integration row supports SMTP config and the email service has a TODO for the SMTP path — drop in `nodemailer` when you wire it up.

---

## 8. Lead webhook — testing with curl & Postman

The webhook lives at `POST /api/webhooks/leads`.

**Headers:**
```
Content-Type: application/json
x-webhook-secret: <LEAD_WEBHOOK_SECRET>
x-organization-id: <your-org-uuid>          # required to route the lead
```

> *Tip:* the org id is in the URL when you're signed in: open **Settings → Integrations** to copy it. (Or query `organizations` in Supabase.)

**Body (per the spec):**
```json
{
  "fullName": "Rahul Sharma",
  "phone": "+919999999999",
  "email": "rahul@example.com",
  "source": "36 Acre",
  "propertyType": "Apartment",
  "budgetMin": 7500000,
  "budgetMax": 12000000,
  "preferredLocation": "Gurgaon",
  "notes": "Looking for 3BHK near Golf Course Road"
}
```

### curl

```bash
curl -X POST http://localhost:3000/api/webhooks/leads \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: $LEAD_WEBHOOK_SECRET" \
  -H "x-organization-id: $ORG_ID" \
  -d '{
    "fullName": "Rahul Sharma",
    "phone": "+919999999999",
    "email": "rahul@example.com",
    "source": "36 Acre",
    "propertyType": "apartment",
    "budgetMin": 7500000,
    "budgetMax": 12000000,
    "preferredLocation": "Gurgaon",
    "notes": "3BHK near Golf Course Rd"
  }'
```

### What happens

1. Lead is inserted into `leads`.
2. **Round-robin** picks the next available agent and sets `assigned_agent_id`.
3. **Activity log** entry created (`lead_created`, `lead_assigned`).
4. **Notification** created for the assigned agent.
5. **Bridge call** is triggered:
   - In `dry-run`: a `calls` row is inserted and immediately marked `completed` / `connected` (no real call placed).
   - In `production`: Twilio calls the agent's phone, plays `"New real estate lead from {{source}}. Press any key to connect with {{leadName}}."`, then dials the lead and bridges them in a Conference.

### Postman

Import the curl above with **Import → Raw text**, or build a request manually with the same headers and body.

### Connecting external sources

The same endpoint works for:
- **Zapier / Make** — use the "Webhook" action.
- **Facebook Lead Ads** — use Zapier or Make to forward to this endpoint.
- **Website forms** — POST directly from your form handler.
- **36 Acre / MagicBricks / Housing.com** — most have webhook export options; map their fields to the body schema.

---

## 9. Deploying to Vercel

1. Push your repo to GitHub.
2. **Import Project** on <https://vercel.com>. Pick the repo.
3. Under **Environment Variables**, add every key from `.env.example` (use your real values).
4. **Deploy.**
5. After first deploy, set `NEXT_PUBLIC_APP_URL` to your production URL (e.g. `https://estateflow.vercel.app`) and redeploy. This is required so Twilio webhooks point at the right host.
6. Configure your **Twilio number's webhook** *(optional — only needed if you also want Twilio to call your number; not used by the bridge flow)*.

**Cron / scheduled tasks** (optional): the spec mentions follow-up reminders. You can add a Vercel Cron at `vercel.json` that hits a small `/api/cron/followups` route to send reminders — left as an extension hook.

---

## 10. Architecture overview

```
estateflow-crm/
├── supabase/
│   ├── migrations/             ← schema + RLS + storage policies
│   └── seed.sql                ← demo data
├── scripts/seed.ts             ← creates demo auth users
├── src/app/
│   ├── (auth)/                 ← /login, /signup, /onboarding
│   ├── (app)/                  ← protected mobile shell (dashboard, leads, …)
│   └── api/
│       ├── webhooks/leads/     ← lead intake endpoint
│       └── twilio/             ← voice TwiML + status callbacks
├── src/components/
│   ├── ui/                     ← shadcn-style primitives
│   ├── layout/                 ← header, bottom nav, sidebar, FAB
│   ├── leads/, properties/, dashboard/, …
├── src/lib/
│   ├── supabase/{client,server,admin,middleware}.ts
│   ├── services/               ← callService, messageService, emailService,
│   │                              propertyShareService, leadAssignmentService,
│   │                              attendanceService, socialPostService, aiService
│   ├── validation/             ← Zod schemas (single source of input truth)
│   ├── db/                     ← typed read queries
│   ├── types.ts, constants.ts, utils.ts, auth.ts
└── src/server/actions/         ← server actions per module
```

### Key principles

- **RLS-first multi-tenancy.** Every table has `organization_id` + RLS policies that scope reads/writes to the caller's org.
- **Service-adapter layer.** UI never imports Twilio/Resend/OpenAI SDKs directly. Each service supports `production` and `dry-run` modes.
- **Server Actions for in-app mutations.** Route Handlers only for webhooks and Twilio TwiML.
- **Mobile-first UI.** Bottom nav + sticky FAB + WhatsApp-style action sheets. Desktop just gets a wider grid.

---

## 11. Service modes: production vs dry-run

Set globally with `SERVICE_MODE`, or per organization in **Integrations**.

| What it affects | `dry-run` | `production` |
|---|---|---|
| Twilio voice (bridge) | Inserts `calls` row, marks `completed/connected` after 142s simulated duration. | Real call: agent ring → IVR → conference → lead dial. |
| Twilio SMS / WhatsApp | Inserts `messages` row, marks `delivered`. | Real message via Twilio. |
| Resend email | Inserts `messages` row, marks `delivered`. | Real email via Resend API. |
| AI drafting | Returns a `[DRY-RUN]` stub. | Calls OpenAI-compatible `/v1/chat/completions`. |
| Social publish webhook | Marks post `published` immediately. | POSTs to `social_publish_webhook`. |

This means you can demo the **entire CRM end-to-end** — including a "new lead → agent gets called → bridge → log" flow — without spending a cent on Twilio.

---

## 12. Troubleshooting

**`row violates row-level security policy`**
You're calling Supabase with the anon client but the user has no profile yet. The signup flow creates the profile automatically; for manual data inserts, use the service-role admin client.

**`Lead webhook returns 401`**
Double-check `x-webhook-secret` matches `LEAD_WEBHOOK_SECRET` (or `webhook_secret` in `integration_settings` for that org).

**Twilio voice never connects**
- In production, `NEXT_PUBLIC_APP_URL` must be reachable from Twilio (use ngrok in dev).
- On Twilio trial, both the agent's phone and the lead's phone must be **verified caller IDs**.
- Look at `calls.notes` and `calls.status` in the DB — Twilio errors are logged there.

**Storage upload fails**
The bucket policies expect the path to start with the org id (or user id for selfies): e.g. `<organization_id>/<property_id>/file.jpg`. Always upload using that prefix.

**Seed users exist but profiles don't load**
Run `npm run seed` *after* applying migrations. The script syncs profile rows to the actual auth user ids.

---

Made with ☕ + 🏡 — happy selling.
