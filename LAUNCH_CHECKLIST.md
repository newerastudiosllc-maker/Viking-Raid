# 🚀 Viking Raid — Google Play Launch Checklist

> Everything **you** need to do to ship *Viking Raid* to the Google Play Store under
> **New Era Studios LLC** — what to do, **where**, and **what** you need.
> The game code, Capacitor config, build script, icons, and PWA manifest are already done.

Legend: ✅ already done in this repo · 🔲 your action · 💰 may cost money · 🔐 keep secret

---

## Phase 0 — What's already done (no action needed)

| Item | Status |
|---|---|
| Complete offline game (raid loop, leveling, loot, runes, daily quests, prestige) | ✅ |
| PWA manifest + service worker (works offline in the WebView) | ✅ |
| `capacitor.config.json` (appId `com.newerastudios.vikingraid`) | ✅ |
| `scripts/build-web.js` (builds `./www` for Capacitor) | ✅ |
| App icon source `assets/icon-1024.png` (1024×1024 square) | ✅ |
| Tests (`npm test` → 73 checks, 0 errors) | ✅ |

---

## Phase 1 — Accounts & prerequisites

| # | Task | Where | What you need | Notes |
|---|---|---|---|---|
| 1.1 | 🔲 Create / use a **Google Play Developer account** registered to **New Era Studios LLC** | https://play.google.com/console/signup | A Google account + **$25 USD one-time fee** 💰 + business verification (EIN/LLC docs) | This is the account that owns the app. Use the LLC's Google Workspace account if you have one. |
| 1.2 | 🔲 Verify the developer account | Play Console → Setup → accounts | Legal entity docs for New Era Studios LLC | Required before you can publish. Can take a few days. |
| 1.3 | 🔲 Install build toolchain | Your computer | **Node.js 18+**, **Android Studio** (latest), **JDK 17** (bundled with Android Studio) | Android Studio installs the Android SDK automatically. |
| 1.4 | 🔲 Accept Android SDK licenses | Terminal | run `yes \| sdkmanager --licenses` (or via Android Studio SDK Manager) | Needed before first build. |

---

## Phase 2 — App identity & signing (do once, guard forever)

| # | Task | Where | What you need | Notes |
|---|---|---|---|---|
| 2.1 | 🔲 Generate a **release keystore** 🔐 | Terminal | Run once: <br>`keytool -genkeypair -v -keystore vikingraid.keystore -alias vikingraid -keyalg RSA -keysize 2048 -validity 10000` | Choose strong passwords. **This file IS your app's identity** — lose it and you can never update the app on Play. |
| 2.2 | 🔲 Store the keystore **securely + backed up** 🔐 | Password manager + encrypted cloud backup + offline USB | `vikingraid.keystore`, its alias (`vikingraid`), and both passwords | Google also offers **Play App Signing** (recommended) — you upload with this key, Google re-signs with their key. Enable it during first upload. |
| 2.3 | ✅ Confirm package id | `capacitor.config.json` | `appId: "com.newerastudios.vikingraid"` | Change here **before** first build if you want a different id. Can't change after publishing. |
| 2.4 | 🔲 Set version for first release | `package.json` → `"version"` | e.g. `"1.0.0"` | Bump for every update. Android also needs `versionCode` (integer) — set in `android/app/build.gradle` after `cap add`. |

---

## Phase 3 — Build the Android App Bundle (AAB)

Run these in the project root:

```bash
npm install                      # Capacitor + tooling
npm run build:web                # copies the game into ./www
npx capacitor-assets generate    # makes Android icons + splash from assets/icon-1024.png (run: npm i -D @capacitor/assets first)
npx cap add android              # creates ./android  (first time only)
npx cap sync android             # copies ./www + plugins into the native project
npx cap open android             # opens the project in Android Studio
```

