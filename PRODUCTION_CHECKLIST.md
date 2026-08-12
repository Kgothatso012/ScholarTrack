# MalumeScholarTrack — Production Launch Checklist

This is the step-by-step to get MalumeScholarTrack from "code on a laptop" to
"live on Google Play." Read top to bottom. Don't skip steps.

## Timeline target

| Phase | Effort | Blocker |
|-------|--------|---------|
| Secrets rotation | 1-2 hours | You + access to Paystack/Supabase/Google consoles |
| Git history scrub | 30 min | Decides whether to rewrite history (destructive) |
| Apply migrations | 30 min | Supabase dashboard SQL editor |
| Pre-flight doctor | 5 min | Run `python3 malumescholartrack_doctor.py` — must be 14/14 OK |
| EAS build | 30-60 min (cloud) | eas-cli + EAS secrets set |
| Play Console setup | 1-2 hours | $25 Google Play developer fee, store listing |
| Submit for review | 1-7 days | Google's review process |

## Phase 1: Secrets rotation (do this FIRST, before anything else)

The brutal review found real secrets in git. They are now untracked from
the index but still in history. **You must rotate them.**

### 1.1 Paystack
- Log into https://dashboard.paystack.co
- Settings → API Keys & Webhooks
- Roll the **test** secret (the leaked one was `sk_test_`)
- If you ever used the leaked key in production, also roll **live**
- The new key goes in Supabase Edge Function secrets:
  ```bash
  supabase secrets set PAYSTACK_SECRET_KEY=sk_test_<NEW_KEY>
  ```
  (or `sk_live_...` when ready for production)
- The Paystack secret is **never** in the mobile app. It only lives in
  Supabase.

### 1.2 Google Maps
- Log into https://console.cloud.google.com
- APIs & Services → Credentials
- Find the leaked key (starts with `AIzaSyA1AB...`)
- **Edit it first**: add Android restriction with your SHA-1 fingerprint
  and package name `com.malumescholartrack.sa`. This is critical — without
  restrictions, anyone can use the key against your billing account.
- Then rotate the key
- New key in EAS:
  ```bash
  eas env:create --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY \
    --value <NEW_KEY> --environment production
  ```

### 1.3 Supabase anon key
- Log into https://supabase.com/dashboard
- Settings → API → "Generate new anon key"
- Update the mobile app's `EXPO_PUBLIC_SUPABASE_ANON_KEY`:
  ```bash
  eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY \
    --value <NEW_KEY> --environment production
  ```
- Old key (in `SECRETS.md` history) is now invalid; new key is the only
  one the production app accepts.

### 1.4 Other Supabase keys to check
- Service role key: rotate via Settings → API
- Database password: rotate via Settings → Database
- Update Supabase Edge Function's `SUPABASE_SERVICE_ROLE_KEY` secret:
  ```bash
  supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<NEW>
  ```

## Phase 2: Git history scrub (one-time, irreversible)

After rotation, the old secrets in git history are useless (they've been
rotated). But they're still visible to anyone with repo access. Scrub them:

```bash
# Install git-filter-repo: pip install git-filter-repo
git filter-repo --invert-paths \
  --path .env \
  --path backend/.env \
  --path SECRETS.md
git push origin --force
```

**This rewrites history. Coordinate with collaborators first.** If you
have forks or PRs, they will need to re-clone.

## Phase 3: Apply database migrations

