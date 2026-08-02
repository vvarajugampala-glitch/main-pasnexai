# Pasnex.ai Provider API Review Plan

This checklist prepares Pasnex.ai for real Instagram, Facebook, Messenger, WhatsApp, and Telegram provider testing.

## Current Product State

- Client can register, verify email, complete onboarding, and prepare selected channels.
- Channel cards are intentionally marked as setup/API pending until provider approval is complete.
- Real inbound/outbound social messages are not enabled until OAuth, webhooks, tokens, and app review are approved.

## Meta App Setup

Create a Meta developer app for Pasnex.ai and connect the required products:

- Instagram Graph API / Instagram Messaging
- Facebook Login for Business
- Messenger Platform, if Messenger replies are included
- WhatsApp Cloud API, if WhatsApp messaging is included
- Webhooks

Required environment values:

- `META_APP_ID`
- `META_APP_SECRET`
- `META_WEBHOOK_VERIFY_TOKEN`
- `META_WEBHOOK_CALLBACK_URL`
- `META_OAUTH_REDIRECT_URL`
- `PROVIDER_TOKEN_ENCRYPTION_KEY`

Webhook callback URL:

```text
https://pasnex.com/api/provider/meta/webhook
```

OAuth callback URL:

```text
https://pasnex.com/api/provider/meta/oauth/callback
```

Local/public test URL must be an HTTPS URL. Meta will not verify a plain localhost callback.

## Webhook Verification Test

After deployment, test the callback verification:

```text
GET /api/provider/meta/webhook?hub.mode=subscribe&hub.verify_token=YOUR_VERIFY_TOKEN&hub.challenge=pasnex_test
```

Expected response:

```text
pasnex_test
```

If the token is wrong, the endpoint returns `403`.

## Webhook Event Storage

Run this SQL once before real provider testing:

```text
docs/supabase-provider-webhook-events.sql
```

Incoming Meta webhook POST events are stored in `provider_webhook_events` with:

- provider
- event type
- provider account id
- signature verification status
- processing status and note
- raw payload
- received timestamp

If the table is missing, the route still returns `ok` to Meta and logs the storage issue, so provider retries do not flood the app during setup.

## Webhook To Inbox Mapping

The first inbox pipeline is intentionally conservative:

- It reads the Meta `entry.id` as the provider account id.
- It maps that id to `channels.handle`.
- If a matching channel is found, Pasnex.ai creates a dashboard conversation and customer message.
- If no matching channel is found, the raw event is stored only and admin can review it in `/admin/provider-events`.
- Processing statuses are `received`, `processed`, `unmapped`, or `failed`.

Before real provider testing, set the prepared channel `handle` to the provider page/account id that Meta sends in webhook `entry.id`.

## OAuth Skeleton Test

The dashboard channel page can now start a Meta OAuth redirect for prepared Instagram, WhatsApp, Facebook, and Messenger channels.

Current behavior:

- Generates a signed `state` tied to the logged-in user, business, and channel.
- Redirects to the Meta OAuth dialog.
- Receives the OAuth `code` at `/api/provider/meta/oauth/callback`.
- Updates the selected channel to `oauth_code_received` and `token_exchange_pending`.

If `META_APP_ID`, `META_APP_SECRET`, and `PROVIDER_TOKEN_ENCRYPTION_KEY` are configured, the callback exchanges the OAuth code for a Meta access token and stores it encrypted in the `channels.access_token_encrypted` column. If any value is missing, the channel stays in `token_exchange_pending`.

## App Review Evidence

Prepare one short screen recording showing:

- Client login
- Onboarding
- Selecting Instagram or WhatsApp
- Channel status showing setup pending/provider approval required
- Admin viewing provider readiness for that client
- Intended automation flow: comment/DM or message arrives, AI prepares reply, lead is captured, admin/team can review

## Permissions To Request

Exact permissions depend on the selected Meta product and final implementation. Prepare review notes for:

- Reading and managing Instagram business messages/comments
- Managing Facebook Page messages/comments, if used
- WhatsApp Business messaging through Cloud API
- Webhook event subscriptions for messages, comments, and message status

Only request permissions required for the first launch. Extra permissions can delay review.

## Before Review Submission

- Production domain is live on `https://pasnex.com`.
- Privacy Policy and Terms pages are public.
- App icon, business name, support email, and support phone are correct.
- No screen claims that a real provider is connected before approval.
- Test account and test business steps are documented.
- Webhook verify token is configured in production environment.
- Meta app secret is configured in production environment.

## After Approval

- Exchange OAuth codes for access tokens on the server.
- Store tokens securely in Supabase, never in browser/localStorage.
- Subscribe approved pages/accounts to webhooks.
- Replace setup-prepared status with connected/live only after token and webhook are valid.
- Add audit logs for every provider connection and token refresh.
