# Pasnex.ai

AI automation platform for social conversations, lead capture, workflows, and customer support.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Main Pages

- `/` public website
- `/login`
- `/register`
- `/forgot-password`
- `/onboarding`
- `/dashboard`
- `/dashboard/channels`
- `/dashboard/automations`
- `/dashboard/inbox`
- `/dashboard/contacts`
- `/dashboard/analytics`
- `/dashboard/billing`
- `/dashboard/settings`

## Backend Roadmap

- Backend plan: `docs/backend-plan.md`
- Supabase setup: `docs/supabase-setup.md`
- Database schema: `docs/supabase-schema.sql`
- Provider webhook events SQL: `docs/supabase-provider-webhook-events.sql`
- Branded email setup: `docs/email-setup.md`
- Local run checklist: `docs/local-run-checklist.md`
- Launch checklist: `docs/LAUNCH-CHECKLIST.md`
- Provider API review plan: `docs/PROVIDER-API-REVIEW.md`

## Environment

Create `.env.local` from `.env.example` before wiring real backend services.

```bash
NEXT_PUBLIC_SITE_URL=https://pasnex.com
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Never commit `.env.local`.

## Quality Checks

```bash
npm run lint
npm run build
```

Health check:

```bash
http://localhost:3000/api/health
```
