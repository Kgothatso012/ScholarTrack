#!/usr/bin/env bash
# set-secrets.sh — write the 4 rotated secrets into .env (mode 600, gitignored).
#
# Secrets are read at the terminal (input hidden), never echoed, and never
# pass through this script's stdout. After it runs, only the .env file holds
# them.
#
# Usage:   bash scripts/set-secrets.sh
# Order:   1. Rotate the 4 secrets in their consoles (see SECRET_ROTATION.md)
#          2. Run this script, paste each value when prompted
#          3. Rebuild: cd android && ./gradlew assembleRelease
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

ENV_FILE=.env
EXAMPLE=.env.example

[ -f "$ENV_FILE" ] || { echo "No .env found. Copying from $EXAMPLE..."; cp "$EXAMPLE" "$ENV_FILE"; }

# Make sure Supabase URL is preserved (it's a public value, not a secret)
SUPABASE_URL=$(grep '^EXPO_PUBLIC_SUPABASE_URL=' "$ENV_FILE" 2>/dev/null | head -1 | cut -d= -f2-)
if [ -z "$SUPABASE_URL" ] || [ "$SUPABASE_URL" = "https://your-project.supabase.co" ]; then
  SUPABASE_URL="https://zjcribmwgavpzycgpwva.supabase.co"
  echo "Setting EXPO_PUBLIC_SUPABASE_URL to $SUPABASE_URL"
fi

echo
echo "Paste each value, then press ENTER. Input is hidden."
echo

# Anon
while true; do
  read -rsp "1/3  Supabase anon key      (eyJ...): " ANON; echo
  case "$ANON" in
    eyJ*) break ;;
    *) echo "  Doesn't look like a JWT. Try again (or Ctrl-C to abort)." ;;
  esac
done

# Google Maps
while true; do
  read -rsp "2/3  Google Maps API key     (AIza...): " GMAPS; echo
  case "$GMAPS" in
    AIza*) break ;;
    *) echo "  Doesn't start with AIza. Try again (or Ctrl-C to abort)." ;;
  esac
done

# Paystack (live only)
while true; do
  read -rsp "3/3  Paystack LIVE secret    (sk_live_...): " PAYSTACK; echo
  case "$PAYSTACK" in
    sk_live_*) break ;;
    *) echo "  Must be a LIVE key (sk_live_...). Try again (or Ctrl-C to abort)." ;;
  esac
done

# Optional: service_role
echo
read -rsp "OPTIONAL  Supabase service_role key (eyJ..., or ENTER to skip): " SVC; echo
if [ -n "$SVC" ]; then
  case "$SVC" in
    eyJ*) : ;;
    *) echo "  Doesn't look like a JWT; skipping."; SVC= ;;
  esac
fi

# Rewrite .env: keep EXPO_PUBLIC_SUPABASE_URL, replace the 3 secrets
TMP=$(mktemp)
{
  echo "# MalumeScholarTrack .env — written by scripts/set-secrets.sh on $(date -Iseconds)"
  echo "# DO NOT COMMIT. Mode 600. Gitignored."
  echo
  echo "EXPO_PUBLIC_SUPABASE_URL=$SUPABASE_URL"
  echo "EXPO_PUBLIC_SUPABASE_ANON_KEY=$ANON"
  echo "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=$GMAPS"
  echo "EXPO_PUBLIC_PAYSTACK_SECRET_KEY=$PAYSTACK"
  if [ -n "$SVC" ]; then
    echo "SUPABASE_SERVICE_ROLE_KEY=$SVC"
  fi
} > "$TMP"
mv "$TMP" "$ENV_FILE"
chmod 600 "$ENV_FILE"

echo
echo "Wrote secrets to $ENV_FILE (mode 600). File size: $(stat -c %s "$ENV_FILE") bytes."
echo
echo "Next:"
echo "  cd android && ./gradlew assembleRelease"
echo
echo "Confirm values are baked in:"
echo "  unzip -p $ENV_FILE  # nope, this is .env, not an APK"
echo "  aapt2 dump badging android/app/build/outputs/apk/release/app-release.apk | grep -i package"
