#!/usr/bin/env bash
# Aligns and signs the release APK with signing/milktracker.keystore.
set -euo pipefail
SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
BT="$(ls -d "$SDK"/build-tools/* | sort -V | tail -1)"
IN="$(find android/app/build/outputs/apk/release -name '*.apk' | head -1)"
[ -n "$IN" ] || { echo "release APK not found"; exit 1; }
mkdir -p dist
"$BT/zipalign" -p -f 4 "$IN" dist/aligned.apk
# Production: set the repo secrets KEYSTORE_BASE64, KEYSTORE_PASSWORD (and optionally KEY_ALIAS) to sign with
# your own private key. Without them the bundled demo key is used (fine for your own phones, NOT for the Play Store).
KS=signing/milktracker.keystore; ALIAS=milktracker; PASS=milktracker123
if [ -n "${KEYSTORE_BASE64:-}" ] && [ -n "${KEYSTORE_PASSWORD:-}" ]; then
  echo "$KEYSTORE_BASE64" | base64 -d > dist/release.keystore
  KS=dist/release.keystore; ALIAS="${KEY_ALIAS:-milktracker}"; PASS="$KEYSTORE_PASSWORD"
  echo "signing with the private release key"
else
  echo "WARNING: signing with the bundled demo key"
fi
"$BT/apksigner" sign --ks "$KS" --ks-key-alias "$ALIAS" \
  --ks-pass pass:"$PASS" --key-pass pass:"$PASS" \
  --out dist/MilkyTrack.apk dist/aligned.apk
"$BT/apksigner" verify --verbose dist/MilkyTrack.apk
rm -f dist/aligned.apk dist/*.idsig dist/release.keystore
ls -la dist
