# Supabase Setup Guide

## 1. Create Project

Create a Supabase project for Pasnex.ai and choose the nearest region to the first customer base.

Recommended first region: India/Singapore if available.

## 2. Environment Variables

Create `.env.local` from `.env.example` and fill:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Never commit `.env.local`.

## 3. Database Schema

Open Supabase SQL editor and run:

```text
docs/supabase-schema.sql
```

This creates:

- Businesses
- Profiles
- Channels
- Automations
- Leads
- Conversations
- Messages
- Invoices
- Row level security policies

## 4. Auth Settings

Enable email/password login first.

Turn on email confirmation so clients verify their email before first login.

For the register-page code verification flow, enable email OTP support and check the email template. Supabase may send either a code or a magic link depending on the template/settings. The UI supports resending and tells users to check spam.

Recommended redirect URLs:

- `http://localhost:3000`
- `http://localhost:3000/login`
- `http://localhost:3000/reset-password`
- `http://localhost:3000/forgot-password`
- `https://pasnex.com`
- `https://pasnex.com/login`
- `https://pasnex.com/reset-password`
- `https://pasnex.com/forgot-password`

## 5. Account Access Rule

New accounts are approved after email verification:

```text
register -> email verification -> login -> onboarding -> dashboard
```

Manual approval can be added later only for special enterprise review cases.

## 6. Backend Wiring Order

1. Install Supabase client.
2. Add Supabase browser/server clients.
3. Wire register form.
4. Wire login form.
5. Wire forgot password.
6. Store onboarding completion in `profiles.onboarding_completed`.
7. Protect dashboard routes.

## 7. Launch Quality Checklist

- Auth emails use Pasnex.ai brand text.
- Approval pending screen is clear.
- Password reset link works on `pasnex.com`.
- Dashboard blocks non-approved users.
- User data is separated by business workspace.
- Service role key is used only on server.
