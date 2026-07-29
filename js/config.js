/* ============================================================
   VIKING RAID — config.js
   Central balance constants & formula helpers.
   Tune numbers here; everything else derives from these.
   New Era Studios LLC
   ============================================================ */
(function (global) {
  "use strict";

  const CONFIG = {
    // --- Build / meta -------------------------------------------------
    VERSION: "1.0.0",
    SAVE_KEY: "vikingraid.save.v1",
    SAVE_INTERVAL_MS: 15000,        // autosave cadence
    AUTOSAVE_DIRTY: true,

    // --- Loop timing --------------------------------------------------
    TICK_HZ: 20,                     // simulation ticks per second
    RENDER_HZ: 60,                   // target render fps
    OFFLINE_CAP_HOURS: 8,            // max offline progress credited
    OFFLINE_EFFICIENCY: 0.45,        // crew fights at 45% strength while away

    // --- Region / raid structure -------------------------------------
    VILLAGES_PER_REGION: 10,         // last one of each region is the Boss Lair
    BOSS_INDEX: 9,                   // 0-based index of the boss within a region

    // --- Village HP / reward scaling ---------------------------------
    VILLAGE_BASE_HP: 14,
    VILLAGE_HP_REGION_GROWTH: 4.35,  // HP multiplier gained per region tier
    VILLAGE_HP_PER_INDEX: 0.16,      // additive growth as you clear a region
    BOSS_HP_MULT: 7.0,

    VILLAGE_BASE_GOLD: 7,
    VILLAGE_GOLD_GROWTH: 1.52,
    VILLAGE_BASE_XP: 6,
    VILLAGE_XP_GROWTH: 1.5,

    // --- Enemy counter-attack ("defense") draining the longship ------
    VILLAGE_BASE_DPS: 0.55,
    VILLAGE_DPS_GROWTH: 1.46,
    BOSS_DPS_MULT: 2.2,

    // --- Player leveling ---------------------------------------------
    XP_BASE: 70,
    XP_GROWTH: 1.165,
    STAT_POINTS_PER_LEVEL: 4,
    STARTING_STATS: { str: 0, led: 0, vit: 0, fot: 0 },

    // --- Tap damage ---------------------------------------------------
    TAP_BASE: 2,
    STR_PER_TAP: 0.7,                // flat tap dmg per Strength
    AXE_TAP_PER_LEVEL: 0.5,          // multiplier growth per Axe level

    // --- Warband (auto DPS) ------------------------------------------
    CREW_BASE_DPS: 0.9,
    CREW_DPS_PER_LEVEL: 0.95,
    LED_CREW_BONUS: 0.09,            // +9% crew dmg per Leadership
    CREW_BASE_INTERVAL_S: 1.0,       // attack cadence at Drummers level 0
    DRUM_SPEED_PER_LEVEL: 0.04,      // faster attacks per Drummers level (capped)

    // --- Longship durability -----------------------------------------
    SHIP_BASE_HP: 100,
    VIT_PER_HP: 20,
    ARMOR_HP_PER_LEVEL: 0.30,
    REGEN_BASE_FRAC: 0.012,          // regen 1.2% max HP / sec base
    RATIONS_REGEN_PER_LEVEL: 0.004,  // +0.4%/sec per Rations level
    REGEN_ON_CLEAR_BONUS: 0.35,      // heal 35% of max on clearing a village
    REPAIR_GOLD_FRAC: 0.10,          // instant repair costs 10% of a village's gold

    // --- Crit ---------------------------------------------------------
    CRIT_BASE_CHANCE: 0.04,
    FOT_CRIT_CHANCE: 0.012,          // +1.2% crit per Fortune
    CRIT_BASE_MULT: 2.0,
    MEAD_CRIT_MULT_PER_LEVEL: 0.18,
    CRIT_CAP: 0.75,

    // --- Gold / Fortune find -----------------------------------------
    FOT_GOLD_PER_LEVEL: 0.03,        // +3% gold per Fortune

    // --- Upgrade cost curve ------------------------------------------
    UPG_COST_GROWTH: 1.15,
    UPG_COST_GROWTH_HEAVY: 1.22,

    // --- Abilities (active) ------------------------------------------
    ABILITIES: {
      berserk: {
        name: "Berserker Rage",
        desc: "Unleash fury: x6 Tap & Crew damage for 7s.",
        icon: "🔥",
        unlockLevel: 4,
        durationS: 7,
        cooldownS: 28,
        mult: 6,
      },
      shield: {
        name: "Shield Wall",
        desc: "Raise shields: take no longship damage for 6s.",
        icon: "🛡️",
        unlockLevel: 9,
        durationS: 6,
        cooldownS: 42,
      },
      horn: {
        name: "Raid Horn",
        desc: "Sound the horn: deal 30s of Warband damage instantly & +60% gold on the next raid.",
        icon: "📯",
        unlockLevel: 16,
        durationS: 0,
        cooldownS: 55,
      },
      valkyrie: {
        name: "Valkyrie's Wrath",
        desc: "Call the Valkyries: 9s of massive guaranteed crits and double Warband speed.",
        icon: "⚡",
        unlockLevel: 28,
        durationS: 9,
        cooldownS: 75,
      },
    },

    // --- Prestige (Saga) ---------------------------------------------
    SAGA_MIN_REGION: 2,              // need to have cleared region index >= this
    SAGA_SHARD_BASE: 6,              // shard formula scaling
    SAGA_SHARD_EXP: 1.42,
    SAGA_BONUS_PER_SHARD_TOTAL: 0.0, // handled per-upgrade below
    SAGA_UPGRADE_COST_GROWTH: 1.7,

    // --- Loot & equipment --------------------------------------------
    LOOT_DROP_CHANCE: 0.16,        // base drop chance per village cleared
    LOOT_BOSS_DROP_CHANCE: 1.0,    // bosses always drop loot
    LOOT_BOSS_RARITY_BONUS: 1,     // bosses roll +1 rarity tier minimum
    LOOT_INV_CAP: 40,              // max items in inventory
    LOOT_AFFIX_LEVEL_SCALE: 0.22,  // per-item-level bonus to affix values
    LOOT_ENCHANT_BASE_RUNES: 2,
    LOOT_ENCHANT_BASE_GOLD: 60,
    LOOT_ENCHANT_GROWTH: 1.65,     // cost growth per enchant level
    LOOT_ENCHANT_MAX_LEVEL: 25,
    // probability of promoting from rarity tier i -> i+1 (before luck)
    LOOT_PROMOTE: [0.52, 0.34, 0.16, 0.07, 0.025],

    // --- Runes (enchant currency) ------------------------------------
    RUNES_PER_BOSS_BASE: 3,
    RUNES_PER_BOSS_REGION: 0.5,
    RUNES_SALVAGE_BASE: 1,

    // --- Daily Saga quests -------------------------------------------
    DAILY_QUEST_COUNT: 3,
    DAILY_RESET_UTC: true,         // roll over at UTC midnight (stable globally)

    // --- Combo (rewards active tapping) ------------------------------
    COMBO_WINDOW_MS: 2200,         // idle time before combo resets
    COMBO_MULT_PER_HIT: 0.02,      // +2% tap dmg per combo step
    COMBO_MULT_CAP: 3.0,           // max tap multiplier from combo
    COMBO_MILESTONE: 25,           // every N hits = pitch escalation + mini-burst

    // --- Juice / game feel -------------------------------------------
    HITSTOP_CRIT_MS: 45,
    HITSTOP_BOSS_MS: 80,
    HITSTOP_LEVELUP_MS: 110,
    HITSTOP_CLEAR_MS: 35,
    SCREEN_SHAKE_DECAY: 0.84,      // overrides earlier default below

    // --- Achievements ------------------------------------------------
    ACHIEVEMENT_CHECK_INTERVAL_S: 2,

    // --- Village modifiers (per-fight variety) -----------------------
    MODIFIER_CHANCE_PER_REGION: 0.07, // +7% chance per region tier
    MODIFIER_CHANCE_CAP: 0.65,
    MODIFIER_CHANCE_BASE: 0.0,        // region 0 stays clean (gentle intro)
    MODIFIER_BOSS_ALWAYS: true,       // boss lairs always carry a modifier

    // --- Ragnarök ultimate (Rage meter) ------------------------------
    RAGE_PER_TAP: 0.0014,
    RAGE_PER_CLEAR: 0.06,
    RAGE_PER_BOSS: 0.24,
    RAGE_CAP: 1,
    RAGNAROK_DMG_CREW_SECONDS: 45,    // instant burst ~= 45s of crew dps
    RAGNAROK_DMG_MIN_FRAC: 0.22,      // …or at least 22% of target max HP
    RAGNAROK_BUFF_S: 8,
    RAGNAROK_BUFF_MULT: 2,

    // --- Boss fury / stagger -----------------------------------------
    BOSS_FURY_HP_FRAC: 0.35,
    BOSS_STAGGER_S: 4,
    BOSS_STAGGER_DMG_MULT: 2,
    BOSS_FURY_DPS_MULT: 2.5,

    // --- Misc / feel --------------------------------------------------
    FLOATER_LIFE_MS: 850,
    MAX_FLOATERS: 60,
    HAPTICS: true,
  };

  // --- Formula helpers (pure) -----------------------------------------
  const F = {
    // XP needed to go from `level` -> level+1
    xpForLevel(level) {
      return Math.floor(CONFIG.XP_BASE * Math.pow(CONFIG.XP_GROWTH, level - 1));
    },

    // Region HP multiplier for region tier r (0-indexed)
    regionHpMul(r) {
      return Math.pow(CONFIG.VILLAGE_HP_REGION_GROWTH, r);
    },

    // Village base stats for a given region index + position
    villageHp(region, index) {
      const isBoss = index === CONFIG.BOSS_INDEX;
      let hp =
        CONFIG.VILLAGE_BASE_HP *
        F.regionHpMul(region) *
        (1 + index * CONFIG.VILLAGE_HP_PER_INDEX);
      if (isBoss) hp *= CONFIG.BOSS_HP_MULT;
      return hp;
    },

    villageDps(region, index) {
      const isBoss = index === CONFIG.BOSS_INDEX;
      let dps =
        CONFIG.VILLAGE_BASE_DPS *
        Math.pow(CONFIG.VILLAGE_DPS_GROWTH, region) *
        (1 + index * 0.10);
      if (isBoss) dps *= CONFIG.BOSS_DPS_MULT;
      return dps;
    },

    villageGold(region, index) {
      const isBoss = index === CONFIG.BOSS_INDEX;
      let g =
        CONFIG.VILLAGE_BASE_GOLD *
        Math.pow(CONFIG.VILLAGE_GOLD_GROWTH, region + index * 0.5);
      if (isBoss) g *= 9;
      return g;
    },

    villageXp(region, index) {
      const isBoss = index === CONFIG.BOSS_INDEX;
      let x =
        CONFIG.VILLAGE_BASE_XP *
        Math.pow(CONFIG.VILLAGE_XP_GROWTH, region + index * 0.45);
      if (isBoss) x *= 7;
      return x;
    },

    // Upgrade cost given base, growth, current level
    upgradeCost(base, growth, level) {
      return Math.ceil(base * Math.pow(growth, level));
    },

    // Saga shards earned for reaching a given max region (0-indexed)
    sagaShardsFor(maxRegion) {
      if (maxRegion < CONFIG.SAGA_MIN_REGION) return 0;
      const r = maxRegion - (CONFIG.SAGA_MIN_REGION - 1);
      return Math.floor(CONFIG.SAGA_SHARD_BASE * Math.pow(r, CONFIG.SAGA_SHARD_EXP));
    },
  };

  global.CONFIG = CONFIG;
  global.F = F;
})(typeof window !== "undefined" ? window : this);
