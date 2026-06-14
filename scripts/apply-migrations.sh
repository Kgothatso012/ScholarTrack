#!/usr/bin/env bash
# apply-migrations.sh — guide the user through running 011, 012, 013 in
# the Supabase SQL Editor. Prints each file with copy-paste delimiters
# and the dashboard URL.
#
# Usage: bash scripts/apply-migrations.sh
#
# Does NOT execute SQL — that must happen in the dashboard (or via
# `supabase db push` once the supabase CLI is installed and linked).

set -euo pipefail

PROJECT_REF="zjcribmwgavpzycgpwva"
SQL_EDITOR_URL="https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new"
MIG_DIR="$(cd "$(dirname "$0")/.." && pwd)/supabase/migrations"

c() { printf "\033[1;36m%s\033[0m\n" "$*"; }
y() { printf "\033[1;33m%s\033[0m\n" "$*"; }
g() { printf "\033[1;32m%s\033[0m\n" "$*"; }
r() { printf "\033[1;31m%s\033[0m\n" "$*"; }

cat <<'BANNER'
============================================================
ScholarTrack migration runner
Migrations to apply: 011, 012, 013
============================================================
BANNER

c "\nOpen the SQL Editor in your browser:\n  ${SQL_EDITOR_URL}\n"

y "BEFORE YOU START — pre-flight:"
cat <<'PREFLIGHT'
  1. Confirm migrations 009 (current_user_role) and 010 (leads table)
     are already applied. They are in this repo under supabase/migrations/.
     If not, apply them first.
  2. For migration 013, pgcrypto must be enabled. Add this line at the
     very top of the editor BEFORE pasting 013:
         CREATE EXTENSION IF NOT EXISTS pgcrypto;
     (If the dashboard asks for a schema, use "extensions".)
  3. Run each migration in a SEPARATE query tab. Do not combine them.
PREFLIGHT

print_migration() {
  local file="$1"
  local title="$2"
  c "\n============================================================"
  c "  ${title}"
  c "  File: ${file}"
  c "============================================================\n"
  cat "${MIG_DIR}/${file}"
  c "\n----- END ${title} -----\n"
  g "  -> Open the SQL Editor, paste the block above, click RUN."
  y "  -> Confirm the final SELECT returns a result row before moving on.\n"
}

print_migration "011_driver_tracking_tighten.sql" "MIGRATION 011/013"
read -rp "Press ENTER after migration 011 has been applied successfully... " _
print_migration "012_trips_child_id.sql"          "MIGRATION 012/013"
read -rp "Press ENTER after migration 012 has been applied successfully... " _
print_migration "013_leads_pii_cleanup.sql"       "MIGRATION 013/013"

cat <<'FOOTER'
============================================================
All three migrations applied.

Next steps:
  1. Verify: the doctor (python3 scholartrack_doctor.py) should still
     pass 14/14.
  2. Deploy Edge Functions:
       supabase functions deploy cleanup-leads
       supabase functions deploy submit-lead
       supabase functions deploy paystack-proxy
       supabase functions deploy send-notification
  3. Schedule the cleanup-leads cron: Supabase Dashboard ->
     Database -> Cron Jobs -> New Cron Job
       schedule: 0 3 * * *  (daily at 03:00 UTC)
       command:   SELECT net.http_post(...)
                  url := '<project>.functions.supabase.co/cleanup-leads',
                  headers := jsonb_build_object('Authorization',
                    'Bearer ' || current_setting('app.cron_token'))
     (Or use pg_cron + a SQL function — see supabase/functions/cleanup-leads/index.ts)
============================================================
FOOTER
