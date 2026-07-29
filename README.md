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

## 🧩 Progression depth (the advanced systems)

- **🎒 Loot & rarity** — Villages and Boss Lairs drop equippable gear across **6 rarity tiers** (Common → Mythic), each with 1–4 rolled affixes (tap dmg, crew dmg, ship HP, crit, crit dmg, gold, regen, flat power). Fortune acts as **Magic Find**, shifting drops toward higher rarities. Four slots: Weapon, Helm, Armor, Relic.
- **🔮 Rune-crafting / Enchanting** — Salvage unwanted items into **Runes** (also dropped by bosses), then spend Runes + gold to **Enchant** any item, raising its level and scaling every affix. A second resource economy layered on top of gold.
- **📜 Daily Saga Quests** — Three rotating daily objectives (raid, defeat bosses, strike, plunder, forge, enchant) with progress tracking, a **streak** system, and rewards in runes, gold, and Saga shards. Resets at UTC midnight. A 📜 button in the HUD shows a badge when a quest is claimable.

Every equipment bonus feeds directly back into the derived-stat formulas, so the gear you find and forge changes your real combat numbers.

---

## 🎬 Game feel & polish (the AAA pass)

- **Combo system** — rapid taps build a combo meter (up to **3× tap damage**) with an escalating heat display and milestone bursts; rewards active play over pure idle.
- **Juice** — hit-stop on crits/boss kills, screen shake, coin-and-shard bursts on plunder, a cracking emblem as a target weakens, a dramatic **boss-intro banner**, region-transition wipes, and a golden **level-up shockwave**.
- **Living world** — each region has its own **weather** (drifting snow, rain, glowing embers, mist, lightning-split storms) rendered as canvas particles.
- **Onboarding** — a 6-step first-time coach that teaches raiding, the Forge, Hero stats, loot, and prestige.
- **Achievements** — 14 meta milestones (First Blood, Giantslayer, Mythic Fortune, Living Legend…) with rune/shard/gold rewards and a 🏆 gallery.
- **Quality of life** — **auto-equip best**, **bulk salvage** below a rarity, **auto-equip new drops**, and one-tap **stat presets** (Tap / Crew / Tank / Balanced).
- **Generative ambient music** — a procedural Norse drone with bell motifs (WebAudio, no files), plus combo-escalation SFX.

---

## ⚔️ Combat depth (the gameplay upgrade)

- **Village modifiers** — every fight can roll an affix that changes the encounter: **Wealthy/Golden** (bonus gold), **Stalwart** (fortified HP), **Frenzy/Bloodthirsty/Raging** (deadlier defenses), **Swift**, **Plagued**, or **Hexed** (no crits — but double gold). Chance scales with region depth; bosses always carry one. Shown as a badge on the target and in the HUD.
- **Ragnarök ultimate** — a **Rage meter** charges from tapping and clearing villages. When full, unleash a screen-shaking burst of damage **plus an 8-second 2× power buff**. A dedicated glowing button with a live charge readout.
- **Boss Fury / Stagger** — below 35% HP a boss **staggers** (a burst window where it takes double damage), then **enrages** — its defenses hit far harder, so time your **Shield Wall**. Reactive boss fights, not just bigger HP pools.
- **Warband Specialists** — hire elite crew units with gold (Forge tab): **Berserkers** (+2% Crew DPS each, Lv 6), **Archers** (+2% Tap damage & +0.05% Crit each, Lv 10), and **Shieldmaidens** (−0.8% ship damage taken & +0.04% regen each, capped at −60%, Lv 14). Painted portrait cards with x1/x10/MAX hiring; counts reset on prestige for a fresh build each Saga.
- **Expedition Routes** — entering each new region (from region 2 on), chart your course: **Calm Passage** (safe), **Storm Strait** (+40% enemy attack, but +65% gold / +30% XP / +6% drops), or **Cursed Channel** (+60% village HP & +25% attack, but 2.2× gold / +50% XP / +12% drops). The route shapes every raid in that region, shows in the HUD, resets to Calm on prestige, and feeds two achievements (Storm Chaser, Grave Robber).

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
#   • test_logic.js  — 100 core-simulation assertions (combat, leveling, upgrades, loot, runes, daily quests, combo, achievements, modifiers, Ragnarök, boss mechanics, warband units, expedition routes, prestige, offline, save)
#   • dom_smoke.js   — 36 full-runtime checks in a real DOM (jsdom) with mocked canvas/audio
```

---

## 📦 Build for the Google Play Store (Android AAB)

The game ships as an **offline-first PWA**. To produce a Play Store **Android App Bundle**, we wrap it with [Capacitor](https://capacitorjs.com). One-time prerequisites: **Node 18+**, **Android Studio**, and the **Android SDK** (Java 17).

```bash
# 1. Install dependencies (Capacitor + tooling)
npm install

# 2. Build the offline web bundle into ./www
npm run build:web

# 3. Generate native icons & splash screens (zero-config — the assets/ folder
#    already contains icon-only/icon-foreground/icon-background/splash/splash-dark)
npm install -D @capacitor/assets && npx capacitor-assets generate --android

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
├─ assets/                  # AI-generated art — runtime scenes (6 regions + boss lair,
│                           #   hero, logo, PWA icons) + packaging sources
│                           #   (icon-only/foreground/background, splash, splash-dark)
├─ assets/icons/            # Game-ready UI icons: 5 ability medallions + 5 tab glyphs
│                           #   (raw/ holds the AI sources; scripts/process-icons.js rebuilds)
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

## 🗺️ Roadmap

**Shipped in v1.0:**
- ✅ Equippable loot & 6 rarity tiers with rolled affixes
- ✅ Runes + Enchanting (second resource economy)
- ✅ Daily Saga Quests with streaks

**Planned next:**
- Cloud save sync (Firebase or Play Games Saved Games) — see `LAUNCH_CHECKLIST.md`
- Leaderboards / async "raiding rivals" (Play Games Services)
- Set bonuses (equipping multiple items from a "set")
- Event regions & limited-time bosses
- Localized strings (i18n)

---

## 📜 Credits & license

- **Game design & code:** New Era Studios LLC
- **Art:** AI-generated Norse illustrations
- **Fonts:** Cinzel / Cinzel Decorative (Google Fonts)
- Proprietary — **All rights reserved, © New Era Studios LLC.** Not for redistribution.