| # | Task | Where | What you need | Notes |
|---|---|---|---|---|
| 3.1 | 🔲 Run the commands above | Terminal → Android Studio | Phase 1 + Phase 2 done | `npx cap add android` is one-time; for later updates use `npm run build:web && npx cap sync`. |
| 3.2 | 🔲 Generate the signed **AAB** | Android Studio → **Build ▸ Generate Signed Bundle / APK ▸ Android App Bundle** | Your keystore (2.1) | Choose **release** variant. Output: `android/app/build/outputs/bundle/release/app-release.aab`. |
| 3.3 | 🔲 (Optional) Test the **APK** on a real phone first | Android Studio → Build APK, or `adb install` | USB cable + dev mode | Validate offline play, tap feel, save/load on a real device before submitting. |

---

## Phase 4 — Store listing assets

| # | Asset | Spec | Where to put it | How to make it |
|---|---|---|---|---|
| 4.1 | 🔲 App icon | 512×512 PNG, 32-bit, no alpha | Play Console → app → Main store listing | Use `assets/icon-1024.png` resized, or regenerate. |
| 4.2 | 🔲 **Screenshots** (min 2, rec 3–8) | Phone: 16:9 or 9:16, min 320px, max 3840px JPEG/PNG | Play Console → Main store listing | **Starter set included:** `screenshots/01_splash.png … 05_fortress.png` (true 1080×2340 renders) + `screenshots/feature_graphic.png` (1024×500). Regenerate any time with `npm i @napi-rs/canvas && node scripts/screenshot.js`. For live captures, run on a real device and use `adb exec-out screencap -p > shot.png`. |
| 4.3 | 🔲 Feature graphic (optional but recommended) | 1024×500 PNG/JPEG | Play Console → Main store listing | A wide banner (longship + "Viking Raid" + "New Era Studios"). |
| 4.4 | 🔲 Short description | ≤ 80 chars | Main store listing | e.g. *"Plunder, level & set sail. An epic Viking raiding RPG."* |
| 4.5 | 🔲 Full description | ≤ 4000 chars | Main store listing | Expand on features: loops, loot, runes, daily quests, prestige, offline play. |
| 4.6 | 🔲 App category / tags | Game ▸ Role Playing (or Strategy) | Main store listing | Tags: idle, rpg, viking, clicker, incremental. |

---

## Phase 5 — Play Console setup (per-app, one-time)

| # | Task | Where | What you need | Notes |
|---|---|---|---|---|
| 5.1 | 🔲 **Create app** | Play Console → "Create app" | App name "Viking Raid", paid/free (free), declarations | Free + in-app-purchase-ready if you later add IAP (none currently). |
| 5.2 | 🔲 Upload first **AAB** | Play Console → app → Production → Create release | The `.aab` from 3.2 + signing | Enable **Play App Signing** when prompted (recommended). |
| 5.3 | 🔲 **Content rating** questionnaire | Play Console → App content → Content rating | Answer ~10 questions (violence = cartoon/fantasy, no gambling/real money) | Yields an ESRB/PEGI/etc. rating. Required to publish. |
| 5.4 | 🔲 **Data safety** form | Play Console → App content → Data safety | Our app: **no data collected** (saves are local; no ads SDK; no analytics) | If you later add Firebase/analytics/ads, you MUST update this. |
| 5.5 | 🔲 **Privacy Policy** URL 🔲 | Play Console → App content → Privacy Policy | A hosted privacy policy page (even a simple one) | Required. Host on your studio site / GitHub Pages. State: local-only saves, no account, no tracking (unless you add services). |
| 5.6 | 🔲 Target audience & content | Play Console → App content | 13+ typically | Declared ads/no-ads, app category. |
| 5.7 | 🔲 Government / news app declarations | App content | "No" for both | Standard for a game. |
| 5.8 | 🔲 Select "Default app" for store | Store settings | Confirm | — |

---

## Phase 6 — Release & review

