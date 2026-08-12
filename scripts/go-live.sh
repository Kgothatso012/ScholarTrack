#!/usr/bin/env bash
# MalumeScholarTrack go-live runbook — runs the remaining external steps in order.
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
echo "==> MalumeScholarTrack go-live"

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
if [ -z "${SENTRY_DSN:-}" ]; then
  echo "    SENTRY_DSN not set — create a Sentry project and re-run with SENTRY_DSN exported; init will be skipped."
else
  # Wire Sentry into App.tsx + app.json idempotently so it activates as soon
  # as the package is installed. The init is guarded by EXPO_PUBLIC_SENTRY_DSN
  # so the build stays green until a DSN is set in .env / EAS secrets.
  python3 - "$SENTRY_DSN" << 'PYEOF2'
import json, sys, re
dsn = sys.argv[1]

# App.tsx: prepend the import and a guarded init after installGlobalErrorHandler().
ap = "App.tsx"
src = open(ap, encoding="utf-8").read()
changed = False
if "sentry-expo" not in src:
    src = src.replace(
        "import { CrashScreen, installGlobalErrorHandler, getCapturedError } from './src/components/CrashScreen';",
        "import { CrashScreen, installGlobalErrorHandler, getCapturedError } from './src/components/CrashScreen';\n"
        "import * as Sentry from 'sentry-expo';",
        1,
    )
    changed = True
if "Sentry.init" not in src:
    src = src.replace(
        "installGlobalErrorHandler();",
        "installGlobalErrorHandler();\n"
        "// Sentry crash reporting — active only when EXPO_PUBLIC_SENTRY_DSN is set.\n"
        "if (process.env.EXPO_PUBLIC_SENTRY_DSN) {\n"
        "  Sentry.init({ dsn: process.env.EXPO_PUBLIC_SENTRY_DSN, tracesSampleRate: 0.2 });\n"
        "}",
        1,
    )
    changed = True
if changed:
    open(ap, "w", encoding="utf-8").write(src)
    print("    App.tsx: Sentry init wired (guarded by EXPO_PUBLIC_SENTRY_DSN).")

# app.json: add the sentry-expo plugin + the DSN to extra (idempotent).
jp = "app.json"
data = json.load(open(jp, encoding="utf-8"))
plugins = data["expo"].setdefault("plugins", [])
if "sentry-expo" not in plugins:
    plugins.append("sentry-expo")
extra = data["expo"].setdefault("extra", {})
extra["EXPO_PUBLIC_SENTRY_DSN"] = dsn
json.dump(data, open(jp, "w", encoding="utf-8"), indent=2)
open(jp, "a", encoding="utf-8").write("\n")
print("    app.json: sentry-expo plugin + EXPO_PUBLIC_SENTRY_DSN added.")
PYEOF2
  # Mirror the DSN into .env so the local build picks it up.
  grep -q "EXPO_PUBLIC_SENTRY_DSN" .env 2>/dev/null || echo "EXPO_PUBLIC_SENTRY_DSN=$SENTRY_DSN" >> .env
fi

echo "==> 5/6  Host the policy + terms (malumescholartrack.co.za/privacy & /terms)"
echo "    Push the privacy.html / terms.html in Projects/malumescholartrack-website"
echo "    to your static host, after filling the [placeholders] in legal/*.md."
echo "    (authored and ready to deploy — see legal/README.md)"

echo "==> 6/6  Build the signed AAB via CI"
echo "    Required GitHub secrets (Actions → Settings → Secrets):"
echo "      SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF"
echo "      SCHOLARTRACK_UPLOAD_KEYSTORE_B64 (base64 of your .keystore)"
echo "      SCHOLARTRACK_UPLOAD_STORE_PASSWORD, SCHOLARTRACK_UPLOAD_KEY_ALIAS"
echo "      SCHOLARTRACK_UPLOAD_KEY_PASSWORD"
echo "    Optional (hardcoded fallbacks exist in app.json):"
echo "      EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY"
echo "      EXPO_PUBLIC_GOOGLE_MAPS_API_KEY, EXPO_PUBLIC_SENTRY_DSN"
echo "    Optional (cert fingerprint check is skipped if not set):"
echo "      SCHOLARTRACK_UPLOAD_CERT_SHA256 (SHA-256 of your upload keystore cert)"
echo ""
if gh auth status >/dev/null 2>&1; then
  git push origin master
  git tag -a v1.1.1 -m "Internal testing release" || true
  git push origin v1.1.1
  echo "    Tag pushed — release.yml will build the AAB. Download the artifact."
else
  echo "    gh is not authed — run 'gh auth login', then:"
  echo "      git push origin master && git tag -a v1.1.1 -m 'Internal testing' && git push origin v1.1.1"
fi

echo "==> Done. Next: rotate the Google Maps key in the Cloud Console (can't be scripted)."
