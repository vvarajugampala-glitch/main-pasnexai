# Local Run Checklist

Use this before testing or sharing a new Pasnex.ai build.

## Without Supabase

The website should still run smoothly without Supabase environment variables.

Expected behavior:

- Public website works.
- Login/register/onboarding demo flow works.
- Dashboard demo pages work.
- Dashboard auth protection is skipped until Supabase keys are added.
- `/api/health` returns `ok: true` and `supabaseConfigured: false`.

## With Supabase

After adding `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Expected behavior:

- `/api/health` returns `supabaseConfigured: true`.
- Dashboard routes require login.
- Register/login/forgot password can be wired to real Supabase auth.

## Commands

```bash
npm run lint
npm run build
```

Both should pass before backup or deployment.
