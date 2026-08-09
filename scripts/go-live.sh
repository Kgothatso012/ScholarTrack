#!/usr/bin/env bash
# ScholarTrack go-live runbook — runs the remaining external steps in order.
#
# Everything the agent could NOT do from the sandbox (no network / expired gh
# token / no cloud console) is here as one command. Run this on a machine with
# network, a valid `gh auth login`, and the Supabase access token linked:
#
#   supabase login
#   supabase link --project-ref zjcribmwgavpzycgpwva
#
# Then, with the secrets exported, run:
#   export SUPABASE_SERVICE_ROLE_KEY=...   # from Supabase dashboard
#   export SUPABASE_ANON_KEY=...           # public anon key (function secret for delete-user)
#   export SENTRY_DSN=...                  # optional
#   bash scripts/go-live.sh
#
# It is idempotent and safe to re-run. Review each step's output before moving on.
set -euo pipefail

cd "$(dirname "$0")/.."
echo "==> ScholarTrack go-live"

echo "==> 1/6  Apply migrations (015 geofence RLS, 016 POPIA) to the project"
npx supabase db push
echo "    Migrations applied. Verify 015/016 show in the migration history."

echo "==> 2/6  Deploy edge functions"
npx supabase functions deploy delete-user
npx supabase functions deploy cleanup-retention

echo "==> 3/6  Set function secrets (delete-user needs anon key to resolve the caller)"
: "${SUPABASE_SERVICE_ROLE_KEY:?SUPABASE_SERVICE_ROLE_KEY is required}"
: "${SUPABASE_ANON_KEY:?SUPABASE_ANON_KEY is required}"
npx supabase secrets set \
  SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY"

echo "==> 4/6  Add Sentry crash reporting (needs network)"
npx expo install sentry-expo
if [ -n "${SENTRY_DSN:-}" ]; then
  echo "    SENTRY_DSN set — add the sentry-expo plugin to app.json and init in App.tsx with this DSN."
else
  echo "    SENTRY_DSN not set — create a Sentry project and re-run with SENTRY_DSN exported."
fi

echo "==> 5/6  Host the policy + terms (scholartrack.co.za/privacy & /terms)"
echo "    Push the privacy.html / terms.html in Projects/scholartrack-website"
echo "    to your static host, after filling the [placeholders] in legal/*.md."
echo "    (authored and ready to deploy — see legal/README.md)"

echo "==> 6/6  Build the signed AAB via CI"
if gh auth status >/dev/null 2>&1; then
  git tag -a v1.1.1 -m "Internal testing release" || true
  git push origin v1.1.1
  echo "    Tag pushed — release.yml will build the AAB. Download the artifact."
else
  echo "    gh is not authed — run 'gh auth login', then push a v1.1.1 tag to trigger release.yml."
fi

echo "==> Done. Next: rotate the Google Maps key in the Cloud Console (can't be scripted)."
