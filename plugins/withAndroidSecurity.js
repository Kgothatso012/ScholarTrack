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
            println 'ScholarTrack: using RELEASE signing keystore at ' + ksPath
        } else {
            println 'ScholarTrack WARNING: SCHOLARTRACK_UPLOAD_KEYSTORE_PATH not set or missing — falling back to DEBUG keystore. Do NOT ship this APK.'
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }`;

    if (!/signingConfigs\s*{[\s\S]*?release\s*{/.test(src)) {
      src = src.replace(
        /(signingConfigs\s*{[\s\S]*?debug\s*{[\s\S]*?\n\s*}\s*\n)/,
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
      cfg.modResults = cfg.modResults.filter((l) => !l.startsWith(`${key}=`));
      cfg.modResults.push(`${key}=${value}`);
    };
    set('android.enableMinifyInReleaseBuilds', 'true');
    set('android.enableShrinkResourcesInReleaseBuilds', 'true');
    return cfg;
  });
}

// 3. Manifest: no backup, no cleartext traffic.
function withManifest(config) {
  return withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application?.[0];
    if (app) {
      app.$['android:allowBackup'] = 'false';
      app.$['android:usesCleartextTraffic'] = 'false';
    }
    return cfg;
  });
}

module.exports = (config) => withManifest(withMinify(withSigning(config)));
