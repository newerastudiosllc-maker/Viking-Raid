# ⚔️ Viking Raid

> **Plunder. Level. Set sail for new lands.**
> An epic incremental raiding RPG — built mobile-first, packaged for the **Google Play Store**.
> © **New Era Studios LLC**

Viking Raid is a deep, systems-driven tap/idle RPG. You command a longship and warband,
raid procedurally generated coastal villages, defeat regional bosses, level your Chieftain,
invest in a permanent upgrade tree, and ultimately **prestige** by sailing to new lands for
ever-greater power. The world scales endlessly — there is always a harder shore.

---

## ✨ Features

| You asked for | How Viking Raid delivers |
|---|---|
| **Loops** | A tight core loop (raid → loot → upgrade → harder raid) layered over a long-loop prestige ("Saga") system and an offline/idle loop. |
| **Systematic** | Every number derives from `config.js` formulas. Stats, upgrades, abilities, and Saga bonuses compose multiplicatively. Save/export/import are deterministic. |
| **Leveling** | Chieftain XP/levels grant allocatable stat points (Strength, Leadership, Vitality, Fortune) plus ability unlocks. |
| **Difficulty scaling** | Region HP grows ~4.35× per tier; enemy defense scales to create real "walls" that demand upgrades. Endless procedural regions. |
| **Visually appealing** | Canvas-rendered animated scenes, HP rings, damage floaters, particle bursts, screen shake, ability auras, procedural SFX, and AI-generated Norse art. |

---

## 🎮 How to play

