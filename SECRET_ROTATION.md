# MalumeScholarTrack — Secret Rotation Runbook

Four secrets were either exposed in git history or are about to be reused
in production. Rotate all four in the order below, then push the new
values into EAS and Supabase Edge Functions.

**Window:** do steps 1-5 in under 5 minutes to minimize the gap where
both old and new keys are valid.

**Order matters.** Rotate Supabase anon FIRST, because the client app
will start rejecting the old key the moment you click "Generate new" —
you must update EAS and ship a new build before mobile users get logged
out. Paystack and Google Maps rotations are non-breaking (server-side).

---

## 1. Supabase — rotate anon key

**URL:** https://supabase.com/dashboard/project/zjcribmwgavpzycgpwva/settings/api

1. Sign in.
2. **Project Settings → API**.
3. Locate the **Project API keys** section.
4. Click **"Generate new"** next to "anon" (or use the "Roll" button).
   - This invalidates the current anon key immediately. All in-flight
     mobile sessions that hold the old key will start getting 401s.
5. Copy the new anon JWT (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`).
6. **Do not** paste it anywhere yet — continue to step 6 (push to EAS).

> Note: rotating anon also rotates the underlying JWT signing secret.
> Your old `eyJ...Sra6t4NVlY` token from git history is now worthless
> even if scraped.

---

## 2. Supabase — rotate service_role key (defensive)

> The service_role key never leaked from git, but we rotate it now
> because the anon rotation also rotates the JWT secret, and any
> service_role-bearing session that was issued under the old secret
> must be reissued.

**Same URL:** https://supabase.com/dashboard/project/zjcribmwgavpzycgpwva/settings/api

1. Click **"Generate new"** next to "service_role".
2. Copy the new service_role JWT.
3. Continue to step 6 (push to Supabase Edge Function secrets).

---

## 3. Paystack — disable test key, issue live key

**URL:** https://dashboard.paystack.co/#/settings/api

1. Sign in to Paystack.
2. **Settings → API Keys & Webhooks**.
3. **Disable** the test key whose suffix starts `cb3c2195...`
   (the one that leaked in git history).
   - "Disable" stops it from being usable, but keeps the row in your
     audit log. This is what you want — the key is now permanently
     dead even if a scraper has it.
4. **Generate** a new **live** key (`sk_live_...`).
   - Note: this requires your Paystack account to be fully verified
     (BVN, business documents). If you have not completed Paystack
     business verification, you'll get a `sk_test_` again — that is
     expected for sandbox testing. Production Android builds MUST
     use a `sk_live_` key, otherwise real parents will see test-mode
     payment screens.
5. Copy the new key.
6. Continue to step 6 (push to Supabase Edge Function secrets).

---

## 4. Google Cloud — rotate Maps API key

**URL:** https://console.cloud.google.com/google/maps-apis/credentials

1. Sign in to Google Cloud Console.
2. Select the project that owns the Maps key (look for billing alerts
   on this project before continuing).
3. **APIs & Services → Credentials**.
4. Find the key with the **"AIzaSyA1AB3gkzA9z..."** prefix in the
   API key list.
5. Click the key, then **"RESTRICT KEY"** to:
   - Set application restriction: **Android apps**.
   - Add the package name `com.malumescholartrack.app` and your SHA-1
     fingerprint (get it with `keytool -list -v -keystore ~/.gradle/...`).
   - Restrict APIs to: Maps SDK for Android, Places API (if used).
   - Save.
6. **Delete the key** (trash icon). This invalidates it immediately.
7. **Create credentials → API key** to mint a new one. The new key is
   unrestricted by default — repeat step 5's restrictions on it
   before saving.
8. Copy the new `AIzaSy...` key.
9. Continue to step 6.

---

## 5. Optional — Supabase JWT_SECRET

> Only do this if you have your own backend (backend/ in this repo).
> Skipping is safe for Expo-only apps.

**URL:** https://supabase.com/dashboard/project/zjcribmwgavpzycgpwva/settings/api

1. Scroll to **JWT Settings → JWT Secret**.
2. Click **"Generate new"**.
3. This invalidates ALL existing user sessions — every parent, driver,
   and admin gets logged out. Coordinate the roll with a known
   low-traffic window (e.g. 02:00 SAST).
4. Copy the new secret to your local `backend/.env`:
   `JWT_SECRET=<new-secret>`.

---

## 6. Push new values to EAS and Edge Functions

Run these in your local terminal **after** the previous 4 rotations.
Replace `<NEW>` with the values copied above.

```bash
# 6a. EAS — what the mobile app reads at build time
eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "<NEW anon>" --environment production
eas env:create --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY --value "<NEW gmaps>" --environment production

# 6b. Supabase Edge Functions — what the server reads at runtime
supabase secrets set PAYSTACK_SECRET_KEY=sk_live_<NEW>
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<NEW service_role>
supabase secrets set SUPABASE_ANON_KEY=<NEW anon>

# 6c. Local .env (for `npm start` dev)
echo "EXPO_PUBLIC_SUPABASE_ANON_KEY=<NEW anon>"   >> .env
echo "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=<NEW gmaps>" >> .env
echo "EXPO_PUBLIC_PAYSTACK_SECRET_KEY=sk_live_<NEW>" >> .env
chmod 600 .env
```

> The pre-commit hook will fail if you paste a `sk_live_`, `sk_test_`,
> `AIzaSy`, or `eyJhbGciOi` literal into a tracked file. That's by
> design — keep secrets in EAS / Edge Function secrets / `.env`, not
> in source.

---

## 7. Trigger a clean build

```bash
eas build --platform android --profile production --clear-cache
```

The `production` profile in `eas.json` produces an AAB (set by codex).
Submit the resulting AAB to Google Play.

---

## Verification

After the build ships:

```bash
# Old Paystack key should be dead:
curl -s https://api.paystack.co/transaction \
  -H "Authorization: Bearer <OLD_PAYSTACK_KEY>" | jq .

# Expected: {"status":false,"message":"Invalid key"}

# Old Google Maps key should be dead:
curl -s "https://maps.googleapis.com/maps/api/js?key=<OLD_GMAPS_KEY>" | head -c 200

# Expected: HTML containing "API key not valid"

# Old Supabase anon key should be dead (returns 401):
curl -s -o /dev/null -w "%{http_code}\n" \
  "https://zjcribmwgavpzycgpwva.supabase.co/rest/v1/profiles" \
  -H "apikey: <OLD_ANON_KEY>"

# Expected: 401
```

All three checks should fail. If any succeed, the old key is still
accepted — investigate before declaring rotation complete.

---

## Rollback

If the rotation breaks something in production, your recovery path is
the EAS / Supabase secrets — the old keys are dead, but you can:

1. Re-issue from the same dashboard (Paystack, Google, Supabase all
   allow re-generating without rate limits).
2. Push the new value to EAS / Edge Function secrets.
3. Trigger a hotfix build (or just restart Edge Functions).

You cannot "un-rotate" — once a key is rolled, the old token is dead
for everyone, including you.