| # | Task | Where | What you need | Notes |
|---|---|---|---|---|
| 6.1 | 🔲 Push to an **Internal testing** track first | Play Console → Testing → Internal testing | Up to 100 tester emails | Fastest way to sanity-check the live build. |
| 6.2 | 🔲 Then **Closed → Open testing** (optional) | Play Console → Testing | Tester lists / opt-in link | Gather feedback before wide release. |
| 6.3 | 🔲 Promote to **Production** | Play Console → Production → Review release | All App-content tasks (Phase 5) complete | New accounts: first review can take **3–7 days**. Subsequent updates are faster. |
| 6.4 | 🔲 Watch the **review status** | Play Console dashboard | — | Fix any policy rejections (common: data safety, icon, screenshots). |

---

## Phase 7 — Optional: Cloud save & leaderboards

> The game currently saves locally (localStorage) + manual export/import codes. Cloud sync and leaderboards require an external service you set up. None of this is required to publish.

| # | Feature | Where | What you need | Notes |
|---|---|---|---|---|
| 7.1 | ☁️ **Cloud save** | Firebase project → Firestore + Auth | A free **Firebase** project; add a `firebase-config.js` with your keys; load Firebase SDK | Store the same JSON `State` object under the user's anonymous-auth UID. Anonymous auth = no email required. Update `Data safety` (4) if enabled. |
| 7.2 | 🏆 **Achievements & leaderboards** | Google Play Console → Play Games Services → set up | Link your app; define achievements (e.g. "First Boss", "Reach Region 5", "Mythic drop") + a "Deepest Region" leaderboard | Integrates via the `@capacitor-community/gameservices`-style plugin or a Cordova bridge; call from `systems.js` event hooks (`clear`, `newRegion`, `prestige`, `drop`). |
| 7.3 | 🔔 **Push notifications** (e.g. daily-quest reminders) | Firebase Cloud Messaging | FCM setup + a Capacitor push plugin | Hook to the existing daily-quest system. Update `Data safety` + add POST_NOTIFICATIONS permission. |

If you want, I can implement the Firebase cloud-save module (7.1) and the Play Games achievements hooks (7.2) as a follow-up — say the word and I'll add `js/cloud.js` + the wiring.

---

## Phase 8 — Post-launch operations

| # | Task | Where | Notes |
|---|---|---|
| 8.1 | 🔲 Monitor crashes / ANRs | Play Console → Quality → Android vitals | Watch for WebView issues on specific Android versions. |
| 8.2 | 🔲 Read reviews & ratings | Play Console → Feedback | Reply to early reviews — boosts ranking. |
| 8.3 | 🔲 Release updates | bump `package.json` version + Android `versionCode` → rebuild AAB → new Production release | The `seenIntro`/save system is forward-compatible; `State.heal()` migrates old saves. |
| 8.4 | 🔲 Optional: Store Listing Experiments | Play Console → Grow | A/B test icons/descriptions. |

---

## Quick reference — the one-command update loop (after first setup)

```bash
# 1. bump version in package.json (e.g. 1.0.0 -> 1.0.1)
# 2. bump versionCode in android/app/build.gradle
npm run build:web && npx cap sync android && npx cap open android
# 3. in Android Studio: Build ▸ Generate Signed Bundle ▸ AAB (release)
# 4. upload the new .aab to Play Console ▸ Production ▸ Create release
```

## What only YOU can do (can't be done from code)

- 💰 Pay the $25 Play developer fee & verify New Era Studios LLC (1.1–1.2)
- 🔐 Create and safeguard the signing keystore (2.1–2.2)
- 📸 Capture real-device screenshots (4.2)
- 📄 Write/host the Privacy Policy (5.5)
- ☁️ Create the Firebase / Play Games Services projects and paste their keys (Phase 7)
- 🚀 Upload the AAB and submit for review (5.2, 6.3)

Everything else is already wired up in this repository.
