# MilkyTrack

Daily doorstep milk ledger: litres × price per litre for each delivery, month totals, Hindi/English, UPI pay, PDF bill, WhatsApp-ready copy, backup/restore. All data stays on the phone.

The app lives in `www/`, split by responsibility so different teams can own different folders. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## 1. Get the Android APK (no tools needed on your PC)

1. Create a **new, empty** GitHub repository.
2. Unzip this project and upload **everything** to it (drag the folders in). Make sure the hidden `.github/workflows/` folder comes along; if your browser skips it, use **Add file → Create new file**, name it `.github/workflows/build-apk.yml` and paste the file's contents.
3. Open the **Actions** tab. *Build Android APK* starts by itself (about 5-8 minutes). If it doesn't, open it and press **Run workflow**.
4. Open the finished run → **Artifacts → MilkyTrack-APK**, download and unzip it, copy `MilkyTrack.apk` to the phone and tap it (allow "install unknown apps" once).

### Optional: a permanent download link
Push a tag such as `v1.0` (GitHub: **Releases → Draft a new release → Choose a tag → create `v1.0`**). The workflow then attaches `MilkyTrack.apk` to that release, and you can share the release link.

### Updates
Replace the `www/` folder, commit, and download the new APK. It is signed with the same key (`signing/milktracker.keystore`), so it installs over the old one and **keeps all data**.

## 2. Optional: run it as a website
Settings → Pages → Source: **GitHub Actions**, then Actions → *Deploy web app (GitHub Pages)* → **Run workflow**. The app then opens in any browser.

## Production checklist
- [ ] **Own signing key** (required for Play Store; keep it private and backed up - losing it means you can never update the app):
      `keytool -genkeypair -v -keystore my.keystore -alias milktracker -keyalg RSA -keysize 2048 -validity 10000`
      then in the repo: Settings -> Secrets -> Actions, add `KEYSTORE_BASE64` (`base64 -w0 my.keystore`), `KEYSTORE_PASSWORD` and (if different) `KEY_ALIAS`. Builds then sign with it automatically.
- [ ] Add a support email to `PRIVACY.md` and host it (GitHub Pages works); the Play Store needs the URL.
- [ ] Tests pass: the *Build Android APK* workflow runs `npm test` first and stops if anything fails (run it locally with `npm i && npx playwright install chromium && npm test`).
- [ ] Bump the version in `package.json` and `CHANGELOG.md`; the Android build number comes from the workflow run number.
- [ ] Install the APK on a real phone and check: add customer, add delivery, UPI QR scan, PDF save, backup/restore, Hindi.

## Good to know
- **Signing key:** by default the bundled demo keystore is used (fine for your own phones). For the Play Store use your own private key via the secrets above.
- **Export PDF** opens Android's print sheet; choose **Save as PDF**.
- **Back button** closes the menu/sheet first and exits only from the main screen.
- **Automatic backup:** the Android app is included in Android's own Google Drive backup (Settings > Google > Backup must be on). It runs by itself about daily on Wi-Fi while charging, and restores when the app is reinstalled on a phone signed into the same Google account (most reliable for Play Store installs; sideloaded APKs may not restore automatically, so also use the manual backup below).
- **Backup** copies your data to the clipboard (paste it into a note or WhatsApp); **Restore** takes that text.
- Package id `com.milktracker.app`; icons, splash and the print bridge are applied by `scripts/android-setup.sh`.
- Fonts (Poppins, Mukta) are bundled at build time so the app looks the same offline.

## Project layout
```
www/                      the app (index.html, css/, js/, assets/, manifest.webmanifest)
capacitor.config.json     app id/name, web folder
android-overrides/        icons, splash, native PDF print bridge
scripts/                  font bundling, Android setup, APK signing
signing/                  demo keystore (replace with secrets for production)
tests/                    smoke tests (npm test)
PRIVACY.md, CHANGELOG.md
.github/workflows/        build-apk.yml (APK), deploy-web.yml (optional website)
```

## Public privacy policy URL (needed for Play Store)
1. Replace `SUPPORT_EMAIL` in `docs/privacy.html` (and `PRIVACY.md`) with your real email.
2. On GitHub: Settings > Pages > Source: **GitHub Actions**.
3. Push to `main` (the "Deploy web app" workflow publishes it). Your URL will be
   `https://<your-username>.github.io/<repo-name>/privacy.html` - paste it into Play Console.
