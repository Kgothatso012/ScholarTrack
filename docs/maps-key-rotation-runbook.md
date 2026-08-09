# Google Maps API Key Rotation Runbook

## Why this exists

The current Google Maps Android API key is hardcoded in **4 places** in the
repository (and was committed in plain text in git history):

| File | Field | Status |
|------|-------|--------|
| `app.json` | `expo.android.config.googleMaps.apiKey` | committed |
| `app.json` | `expo.extra.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | committed |
| `android/app/src/main/AndroidManifest.xml` | `<meta-data ...geo.API_KEY />` | regenerated on `expo prebuild` |
| `src/services/PlacesService.ts` | hardcoded literal in `getApiKey()` | **committed to JS bundle in APK** |

The committed key is **permanently tainted**. Every clone of the repo has it.
Once a release APK ships, the key is also in the user's installed APK and
in the JS bundle they can extract from it. Rotation is the only path
forward — purging history without rotation leaves the old key active.

## Steps (do these in order — do NOT skip ahead)

### 1. Create the new key in Google Cloud Console

1. Open https://console.cloud.google.com/google/maps-apis/credentials
2. Project: `ScholarTrack` (or whatever GCP project hosts the existing key)
3. Click **+ CREATE CREDENTIALS → API key**
4. Name: `Malume Android v1.1.1+` (include the release you're shipping for)
5. **Application restrictions**:
   - Type: **Android apps**
   - Click **Add an item**:
     - Package name: `com.scholartrack.sa`
     - SHA-1 fingerprint: **paste the release keystore SHA-1** (see step 2)
6. **API restrictions**:
   - Type: **Restrict key**
   - Select ONLY the APIs the app actually calls:
     - ✅ Maps SDK for Android
     - ✅ Places API
     - ❌ Everything else (Directions, Geocoding, etc. — disable unless used)
7. Click **Save**

### 2. Get the release keystore SHA-1

The release keystore lives at `android/app/release.keystore` (gitignored).
The SHA-1 fingerprint varies per machine unless you committed the keystore
to a secret manager — in which case use the SHA-1 from the keystore stored
in your password manager / 1Password / GitHub Secrets.

```bash
keytool -list -v -keystore ~/ScholarTrack-Expo54/android/app/release.keystore \
  -alias scholartrack -storepass <KEYSTORE_PASSWORD> 2>/dev/null \
  | grep -E "SHA1:|SHA-1:"
# Output line: SHA1: AB:CD:EF:... (40 hex chars with colons)
# Remove the colons for the GCP form: ABCDEF...
```

If you don't have the keystore password, you cannot rotate properly —
recover it from the keystore.properties file (gitignored) or your password
manager before proceeding. **Do NOT generate a new keystore** — that would
invalidate every existing install.

### 3. Disable (but don't delete yet) the old key

1. Back in Credentials, find the old key
2. Click it → click the trash icon or "Delete key" — but FIRST set
   application restrictions to block everything (delete + recreate is fine,
   disabling is reversible if you need to roll back)

For safety: **delete** the old key. GCP has a 24-hour recovery window for
deleted keys via support, so if you discover something broke, you have
time to revert.

### 4. Update the 4 in-repo locations

After the new key is created and restricted, replace the old value in:

```bash
cd ~/ScholarTrack-Expo54

# A. app.json — expo.android.config.googleMaps.apiKey (manifest source)
# B. app.json — expo.extra.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY (JS bundle source)
# Both in the same file; one sed each, OR just rewrite with the JSON tools.
python3 -c "
import json
d = json.load(open('app.json'))
new_key = 'AIza...'  # paste new key here
d['expo']['android']['config']['googleMaps']['apiKey'] = new_key
d['expo']['extra']['EXPO_PUBLIC_GOOGLE_MAPS_API_KEY'] = new_key
json.dump(d, open('app.json', 'w'), indent=2)
print('app.json updated')
"

