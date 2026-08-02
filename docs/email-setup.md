# Pasnex.ai Branded Email Setup

## Goal

Auth emails should look like they come from Pasnex.ai, not Supabase.

Recommended sender:

- `no-reply@pasnex.com` for verification and password reset
- `support@pasnex.com` for human support

## Recommended Provider

Use Resend for branded auth emails.

Why:

- Clean developer setup
- Better deliverability than default test senders
- Good for SaaS/global brand emails
- Works with Supabase custom SMTP

## Setup Steps

1. Create a Resend account.
2. Add domain: `pasnex.com`.
3. Resend will show DNS records.
4. Add those DNS records where the domain DNS is managed.
5. Wait until Resend shows domain verified.
6. Create an API key.
7. In Supabase, open Authentication -> Emails / SMTP settings.
8. Enable custom SMTP.
9. Use:

```text
Host: smtp.resend.com
Port: 587
Username: resend
Password: RESEND_API_KEY
Sender name: Pasnex.ai
Sender email: no-reply@pasnex.com
```

## Supabase Redirect URLs

Add these in Supabase URL configuration:

```text
http://localhost:3000
http://localhost:3000/register
http://localhost:3000/login
http://localhost:3000/reset-password
https://pasnex.com
https://pasnex.com/register
https://pasnex.com/login
https://pasnex.com/reset-password
```

## Verification Email Template

Subject:

```text
Verify your Pasnex.ai email
```

Body:

```html
<h2>Verify your Pasnex.ai email</h2>
<p>Welcome to Pasnex.ai. Click the button below to verify your email and continue setting up your automation workspace.</p>
<p><a href="{{ .ConfirmationURL }}">Verify Email</a></p>
<p>If you did not request this, you can ignore this email.</p>
<p>Pasnex.ai<br/>AI Automation Platform</p>
```

## Password Reset Email Template

Subject:

```text
Reset your Pasnex.ai password
```

Body:

```html
<h2>Reset your Pasnex.ai password</h2>
<p>Click the button below to create a new password for your Pasnex.ai account.</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>This link expires automatically for your security.</p>
<p>If you did not request a password reset, you can ignore this email.</p>
<p>Pasnex.ai<br/>AI Automation Platform</p>
```

## Later OTP Code Template

When we switch from magic link to OTP code, use:

```html
<h2>Your Pasnex.ai verification code</h2>
<p>Your verification code is:</p>
<h1>{{ .Token }}</h1>
<p>Enter this code on the registration page to verify your email.</p>
```

## Current Recommendation

Use magic-link verification until custom SMTP is connected and stable. After that, switch to OTP code if needed.
