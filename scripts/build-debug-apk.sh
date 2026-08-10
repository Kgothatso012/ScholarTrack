#!/usr/bin/env bash
# Build a debug APK for local testing — no release keystore needed.
#
# The release signing config in build.gradle throws if SCHOLARTRACK_UPLOAD_*
# env vars are unset (by design — prevents shipping debug-signed releases).
# This script points them at the Android debug keystore so the config
# phase doesn't throw, then builds assembleDebug (which uses the debug
# signing config, not release).
#
# Run from the repo root on a machine with Android SDK + Java 17:
#   bash scripts/build-debug-apk.sh
#
# Output: android/app/build/outputs/apk/debug/app-debug.apk
set -euo pipefail
cd "$(dirname "$0")/.."

# Ensure a debug keystore exists.
DEBUG_KS="$HOME/.android/debug.keystore"
if [ ! -f "$DEBUG_KS" ]; then
  echo "Creating debug keystore at $DEBUG_KS ..."
  mkdir -p "$HOME/.android"
  keytool -genkeypair -v \
    -keystore "$DEBUG_KS" \
    -alias androiddebugkey \
    -dname "CN=Android Debug,O=Android,C=US" \
    -storepass android -keypass android \
    -keyalg RSA -keysize 2048 -validity 10000
fi

# Point the release signing config at the debug keystore so Gradle's
# configuration phase doesn't throw. The debug build type uses
# signingConfigs.debug, so this has no effect on the output APK.
export SCHOLARTRACK_UPLOAD_KEYSTORE_PATH="$DEBUG_KS"
export SCHOLARTRACK_UPLOAD_STORE_PASSWORD=android
export SCHOLARTRACK_UPLOAD_KEY_ALIAS=androiddebugkey
export SCHOLARTRACK_UPLOAD_KEY_PASSWORD=android

echo "==> Prebuild (regenerate native project from app.json + plugins)"
npx expo prebuild --platform android --clean

echo "==> Gradle assembleDebug"
cd android
./gradlew assembleDebug

APK="app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK" ]; then
  SIZE=$(du -h "$APK" | cut -f1)
  echo "==> Done: $APK ($SIZE)"
  echo "    Install with: adb install $APK"
else
  echo "FATAL: APK not found at $APK"
  exit 1
fi
