# ScholarTrack — Secrets Operations Runbook

This file is a **runbook**, not a credential store. Real credentials live in:

- **Supabase Dashboard** → Project Settings → API (anon + service keys)
- **Supabase Edge Function secrets** → set with `supabase secrets set NAME=value`
- **EAS secrets** → `eas env:create --name NAME --value VALUE --environment production`
- **Google Cloud Console** → Maps API key
- **Paystack Dashboard** → API keys (test + live)
- **Google Play Console** → Upload key (managed by EAS)

## How to get a credential when you need one

1. Open 1Password / Bitwarden and look up the entry.
2. If the entry doesn't exist, ask the team lead; they will rotate and add.
3. **Never** commit credentials to git, even in `.env`. The `.env` file
   is gitignored for a reason.

## How to rotate a credential

| Service | Rotation path |
|---------|---------------|
| Supabase anon key | Dashboard → Settings → API → "Generate new anon key" → update EAS secret + Supabase client config |
| Supabase service role | Dashboard → Settings → API → rotate (this invalidates the Edge Function's stored key) |
| Paystack secret | Dashboard → Settings → API Keys → rotate test/live → update Supabase Edge Function secret: `supabase secrets set PAYSTACK_SECRET_KEY=sk_live_...` |
| Google Maps API key | Cloud Console → APIs & Services → Credentials → restrict to package name + SHA-1, then rotate |
| Google Play upload key | EAS manages this. For manual: Play Console → Setup → App integrity → upload key reset (1 per year max) |

## Pre-commit secret scan

A `pre-commit` hook (see `scripts/install-precommit.sh`) greps the diff
for `sk_live`, `sk_test`, `AIzaSy`, `eyJhbGciOi` patterns and fails the
commit if any are present in non-`.example` files.
