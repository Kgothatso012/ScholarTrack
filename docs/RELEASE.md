# MalumeScholarTrack release signing & deployment

Covers the **eas.json `production` profile** and the GitHub Actions
`release.yml` workflow that wires the release keystore and runs Supabase
migrations.

## eas.json - production profile

The `production` profile builds an Android **app-bundle (AAB)** for the Play
Store (`distribution: store`, `buildType: app-bundle`). It is **not** an APK.

Signing is applied by the `withAndroidSecurity` config plugin (see
`plugins/README.md`) at `expo prebuild` time, NOT by EAS Credentials. The
plugin reads the keystore from `SCHOLARTRACK_UPLOAD_*` env vars.

Two ways to provide the keystore at build time:

### A. GitHub Actions runner build (release.yml - recommended for parity)
The runner decodes the keystore from a base64 GitHub secret to a temp file and
passes its path via `SCHOLARTRACK_UPLOAD_KEYSTORE_PATH`. The Gradle build signs
with it. `apksigner verify` then asserts the cert is not `CN=Android Debug`.

### B. EAS cloud build
EAS cloud builds do not have your keystore file. Either switch to **EAS
Credentials** (managed keystore) and remove the plugin's signing block, or run
the release build on the GitHub runner (option A).

## Required secrets

### GitHub (repo Settings Secrets and variables Actions)
| Secret | Value |
|--------|-------|
| EXPO_TOKEN | Expo access token (eas token:generate) |
| EXPO_PUBLIC_SUPABASE_URL | https://zjcribmwgavpzycgpwva.supabase.co |
| EXPO_PUBLIC_SUPABASE_ANON_KEY | anon key (rotate after RLS fix) |
| SUPABASE_ACCESS_TOKEN | supabase access-token create |
| SUPABASE_PROJECT_REF | zjcribmwgavpzycgpwva |
| SCHOLARTRACK_UPLOAD_KEYSTORE_B64 | base64 -w0 malumescholartrack-upload.keystore |
| SCHOLARTRACK_UPLOAD_STORE_PASSWORD | keystore password |
| SCHOLARTRACK_UPLOAD_KEY_ALIAS | e.g. upload |
| SCHOLARTRACK_UPLOAD_KEY_PASSWORD | key password |

### Generate the upload keystore once
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore malumescholartrack-upload.keystore \
  -alias upload -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 malumescholartrack-upload.keystore   # paste into SCHOLARTRACK_UPLOAD_KEYSTORE_B64
```
Never commit malumescholartrack-upload.keystore (it is gitignored).

## Running the release
```bash
git tag v1.2.0 && git push --tags        # triggers release.yml
# or: Actions Release Run workflow
```
The workflow:
1. supabase link + supabase db push --dry-run + supabase db push
   (applies supabase/migrations/* incl. 014_rls_lockdown.sql).
2. expo prebuild then ./gradlew bundleRelease signed with the upload keystore.
3. Fails the build if the AAB is signed with CN=Android Debug.
4. Uploads the AAB as an artifact.

## Pre-release checklist
- [ ] Migration 014 applied to production Supabase (workflow step 1 green)
- [ ] Anon key rotated in Supabase then updated in GitHub and EAS secrets
- [ ] apksigner verify --print-certs shows the upload cert (not Android Debug)
- [ ] Release AAB smoke-tested on a device before Play upload
