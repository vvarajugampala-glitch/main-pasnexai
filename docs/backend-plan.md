# Pasnex.ai Backend Plan

## Goal

Pasnex.ai should move from a frontend demo into a real SaaS platform where businesses can register, complete onboarding, connect channels, build automations, manage leads, and track performance.

## Recommended Stack

- Frontend: Next.js app router
- Auth and database: Supabase
- Email notifications: Resend or Supabase email templates
- File storage: Supabase Storage
- Payments: Razorpay first, Stripe later for global billing
- Integrations:
  - Meta OAuth for Instagram and Facebook
  - WhatsApp Business Cloud API
  - Telegram Bot API

## User Roles

- Owner: Full workspace control, billing, integrations, team management
- Admin: Automations, channels, inbox, analytics, team operations
- Agent: Inbox, contacts, lead follow-up
- Viewer: Read-only dashboard and reports

## Account Flow

1. User opens public website.
2. User clicks Register.
3. User creates account with business details.
4. User enters onboarding.
5. User connects first channel or skips for manual review.
6. User verifies email.
7. Verified user can login.
8. First verified login routes to onboarding if not completed.
9. Later logins route directly to dashboard.

## Auth Rules

- New registration creates a user and business workspace.
- Login is blocked by Supabase until email verification is completed.
- Manual approval can be added later for high-risk enterprise accounts.
- Forgot password sends a secure reset email.
- Google login can be enabled after core email/password flow is stable.
- Onboarding completion is stored in database, not only localStorage.

## Database Tables

### users

- id
- business_id
- full_name
- email
- role
- status
- onboarding_completed
- last_login_at
- created_at

### businesses

- id
- name
- website
- email
- phone
- country
- timezone
- status
- plan
- created_at

### channels

- id
- business_id
- type
- display_name
- handle
- status
- access_token_encrypted
- refresh_token_encrypted
- webhook_status
- connected_at

### automations

- id
- business_id
- channel_id
- name
- trigger_type
- status
- config_json
- created_by
- created_at

### leads

- id
- business_id
- channel_id
- name
- phone
- email
- source
- status
- score
- interest
- next_action
- created_at

### conversations

- id
- business_id
- channel_id
- lead_id
- status
- assigned_to
- last_message_at
- created_at

### messages

- id
- conversation_id
- sender_type
- message_text
- ai_generated
- created_at

### invoices

- id
- business_id
- plan
- amount
- currency
- status
- billing_period
- invoice_url
- created_at

## Dashboard Data Mapping

- Overview stats come from messages, automations, leads, and channels.
- Inbox reads conversations and messages.
- Contacts reads leads.
- Automations reads automation templates and saved workflows.
- Channels reads connected social accounts.
- Analytics aggregates messages, leads, response time, and conversion.
- Billing reads business plan and invoices.
- Settings updates business, team, security, and webhook settings.

## Integration Phases

### Phase 1: Auth and Database

- Supabase project setup
- Environment variables
- Database schema
- Register/login/forgot password wiring
- Account approval status
- Onboarding completion in database

### Phase 2: Dashboard Data

- Replace static dashboard data with Supabase reads
- Save leads and conversations
- Save automation templates and workflow drafts
- Add workspace-level permissions

### Phase 3: Channel Integrations

- Instagram/Facebook OAuth
- WhatsApp Cloud API setup
- Telegram bot setup
- Webhook endpoints
- Token storage and refresh

### Phase 4: Automation Engine

- Trigger matching
- AI reply generation
- Lead capture fields
- Human handoff
- Activity logs

### Phase 5: Billing

- Razorpay subscription setup
- Invoices
- Plan limits
- Usage enforcement
- Stripe support for global customers

## Immediate Next Task

Set up Supabase and connect auth pages:

1. Create Supabase project.
2. Add env variables to `.env.local`.
3. Install Supabase client package.
4. Create database schema.
5. Wire register page.
6. Wire login page.
7. Wire forgot password page.
8. Store onboarding completion in Supabase.