Run in order, in the Supabase SQL Editor (https://supabase.com/dashboard → SQL):

1. `009_rls_tighten.sql` (already applied — verify)
2. `011_driver_tracking_tighten.sql` — **CRITICAL** for child safety
3. `012_trips_child_id.sql` — fixes getTripsForChild
4. `013_leads_pii_cleanup.sql` — POPIA compliance

After each, check the Supabase logs for errors. The first migration
(011) is the most important — verify by running:

```sql
SELECT policyname FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'driver_tracking';
-- Should list 5 policies, none of them "Anyone can read driver tracking"
```

## Phase 4: Deploy Edge Functions

```bash
supabase functions deploy paystack-proxy
supabase functions deploy cleanup-leads
supabase functions deploy submit-lead
supabase functions deploy send-notification

# Set the cron for leads cleanup
supabase functions schedule create cleanup-leads '0 2 * * *' \
  --command 'select 1'
```

## Phase 5: Pre-flight checks

```bash
# 1. The doctor (must be 14/14 OK)
python3 malumescholartrack_doctor.py

# 2. TypeScript check
npx tsc --noEmit

# 3. Tests
npm test

# 4. Pre-commit hook installed
bash scripts/install-precommit.sh
```

If any of these fail, do not proceed. Fix the failures first.

## Phase 6: EAS Build (production)

```bash
# Make sure you're logged in
eas login

# Build the production AAB
eas build --platform android --profile production
```

This will take 20-60 minutes. EAS will:
- Inject `EXPO_PUBLIC_*` env vars from your EAS secrets
- Sign the bundle with your upload key (managed by EAS)
- Produce an `.aab` file

Download the AAB and verify it locally:
```bash
# Install bundletool: brew install bundletool (or download from GitHub)
bundletool build-apks --bundle=app.aab --output=app.apks
bundletool install-apks --apks=app.apks
```

Smoke-test the AAB on a real device before submitting to Play.

## Phase 7: Google Play Console setup

### 7.1 Create the developer account
- Pay the $25 one-time fee at https://play.google.com/console
- Complete identity verification (can take 48 hours)

### 7.2 Create the app
- "Create app" → name "MalumeScholarTrack", default language English (South Africa)
- Free or paid: choose Free
- Accept the content declarations

### 7.3 Store listing
You'll need:
- **App name**: MalumeScholarTrack
- **Short description** (80 chars): "Real-time school transport tracking for South African parents and drivers."
- **Full description** (4000 chars): marketing copy
- **Screenshots**: minimum 2 (phone), ideally 8. Real device captures.
- **Feature graphic**: 1024x500 PNG
- **App icon**: 512x512 PNG (already in `assets/`)
- **Content rating**: complete the questionnaire
- **Target audience**: NOT "Children" (this would trigger stricter review)
- **Category**: Education or Maps & Navigation
- **Privacy policy URL**: required, host on malumescholartrack.co.za

### 7.4 Service account for EAS submit
- Google Cloud Console → IAM & Admin → Service Accounts
- Create a service account with the "Service Account User" role
- Grant it the "Release Manager" role on the Play Console project
  (Settings → Users & permissions → Invite new user)
- Download the JSON key as `google-service-account.json`
- Place it at the repo root (it's gitignored)
- The `eas.json` already references it

### 7.5 Data safety form
- "Does your app collect or share user data?" → Yes
- "Is all of the user data collected by your app encrypted in transit?" → Yes (Supabase uses TLS)
- "Do you provide a way for users to request that their data is deleted?" → Yes (Supabase dashboard, or build a profile-delete flow)
- "Does your app allow users to opt out of personalized ads?" → N/A
- For each data type: declare purpose, whether required, etc.

### 7.6 App content
- Ads: No
- COVID-19 apps: No
- Health apps: No
- Data safety: see 7.5

## Phase 8: Submit for review

```bash
# This uploads the AAB to Play Console and submits to internal testing
eas submit --platform android --profile production --latest
```

Once the build is uploaded, go to Play Console → Testing → Internal testing
and "Promote release" → Production (or keep on internal for now).

Internal testing publishes within minutes. Production review takes 1-7 days
for a first submission.

## Phase 9: Post-launch

- **Crashlytics / Sentry**: not currently configured. Recommended:
  install `@sentry/react-native` and ship crash reports from day 1.
- **Analytics**: not configured. Add `expo-analytics` or PostHog
  before opening the app to the public.
- **Support email**: monitor `support@malumescholartrack.co.za`
- **POPIA**: ensure your privacy policy reflects what migration 013
  does (90-day leads retention, no UA storage, hashed IPs).

## What you still need to do manually

I cannot do these from this sandbox:
1. Pay the $25 Google Play developer fee
2. Complete Google Play identity verification
3. Rotate secrets in their respective consoles (Paystack, Google Cloud, Supabase)
4. Apply the migrations in the Supabase SQL Editor (or via `supabase db push`)
5. Upload the AAB to Play Console
6. Take real-device screenshots for the store listing
7. Host a privacy policy at malumescholartrack.co.za/privacy

Everything in this checklist except those 7 items is now in the repo
and ready to use.
