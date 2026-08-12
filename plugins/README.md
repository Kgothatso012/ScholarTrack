# MalumeScholarTrack security config plugin

`withAndroidSecurity` applies the Android hardening from the adversarial APK
audit (2026-07-24). It is registered in `app.json` and runs during
`expo prebuild`, so it survives regeneration of the gitignored `android/` tree.

## What it does
1. **Release signing** — release builds sign with a dedicated upload keystore
   read from env/gradle properties, **not** the Android debug keystore. If the
   keystore is missing it falls back to debug and prints a loud warning; such
   APKs must never be published.
2. **Minify + shrink release** — `android.enableMinifyInReleaseBuilds=true` and
   `android.enableShrinkResourcesInReleaseBuilds=true` (R8 strips dead code,
   including the React Native dev packager/debugger classes). Release builds are
   `debuggable false`.
3. **Manifest** — `android:allowBackup=false`, `android:usesCleartextTraffic=false`.

## Wiring the release keystore
Generate once:
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore malumescholartrack-upload.keystore \
  -alias upload -keyalg RSA -keysize 2048 -validity 10000
```
Then set as **EAS secrets** (preferred) or `~/.gradle/gradle.properties`:
```
SCHOLARTRACK_UPLOAD_KEYSTORE_PATH=/path/to/malumescholartrack-upload.keystore
SCHOLARTRACK_UPLOAD_STORE_PASSWORD=*****
SCHOLARTRACK_UPLOAD_KEY_ALIAS=upload
SCHOLARTRACK_UPLOAD_KEY_PASSWORD=*****
```
Never commit the keystore or its passwords. After building, verify with
`apksigner verify --print-certs app.apk` — the owner must NOT be
`CN=Android Debug`.

## ProGuard keep rules
`android/app/proguard-rules.pro` (generated) should keep RN/Expo runtime. If a
minified release crashes, add the missing `-keep` rule there (or via a
`withDangerousMod` in this plugin) rather than disabling minify.
