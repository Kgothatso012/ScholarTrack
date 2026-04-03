# ScholarTrack Email Branding Setup Guide

## Current Status
- **Email Confirmation**: DISABLED (users auto-confirmed)
- **SMTP**: Default Supabase (noreply@mail.app.supabase.io)
- **Templates**: Default Supabase (no branding)

## Step 1: Enable Email Confirmation

In Supabase Dashboard:
1. Go to: https://supabase.com/dashboard/project/zjcribmwgavpzycgpwva/auth/providers
2. Find "Email" provider
3. Enable: **"Confirm email"** toggle
4. Save changes

**Result**: New signups will receive confirmation email (still generic template but functional)

---

## Step 2: Configure Custom SMTP (Optional - for full branding)

In Supabase Dashboard:
1. Go to: Settings → Infrastructure → SMTP
2. Enter your SMTP credentials:
   - Host: your-smtp-provider.com
   - Port: 587 (or 465 for SSL)
   - Username: your-smtp-username
   - Password: your-smtp-password
   - Sender email: noreply@scholartrack.co.za
   - Sender name: ScholarTrack

**Providers to consider**:
- SendGrid (recommended for SA)
- Mailgun
- AWS SES

---

## Step 3: Customize Email Templates

In Supabase Dashboard:
1. Go to: Authentication → Email Templates
2. Click "Edit" on each template
3. Apply ScholarTrack branding:

### Template Variables Available
```
{{ .ConfirmationURL }}  - Confirmation link
{{ .Token }}            - Verification token
{{ .Email }}            - User email
{{ .FirstName }}        - User first name (if set in user metadata)
{{ .RedirectURL }}      - Where to redirect after confirmation
{{ .SiteURL }}          - Your app URL
```

### Brand Colors to Use
- Primary: #002395 (SA Blue)
- Secondary: #007749 (SA Green)
- Accent: #FFB81C (SA Gold)

### Sample Template Customization

**Confirmation Email**:
```
Subject: Verify your ScholarTrack account

Body:
Welcome to ScholarTrack!

To confirm your email and activate your account, click the button below:

{{ .ConfirmationURL }}

If you didn't create this account, please ignore this email.

Safe travels,
The ScholarTrack Team

---
ScholarTrack - South Africa's Student Transport Safety App
```

---

## Verification Steps

After configuring, test with:

1. **Sign up** a new user → should receive confirmation email
2. **Request password reset** → should come from your SMTP (not Supabase)
3. **Check email source** → should show noreply@scholartrack.co.za

---

## What the App Already Supports

The app code is ready - it already passes the redirect URL:
```typescript
// RegisterScreen.tsx - line 40+
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { role, full_name: fullName, phone },
    emailRedirectTo: 'scholartrack://confirm'
  }
});

// ForgotPasswordScreen.tsx - line 40
const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
  redirectTo: 'scholartrack://reset-password',
});
```

---

## Deep Link Configuration (Required)

For the redirect URLs to work, add this to your app:

1. **app.json** - Add scheme:
```json
{
  "expo": {
    "scheme": "scholartrack"
  }
}
```

2. **In Supabase** - Add to "Redirect URLs":
   - scholartrack://confirm
   - scholartrack://reset-password
   - scholartrack://login