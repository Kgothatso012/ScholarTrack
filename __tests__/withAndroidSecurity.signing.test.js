/**
 * withAndroidSecurity signing-config regression test.
 *
 * Regression guard for the 2026-10-20 defect: the buildType swap regex matched
 * the first `release {` in the file (the injected signingConfigs.release block),
 * so buildTypes.debug got signingConfigs.release and buildTypes.RELEASE stayed
 * on signingConfigs.debug → the shipped APK/AAB was debug-signed.
 */
const path = require('path');

const plugin = require(path.join(__dirname, '..', 'plugins', 'withAndroidSecurity.js'));
const { swapReleaseSigningConfig, releaseBuildTypeUses } = plugin.__test;

// Shape of the SDK 55 template AFTER the release signingConfig was injected —
// this is the exact input that broke in production.
const INJECTED = `
android {
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }

    release {
        def ksPath = System.getenv('SCHOLARTRACK_UPLOAD_KEYSTORE_PATH')
        storeFile file(ksPath.toString())
    }
    }

    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            // Caution! In production, you need to generate your own keystore file.
            signingConfig signingConfigs.debug
            minifyEnabled enableProguardInReleaseBuilds
        }
    }
}
`;

describe('withAndroidSecurity release signing config swap', () => {
  it('points buildTypes.release at signingConfigs.release (the production defect)', () => {
    const out = swapReleaseSigningConfig(INJECTED);
    const bt = out.slice(out.indexOf('buildTypes'));
    expect(bt).toMatch(/release\s*\{[^}]*signingConfig\s+signingConfigs\.release/);
  });

  it('removes the debug keystore from buildTypes.release', () => {
    const out = swapReleaseSigningConfig(INJECTED);
    const bt = out.slice(out.indexOf('buildTypes'));
    expect(bt).not.toMatch(/release\s*\{[^}]*signingConfig\s+signingConfigs\.debug/);
  });

  it('leaves buildTypes.debug on signingConfigs.debug', () => {
    const out = swapReleaseSigningConfig(INJECTED);
    const bt = out.slice(out.indexOf('buildTypes'));
    expect(bt).toMatch(/debug\s*\{[^}]*signingConfig\s+signingConfigs\.debug/);
  });

  it('is idempotent', () => {
    const out = swapReleaseSigningConfig(INJECTED);
    expect(swapReleaseSigningConfig(out)).toBe(out);
  });

  it('preserves the signingConfigs.release body', () => {
    const out = swapReleaseSigningConfig(INJECTED);
    expect(out).toContain("def ksPath = System.getenv('SCHOLARTRACK_UPLOAD_KEYSTORE_PATH')");
  });

  it('releaseBuildTypeUses detects the release config', () => {
    const out = swapReleaseSigningConfig(INJECTED);
    expect(releaseBuildTypeUses(out, 'signingConfigs.release')).toBe(true);
  });

  it('releaseBuildTypeUses detects the un-fixed defect shape', () => {
    expect(releaseBuildTypeUses(INJECTED, 'signingConfigs.release')).toBe(false);
  });

  it('detects a missing release buildType so the plugin throws at prebuild', () => {
    const NO_RELEASE = INJECTED.replace(
      /release\s*\{[^}]*signingConfig\s+signingConfigs\.debug[^}]*\}/,
      ''
    );
    expect(releaseBuildTypeUses(NO_RELEASE, 'signingConfigs.release')).toBe(false);
  });
});