- **Tap the raid target** to strike it (your Tap Damage). Your **Warband** auto-attacks for continuous DPS.
- Drain a village's health to **plunder** gold & XP, then the next, harder target appears.
- The **10th target of each region is a Boss Lair** — huge HP, huge rewards.
- Watch your **Longship durability** (bottom bar). Enemy defenses drain it; if it hits 0 you **retreat** and must re-take the village. Reinforce with **Armor** & **Rations**, or tap **⚓ Repair**.
- Spend gold in **🔨 The Forge** on 7 compounding upgrades (buy ×1 / ×10 / MAX).
- Level up in **🧔 Hero** and spend stat points; unlock & fire **Abilities** (🔥 Berserker, 🛡️ Shield Wall, 📯 Raid Horn, ⚡ Valkyrie's Wrath).
- Reach Region 3 to **🌀 Set Sail** (prestige): reset progress for **💎 Saga Shards** that buy **permanent** multipliers.
- Your warband keeps raiding while you're away — collect the **Away Report** on return.

---

## 🔁 The loops

1. **Micro-loop (seconds):** tap → damage → clear village → loot → next target.
2. **Mid-loop (minutes):** gold → Forge upgrades & Hero stats → break through region walls & bosses → new region.
3. **Macro-loop (hours):** prestige into Saga Shards → permanent boons → climb faster & deeper each cycle.
4. **Idle-loop (offline):** crew auto-plunders at 45% efficiency (capped at 8h) — always progressing.

---

## 🚀 Run / preview locally

It's a static web app — any static server works (opening `index.html` via `file://` is *not*
recommended because the service worker won't register; use a local server).

```bash
# from the project root
python3 -m http.server 8080
# then open http://localhost:8080  (use your machine's IP to test on a real phone)
```

> Tip: in Chrome DevTools toggle the device toolbar (📱) and pick a phone for the intended portrait experience. Add to Home Screen to test the installable PWA.

---

## ✅ Tests

```bash
npm install            # pulls jsdom for the DOM test
npm test               # runs both suites
#   • test_logic.js  — 34 core-simulation assertions (combat, leveling, upgrades, prestige, offline, save)
#   • dom_smoke.js   — 18 full-runtime checks in a real DOM (jsdom) with mocked canvas/audio
```

---

## 📦 Build for the Google Play Store (Android AAB)

The game ships as an **offline-first PWA**. To produce a Play Store **Android App Bundle**, we wrap it with [Capacitor](https://capacitorjs.com). One-time prerequisites: **Node 18+**, **Android Studio**, and the **Android SDK** (Java 17).

```bash
# 1. Install dependencies (Capacitor + tooling)
npm install

# 2. Build the offline web bundle into ./www
npm run build:web

# 3. Generate native icons & splash from assets/icon-1024.png
npx capacitor-assets generate

# 4. Add the Android platform (creates ./android)
npx cap add android
npx cap sync android

# 5. Open in Android Studio and build the release AAB
npx cap open android
#    → Build ▸ Generate Signed Bundle / APK ▸ Android App Bundle
```

Then upload the `.aab` to the **Google Play Console** under your **New Era Studios LLC** developer account.

**Before release, update the Android identity in `capacitor.config.json`:**
- `appId` — `com.newerastudios.vikingraid` (reverse-DNS package name)
- `appName` — `Viking Raid`
- App version lives in `package.json` → `version` and is read during the native build.
- Sign the AAB with your upload keystore (keep `*.keystore` / `keystore.properties` out of git — they're in `.gitignore`).

> The Capacitor WebView serves the bundled `www/` files locally, so the app is **fully offline** with no service-worker dependency.

---

## 🗂️ Project structure

```
Viking-Raid/
├─ index.html               # App shell: splash, HUD, canvas, tabs, modals
├─ style.css                # Norse-themed mobile UI
├─ manifest.webmanifest     # PWA manifest (installable, offline)
├─ sw.js                    # Service worker (offline app shell)
├─ capacitor.config.json    # Android packaging config (Play Store)
├─ assets/                  # AI-generated art (logo, icon-1024, hero, scenes)
├─ js/
│  ├─ config.js             # ⚙️ All balance constants & formula helpers (TUNE HERE)
│  ├─ data.js               # Static defs: stats, upgrades, saga, regions, names
│  ├─ state.js              # Save/load, offline detection, export/import codes
│  ├─ systems.js            # The simulation: combat, leveling, prestige, offline
│  ├─ render.js             # Canvas renderer + G.fx particle/shake API
│  ├─ audio.js              # Procedural WebAudio SFX (no asset files)
│  ├─ ui.js                 # DOM UI controller (HUD, panels, modals)
│  └─ main.js               # Bootstrap, fixed-timestep loop, event wiring
├─ scripts/build-web.js     # Copies the game into ./www for Capacitor
├─ test_logic.js            # Headless core-logic tests
└─ dom_smoke.js             # Full-runtime DOM smoke test (jsdom)
```

---

## ⚙️ Tuning the game

All balance lives in **`js/config.js`**. Key levers:

- `VILLAGE_HP_REGION_GROWTH` (4.35) — steepness of difficulty walls between regions.
- `VILLAGE_*_GROWTH` — gold/XP/dps curves.
- `XP_GROWTH` (1.165) — leveling pace.
- `UPG_COST_GROWTH` — how fast upgrades get expensive.
- `SAGA_*` — prestige currency formula and minimum region.
- `ABILITIES` — cooldowns, durations, unlock levels.

Enemy stats are deterministic per `(region, villageIndex)` via a seeded RNG, so a given
save always faces the same sequence — fair and reproducible.

---

## 🗺️ Roadmap ideas

- Equipable loot & rarity (weapons/armor with affixes)
- A second resource (runes) and a rune-crafting tree
- Daily saga quests & event regions
- Leaderboards / async "raiding rivals"
- iCloud/Play cloud save sync
- Localized strings (i18n)

---

## 📜 Credits & license

- **Game design & code:** New Era Studios LLC
- **Art:** AI-generated Norse illustrations
- **Fonts:** Cinzel / Cinzel Decorative (Google Fonts)
- Proprietary — **All rights reserved, © New Era Studios LLC.** Not for redistribution.
