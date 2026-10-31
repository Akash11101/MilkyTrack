#!/usr/bin/env bash
# Run once after `npx cap add android`: applies the app icon, splash screen,
# the native PDF-print bridge and the version number to the generated project.
set -euo pipefail
RES=android/app/src/main/res
JAVA_DIR=android/app/src/main/java/com/milktracker/app

for f in android-overrides/xml/*.xml android-overrides/drawable/*.xml; do
  [ -s "$f" ] && grep -q '<' "$f" || { echo "ERROR: $f is empty or invalid"; exit 1; }
done
[ -d "$RES" ] || { echo "android/ project not found - run 'npx cap add android' first"; exit 1; }

# launcher icons (legacy + adaptive) and splash
for d in mdpi hdpi xhdpi xxhdpi xxxhdpi; do
  mkdir -p "$RES/mipmap-$d"
  cp android-overrides/res/mipmap-$d/*.png "$RES/mipmap-$d/"
done
mkdir -p "$RES/mipmap-anydpi-v26" "$RES/values"
cp android-overrides/xml/ic_launcher.xml "$RES/mipmap-anydpi-v26/ic_launcher.xml"
cp android-overrides/xml/ic_launcher.xml "$RES/mipmap-anydpi-v26/ic_launcher_round.xml"
cp android-overrides/xml/ic_launcher_bg.xml "$RES/values/ic_launcher_bg.xml"
find "$RES" -name 'splash.png' -exec cp android-overrides/res/splash.png {} \;
# plain (icon-free) launch screen so only the in-app logo animation shows
mkdir -p "$RES/drawable"
cp android-overrides/drawable/splash_empty.xml "$RES/drawable/splash_empty.xml"
python3 android-overrides/launch_theme.py

# automatic backup to the user's Google Drive (Android Auto Backup)
mkdir -p "$RES/xml"
cp android-overrides/xml/backup_rules.xml android-overrides/xml/data_extraction_rules.xml "$RES/xml/"
MANIFEST=android/app/src/main/AndroidManifest.xml
python3 - "$MANIFEST" <<'PY'
import re, sys
p = sys.argv[1]; s = open(p).read()
s = re.sub(r'\s+android:(allowBackup|fullBackupContent|dataExtractionRules|resizeableActivity)="[^"]*"', '', s)
s = s.replace('<application', '<application android:resizeableActivity="true" android:allowBackup="true" android:fullBackupContent="@xml/backup_rules" android:dataExtractionRules="@xml/data_extraction_rules"', 1)
open(p, 'w').write(s)
PY

# native PDF bridge
mkdir -p "$JAVA_DIR"
cp android-overrides/MainActivity.java "$JAVA_DIR/MainActivity.java"

# version (CI passes VERSION_CODE; local builds default to 1)
GRADLE=android/app/build.gradle
sed -i -E "s/versionCode [0-9]+/versionCode ${VERSION_CODE:-1}/; s/versionName \"[^\"]*\"/versionName \"1.${VERSION_CODE:-0}\"/" "$GRADLE"
echo "android project customised"
