/**
 * withAndroidSecurity — Expo config plugin (security hardening from the
 * adversarial APK audit, 2026-07-24).
 *
 * The `android/` directory is gitignored (expo prebuild regenerates it), so
 * gradle/manifest edits must be injected here to survive prebuild and apply on
 * clean EAS cloud builds. This plugin uses only official expo config mods.
 *
 * Applied:
 *   1. Release builds use a dedicated upload keystore (env/gradle.properties),
 *      never the Android debug keystore; fallback to debug prints a warning.
 *   2. Release builds are minified + resource-shrunk (strip dead code, incl. the
 *      RN dev packager/debugger classes) and never debuggable.
 *   3. allowBackup=false, usesCleartextTraffic=false on <application>.
 *
 * Release keystore env vars (set as EAS/CI secrets, never commit):
 *   SCHOLARTRACK_UPLOAD_KEYSTORE_PATH / SCHOLARTRACK_UPLOAD_STORE_PASSWORD
 *   SCHOLARTRACK_UPLOAD_KEY_ALIAS      / SCHOLARTRACK_UPLOAD_KEY_PASSWORD
 */

const {
  withAppBuildGradle,
  withGradleProperties,
  withAndroidManifest,
} = require('expo/config-plugins');

// 1. Release signing config + harden the release build type.
function withSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let src = cfg.modResults.contents;

    // Inject a `release` signingConfig after the `debug` one (idempotent).
    const releaseSign = `
    release {
        def ksPath = System.getenv('SCHOLARTRACK_UPLOAD_KEYSTORE_PATH') ?: findProperty('SCHOLARTRACK_UPLOAD_KEYSTORE_PATH')
        if (ksPath != null && !ksPath.toString().isEmpty() && new File(ksPath.toString()).exists()) {
            storeFile file(ksPath.toString())
            storePassword System.getenv('SCHOLARTRACK_UPLOAD_STORE_PASSWORD') ?: findProperty('SCHOLARTRACK_UPLOAD_STORE_PASSWORD') ?: ''
            keyAlias System.getenv('SCHOLARTRACK_UPLOAD_KEY_ALIAS') ?: findProperty('SCHOLARTRACK_UPLOAD_KEY_ALIAS') ?: ''
            keyPassword System.getenv('SCHOLARTRACK_UPLOAD_KEY_PASSWORD') ?: findProperty('SCHOLARTRACK_UPLOAD_KEY_PASSWORD') ?: ''
            println 'MalumeScholarTrack: using RELEASE signing keystore at ' + ksPath
        } else {
            throw new GradleException('MalumeScholarTrack: SCHOLARTRACK_UPLOAD_KEYSTORE_PATH not set or keystore missing. Release builds must be signed with the upload keystore; refusing to fall back to the debug keystore. Set the SCHOLARTRACK_UPLOAD_* env vars (or ~/.gradle/gradle.properties) before building a release.')
        }
    }`;

    // ponytail: bug-fix 2026-08-10 — the previous test regex `[\s\S]*?release\s*{`
    // false-matched on `release {` inside `buildTypes { ... }` later in the file,
    // so the release signing block was never injected. Restrict both tests to
    // content within a single brace pair (no nested `{}`).
    if (!/signingConfigs\s*\{[^{}]*release\s*\{/.test(src)) {
      src = src.replace(
        /(signingConfigs\s*\{[^{}]*?debug\s*\{[^{}]*?\n\s*}\s*\n)/,
        `$1${releaseSign}\n`
      );
    }

    // Point release buildType at the release signing config.
    src = src.replace(
      /(release\s*{[\s\S]*?)signingConfig\s+signingConfigs\.debug/,
      `$1signingConfig signingConfigs.release`
    );

    cfg.modResults.contents = src;
    return cfg;
  });
}

// 2. Enable R8 minify + resource shrinking for release via gradle.properties.
function withMinify(config) {
  return withGradleProperties(config, (cfg) => {
    const set = (key, value) => {
      // gradle.properties items are { type: 'property', key, value } objects, not strings.
      cfg.modResults = cfg.modResults.filter(
        (l) => !(l.type === 'property' && l.key === key)
      );
      cfg.modResults.push({ type: 'property', key, value });
    };
    set('android.enableMinifyInReleaseBuilds', 'true');
    set('android.enableShrinkResourcesInReleaseBuilds', 'true');
    return cfg;
  });
}

// 3. Manifest: no backup, no cleartext traffic; strip unused permissions
    //    (Play Store requires justification — RECORD_AUDIO / SYSTEM_ALERT_WINDOW
    //    have no usage in this app and must not ship).
function withManifest(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    const STRIP = new Set([
      'android.permission.RECORD_AUDIO',
      'android.permission.SYSTEM_ALERT_WINDOW',
    ]);
    if (!Array.isArray(manifest['uses-permission'])) {
      manifest['uses-permission'] = [];
    }
    manifest['uses-permission'] = manifest['uses-permission'].filter(
      (p) => !STRIP.has(p?.$?.['android:name'])
    );
    // Add the permissions the background driver-tracking task needs (these
    // ARE used by Location.startLocationUpdatesAsync — declared here so they
    // survive prebuild, and so the manifest source is the plugin, not the
    // gitignored android/ tree).
    const ADD_PERMS = [
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_LOCATION',
      'android.permission.ACCESS_BACKGROUND_LOCATION',
    ];
    const present = new Set(manifest['uses-permission'].map((p) => p?.$?.['android:name']));
    for (const name of ADD_PERMS) {
      if (!present.has(name)) {
        manifest['uses-permission'].push({ $: { 'android:name': name } });
      }
    }
    const app = manifest.application?.[0];
    if (app) {
      app.$['android:allowBackup'] = 'false';
      app.$['android:usesCleartextTraffic'] = 'false';
    }
    return cfg;
  });
}

module.exports = (config) => withManifest(withMinify(withSigning(config)));
