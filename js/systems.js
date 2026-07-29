/* ============================================================
   VIKING RAID — systems.js
   The simulation: derived stats, village generation, combat,
   leveling, upgrades, abilities, prestige, offline progress.
   New Era Studios LLC
   ============================================================ */
(function (global) {
  "use strict";

  const G = (global.G = global.G || {
    state: null,
    village: null,
    derived: null,
    dirty: true,
    paused: false,
    listeners: {},
    fx: null, // filled by render.js
  });

  // --- Tiny event bus ----------------------------------------------
  G.on = function (ev, cb) {
    (G.listeners[ev] = G.listeners[ev] || []).push(cb);
  };
  G.emit = function (ev, data) {
    (G.listeners[ev] || []).forEach(function (cb) {
      try { cb(data); } catch (e) { console.warn(e); }
    });
  };

  const Sys = (global.Sys = {});

  // --- Saga bonus helpers ------------------------------------------
  function sagaBonus(kind) {
    let total = 0;
    DATA.SAGA.forEach(function (s) {
      if (s.kind === kind) total += (G.state.saga.upgrades[s.id] || 0) * s.bonusPerLevel;
    });
    return total;
  }

  // --- Recompute all derived (static) stats -------------------------
  Sys.recompute = function () {
    const s = G.state;
    const C = CONFIG;
    const statMul = 1 + (s.saga.upgrades.allfather || 0) * 0.05;
    const strEff = s.stats.str * statMul;
    const ledEff = s.stats.led * statMul;
    const vitEff = s.stats.vit * statMul;
    const fotEff = s.stats.fot * statMul;
    const bannerMult = 1 + (s.upgrades.banner || 0) * 0.12;

    const tapBase = C.TAP_BASE + strEff * C.STR_PER_TAP;
    const tapDmg =
      tapBase *
      (1 + (s.upgrades.axe || 0) * C.AXE_TAP_PER_LEVEL) *
      bannerMult *
      (1 + sagaBonus("tap"));

    const crewDmg =
      (C.CREW_BASE_DPS + (s.upgrades.crew || 0) * C.CREW_DPS_PER_LEVEL) *
      (1 + ledEff * C.LED_CREW_BONUS) *
      bannerMult *
      (1 + sagaBonus("crew"));

    const shipMaxHp =
      (C.SHIP_BASE_HP + vitEff * C.VIT_PER_HP) *
      (1 + (s.upgrades.armor || 0) * C.ARMOR_HP_PER_LEVEL) *
      (1 + sagaBonus("hp"));

    const d = {
      statMul: statMul,
      tapDmg: tapDmg,
      crewDps: crewDmg,
      shipMaxHp: Math.max(1, shipMaxHp),
      regenFrac: C.REGEN_BASE_FRAC + (s.upgrades.rations || 0) * C.RATIONS_REGEN_PER_LEVEL,
      critChance: Math.min(C.CRIT_CAP, C.CRIT_BASE_CHANCE + fotEff * C.FOT_CRIT_CHANCE),
      critMult: C.CRIT_BASE_MULT + (s.upgrades.mead || 0) * C.MEAD_CRIT_MULT_PER_LEVEL,
      goldMult: (1 + fotEff * C.FOT_GOLD_PER_LEVEL) * (1 + sagaBonus("gold")),
      crewInterval:
        C.CREW_BASE_INTERVAL_S * (1 - Math.min(0.6, (s.upgrades.drum || 0) * C.DRUM_SPEED_PER_LEVEL)),
      bannerMult: bannerMult,
      sagaTap: sagaBonus("tap"),
      sagaCrew: sagaBonus("crew"),
      sagaHp: sagaBonus("hp"),
      sagaGold: sagaBonus("gold"),
    };
    G.derived = d;
    G.dirty = false;
    return d;
  };
  function ensureDerived() {
    if (G.dirty || !G.derived) Sys.recompute();
    return G.derived;
  }

  // --- Village generation (deterministic per region/index) ---------
  Sys.genVillage = function (region, index) {
    const seed = (region * 1000 + index) * 7919 + 104729;
    const rng = DATA.rng(seed >>> 0);
    const isBoss = index === CONFIG.BOSS_INDEX;
    const type = DATA.VILLAGE_TYPES[Math.floor(rng() * DATA.VILLAGE_TYPES.length)];
    let name;
    if (isBoss) name = DATA.bossName(rng) + "'s Lair";
    else name = DATA.villageName(rng) + " " + type.word;

    const maxHp = F.villageHp(region, index) * type.hp;
    return {
      region: region,
      index: index,
      name: name,
      isBoss: isBoss,
      type: type,
      maxHp: maxHp,
      hp: maxHp,
      gold: F.villageGold(region, index) * type.gold,
      xp: F.villageXp(region, index),
      dps: F.villageDps(region, index),
      hitFlash: 0,
      wobble: 0,
    };
  };

  // --- Initialize runtime from a state -----------------------------
  Sys.init = function (state) {
    G.state = state;
    G.dirty = true;
    ensureDerived();
    if (state.shipHp < 0 || state.shipHp > G.derived.shipMaxHp) {
      state.shipHp = G.derived.shipMaxHp;
    }
    G.village = Sys.genVillage(state.region, state.villageIndex);
  };

  // --- Current max ship HP accessor (used after recompute) ---------
  Sys.syncShipHp = function () {
    const max = ensureDerived().shipMaxHp;
    if (G.state.shipHp > max) G.state.shipHp = max;
    return G.state.shipHp;
  };

  // --- Tap attack ---------------------------------------------------
  Sys.tap = function (px, py) {
    if (G.paused) return;
    const d = ensureDerived();
    const s = G.state;
    const v = G.village;
    let dmg = d.tapDmg;
    if (s.abilities.berserk.activeLeft > 0) dmg *= CONFIG.ABILITIES.berserk.mult;
    let crit = Math.random() < d.critChance || s.abilities.valkyrie.activeLeft > 0;
    if (crit) dmg *= d.critMult;
    dmg = Math.max(1, dmg);

    v.hp -= dmg;
    v.hitFlash = 1;
    v.wobble = 1;
    s.totals.taps++;
    if (crit) s.totals.crits++;

    if (G.fx) G.fx.tapImpact(px, py, dmg, crit);
    if (s.settings.haptics && navigator.vibrate) {
      navigator.vibrate(crit ? 22 : 8);
    }
    if (v.hp <= 0) Sys.clearVillage();
  };

  // --- Crew / defense simulation tick ------------------------------
  Sys.tick = function (dt) {
    if (G.paused) return;
    const d = ensureDerived();
    const s = G.state;
    const v = G.village;

    // ability timers
    Object.keys(s.abilities).forEach(function (id) {
      const a = s.abilities[id];
      if (a.activeLeft > 0) {
        a.activeLeft = Math.max(0, a.activeLeft - dt);
        if (a.activeLeft === 0) G.emit("abilityEnd", id);
      }
      if (a.cdLeft > 0) a.cdLeft = Math.max(0, a.cdLeft - dt);
    });

    // warband damage to village
    let crewDps = d.crewDps;
    let interval = d.crewInterval;
    if (s.abilities.berserk.activeLeft > 0) crewDps *= CONFIG.ABILITIES.berserk.mult;
    if (s.abilities.valkyrie.activeLeft > 0) {
      crewDps *= 1.6;
      interval *= 0.5;
    }
    const crewDmg = crewDps * dt;
    if (crewDmg > 0) {
      v.hp -= crewDmg;
      v.hitFlash = Math.min(1, v.hitFlash + 0.4);
    }

    // enemy defense drains the longship
    const shielded = s.abilities.shield.activeLeft > 0;
    if (!shielded) {
      const dmg = v.dps * dt;
      s.shipHp -= dmg;
    }

    // durability regen
    if (s.shipHp < d.shipMaxHp) {
      s.shipHp = Math.min(d.shipMaxHp, s.shipHp + d.regenFrac * d.shipMaxHp * dt);
    }

    // retreat condition
    if (s.shipHp <= 0) {
      Sys.onRetreat();
    } else if (v.hp <= 0) {
      Sys.clearVillage();
    }
  };

  // --- Clear current village ---------------------------------------
  Sys.clearVillage = function () {
    const s = G.state;
    const v = G.village;
    if (!v || v.hp > 0) return;
    v.hp = 0;

    const goldGain = Math.ceil(v.gold * G.derived.goldMult * (1 + s.hornGoldBuff));
    const xpGain = Math.ceil(v.xp);
    s.gold += goldGain;
    s.xp += xpGain;
    s.totals.goldEarned += goldGain;
    s.totals.raids++;
    s.hornGoldBuff = 0;

    const wasBoss = v.isBoss;
    if (wasBoss) s.totals.bosses++;

    // heal ship on victory
    const heal = G.derived.shipMaxHp * CONFIG.REGEN_ON_CLEAR_BONUS;
    s.shipHp = Math.min(G.derived.shipMaxHp, s.shipHp + heal);

    G.emit("clear", { gold: goldGain, xp: xpGain, boss: wasBoss, name: v.name });

    // advance
    let idx = v.index + 1;
    let reg = v.region;
    if (idx >= CONFIG.VILLAGES_PER_REGION) {
      idx = 0;
      reg += 1;
    }
    s.region = reg;
    s.villageIndex = idx;
    if (reg > s.highestRegion) {
      s.highestRegion = reg;
      G.emit("newRegion", reg);
    }

    Sys.checkLevel();
    G.village = Sys.genVillage(reg, idx);
  };

  // --- Retreat (longship overwhelmed) ------------------------------
  Sys.onRetreat = function () {
    const s = G.state;
    s.shipHp = G.derived.shipMaxHp * 0.6;
    if (G.village) {
      G.village.hp = G.village.maxHp; // must re-defeat
      G.village.hitFlash = 0;
    }
    G.emit("retreat");
  };

  // --- Instant repair (gold) ---------------------------------------
  Sys.repair = function () {
    const s = G.state;
    const d = ensureDerived();
    if (s.shipHp >= d.shipMaxHp) return false;
    const cost = Math.max(5, Math.ceil(F.villageGold(s.region, s.villageIndex) * CONFIG.REPAIR_GOLD_FRAC));
    if (s.gold < cost) return false;
    s.gold -= cost;
    s.shipHp = d.shipMaxHp;
    G.emit("repair");
    return true;
  };

  // --- Leveling ----------------------------------------------------
  Sys.checkLevel = function () {
    const s = G.state;
    let leveled = false;
    while (s.xp >= F.xpForLevel(s.level)) {
      s.xp -= F.xpForLevel(s.level);
      s.level++;
      s.unspentStatPoints += CONFIG.STAT_POINTS_PER_LEVEL;
      leveled = true;
    }
    if (leveled) G.emit("levelup", s.level);
    return leveled;
  };

  Sys.allocStat = function (id) {
    const s = G.state;
    if (s.unspentStatPoints <= 0) return false;
    if (s.stats[id] == null) return false;
    s.stats[id]++;
    s.unspentStatPoints--;
    G.dirty = true;
    Sys.syncShipHp();
    G.emit("stat");
    return true;
  };

  // --- Upgrades ----------------------------------------------------
  Sys.upgradeCost = function (id, level) {
    const def = DATA.UPGRADES.find((u) => u.id === id);
    return F.upgradeCost(def.baseCost, def.growth, level);
  };

  // returns how many of an upgrade we can buy with current gold (max `cap`)
  Sys.maxAffordable = function (id, cap) {
    const s = G.state;
    const def = DATA.UPGRADES.find((u) => u.id === id);
    let lvl = s.upgrades[id] || 0;
    let gold = s.gold;
    let count = 0;
    cap = cap || 100000;
    while (count < cap) {
      const cost = F.upgradeCost(def.baseCost, def.growth, lvl);
      if (gold < cost) break;
      gold -= cost;
      lvl++;
      count++;
    }
    return { count: count, spent: s.gold - gold, nextCost: F.upgradeCost(def.baseCost, def.growth, lvl) };
  };

  Sys.buyUpgrade = function (id, qty) {
    const s = G.state;
    const def = DATA.UPGRADES.find((u) => u.id === id);
    if (!def) return false;
    const aff = Sys.maxAffordable(id, qty === "max" ? 100000 : qty || 1);
    if (aff.count <= 0) return false;
    s.gold -= aff.spent;
    s.upgrades[id] = (s.upgrades[id] || 0) + aff.count;
    G.dirty = true;
    Sys.syncShipHp();
    G.emit("upgrade", { id: id, count: aff.count });
    return true;
  };

  // --- Abilities ---------------------------------------------------
  Sys.abilityReady = function (id) {
    const s = G.state;
    const def = CONFIG.ABILITIES[id];
    if (!def) return false;
    if (s.level < def.unlockLevel) return false;
    const a = s.abilities[id];
    return a.cdLeft <= 0 && a.activeLeft <= 0;
  };

  Sys.activateAbility = function (id) {
    const s = G.state;
    const def = CONFIG.ABILITIES[id];
    if (!def || !Sys.abilityReady(id)) return false;
    const a = s.abilities[id];
    a.activeLeft = def.durationS;
    a.cdLeft = def.cooldownS;
    if (s.settings.haptics && navigator.vibrate) navigator.vibrate([10, 30, 20]);

    if (id === "horn") {
      // instant burst of crew damage + gold buff on next clear
      const burst = G.derived.crewDps * 30;
      if (G.village) G.village.hp -= burst;
      s.hornGoldBuff = Math.max(s.hornGoldBuff, 0.6);
      if (G.fx && G.village) G.fx.abilityBurst(G.village);
      if (G.village && G.village.hp <= 0) Sys.clearVillage();
    } else if (id === "berserk" || id === "valkyrie") {
      if (G.fx) G.fx.abilityAura(id);
    }
    G.emit("ability", id);
    return true;
  };

  // --- Prestige (Saga) ---------------------------------------------
  Sys.canPrestige = function () {
    return G.state.highestRegion >= CONFIG.SAGA_MIN_REGION;
  };
  Sys.sagaGain = function () {
    return F.sagaShardsFor(G.state.highestRegion);
  };

  Sys.doPrestige = function () {
    if (!Sys.canPrestige()) return false;
    const s = G.state;
    const gain = Sys.sagaGain();
    s.saga.shards += gain;
    s.saga.totalEarned += gain;

    // reset progression, keep saga + totals + settings + meta
    s.gold = 0;
    s.xp = 0;
    s.level = 1;
    s.unspentStatPoints = 0;
    s.stats = { str: 0, led: 0, vit: 0, fot: 0 };
    s.upgrades = {};
    DATA.UPGRADES.forEach((u) => (s.upgrades[u.id] = 0));
    s.region = 0;
    s.villageIndex = 0;
    s.highestRegion = 0;
    s.shipHp = -1;
    s.hornGoldBuff = 0;
    s.abilities = State.freshAbilities();
    G.dirty = true;
    Sys.init(s);
    G.emit("prestige", gain);
    return true;
  };

  // --- Saga upgrades -----------------------------------------------
  Sys.sagaCost = function (id, level) {
    const def = DATA.SAGA.find((u) => u.id === id);
    return Math.ceil(def.baseCost * Math.pow(CONFIG.SAGA_UPGRADE_COST_GROWTH, level));
  };
  Sys.buySaga = function (id) {
    const s = G.state;
    const lvl = s.saga.upgrades[id] || 0;
    const cost = Sys.sagaCost(id, lvl);
    if (s.saga.shards < cost) return false;
    s.saga.shards -= cost;
    s.saga.upgrades[id] = lvl + 1;
    G.dirty = true;
    Sys.syncShipHp();
    G.emit("sagaUpgrade", id);
    return true;
  };

  // --- Offline progress --------------------------------------------
  Sys.applyOffline = function (offlineMs) {
    const capped = Math.min(offlineMs, CONFIG.OFFLINE_CAP_HOURS * 3600 * 1000);
    const seconds = capped / 1000;
    if (seconds < 10) return null;
    const d = ensureDerived();
    const crew = d.crewDps * CONFIG.OFFLINE_EFFICIENCY;
    let gold = crew * seconds;
    // cap to a sane multiple of current village value
    const cap = F.villageGold(G.state.region, G.state.villageIndex) * 60;
    if (gold > cap) gold = cap;
    gold = Math.floor(gold);
    const xp = Math.floor(gold * 0.5);
    G.state.gold += gold;
    G.state.xp += xp;
    G.state.totals.goldEarned += gold;
    Sys.checkLevel();
    return { seconds: seconds, gold: gold, xp: xp, capped: capped < offlineMs };
  };

  // expose helpers
  Sys.ensureDerived = ensureDerived;
})(typeof window !== "undefined" ? window : this);
