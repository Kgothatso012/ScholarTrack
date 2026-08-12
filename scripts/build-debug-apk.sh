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

# Point Gradle at the Android SDK. Search common locations; create local.properties
# so Expo prebuild (which regenerates android/) doesn't blow it away mid-build.
ANDROID_SDK_DIR="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
if [ -z "$ANDROID_SDK_DIR" ] || [ ! -d "$ANDROID_SDK_DIR" ]; then
  for candidate in "$HOME/android-sdk" "$HOME/Android/Sdk" "/opt/android-sdk" "/usr/lib/android-sdk"; do
    if [ -d "$candidate/platform-tools" ]; then
      ANDROID_SDK_DIR="$candidate"
      break
    fi
  done
fi
if [ -z "$ANDROID_SDK_DIR" ]; then
  echo "FATAL: Android SDK not found. Set ANDROID_HOME or ANDROID_SDK_ROOT." >&2
  exit 1
fi
export ANDROID_HOME="$ANDROID_SDK_DIR"
export ANDROID_SDK_ROOT="$ANDROID_SDK_DIR"

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
# Re-write local.properties AFTER prebuild — `expo prebuild --clean` wipes the
# entire android/ directory including any local.properties we wrote earlier.
# Gradle needs sdk.dir to resolve the SDK; ANDROID_HOME alone is not enough
# when a stale/empty local.properties exists. ponytail: write beats env-var.
echo "sdk.dir=$ANDROID_SDK_DIR" > local.properties
# ponytail: dl.google.com has both A + AAAA records; Java prefers IPv6 and WSL2 here
# has no public v6 route, so Maven downloads hang on connect timeout. Force IPv4.
GRADLE_OPTS="-Djava.net.preferIPv4Stack=true" ./gradlew assembleDebug

APK="app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK" ]; then
  SIZE=$(du -h "$APK" | cut -f1)
  echo "==> Done: $APK ($SIZE)"
  echo "    Install with: adb install $APK"
else
  echo "FATAL: APK not found at $APK"
  exit 1
fi
