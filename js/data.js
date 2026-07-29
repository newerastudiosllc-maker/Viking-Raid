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
    REGIONS: [
      { name: "The Frozen Shore",   art: "scene_village",  tint: "#1b2a3a" },
      { name: "Whispering Fjords",  art: "scene_village",  tint: "#243440" },
      { name: "Ironwood Forest",    art: "scene_forest",   tint: "#16241a" },
      { name: "Blackpine Marches",  art: "scene_forest",   tint: "#1a2230" },
      { name: "Stormhold Keep",     art: "scene_fortress", tint: "#10131f" },
      { name: "Thunder Cliffs",     art: "scene_fortress", tint: "#0e1322" },
    ],

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

    // --- Daily quest templates ---------------------------------------
    // goal: fixed, or 0 => computed dynamically from player economy
    DAILY_POOL: [
      { id: "raid",     track: "raids",     verb: "Raid",        noun: "villages",   goal: 15,  reward: { runes: 3 } },
      { id: "boss",     track: "bosses",    verb: "Defeat",      noun: "Boss Lairs", goal: 1,   reward: { runes: 6, shards: 1 } },
      { id: "tap",      track: "taps",      verb: "Strike",      noun: "times",      goal: 150, reward: { runes: 3 } },
      { id: "gold",     track: "gold",      verb: "Plunder",     noun: "gold",       goal: 0,   reward: { runes: 4 } },
      { id: "upgrade",  track: "upgrades",  verb: "Forge",       noun: "upgrades",   goal: 6,   reward: { runes: 4 } },
      { id: "enchant",  track: "enchants",  verb: "Enchant",     noun: "items",      goal: 1,   reward: { runes: 7, shards: 1 } },
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
      return { name: DATA.regionName(index), art: base.art, tint: base.tint };
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

  global.DATA = DATA;
})(typeof window !== "undefined" ? window : this);
