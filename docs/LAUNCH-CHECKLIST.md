# Pasnex.ai Launch Checklist

## Launch Goal

Launch Pasnex.ai as a polished MVP with landing page, registration, onboarding, dashboard, trial automation, and admin monitoring. Real Meta/WhatsApp provider APIs will be activated in the next integration phase after approvals.

## Current Launch Scope

- Public landing page
- Register, login, forgot password, reset password
- Email verification
- Google login
- First-time onboarding
- Client dashboard
- Trial automation simulation
- Inbox, contacts, automations, analytics, billing, settings, support, team
- Admin login and admin control room
- Visitor and CTA tracking
- Support tickets and admin notes

## Pre-Launch QA

- [ ] Landing page desktop review
- [ ] Landing page mobile review
- [ ] Header nav smooth scroll and active state
- [ ] Feature cards learn-more behavior
- [ ] Solutions cards and Ask Pasnex.ai behavior
- [ ] Pricing cards and CTA links
- [ ] FAQ wording and API approval note
- [ ] Contact form submit test
- [ ] WhatsApp contact link test
- [ ] Register with fresh email
- [ ] Email verification redirect
- [ ] Login after verification
- [ ] Google login first-time flow
- [ ] Onboarding channel selection
- [ ] Dashboard loads after onboarding
- [ ] Run Trial Automation
- [ ] Inbox shows trial conversation
- [ ] Contacts shows trial lead
- [ ] Dashboard counts match conversations/messages/leads
- [ ] Admin login works only for admin
- [ ] Admin client list shows new client
- [ ] Admin client detail shows channels, automations, notes, tickets
- [ ] Support ticket create and status update
- [ ] Logout and re-login flow

## Production Environment

- [ ] `NEXT_PUBLIC_SITE_URL=https://pasnex.com`
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXT_PUBLIC_SUPPORT_EMAIL=pasnexai@gmail.com`
- [ ] `NEXT_PUBLIC_SUPPORT_PHONE=+918919052808`
- [ ] `NEXT_PUBLIC_WHATSAPP_NUMBER=918919052808`
- [ ] `OPENAI_API_KEY` for Ask Pasnex.ai real replies
- [ ] `OPENAI_MODEL`
- [ ] Resend/Supabase SMTP configured
- [ ] FormSubmit redirect points to live domain

## Supabase Configuration

- [ ] Auth site URL set to `https://pasnex.com`
- [ ] Redirect URLs include local and production routes
- [ ] Email templates branded as Pasnex.ai
- [ ] SMTP sender uses Pasnex.ai domain
- [ ] Tables created
- [ ] RLS policies verified
- [ ] Admin user restricted to Pasnex.ai admin email
- [ ] Test dummy users cleaned or archived

## Compliance And Trust

- [ ] Privacy Policy route works
- [ ] Terms route works
- [ ] Contact email visible
- [ ] Phone and WhatsApp visible
- [ ] Provider API approval note visible where needed
- [ ] Meta/WhatsApp approval pack reviewed: `docs/META-WHATSAPP-APPROVAL-PACK.md`
- [ ] No false live API claims
- [ ] No exposed secret keys in public code

## Deployment

- [ ] Final local `eslint`
- [ ] Final local `tsc --noEmit`
- [ ] Final backup zip created
- [ ] Build succeeds
- [ ] Deploy to hosting
- [ ] Connect `pasnex.com`
- [ ] SSL active
- [ ] Production smoke test

## Soft Launch

- [ ] Test with 3-5 trusted users
- [ ] Collect issues
- [ ] Fix urgent bugs
- [ ] Confirm contact/demo enquiries arrive
- [ ] Confirm admin monitoring works

## Public Launch

- [ ] Announce to initial audience
- [ ] Monitor admin visitor tracking
- [ ] Monitor register/demo/WhatsApp CTA clicks
- [ ] Follow up with interested clients
- [ ] Start Meta/WhatsApp API approval process in parallel

## Post-Launch Roadmap

- [ ] Meta Developer app setup
- [ ] Meta/WhatsApp approval recording prepared
- [ ] Instagram API integration
- [ ] Facebook/Messenger integration
- [ ] WhatsApp Cloud API integration
- [ ] Telegram bot integration
- [ ] Payment gateway
- [ ] Invoice automation
- [ ] Help center docs
- [ ] Demo video
