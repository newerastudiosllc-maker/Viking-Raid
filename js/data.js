/* ============================================================
   VIKING RAID — data.js
   Static definitions: stats, upgrades, saga, regions, names.
   New Era Studios LLC
   ============================================================ */
(function (global) {
  "use strict";

  const DATA = {
    // --- Hero stats (allocatable on level up) -------------------------
    STATS: [
      {
        id: "str",
        name: "Strength",
        icon: "⚔️",
        color: "#e0533d",
        desc: "Increases Tap damage. Your blade strikes harder.",
      },
      {
        id: "led",
        name: "Leadership",
        icon: "🪓",
        color: "#d6a13a",
        desc: "Empowers your Warband. Each point adds Crew damage.",
      },
      {
        id: "vit",
        name: "Vitality",
        icon: "❤️",
        color: "#3da8e0",
        desc: "Reinforces the Longship. More durability against defenses.",
      },
      {
        id: "fot",
        name: "Fortune",
        icon: "🍀",
        color: "#5fd17a",
        desc: "Luck of the gods. Raises crit chance and gold plundered.",
      },
    ],

    // --- Gold-purchased upgrades (the Forge) -------------------------
    UPGRADES: [
      {
        id: "axe",
        name: "Sharpened Axes",
        icon: "🪓",
        desc: "+50% Tap damage per level.",
        baseCost: 15,
        growth: 1.14,
        group: "offense",
      },
      {
        id: "crew",
        name: "Warband",
        icon: "👥",
        desc: "Recruit warriors. +0.95 Crew DPS per level.",
        baseCost: 60,
        growth: 1.17,
        group: "offense",
      },
      {
        id: "drum",
        name: "War Drums",
        icon: "🥁",
        desc: "Faster Warband attacks. -4% interval per level.",
        baseCost: 140,
        growth: 1.20,
        group: "offense",
      },
      {
        id: "mead",
        name: "Mead Hall",
        icon: "🍻",
        desc: "Stronger crits. +0.18x crit damage per level.",
        baseCost: 90,
        growth: 1.19,
        group: "offense",
      },
      {
        id: "armor",
        name: "Longship Armor",
        icon: "🛡️",
        desc: "+30% Longship durability per level.",
        baseCost: 35,
        growth: 1.15,
        group: "defense",
      },
      {
        id: "rations",
        name: "Salted Rations",
        icon: "🍖",
        desc: "Faster repair. +0.4%/sec durability regen per level.",
        baseCost: 45,
        growth: 1.15,
        group: "defense",
      },
      {
        id: "banner",
        name: "War Banner",
        icon: "🚩",
        desc: "Rallying cry: +12% to ALL damage per level.",
        baseCost: 500,
        growth: 1.24,
        group: "offense",
      },
    ],

    // --- Saga (prestige) permanent upgrades --------------------------
    SAGA: [
      {
        id: "steel",
        name: "Ancient Steel",
        icon: "🗡️",
        desc: "+12% Tap damage per level (permanent).",
        baseCost: 3,
        growth: 1.7,
        bonusPerLevel: 0.12,
        kind: "tap",
      },
      {
        id: "legacy",
        name: "Warband Legacy",
        icon: "⚔️",
        desc: "+12% Crew damage per level (permanent).",
        baseCost: 3,
        growth: 1.7,
        bonusPerLevel: 0.12,
        kind: "crew",
      },
      {
        id: "ironhide",
        name: "Iron Hide",
        icon: "⚓",
        desc: "+12% Longship durability per level (permanent).",
        baseCost: 3,
        growth: 1.7,
        bonusPerLevel: 0.12,
        kind: "hp",
      },
      {
        id: "plunder",
        name: "Plunderer's Code",
        icon: "💰",
        desc: "+12% Gold from all raids per level (permanent).",
        baseCost: 4,
        growth: 1.75,
        bonusPerLevel: 0.12,
        kind: "gold",
      },
      {
        id: "allfather",
        name: "Allfather's Boon",
        icon: "👁️",
        desc: "+5% to EVERY stat's effect per level (permanent).",
        baseCost: 10,
        growth: 1.9,
        bonusPerLevel: 0.05,
        kind: "global",
      },
    ],

    // --- Regions (first several hand-authored, then procedural) ------
    // --- Warband specialists (hired with gold, scale multiplicatively) ---
    UNITS: [
      {
        id: "berserker",
        name: "Berserkers",
        icon: "assets/icons/unit_berserker.png",
        emoji: "🪓",
        desc: "+2% Crew DPS each. Frenzied shock troops.",
        baseCost: 400,
        growth: 1.22,
        unlockLevel: 6,
      },
      {
        id: "archer",
        name: "Archers",
        icon: "assets/icons/unit_archer.png",
        emoji: "🏹",
        desc: "+2% Tap damage & +0.05% Crit each. Deadly volleys.",
        baseCost: 650,
        growth: 1.24,
        unlockLevel: 10,
      },
      {
        id: "shieldmaiden",
        name: "Shieldmaidens",
        icon: "assets/icons/unit_shieldmaiden.png",
        emoji: "🛡️",
        desc: "-0.8% ship damage taken & +0.04% regen each.",
        baseCost: 900,
        growth: 1.26,
        unlockLevel: 14,
      },
    ],
    UNIT_BY_ID: {},

    // --- Expedition routes: pick your sea passage into each region ----
    // Multipliers apply to every village in the region until the next one.
    ROUTES: [
      {
        id: "calm",
        name: "Calm Passage",
        icon: "assets/icons/route_calm.png",
        emoji: "⛵",
        desc: "Safe waters. A steady, unremarkable raid.",
        hp: 1.0, dps: 1.0, gold: 1.0, xp: 1.0, dropBonus: 0,
        flavor: "The sea is kind today.",
      },
      {
        id: "storm",
        name: "Storm Strait",
        icon: "assets/icons/route_storm.png",
        emoji: "🌊",
        desc: "Defenses hit +40% harder — but +65% gold and +30% XP.",
        hp: 1.0, dps: 1.4, gold: 1.65, xp: 1.3, dropBonus: 0.06,
        flavor: "Fortune favors those who dare the gale.",
      },
      {
        id: "cursed",
        name: "Cursed Channel",
        icon: "assets/icons/route_cursed.png",
        emoji: "💀",
        desc: "Villages +60% HP, defenses +25% — but 2.2× gold and +12% drop chance.",
        hp: 1.6, dps: 1.25, gold: 2.2, xp: 1.5, dropBonus: 0.12,
        flavor: "The dead guard the richest shores.",
      },
    ],
    ROUTE_BY_ID: {},

    REGIONS: [
      { name: "The Frozen Shore",   art: "scene_frozen_shore", tint: "#1b2a3a", weather: "snow" },
      { name: "Whispering Fjords",  art: "scene_fjords",       tint: "#243440", weather: "mist" },
      { name: "Ironwood Forest",    art: "scene_forest",       tint: "#16241a", weather: "embers" },
      { name: "Blackpine Marches",  art: "scene_marches",      tint: "#1a2230", weather: "rain" },
      { name: "Stormhold Keep",     art: "scene_fortress",     tint: "#10131f", weather: "storm" },
      { name: "Thunder Cliffs",     art: "scene_cliffs",       tint: "#0e1322", weather: "storm" },
    ],

    // --- Weather profiles (rendered as canvas particles) -------------
    WEATHER: {
      clear:  { count: 0,   color: "#ffffff", speed: 0,    wind: 0,    len: 0,  glow: false, lightning: false },
      mist:   { count: 0,   color: "#ffffff", speed: 0,    wind: 0,    len: 0,  glow: false, lightning: false },
      rain:   { count: 110, color: "#9fd0ff", speed: 1.7,  wind: 0.55, len: 16, glow: false, lightning: false },
      snow:   { count: 80,  color: "#ffffff", speed: 0.55, wind: 0.22, len: 0,  glow: true,  lightning: false },
      embers: { count: 60,  color: "#ff9a3c", speed: -0.5, wind: -0.3, len: 0,  glow: true,  lightning: false },
      storm:  { count: 150, color: "#9fb8d8", speed: 2.1,  wind: 0.9,  len: 22, glow: false, lightning: true },
    },
    weatherFor(region) {
      const w = DATA.regionArt(region).weather;
      return DATA.WEATHER[w] || DATA.WEATHER.clear;
    },

    // --- Procedural village naming ------------------------------------
    NAME_PREFIX: [
      "Frost", "Wolf", "Raven", "Blood", "Storm", "Iron", "Bone", "Salt",
      "Bear", "Whale", "Mist", "Ash", "Thorn", "Frost", "Sea", "Oak",
      "Wyrm", "Crow", "Red", "Black", "Grey", "Winter", "Flame", "Stone",
    ],
    NAME_ROOT: [
      "peak", "holt", "wick", "mere", "fell", "thorpe", "gard", "fjord",
      "stead", "by", "ness", "skaal", "dal", "vik", "borg", "heim",
    ],
    VILLAGE_TYPES: [
      { word: "Village", hp: 1.0, gold: 1.0 },
      { word: "Hamlet",  hp: 0.85, gold: 0.9 },
      { word: "Camp",    hp: 0.8, gold: 1.1 },
      { word: "Hold",    hp: 1.2, gold: 1.05 },
      { word: "Outpost", hp: 0.95, gold: 1.15 },
      { word: "Settlement", hp: 1.1, gold: 1.0 },
    ],

    BOSS_TITLES: [
      "Jarl", "Chieftain", "Warlord", "Huscarl", "Reaver", "Drengr",
      "Skald-King", "Thane", "Berserker-Lord",
    ],
    BOSS_NAMES: [
      "Bloodaxe", "Skullsplitter", "Ironhand", "Stormborn", "Redbeard",
      "Greycloak", "Foebiter", "Skulltaker", "Blacktongue", "Wolfsbane",
      "Frostmaw", "Seawolf", "Bonecrusher", "Grimtooth", "Shieldbreaker",
    ],

    // --- Equipment rarities (index === tier) -------------------------
    RARITY: [
      { id: 0, name: "Common",    color: "#9aa0a6", affixes: 1, mult: 0.90, sell: 1,   weight: 1000 },
      { id: 1, name: "Uncommon",  color: "#5fd17a", affixes: 2, mult: 1.15, sell: 3,   weight: 520 },
      { id: 2, name: "Rare",      color: "#56b4e6", affixes: 2, mult: 1.50, sell: 9,   weight: 230 },
      { id: 3, name: "Epic",      color: "#b06ce0", affixes: 3, mult: 2.00, sell: 24,  weight: 85 },
      { id: 4, name: "Legendary", color: "#e8a23a", affixes: 3, mult: 2.80, sell: 60,  weight: 24 },
      { id: 5, name: "Mythic",    color: "#ff5a3c", affixes: 4, mult: 3.90, sell: 160, weight: 5 },
    ],

    // --- Affixes (rollable bonuses on items) -------------------------
    AFFIXES: [
      { id: "tapPct",  name: "Tap Damage",       icon: "⚔️", min: 0.04, max: 0.09, fmt: "pct" },
      { id: "crewPct", name: "Crew Damage",      icon: "🪓", min: 0.05, max: 0.11, fmt: "pct" },
      { id: "hpPct",   name: "Longship HP",      icon: "🛡️", min: 0.05, max: 0.12, fmt: "pct" },
      { id: "crit",    name: "Crit Chance",      icon: "🎯", min: 0.008, max: 0.025, fmt: "pct" },
      { id: "critDmg", name: "Crit Damage",      icon: "💥", min: 0.10, max: 0.28, fmt: "pct" },
      { id: "gold",    name: "Gold Find",        icon: "🍀", min: 0.05, max: 0.12, fmt: "pct" },
      { id: "regen",   name: "Durability Regen", icon: "✚",  min: 0.003, max: 0.008, fmt: "pct" },
      { id: "tapFlat", name: "Flat Tap Power",   icon: "✊",  min: 3, max: 10, fmt: "flat" },
    ],
    AFFIX_BY_ID: {}, // filled at runtime below

    // --- Equipment slots ---------------------------------------------
    SLOTS: [
      { id: "weapon", name: "Weapon", icon: "🗡️" },
      { id: "helm",   name: "Helm",   icon: "⛑️" },
      { id: "armor",  name: "Armor",  icon: "🛡️" },
      { id: "relic",  name: "Relic",  icon: "💠" },
    ],
    SLOT_BY_ID: {},

    // Loot name generation
    ITEM_ADJ: ["Ancient", "Frostbound", "Ravensworn", "Iron", "Bloodforged", "Storm", "Wyrm", "Sacred", "Cursed", "Golden", "Shadow", "Wolf", "Bear", "Oak", "Runic", "Sundered"],
    ITEM_SUFFIX: ["the North", "Slumber", "Giants", "the Deep", "Valor", "the Gods", "Thunder", "Winter", "the Hunt", "Endless Fury", "the Forge", "the Void"],

    // --- Achievements (meta milestones with rewards) -----------------
    // check(s) => boolean; reward: { shards, runes, goldFactor }
    ACHIEVEMENTS: [
      { id: "first_raid", name: "First Blood",          icon: "⚔️", desc: "Raid your first village.",        check: (s) => s.totals.raids >= 1,        reward: { goldFactor: 10 } },
      { id: "raids_50",   name: "Raider",               icon: "🔥", desc: "Raid 50 villages.",               check: (s) => s.totals.raids >= 50,       reward: { runes: 8, goldFactor: 15 } },
      { id: "raids_500",  name: "Scourge of the Coast", icon: "💀", desc: "Raid 500 villages.",              check: (s) => s.totals.raids >= 500,      reward: { shards: 4 } },
      { id: "boss_1",     name: "Giantslayer",          icon: "☠️", desc: "Defeat your first Boss Lair.",    check: (s) => s.totals.bosses >= 1,       reward: { runes: 5, goldFactor: 15 } },
      { id: "boss_10",    name: "Boss Crusher",         icon: "🏔️", desc: "Defeat 10 Boss Lairs.",           check: (s) => s.totals.bosses >= 10,      reward: { shards: 2 } },
      { id: "region_3",   name: "Beyond the Shore",     icon: "🗺️", desc: "Reach Region 4.",                 check: (s) => s.highestRegion >= 3,       reward: { shards: 3 } },
      { id: "region_6",   name: "Deep Raider",          icon: "🌊", desc: "Reach Region 7.",                 check: (s) => s.highestRegion >= 6,       reward: { shards: 6 } },
      { id: "lvl_25",     name: "Seasoned Chieftain",   icon: "⭐", desc: "Reach Level 25.",                 check: (s) => s.level >= 25,             reward: { runes: 15 } },
      { id: "lvl_50",     name: "Living Legend",        icon: "🌟", desc: "Reach Level 50.",                 check: (s) => s.level >= 50,             reward: { shards: 5 } },
      { id: "mythic",     name: "Mythic Fortune",       icon: "💎", desc: "Find a Mythic item.",             check: (s) => s.loot.bestRarity >= 5,     reward: { shards: 4 } },
      { id: "enchant10",  name: "Master Runesmith",     icon: "🔮", desc: "Enchant an item to +10.",         check: (s) => s.loot.bestEnchant >= 10,   reward: { shards: 3 } },
      { id: "rich",       name: "Dragon's Hoard",       icon: "🪙", desc: "Earn 1,000,000 total gold.",      check: (s) => s.totals.goldEarned >= 1e6, reward: { runes: 20 } },
      { id: "saga_1",     name: "A New Saga",           icon: "🌀", desc: "Prestige for the first time.",    check: (s) => s.saga.totalEarned > 0,     reward: { shards: 3 } },
      { id: "combo_50",   name: "Fury Unleashed",       icon: "⚡", desc: "Reach a 50-hit combo.",           check: (s) => (s.totals.maxCombo || 0) >= 50, reward: { runes: 12 } },
      { id: "warband_10", name: "Growing Warband",      icon: "🪓", desc: "Hire 10 specialists.",            check: (s) => { const u = s.units || {}; return ((u.berserker||0)+(u.archer||0)+(u.shieldmaiden||0)) >= 10; }, reward: { runes: 10 } },
      { id: "warband_100",name: "Legion of the North",  icon: "⚜️", desc: "Hire 100 specialists.",           check: (s) => { const u = s.units || {}; return ((u.berserker||0)+(u.archer||0)+(u.shieldmaiden||0)) >= 100; }, reward: { shards: 5 } },
      { id: "storm_5",    name: "Storm Chaser",         icon: "🌊", desc: "Brave the Storm Strait 5 times.", check: (s) => ((s.routeStats && s.routeStats.storm) || 0) >= 5, reward: { runes: 12 } },
      { id: "cursed_5",   name: "Grave Robber",         icon: "🧭", desc: "Dare the Cursed Channel 5 times.", check: (s) => ((s.routeStats && s.routeStats.cursed) || 0) >= 5, reward: { shards: 4 } },
    ],

    // --- Village modifiers (per-fight affixes; hp/dps/gold/xp are multipliers) ---
    MODIFIERS: [
      { id: "none",        name: "Placid",       icon: "🕊️", hp: 1.0,  dps: 1.0,  gold: 1.0,  xp: 1.0,  weight: 0,  desc: "No special traits." },
      { id: "wealthy",     name: "Wealthy",      icon: "💰", hp: 1.0,  dps: 1.0,  gold: 1.7,  xp: 1.2,  weight: 14, desc: "+70% gold plundered." },
      { id: "golden",      name: "Golden",       icon: "✨", hp: 1.0,  dps: 1.0,  gold: 2.6,  xp: 1.0,  weight: 4,  desc: "+160% gold plundered." },
      { id: "stalwart",    name: "Stalwart",     icon: "🛡️", hp: 2.3,  dps: 1.0,  gold: 1.5,  xp: 1.4,  weight: 10, desc: "Fortified: +130% HP, +50% gold." },
      { id: "frenzy",      name: "Frenzied",     icon: "🔥", hp: 0.85, dps: 2.0,  gold: 1.4,  xp: 1.2,  weight: 9,  desc: "Defenses strike twice as hard." },
      { id: "bloodthirsty",name: "Bloodthirsty", icon: "🩸", hp: 1.1,  dps: 1.7,  gold: 1.6,  xp: 1.3,  weight: 7,  desc: "Lethal defenses, rich plunder." },
      { id: "hexed",       name: "Hexed",        icon: "🔮", hp: 1.0,  dps: 1.0,  gold: 2.0,  xp: 1.6,  weight: 6,  crit: false, desc: "Crits disabled — but +100% gold." },
      { id: "swift",       name: "Swift",        icon: "💨", hp: 0.8,  dps: 1.45, gold: 1.25, xp: 1.1,  weight: 8,  desc: "Fast and fierce raiders." },
      { id: "plagued",     name: "Plagued",      icon: "☠️", hp: 1.35, dps: 1.35, gold: 1.7,  xp: 1.4,  weight: 6,  desc: "Tough and toxic." },
      { id: "raging",      name: "Raging",       icon: "😡", hp: 1.2,  dps: 2.2,  gold: 1.9,  xp: 1.5,  weight: 3,  desc: "Enraged defenders, fat loot." },
    ],
    MODIFIER_BY_ID: {},
    rollModifier(region, isBoss, rng) {
      const r = rng || Math.random;
      let chance = Math.min(CONFIG.MODIFIER_CHANCE_CAP, CONFIG.MODIFIER_CHANCE_BASE + region * CONFIG.MODIFIER_CHANCE_PER_REGION);
      if (isBoss && CONFIG.MODIFIER_BOSS_ALWAYS) chance = 1;
      if (r() > chance) return DATA.MODIFIERS[0];
      const pool = DATA.MODIFIERS.filter((m) => m.weight > 0);
      let total = 0; pool.forEach((m) => (total += m.weight));
      let roll = r() * total;
      for (let i = 0; i < pool.length; i++) { roll -= pool[i].weight; if (roll <= 0) return pool[i]; }
      return pool[pool.length - 1];
    },

    // --- Daily quest templates ---------------------------------------
    // goal: fixed, or 0 => computed dynamically from player economy
    DAILY_POOL: [
      { id: "raid",     track: "raids",     verb: "Raid",        noun: "villages",   goal: 15,  reward: { runes: 3 } },
      { id: "boss",     track: "bosses",    verb: "Defeat",      noun: "Boss Lairs", goal: 1,   reward: { runes: 6, shards: 1 } },
      { id: "tap",      track: "taps",      verb: "Strike",      noun: "times",      goal: 150, reward: { runes: 3 } },
      { id: "gold",     track: "gold",      verb: "Plunder",     noun: "gold",       goal: 0,   reward: { runes: 4 } },
      { id: "upgrade",  track: "upgrades",  verb: "Forge",       noun: "upgrades",   goal: 6,   reward: { runes: 4 } },
      { id: "enchant",  track: "enchants",  verb: "Enchant",     noun: "items",      goal: 1,   reward: { runes: 7, shards: 1 } },
      { id: "hire",     track: "hires",     verb: "Hire",        noun: "specialists", goal: 8,  reward: { runes: 4 } },
    ],


    // Deterministic-ish RNG helpers (seedable for stable village names per save)
    rng(seed) {
      // mulberry32
      let a = seed >>> 0;
      return function () {
        a |= 0; a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    },

    villageName(rngFn) {
      const p = DATA.NAME_PREFIX[Math.floor(rngFn() * DATA.NAME_PREFIX.length)];
      const r = DATA.NAME_ROOT[Math.floor(rngFn() * DATA.NAME_ROOT.length)];
      return p + r;
    },

    bossName(rngFn) {
      const t = DATA.BOSS_TITLES[Math.floor(rngFn() * DATA.BOSS_TITLES.length)];
      const n = DATA.BOSS_NAMES[Math.floor(rngFn() * DATA.BOSS_NAMES.length)];
      return t + " " + n;
    },

    regionName(index) {
      if (index < DATA.REGIONS.length) return DATA.REGIONS[index].name;
      // procedural for endless regions
      const tiers = ["Cursed", "Forsaken", "Doomed", "Shattered", "Abyssal", "Eternal"];
      const places = ["Reach", "Wastes", "Deeps", "Height", "March", "Maw"];
      const t = tiers[(index - DATA.REGIONS.length) % tiers.length];
      const p = places[(index - DATA.REGIONS.length) % places.length];
      return "The " + t + " " + p + " " + (Math.floor((index - DATA.REGIONS.length) / tiers.length) + 1);
    },

    regionArt(index) {
      if (index < DATA.REGIONS.length) return DATA.REGIONS[index];
      // cycle art, darkening tints for deeper regions
      const base = DATA.REGIONS[index % DATA.REGIONS.length];
      return { name: DATA.regionName(index), art: base.art, tint: base.tint, weather: base.weather };
    },

    // Compose a flavourful item name from its slot + rarity.
    itemName(slotId, rarity, rngFn) {
      const slot = DATA.SLOT_BY_ID[slotId] || { name: "Item" };
      const adj = DATA.ITEM_ADJ[Math.floor(rngFn() * DATA.ITEM_ADJ.length)];
      if (rarity >= 4) {
        const suf = DATA.ITEM_SUFFIX[Math.floor(rngFn() * DATA.ITEM_SUFFIX.length)];
        return adj + " " + slot.name + " of " + suf;
      }
      return adj + " " + slot.name;
    },

    // Affix display value at a given item level
    affixValue(affix, level) {
      const scale = 1 + CONFIG.LOOT_AFFIX_LEVEL_SCALE * (level - 1);
      let v = (affix.base * DATA.RARITY[affix.rarity].mult) * scale;
      return v;
    },
  };

  // build lookup maps
  DATA.AFFIXES.forEach((a) => (DATA.AFFIX_BY_ID[a.id] = a));
  DATA.SLOTS.forEach((s) => (DATA.SLOT_BY_ID[s.id] = s));
  DATA.MODIFIERS.forEach((m) => (DATA.MODIFIER_BY_ID[m.id] = m));
  DATA.UNITS.forEach((u) => (DATA.UNIT_BY_ID[u.id] = u));
  DATA.ROUTES.forEach((r) => (DATA.ROUTE_BY_ID[r.id] = r));

  global.DATA = DATA;
})(typeof window !== "undefined" ? window : this);