# C. AndroidManifest.xml — needs expo prebuild --clean to regenerate from app.json
npx expo prebuild --no-install --platform android --clean
# This overwrites android/app/src/main/AndroidManifest.xml from app.json.
# Verify the new key landed:
grep -A1 "geo.API_KEY" android/app/src/main/AndroidManifest.xml | head -3

# D. src/services/PlacesService.ts — remove the hardcoded literal entirely.
#    Replace getApiKey() with: Constants.expoConfig?.extra?.googleMapsApiKey
#    ?? process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
#    (See fix already shipped in 72d1ec2.)
```

### 5. Set the key as an EAS secret (do NOT hardcode in production builds)

```bash
eas env:create --name GOOGLE_MAPS_API_KEY \
  --value "AIza...new_key..." \
  --environment production --visibility sensitive
```

Then in `app.json`, reference it as `${GOOGLE_MAPS_API_KEY}` so the
production EAS build inlines it without committing it to git.

### 6. Purge git history (BFG)

Even with rotation, the old key is in every git commit ever pushed.
Anyone who clones the repo gets it. Purge with:

```bash
cd ~/ScholarTrack-Expo54
echo "AIzaSy...old_key..." > /tmp/old-maps-keys.txt
bfg --replace-text /tmp/old-maps-keys.txt --no-blob-protection
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

If the repo is **public**, assume the old key was scraped by automated
bots within minutes of being committed. Rotate is the only real fix; BFG
is just hygiene for future contributors.

### 7. Verify the new key works end-to-end

After the new APK builds:

```bash
APK=android/app/build/outputs/apk/release/app-release.apk

# Verify the new key made it into the compiled manifest
/mnt/c/Users/Administrator/AppData/Local/Android/Sdk/build-tools/35.0.0/aapt \
  dump xmltree "$APK" AndroidManifest.xml | grep -A1 "geo.API_KEY"
# Expect: Raw: "AIzaSy...new..." (39 chars)

# Verify the JS bundle doesn't have a Maps key hardcoded literal
unzip -p "$APK" assets/index.android.bundle | strings -n 8 | grep -c "AIzaSy"
# If new key: returns >=1 (the read site)
# If old key shipped by mistake: returns the old value
```

### 8. Build + ship v1.1.1

After all of the above:

```bash
git add app.json android/app/src/main/AndroidManifest.xml \
        src/services/PlacesService.ts
git commit -m "Rotate Maps API key to v1.1.1+ restricted variant"
eas build --platform android --profile production --non-interactive \
  2>&1 | tee /tmp/eas-build.log
```

The AAB from this build is the one you ship to Internal Testing.

## Pitfalls

- **Don't skip step 3.** Disabling the old key prevents the leak from
  continuing to be billable / abusable while you do steps 4-7.
- **Don't commit the new key to public git.** Use `${GOOGLE_MAPS_API_KEY}`
  in `app.json` with an EAS secret for production. The local-only
  hardcoded fallback in `PlacesService.ts` is acceptable because the
  value is regenerated on each `expo prebuild` and lives in a file
  that's gitignored (android/) or already shipped to every device (the
  JS bundle in the APK).
- **The Maps quota warning**. If your Maps key was being abused by a
  bot using the leaked key, GCP may have already disabled it for
  "suspicious activity". Check the Maps API dashboard before assuming
  the existing key still works.
- **Don't forget the iOS key if you ship iOS later** — the runbook only
  covers Android. iOS uses a different API key with a different bundle
  ID restriction.

## Verification checklist (after rotation)

- [ ] New key created in GCP, restricted to `com.scholartrack.sa` + release SHA-1
- [ ] Only Maps SDK + Places API enabled on the new key
- [ ] Old key disabled in GCP
- [ ] `app.json` updated (2 places)
- [ ] `android/app/src/main/AndroidManifest.xml` regenerated via `expo prebuild --clean`
- [ ] `PlacesService.ts` no longer has a hardcoded key literal
- [ ] `git log -p -- app.json | grep "AIzaSy..."` returns empty
- [ ] `aapt dump xmltree ... | grep geo.API_KEY` shows the NEW key
- [ ] First production AAB builds and installs without Maps quota errors