# Pasnex.ai Meta and WhatsApp Approval Pack

Use this pack when preparing Pasnex.ai for real Instagram, Facebook, Messenger, and WhatsApp provider approval.

## Production URLs

- Website: `https://pasnex.com`
- Meta webhook callback: `https://pasnex.com/api/provider/meta/webhook`
- Meta OAuth callback: `https://pasnex.com/api/provider/meta/oauth/callback`
- Privacy Policy: `https://pasnex.com/privacy`
- Terms: `https://pasnex.com/terms`
- Support email: `pasnexai@gmail.com`
- Support phone: `+91 8919052808`

## Required Environment Variables

- `NEXT_PUBLIC_SITE_URL=https://pasnex.com`
- `META_APP_ID`
- `META_APP_SECRET`
- `META_WEBHOOK_VERIFY_TOKEN`
- `META_WEBHOOK_CALLBACK_URL=https://pasnex.com/api/provider/meta/webhook`
- `META_OAUTH_REDIRECT_URL=https://pasnex.com/api/provider/meta/oauth/callback`
- `META_GRAPH_API_VERSION=v21.0`
- `PROVIDER_TOKEN_ENCRYPTION_KEY`
- `PROVIDER_LIVE_DISPATCH_ENABLED=false` before approval, then `true` only after provider send QA passes

## Meta App Products

Start with the smallest permission set needed for first launch.

- Facebook Login for Business
- Webhooks
- Instagram Graph API / Instagram Messaging
- Messenger Platform, only if Messenger launch is included
- WhatsApp Cloud API, only if WhatsApp launch is included

## Permission Request Notes

Use clear wording in app review notes:

- Pasnex.ai helps business users automate and manage customer conversations from Instagram, Facebook, Messenger, and WhatsApp.
- Messages are used only to prepare replies, qualify leads, and route conversations to the business team.
- A business must connect its own approved social account before messages are received or sent.
- Pasnex.ai does not claim live provider sending until token, webhook, and provider approval are complete.

Likely Meta permissions to review:

- Instagram business messages and comments access
- Facebook Page messaging/comment access, if Facebook is included
- Messenger send/receive access, if Messenger is included
- WhatsApp Cloud API messaging access, if WhatsApp is included
- Webhook subscriptions for message, comment, and status events

## Review Screen Recording

Prepare a short screen recording with these scenes:

1. Visit `pasnex.com`.
2. Register a business account.
3. Verify email.
4. Complete onboarding and select Instagram or WhatsApp.
5. Open dashboard channels and show provider setup is marked pending, not falsely live.
6. Open admin provider events.
7. Confirm provider ID was stored automatically from Meta OAuth, or add the test provider ID manually for sandbox testing.
8. Send provider test webhook.
9. Show inbox conversation created.
10. Send a reply and show outbound attempt is logged as setup/token pending until approval.

## Test Account Notes

Prepare one test business:

- Business name: Pasnex Demo Client
- Channel: Instagram Business
- Provider test ID: `pasnex-test-instagram`
- Test customer sender id: `test_customer`
- Test message: `Hi, I want automation details.`

## Supabase SQL Required Before Provider Testing

Run these files in Supabase SQL Editor:

- `docs/supabase-provider-webhook-events.sql`
- `docs/supabase-provider-outbound.sql`

## Internal QA Before Submission

- Webhook verification GET returns the challenge text.
- Provider webhook POST stores an event in `provider_webhook_events`.
- Matching `channels.handle` creates an inbox conversation.
- Conversation stores `provider_recipient_id`.
- Inbox reply saves internally and logs `provider_outbound_messages`.
- Admin provider events shows inbound events, outbound attempts, and channel readiness.
- Client detail page shows provider ID, webhook, recipient, token, and live-send readiness.

## WhatsApp Approval Path

For WhatsApp, plan these separately:

- Create or connect Meta Business Manager.
- Add WhatsApp Business Account.
- Verify business if required by Meta.
- Add phone number and complete display name approval.
- Configure webhook callback.
- Subscribe to message and status events.
- Store phone number ID or WABA ID as the provider account ID.
- Keep outbound sending blocked until token and webhook status are live.

## Launch Blockers

Do not enable real provider sending until:

- Production domain and SSL are active.
- Meta app review is approved for the required permissions.
- Webhook callback verifies successfully.
- Provider token is stored encrypted.
- Client channel status is `connected`.
- Client webhook status is `live`.
- Recipient mapping exists from an incoming event.
- Admin outbound attempt log shows payload readiness.

## Live Outbound Switch

Pasnex.ai now prepares real Meta Graph API outbound payloads for Instagram, Facebook, Messenger, and WhatsApp. Replies remain internal unless every readiness check passes and `PROVIDER_LIVE_DISPATCH_ENABLED=true`.

Before turning it on, verify one real connected channel in this order:

1. OAuth token is stored encrypted.
2. Instagram or Facebook provider account ID is stored in `channels.handle`.
3. Webhook event creates or updates an inbox conversation.
4. Conversation has `provider_recipient_id`.
5. Channel status is `connected`.
6. Channel webhook status is `live`.
7. Admin provider events shows outbound payload readiness.
8. Enable `PROVIDER_LIVE_DISPATCH_ENABLED=true` in production env.
9. Send one small test reply and confirm provider delivery plus outbound log status `sent`.
