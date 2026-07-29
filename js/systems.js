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

  // ===========================================================
  //  LOOT & EQUIPMENT
  // ===========================================================
  // Sum of equipped affix bonuses (recomputed each recompute()).
  function computeEquipBonus() {
    const b = { tapPct: 0, crewPct: 0, hpPct: 0, crit: 0, critDmg: 0, gold: 0, regen: 0, tapFlat: 0 };
    const eq = G.state.loot.equipped;
    for (const slot in eq) {
      const it = eq[slot];
      if (!it) continue;
      it.affixes.forEach(function (a) {
        if (!DATA.AFFIX_BY_ID[a.stat]) return;
        const v = DATA.affixValue(a, it.level);
        b[a.stat] = (b[a.stat] || 0) + v;
      });
    }
    return b;
  }
  Sys.equipBonus = computeEquipBonus;

  Sys.itemPower = function (it) {
    let p = 0;
    it.affixes.forEach(function (a) { p += DATA.affixValue(a, it.level); });
    return p * (1 + it.rarity * 0.5) * (1 + it.level * 0.1);
  };

  Sys.genItem = function (region, opts) {
    opts = opts || {};
    const s = G.state;
    const rng = opts.rng || Math.random;
    const slot = DATA.SLOTS[Math.floor(rng() * DATA.SLOTS.length)].id;
    // rarity via chained promotion rolls, boosted by region depth + Fortune + bonus
    const luck = region * 0.5 + s.stats.fot * 0.1 + (opts.rarityBonus || 0);
    let tier = 0, guard = 0;
    while (tier < DATA.RARITY.length - 1 && guard++ < 50) {
      const chance = CONFIG.LOOT_PROMOTE[tier] * (1 + luck * 0.1);
      if (rng() < chance) tier++; else break;
    }
    tier = Math.min(DATA.RARITY.length - 1, tier + (opts.rarityBonus || 0));
    const R = DATA.RARITY[tier];
    // distinct affixes
    const pool = DATA.AFFIXES.slice();
    const affixes = [];
    for (let i = 0; i < R.affixes && pool.length; i++) {
      const pick = pool.splice(Math.floor(rng() * pool.length), 1)[0];
      const base = pick.min + rng() * (pick.max - pick.min);
      affixes.push({ stat: pick.id, base: base, rarity: tier });
    }
    return {
      uid: s.loot.uid++,
      slot: slot,
      rarity: tier,
      level: 1,
      region: region,
      affixes: affixes,
      name: DATA.itemName(slot, tier, rng),
    };
  };

  Sys.rollDrop = function (region, isBoss) {
    const s = G.state;
    let chance = isBoss ? CONFIG.LOOT_BOSS_DROP_CHANCE : CONFIG.LOOT_DROP_CHANCE;
    chance += s.stats.fot * 0.004; // Fortune = magic find
    if (Math.random() > chance) return null;
    return Sys.genItem(region, { rarityBonus: isBoss ? CONFIG.LOOT_BOSS_RARITY_BONUS : 0 });
  };

  function findWeakest() {
    const inv = G.state.loot.inventory;
    if (!inv.length) return null;
    let worst = inv[0];
    for (let i = 1; i < inv.length; i++) {
      if (Sys.itemPower(inv[i]) < Sys.itemPower(worst)) worst = inv[i];
    }
    return worst;
  }
  function salvageInternal(it) {
    const runes = Sys.salvageValue(it);
    G.state.loot.runes += runes;
    G.state.loot.totalRunes += runes;
  }
  function makeRoom() {
    if (G.state.loot.inventory.length >= CONFIG.LOOT_INV_CAP) salvageInternal(findWeakest());
  }

  function addItem(item) {
    makeRoom();
    const s = G.state;
    s.loot.inventory.push(item);
    s.loot.totalDrops++;
    if (item.rarity > s.loot.bestRarity) s.loot.bestRarity = item.rarity;
    // auto-equip if enabled and the new item beats what's equipped
    if (s.settings.autoEquip) {
      const cur = s.loot.equipped[item.slot];
      if (!cur || Sys.itemPower(item) > Sys.itemPower(cur)) Sys.equipItem(item.uid);
    }
  }

  Sys.sellValue = function (it) {
    const R = DATA.RARITY[it.rarity];
    return Math.ceil(R.sell * (1 + 0.6 * it.level) * (1 + it.region * 0.15));
  };
  Sys.salvageValue = function (it) {
    return CONFIG.RUNES_SALVAGE_BASE + it.rarity + Math.floor(it.level / 3);
  };
  Sys.enchantCost = function (it) {
    const br = CONFIG.LOOT_ENCHANT_BASE_RUNES * (it.rarity + 1);
    const bg = CONFIG.LOOT_ENCHANT_BASE_GOLD * (it.rarity + 1);
    return {
      runes: Math.ceil(br * Math.pow(CONFIG.LOOT_ENCHANT_GROWTH, it.level - 1)),
      gold: Math.ceil(bg * Math.pow(CONFIG.LOOT_ENCHANT_GROWTH, it.level - 1) * (1 + it.region * 0.1)),
    };
  };

  function findItem(uid) {
    const s = G.state;
    const ii = s.loot.inventory.findIndex((i) => i.uid === uid);
    if (ii >= 0) return { item: s.loot.inventory[ii], loc: "inv", index: ii, slot: null };
    for (const sl in s.loot.equipped) {
      if (s.loot.equipped[sl] && s.loot.equipped[sl].uid === uid) {
        return { item: s.loot.equipped[sl], loc: "eq", index: -1, slot: sl };
      }
    }
    return null;
  }

  Sys.equipItem = function (uid) {
    const s = G.state;
    const f = findItem(uid);
    if (!f || f.loc !== "inv") return false;
    const item = f.item;
    const slot = item.slot;
    const prev = s.loot.equipped[slot];
    s.loot.equipped[slot] = item;
    s.loot.inventory.splice(f.index, 1);
    if (prev) s.loot.inventory.push(prev);
    G.dirty = true; Sys.syncShipHp(); G.emit("loot");
    return true;
  };
  Sys.unequip = function (slot) {
    const s = G.state;
    const cur = s.loot.equipped[slot];
    if (!cur) return false;
    makeRoom();
    s.loot.equipped[slot] = null;
    s.loot.inventory.push(cur);
    G.dirty = true; Sys.syncShipHp(); G.emit("loot");
    return true;
  };
  Sys.sellItem = function (uid) {
    const s = G.state;
    const f = findItem(uid);
    if (!f || f.loc !== "inv") return false;
    const gold = Sys.sellValue(f.item);
    s.gold += gold;
    s.totals.goldEarned += gold;
    s.loot.inventory.splice(f.index, 1);
    G.emit("loot");
    return { gold: gold };
  };
  Sys.salvageItem = function (uid) {
    const s = G.state;
    const f = findItem(uid);
    if (!f || f.loc !== "inv") return false;
    const runes = Sys.salvageValue(f.item);
    salvageInternal(f.item);
    s.loot.inventory.splice(f.index, 1);
    G.emit("loot");
    return { runes: runes };
  };
  Sys.enchantItem = function (uid) {
    const s = G.state;
    const f = findItem(uid);
    if (!f) return false;
    const it = f.item;
    if (it.level >= CONFIG.LOOT_ENCHANT_MAX_LEVEL) return false;
    const cost = Sys.enchantCost(it);
    if (s.loot.runes < cost.runes || s.gold < cost.gold) return false;
    s.loot.runes -= cost.runes;
    s.gold -= cost.gold;
    it.level++;
    if (it.level > s.loot.bestEnchant) s.loot.bestEnchant = it.level;
    G.dirty = true; Sys.syncShipHp();
    Sys.daily("enchants", 1);
    G.emit("loot"); G.emit("enchant", it);
    return true;
  };
  // expose for drop integration
  Sys._addItem = addItem;

  // ===========================================================
  //  DAILY SAGA QUESTS
  // ===========================================================
  Sys.todayKey = function () {
    const d = new Date();
    return d.getUTCFullYear() + "-" + (d.getUTCMonth() + 1) + "-" + d.getUTCDate();
  };
  Sys.genDailies = function () {
    const s = G.state;
    const pool = DATA.DAILY_POOL.slice();
    const quests = [];
    for (let i = 0; i < CONFIG.DAILY_QUEST_COUNT && pool.length; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      const t = pool.splice(idx, 1)[0];
      let goal = t.goal;
      if (goal === 0) {
        const g = F.villageGold(s.region, Math.min(CONFIG.BOSS_INDEX, s.villageIndex));
        goal = Math.max(20, Math.floor(g * 8));
      }
      quests.push({
        id: t.id, track: t.track, verb: t.verb, noun: t.noun,
        goal: goal, reward: t.reward, progress: 0, claimed: false,
      });
    }
    const prevStreak = s.dailies ? s.dailies.streak : 0;
    return {
      date: Sys.todayKey(),
      counters: { raids: 0, bosses: 0, taps: 0, gold: 0, upgrades: 0, enchants: 0 },
      quests: quests,
      streak: prevStreak,
    };
  };
  Sys.dailyRollover = function () {
    const s = G.state;
    if (!s.dailies) { s.dailies = Sys.genDailies(); return; }
    if (s.dailies.date !== Sys.todayKey()) {
      const allClaimed = s.dailies.quests.length > 0 && s.dailies.quests.every((q) => q.claimed);
      const newStreak = allClaimed ? (s.dailies.streak || 0) + 1 : 0;
      s.dailies = Sys.genDailies();
      s.dailies.streak = newStreak;
      G.emit("newDay");
    }
  };
  Sys.daily = function (track, amount) {
    const s = G.state;
    if (!s.dailies) Sys.dailyRollover();
    if (!s.dailies) return;
    const c = s.dailies.counters;
    c[track] = (c[track] || 0) + (amount || 1);
    s.dailies.quests.forEach(function (q) {
      if (q.track === track) q.progress = Math.min(q.goal, (q.progress || 0) + (amount || 1));
    });
  };
  Sys.claimDaily = function (idx) {
    const s = G.state;
    if (!s.dailies || !s.dailies.quests[idx]) return null;
    const q = s.dailies.quests[idx];
    if (q.claimed || (q.progress || 0) < q.goal) return null;
    q.claimed = true;
    const r = q.reward || {};
    if (r.runes) { s.loot.runes += r.runes; s.loot.totalRunes += r.runes; }
    if (r.shards) s.saga.shards += r.shards;
    const bonusGold = Math.ceil(F.villageGold(s.region, 0) * 5);
    s.gold += bonusGold;
    s.totals.goldEarned += bonusGold;
    G.emit("dailyClaim", { quest: q, gold: bonusGold, runes: r.runes || 0, shards: r.shards || 0 });
    return { gold: bonusGold, runes: r.runes || 0, shards: r.shards || 0 };
  };

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

    // equipment affixes (loot system)
    const eq = computeEquipBonus();

    const d = {
      statMul: statMul,
      tapDmg: tapDmg * (1 + eq.tapPct) + eq.tapFlat,
      crewDps: crewDmg * (1 + eq.crewPct),
      shipMaxHp: Math.max(1, shipMaxHp * (1 + eq.hpPct)),
      regenFrac:
        C.REGEN_BASE_FRAC + (s.upgrades.rations || 0) * C.RATIONS_REGEN_PER_LEVEL + eq.regen,
      critChance: Math.min(C.CRIT_CAP, C.CRIT_BASE_CHANCE + fotEff * C.FOT_CRIT_CHANCE + eq.crit),
      critMult: C.CRIT_BASE_MULT + (s.upgrades.mead || 0) * C.MEAD_CRIT_MULT_PER_LEVEL + eq.critDmg,
      goldMult: (1 + fotEff * C.FOT_GOLD_PER_LEVEL) * (1 + sagaBonus("gold")) * (1 + eq.gold),
      crewInterval:
        C.CREW_BASE_INTERVAL_S * (1 - Math.min(0.6, (s.upgrades.drum || 0) * C.DRUM_SPEED_PER_LEVEL)),
      bannerMult: bannerMult,
      sagaTap: sagaBonus("tap"),
      sagaCrew: sagaBonus("crew"),
      sagaHp: sagaBonus("hp"),
      sagaGold: sagaBonus("gold"),
      equip: eq,
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
    const mod = DATA.rollModifier(region, isBoss, rng);
    let name;
    if (isBoss) name = DATA.bossName(rng) + "'s Lair";
    else name = DATA.villageName(rng) + " " + type.word;

    const maxHp = F.villageHp(region, index) * type.hp * mod.hp;
    return {
      region: region,
      index: index,
      name: name,
      isBoss: isBoss,
      type: type,
      mod: mod,
      maxHp: maxHp,
      hp: maxHp,
      gold: F.villageGold(region, index) * type.gold * mod.gold,
      xp: F.villageXp(region, index) * mod.xp,
      dps: F.villageDps(region, index) * mod.dps,
      stagger: 0,
      staggered: false,
      fury: false,
      hitFlash: 0,
      wobble: 0,
    };
  };

  // --- Initialize runtime from a state -----------------------------
  Sys.init = function (state) {
    G.state = state;
    G.dirty = true;
    G.runtime = {
      combo: 0, comboTimer: 0, lastTap: 0, maxCombo: state.totals.maxCombo || 0,
      hitstop: 0, bossBanner: 0, regionWipe: 0, flash: 0, lastRegion: state.region,
      rage: 0, ragBuff: 0,
    };
    ensureDerived();
    if (state.shipHp < 0 || state.shipHp > G.derived.shipMaxHp) {
      state.shipHp = G.derived.shipMaxHp;
    }
    Sys.setVillage(state.region, state.villageIndex);
    Sys.dailyRollover();
  };

  // Generate + assign the active village, triggering boss/region FX flags
  Sys.setVillage = function (region, index) {
    const prevRegion = G.runtime ? G.runtime.lastRegion : region;
    const v = Sys.genVillage(region, index);
    G.village = v;
    if (G.runtime) {
      G.runtime.lastRegion = region;
      if (v.isBoss) G.runtime.bossBanner = 1.5;
      if (region !== prevRegion) G.runtime.regionWipe = 0.7;
    }
    return v;
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
    const rt = G.runtime;

    // combo build
    rt.combo += 1;
    rt.comboTimer = CONFIG.COMBO_WINDOW_MS / 1000;
    rt.lastTap = performance.now();
    if (rt.combo > rt.maxCombo) { rt.maxCombo = rt.combo; s.totals.maxCombo = rt.maxCombo; }
    const comboMult = Math.min(CONFIG.COMBO_MULT_CAP, 1 + rt.combo * CONFIG.COMBO_MULT_PER_HIT);
    rt.rage = Math.min(CONFIG.RAGE_CAP, rt.rage + CONFIG.RAGE_PER_TAP);

    let dmg = d.tapDmg * comboMult;
    if (s.abilities.berserk.activeLeft > 0) dmg *= CONFIG.ABILITIES.berserk.mult;
    if (rt.ragBuff > 0) dmg *= CONFIG.RAGNAROK_BUFF_MULT;
    if (v.isBoss && v.stagger > 0) dmg *= CONFIG.BOSS_STAGGER_DMG_MULT;
    const hexed = v.mod && v.mod.crit === false;
    const valk = s.abilities.valkyrie.activeLeft > 0;
    let crit = (!hexed || valk) && (Math.random() < d.critChance || valk);
    if (crit) dmg *= d.critMult;
    dmg = Math.max(1, dmg);

    v.hp -= dmg;
    v.hitFlash = 1;
    v.wobble = 1;
    s.totals.taps++;
    if (crit) s.totals.crits++;
    Sys.daily("taps", 1);

    if (G.fx) G.fx.tapImpact(px, py, dmg, crit, rt.combo);
    if (s.settings.haptics && navigator.vibrate) {
      navigator.vibrate(crit ? 22 : 8);
    }
    // combo milestone flourish
    if (rt.combo > 0 && rt.combo % CONFIG.COMBO_MILESTONE === 0 && G.fx) {
      G.fx.comboBurst(rt.combo);
      if (global.SFX && global.SFX.combo) global.SFX.combo(rt.combo);
    }
    if (crit && G.runtime) G.runtime.hitstop = Math.max(G.runtime.hitstop, CONFIG.HITSTOP_CRIT_MS / 1000);
    if (v.hp <= 0) Sys.clearVillage();
  };

  Sys.comboMult = function () {
    const rt = G.runtime;
    if (!rt || rt.combo <= 0) return 1;
    return Math.min(CONFIG.COMBO_MULT_CAP, 1 + rt.combo * CONFIG.COMBO_MULT_PER_HIT);
  };

  // --- Ragnarök ultimate (Rage meter) -------------------------------
  Sys.rageFrac = function () { const rt = G.runtime; return rt ? Math.min(1, rt.rage / CONFIG.RAGE_CAP) : 0; };
  Sys.rageReady = function () { return Sys.rageFrac() >= 1; };
  Sys.ragnarokActive = function () { const rt = G.runtime; return !!(rt && rt.ragBuff > 0); };
  Sys.unleashRagnarok = function () {
    const rt = G.runtime;
    const s = G.state;
    if (!rt || rt.rage < CONFIG.RAGE_CAP || !G.village) return false;
    const d = G.derived;
    const v = G.village;
    const dmg = Math.max(v.maxHp * CONFIG.RAGNAROK_DMG_MIN_FRAC, d.crewDps * CONFIG.RAGNAROK_DMG_CREW_SECONDS);
    v.hp -= dmg;
    v.hitFlash = 1;
    rt.rage = 0;
    rt.ragBuff = CONFIG.RAGNAROK_BUFF_S;
    rt.flash = Math.max(rt.flash || 0, 0.85);
    if (G.fx) G.fx.ragnarok();
    if (s.settings.haptics && navigator.vibrate) navigator.vibrate([20, 40, 30, 60]);
    G.emit("ragnarok");
    if (v.hp <= 0) Sys.clearVillage();
    return true;
  };

  // --- Crew / defense simulation tick ------------------------------
  Sys.tick = function (dt) {
    if (G.paused) return;
    const rt = G.runtime;
    // hit-stop: freeze simulation briefly for impact weight
    if (rt && rt.hitstop > 0) {
      rt.hitstop = Math.max(0, rt.hitstop - dt);
      return;
    }
    // decay transient FX timers
    if (rt) {
      if (rt.bossBanner > 0) rt.bossBanner = Math.max(0, rt.bossBanner - dt);
      if (rt.regionWipe > 0) rt.regionWipe = Math.max(0, rt.regionWipe - dt);
      if (rt.flash > 0) rt.flash = Math.max(0, rt.flash - dt);
      if (rt.ragBuff > 0) rt.ragBuff = Math.max(0, rt.ragBuff - dt);
      // combo decay
      if (rt.combo > 0) {
        rt.comboTimer -= dt;
        if (rt.comboTimer <= 0) rt.combo = 0;
      }
    }
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
    let crewDmg = crewDps * dt;
    if (rt.ragBuff > 0) crewDmg *= CONFIG.RAGNAROK_BUFF_MULT;
    if (v.isBoss && v.stagger > 0) crewDmg *= CONFIG.BOSS_STAGGER_DMG_MULT;
    if (crewDmg > 0) {
      v.hp -= crewDmg;
      v.hitFlash = Math.min(1, v.hitFlash + 0.4);
    }

    // boss fury / stagger mechanic: below 35% HP it staggers (bonus damage
    // window), then enrages (defenses hit far harder)
    if (v.isBoss) {
      const frac = Math.max(0, v.hp / v.maxHp);
      if (!v.staggered && !v.fury && frac <= CONFIG.BOSS_FURY_HP_FRAC) {
        v.stagger = CONFIG.BOSS_STAGGER_S;
        v.staggered = true;
        G.emit("bossStagger", v);
      }
      if (v.stagger > 0) {
        v.stagger = Math.max(0, v.stagger - dt);
        if (v.stagger === 0 && !v.fury) { v.fury = true; G.emit("bossFury", v); }
      }
    }

    // enemy defense drains the longship (fury hits much harder)
    const shielded = s.abilities.shield.activeLeft > 0;
    if (!shielded) {
      const furyMult = v.fury ? CONFIG.BOSS_FURY_DPS_MULT : 1;
      s.shipHp -= v.dps * furyMult * dt;
    }

    // durability regen
    if (s.shipHp < d.shipMaxHp) {
      s.shipHp = Math.min(d.shipMaxHp, s.shipHp + d.regenFrac * d.shipMaxHp * dt);
    }

    // retreat / clear
    if (s.shipHp <= 0) Sys.onRetreat();
    else if (v.hp <= 0) Sys.clearVillage();
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

    // impact feedback
    if (G.runtime) {
      G.runtime.hitstop = Math.max(G.runtime.hitstop, wasBoss ? CONFIG.HITSTOP_BOSS_MS / 1000 : CONFIG.HITSTOP_CLEAR_MS / 1000);
      G.runtime.flash = wasBoss ? 0.55 : 0.25;
      G.runtime.rage = Math.min(CONFIG.RAGE_CAP, G.runtime.rage + (wasBoss ? CONFIG.RAGE_PER_BOSS : CONFIG.RAGE_PER_CLEAR));
    }

    // daily quest tracking
    Sys.daily("raids", 1);
    Sys.daily("gold", goldGain);
    if (wasBoss) {
      Sys.daily("bosses", 1);
      const runes = CONFIG.RUNES_PER_BOSS_BASE + Math.floor(v.region * CONFIG.RUNES_PER_BOSS_REGION);
      s.loot.runes += runes;
      s.loot.totalRunes += runes;
    }

    // loot drop (always after a clear; bosses always drop, rarer)
    const drop = Sys.rollDrop(v.region, wasBoss);
    if (drop) { Sys._addItem(drop); G.emit("drop", drop); }

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
    Sys.setVillage(reg, idx);
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
    Sys.daily("upgrades", aff.count);
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

  // ===========================================================
  //  ACHIEVEMENTS
  // ===========================================================
  Sys.checkAchievements = function () {
    const s = G.state;
    const have = {};
    s.achievements.forEach(function (id) { have[id] = true; });
    const newly = [];
    DATA.ACHIEVEMENTS.forEach(function (a) {
      if (have[a.id]) return;
      try {
        if (a.check(s)) {
          s.achievements.push(a.id);
          newly.push(a);
          const r = a.reward || {};
          if (r.shards) s.saga.shards += r.shards;
          if (r.runes) { s.loot.runes += r.runes; s.loot.totalRunes += r.runes; }
          if (r.goldFactor) {
            const g = Math.ceil(F.villageGold(s.region, 0) * r.goldFactor);
            s.gold += g; s.totals.goldEarned += g;
          }
        }
      } catch (e) {}
    });
    if (newly.length) G.emit("achievements", newly);
    return newly;
  };
  Sys.isUnlocked = function (id) { return G.state.achievements.indexOf(id) >= 0; };

  // ===========================================================
  //  QUALITY OF LIFE
  // ===========================================================
  Sys.autoEquipBest = function () {
    const s = G.state;
    let changed = 0;
    DATA.SLOTS.forEach(function (sl) {
      let best = null;
      s.loot.inventory.forEach(function (it) {
        if (it.slot === sl.id && (!best || Sys.itemPower(it) > Sys.itemPower(best))) best = it;
      });
      const cur = s.loot.equipped[sl.id];
      if (best && (!cur || Sys.itemPower(best) > Sys.itemPower(cur))) {
        Sys.equipItem(best.uid); changed++;
      }
    });
    return changed;
  };

  Sys.salvageBelowRarity = function (maxRarity) {
    const s = G.state;
    let runes = 0, count = 0;
    for (let i = s.loot.inventory.length - 1; i >= 0; i--) {
      if (s.loot.inventory[i].rarity < maxRarity) {
        const it = s.loot.inventory.splice(i, 1)[0];
        runes += Sys.salvageValue(it); count++;
      }
    }
    if (count) { s.loot.runes += runes; s.loot.totalRunes += runes; G.emit("loot"); }
    return { runes: runes, count: count };
  };

  Sys.applyStatPreset = function (w) {
    const s = G.state;
    const keys = ["str", "led", "vit", "fot"].filter(function (k) { return (w[k] || 0) > 0; });
    if (!keys.length || s.unspentStatPoints <= 0) return 0;
    let n = 0, i = 0;
    while (s.unspentStatPoints > 0 && i < 100000) {
      if (Sys.allocStat(keys[i % keys.length])) n++;
      i++;
    }
    return n;
  };
})(typeof window !== "undefined" ? window : this);
