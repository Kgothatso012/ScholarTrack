#!/usr/bin/env bash
# launch.sh — end-to-end launch sequence for MalumeScholarTrack.
#
# Run this after you have rotated all 4 secrets (see SECRET_ROTATION.md)
# and have OAuth sessions for `supabase` and `eas`.
#
# Each step is a hard gate — do not run step N+1 until step N is green.
#
# Usage:  bash scripts/launch.sh
# Or step-by-step:  bash scripts/launch.sh <step-number>
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

c() { printf "\033[1;36m%s\033[0m\n" "$*"; }
g() { printf "\033[1;32m%s\033[0m\n" "$*"; }
r() { printf "\033[1;31m%s\033[0m\n" "$*"; }

step_login() {
  c "Step 1/10: OAuth login"
  supabase login
  eas login
}

step_link() {
  c "Step 2/10: Link Supabase project"
  c "  When prompted for the DB password, paste from"
  c "  Dashboard -> Settings -> Database -> Connection string."
  supabase link --project-ref zjcribmwgavpzycgpwva
}

step_migrations() {
  c "Step 3/10: Apply migrations 011, 012, 013"
  supabase db execute --file supabase/migrations/011_driver_tracking_tighten.sql
  supabase db execute --file supabase/migrations/012_trips_child_id.sql
  c "  Enabling pgcrypto for migration 013 (one-time)..."
  DB_URL=$(supabase status --output env 2>/dev/null | awk -F= '/^DB_URL=/{print $0}' | cut -d= -f2-)
  if [ -n "$DB_URL" ]; then
    supabase db execute --db-url "$DB_URL" --sql "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
  else
    c "  Could not auto-detect DB_URL. Run this manually in the SQL editor:"
    c "    CREATE EXTENSION IF NOT EXISTS pgcrypto;"
    read -rp "  Press ENTER once enabled... " _
  fi
  supabase db execute --file supabase/migrations/013_leads_pii_cleanup.sql
}

step_doctor() {
  c "Step 4/10: Re-run doctor (expect 14/14)"
  python3 malumescholartrack_doctor.py
}

step_deploy_functions() {
  c "Step 5/10: Deploy edge functions"
  supabase functions deploy cleanup-leads
  supabase functions deploy submit-lead
  supabase functions deploy paystack-proxy
  supabase functions deploy send-notification
}

step_cron() {
  c "Step 6/10: Schedule cleanup-leads cron (03:00 UTC daily)"
  c "  If pg_cron + pg_net are not enabled, run this first in SQL editor:"
  c "    create extension if not exists pg_cron;"
  c "    create extension if not exists pg_net;"
  read -rp "  Press ENTER once those are enabled (or skip if already)..." _
  supabase db execute --sql "
    select cron.schedule(
      'cleanup-leads-daily',
      '0 3 * * *',
      \$\$ select net.http_post(
           url:='https://zjcribmwgavpzycgpwva.functions.supabase.co/cleanup-leads',
           headers:=jsonb_build_object('Authorization','Bearer '||current_setting('app.cron_token', true))
         ); \$\$
    );
  "
}

step_rotate() {
  c "Step 7/10: Secret rotation (MANUAL — see SECRET_ROTATION.md)"
  c "  1. Supabase anon       (Dashboard -> Settings -> API -> Generate new)"
  c "  2. Supabase service_role (same screen, Generate new)"
  c "  3. Paystack            (disable sk_test_cb3c2195..., issue sk_live_)"
  c "  4. Google Maps         (delete old AIzaSyA1AB3gkzA9z..., create new)"
  read -rp "  Press ENTER once all 4 are rotated..." _
}

step_push_secrets() {
  c "Step 8/10: Push new secrets to EAS and Supabase Edge Functions"
  c "  Run the commands in SECRET_ROTATION.md step 6."
  c "  EAS secrets:"
  c "    eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value <NEW> --environment production"
  c "    eas env:create --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY --value <NEW> --environment production"
  c "  Supabase Edge Function secrets:"
  c "    supabase secrets set PAYSTACK_SECRET_KEY=sk_live_<NEW>"
  c "    supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<NEW>"
  c "    supabase secrets set SUPABASE_ANON_KEY=<NEW>"
  read -rp "  Press ENTER once secrets are pushed..." _
}

step_build() {
  c "Step 9/10: Trigger AAB build"
  eas build --platform android --profile production --clear-cache --non-interactive
}

step_submit() {
  c "Step 10/10: Submit AAB to Google Play"
  eas submit --platform android --latest --non-interactive
}

case "${1:-all}" in
  1)  step_login ;;
  2)  step_link ;;
  3)  step_migrations ;;
  4)  step_doctor ;;
  5)  step_deploy_functions ;;
  6)  step_cron ;;
  7)  step_rotate ;;
  8)  step_push_secrets ;;
  9)  step_build ;;
  10) step_submit ;;
  all)
    step_login
    step_link
    step_migrations
    step_doctor
    step_deploy_functions
    step_cron
    step_rotate
    step_push_secrets
    step_build
    step_submit
    g "Launch complete. Verify the Google Play Console for the rollout status."
    ;;
  *)
    r "Unknown step: $1 (use 1-10 or 'all')"
    exit 1
    ;;
esac
