/* ============================================================
   VIKING RAID — state.js
   Game state shape, persistence (localStorage), offline
   detection, and export/import backup codes.
   New Era Studios LLC
   ============================================================ */
(function (global) {
  "use strict";

  const KEY = CONFIG.SAVE_KEY;

  function freshSagaUpgrades() {
    const o = {};
    DATA.SAGA.forEach((s) => (o[s.id] = 0));
    return o;
  }
  function freshUpgrades() {
    const o = {};
    DATA.UPGRADES.forEach((u) => (o[u.id] = 0));
    return o;
  }
  function freshAbilities() {
    const o = {};
    Object.keys(CONFIG.ABILITIES).forEach((id) => {
      o[id] = { cdLeft: 0, activeLeft: 0 };
    });
    return o;
  }

  function freshEquipped() {
    const o = {};
    DATA.SLOTS.forEach((s) => (o[s.id] = null));
    return o;
  }

  function defaults() {
    return {
      meta: {
        version: CONFIG.VERSION,
        createdAt: Date.now(),
        playtimeS: 0,
        lastSaved: Date.now(),
      },
      gold: 0,
      xp: 0,
      level: 1,
      unspentStatPoints: 0,
      stats: { str: 0, led: 0, vit: 0, fot: 0 },
      upgrades: freshUpgrades(),
      units: { berserker: 0, archer: 0, shieldmaiden: 0 },
      route: "calm",        // active expedition route for the current region
      routeStats: { storm: 0, cursed: 0 }, // lifetime risky-route picks
      saga: {
        shards: 0,
        totalEarned: 0,
        upgrades: freshSagaUpgrades(),
      },
      region: 0,
      villageIndex: 0,
      highestRegion: 0,
      shipHp: -1, // -1 => set to max on first load
      abilities: freshAbilities(),
      hornGoldBuff: 0, // bonus gold fraction on next raid from Raid Horn
      totals: {
        goldEarned: 0,
        raids: 0,
        bosses: 0,
        taps: 0,
        crits: 0,
        maxCombo: 0,
        caches: 0,
      },
      loot: {
        inventory: [],
        equipped: freshEquipped(),
        runes: 0,
        totalRunes: 0,
        totalDrops: 0,
        bestRarity: 0,
        bestEnchant: 0,
        uid: 1,
      },
      achievements: [], // unlocked achievement ids
      onboarding: { step: 0, dismissed: false },
      dailies: null, // generated lazily by Sys.dailyRollover()
      settings: { sfx: true, haptics: true, reducedFx: false, notifsBoss: true, music: true, autoEquip: false },
      seenIntro: false,
    };
  }

  // Migrate / heal an older or partial save into the current shape.
  function heal(s) {
    const d = defaults();
    const out = Object.assign({}, d, s);
    out.meta = Object.assign({}, d.meta, s.meta || {});
    out.stats = Object.assign({}, d.stats, s.stats || {});
    out.upgrades = Object.assign(freshUpgrades(), s.upgrades || {});
    out.units = Object.assign({ berserker: 0, archer: 0, shieldmaiden: 0 }, s.units || {});
    if (typeof out.route !== "string" || !out.route) out.route = "calm";
    out.routeStats = Object.assign({ storm: 0, cursed: 0 }, s.routeStats || {});
    out.saga = Object.assign({}, d.saga, s.saga || {});
    out.saga.upgrades = Object.assign(freshSagaUpgrades(), (s.saga && s.saga.upgrades) || {});
    out.abilities = Object.assign(freshAbilities(), s.abilities || {});
    Object.keys(d.abilities).forEach((id) => {
      out.abilities[id] = Object.assign({ cdLeft: 0, activeLeft: 0 }, out.abilities[id] || {});
    });
    out.totals = Object.assign({}, d.totals, s.totals || {});
    out.settings = Object.assign({}, d.settings, s.settings || {});
    out.achievements = Array.isArray(s.achievements) ? s.achievements : [];
    out.onboarding = Object.assign({}, d.onboarding, s.onboarding || {});
    // loot
    out.loot = Object.assign({}, d.loot, s.loot || {});
    out.loot.equipped = Object.assign(freshEquipped(), (s.loot && s.loot.equipped) || {});
    out.loot.inventory = Array.isArray(out.loot.inventory) ? out.loot.inventory : [];
    if (typeof out.loot.runes !== "number") out.loot.runes = 0;
    if (typeof out.loot.uid !== "number") out.loot.uid = 1 + out.loot.inventory.length;
    if (typeof out.loot.bestEnchant !== "number") out.loot.bestEnchant = 0;
    // dailies left as-is (validated/rolled by Sys); ensure object if present
    out.dailies = s.dailies || null;
    if (typeof out.unspentStatPoints !== "number") out.unspentStatPoints = 0;
    return out;
  }

  function save(state) {
    try {
      state.meta.lastSaved = Date.now();
      const payload = JSON.stringify(state);
      localStorage.setItem(KEY, payload);
      return true;
    } catch (e) {
      console.warn("Save failed:", e);
      return false;
    }
  }

  // Returns { state, offlineMs } or null if no save.
  function load() {
    let raw = null;
    try {
      raw = localStorage.getItem(KEY);
    } catch (e) {
      return null;
    }
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      const state = heal(parsed);
      const offlineMs = Math.max(0, Date.now() - (state.meta.lastSaved || Date.now()));
      return { state, offlineMs };
    } catch (e) {
      console.warn("Load failed, starting fresh:", e);
      return null;
    }
  }

  function wipe() {
    try {
      localStorage.removeItem(KEY);
    } catch (e) {}
  }

  // --- Export / import (base64 backup code) -------------------------
  function exportCode(state) {
    try {
      const json = JSON.stringify(state);
      // base64url-safe, UTF-8 friendly
      const b64 = btoa(unescape(encodeURIComponent(json)));
      return "VR1-" + b64;
    } catch (e) {
      return "";
    }
  }

  function importCode(code) {
    try {
      const trimmed = String(code).trim().replace(/^VR1-/, "");
      const json = decodeURIComponent(escape(atob(trimmed)));
      const parsed = JSON.parse(json);
      return heal(parsed);
    } catch (e) {
      return null;
    }
  }

  global.State = { defaults, heal, save, load, wipe, exportCode, importCode, freshAbilities };
})(typeof window !== "undefined" ? window : this);
