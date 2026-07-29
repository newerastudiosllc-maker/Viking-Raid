/* ============================================================
   VIKING RAID — ui.js
   DOM UI controller: HUD, tabs, panels, modals, toasts.
   New Era Studios LLC
   ============================================================ */
(function (global) {
  "use strict";

  const UI = (global.UI = {});
  let el = {};
  let tab = "raid";
  let buyMode = 1; // 1 | 10 | "max"
  let toastTimer = null;
  let abilityEls = {};
  let selectedUid = null;

  function $(id) { return document.getElementById(id); }
  function fmt(n) { return Render.formatNum(n); }

  UI.init = function () {
    el = {
      splash: $("splash"), startBtn: $("splashStart"),
      regionBadge: $("regionBadge"), gold: $("gold"), shards: $("shards"),
      levelBadge: $("levelBadge"), xpFill: $("xpFill"), xpText: $("xpText"),
      tapVal: $("tapVal"), crewVal: $("crewVal"), repairBtn: $("repairBtn"),
      menuBtn: $("menuBtn"),
      stage: $("stage"),
      abilities: $("abilities"),
      panel: $("panel"),
      panelForge: $("panelForge"), panelHero: $("panelHero"),
      panelSaga: $("panelSaga"),
      panelLoot: $("panelLoot"),
      forgeList: $("forgeList"), buyModeBtn: $("buyMode"),
      unitList: $("unitList"),
      equipSlots: $("equipSlots"), itemDetail: $("itemDetail"),
      invList: $("invList"), invCount: $("invCount"), invCap: $("invCap"),
      lootRunes: $("lootRunes"),
      ltAutoEquip: $("ltAutoEquip"), ltSalvage: $("ltSalvage"),
      ltAutoToggle: $("ltAutoToggle"), ltAutoState: $("ltAutoState"),
      presetRow: $("presetRow"),
      achBtn: $("achBtn"), modalAchievements: $("modalAchievements"),
      achList: $("achList"), achCount: $("achCount"), achClose: $("achClose"),
      dailyBtn: $("dailyBtn"), modalDaily: $("modalDaily"),
      dailyList: $("dailyList"), dailyStreak: $("dailyStreak"), dailyClose: $("dailyClose"),
      modalRoute: $("modalRoute"), routeList: $("routeList"),
      mapBtn: $("mapBtn"), modalMap: $("modalMap"), mapTrail: $("mapTrail"),
      mapRegionName: $("mapRegionName"), mapProgress: $("mapProgress"), mapClose: $("mapClose"),
      onboarding: $("onboarding"), obIcon: $("obIcon"), obTitle: $("obTitle"),
      obText: $("obText"), obNext: $("obNext"), obSkip: $("obSkip"), obDots: $("obDots"),
      unspent: $("unspentPts"), statList: $("statList"),
      derivedStats: $("derivedStats"), abilityInfo: $("abilityInfo"),
      sagaGain: $("sagaGain"), sagaBtn: $("sagaPrestige"),
      sagaTotal: $("sagaTotal"), sagaShards: $("sagaShards"), sagaList: $("sagaList"),
      toast: $("toast"),
      modalSettings: $("modalSettings"),
      modalOffline: $("modalOffline"), offReport: $("offReport"),
      modalPrestige: $("modalPrestige"), prestigeDetail: $("prestigeDetail"),
    };

    // tabs
    document.querySelectorAll("#tabs .tab").forEach(function (btn) {
      btn.addEventListener("click", function () { UI.setTab(btn.dataset.tab); });
    });

    // splash
    el.startBtn.addEventListener("click", UI.startGame);
    el.stage.addEventListener("pointerdown", onStagePointer, { passive: true });

    // buy mode
    el.buyModeBtn.addEventListener("click", function () {
      buyMode = buyMode === 1 ? 10 : buyMode === 10 ? "max" : 1;
      el.buyModeBtn.textContent = buyMode === "max" ? "MAX" : "x" + buyMode;
      UI.refreshForge();
    });

    // menu
    el.menuBtn.addEventListener("click", function () { UI.openModal("modalSettings"); UI.refreshSettings(); });
    el.repairBtn.addEventListener("click", function () {
      if (Sys.repair()) { SFX.upgrade(); UI.toast("Longship repaired!"); }
      else { SFX.error(); UI.toast("Not enough gold."); }
    });

    // saga
    el.sagaBtn.addEventListener("click", function () { UI.openPrestige(); });

    // daily quests
    el.dailyBtn.addEventListener("click", function () { Sys.dailyRollover(); UI.refreshDailies(); UI.openModal("modalDaily"); });
    if (el.mapBtn) el.mapBtn.addEventListener("click", function () { UI.showMap(); });
    if (el.mapClose) el.mapClose.addEventListener("click", function () { UI.closeModal("modalMap"); });
    el.dailyClose.addEventListener("click", function () { UI.closeModal("modalDaily"); });

    // achievements
    el.achBtn.addEventListener("click", function () { UI.refreshAchievements(); UI.openModal("modalAchievements"); });
    el.achClose.addEventListener("click", function () { UI.closeModal("modalAchievements"); });

    // loot QoL
    el.ltAutoEquip.addEventListener("click", function () { const n = Sys.autoEquipBest(); SFX.upgrade(); UI.toast(n ? "Equipped " + n + " better item" + (n > 1 ? "s" : "") + "." : "Already optimal."); });
    el.ltSalvage.addEventListener("click", function () { const r = Sys.salvageBelowRarity(2); SFX.upgrade(); UI.toast(r.count ? "Salvaged " + r.count + " for 🔮" + r.runes : "Nothing to salvage."); });
    el.ltAutoToggle.addEventListener("click", function () { G.state.settings.autoEquip = !G.state.settings.autoEquip; UI.refreshLootTools(); SFX.upgrade(); });

    // onboarding
    el.obNext.addEventListener("click", function () { OB.next(); });
    el.obSkip.addEventListener("click", function () { OB.skip(); });

    el.invCap.textContent = CONFIG.LOOT_INV_CAP;

    buildForge();
    buildUnits();
    buildStats();
    buildSaga();
    buildAbilities();
    buildEquipSlots();
    buildPresets();

    // settings buttons
    bindSetting("setSfx", "sfx");
    bindSetting("setHaptics", "haptics");
    bindSetting("setFx", "reducedFx");
    const musicBtn = $("setMusic");
    if (musicBtn) musicBtn.addEventListener("click", function () {
      G.state.settings.music = !G.state.settings.music;
      if (window.Music) Music.setEnabled(G.state.settings.music);
      UI.refreshSettings();
    });
    $("setExport").addEventListener("click", UI.doExport);
    $("setImport").addEventListener("click", UI.doImport);
    $("setWipe").addEventListener("click", UI.confirmWipe);
    $("setClose").addEventListener("click", function () { UI.closeModal("modalSettings"); });
    $("offClose").addEventListener("click", function () { UI.closeModal("modalOffline"); });
    $("prestigeConfirm").addEventListener("click", UI.doPrestige);
    $("prestigeCancel").addEventListener("click", function () { UI.closeModal("modalPrestige"); });

    // close modals on backdrop
    document.querySelectorAll(".modal").forEach(function (m) {
      m.addEventListener("click", function (e) { if (e.target === m) UI.closeModal(m.id); });
    });
  };

  function bindSetting(btnId, key) {
    const b = $(btnId);
    if (b) b.addEventListener("click", function () {
      G.state.settings[key] = !G.state.settings[key];
      if (key === "sfx") SFX.setEnabled(G.state.settings.sfx);
      UI.refreshSettings();
    });
  }

  function onStagePointer(e) {
    if (tab !== "raid" || G.paused) return;
    const r = el.stage.getBoundingClientRect();
    const x = (e.clientX - r.left);
    const y = (e.clientY - r.top);
    SFX.resume();
    Sys.tap(x, y);
    SFX.tap(false);
  }

  // --- Tab switching -----------------------------------------------
  UI.setTab = function (name) {
    tab = name;
    document.querySelectorAll("#tabs .tab").forEach(function (b) {
      b.classList.toggle("active", b.dataset.tab === name);
    });
    const showPanel = name !== "raid";
    el.panel.style.display = showPanel ? "flex" : "none";
    document.querySelectorAll(".panel-pane").forEach(function (p) { p.style.display = "none"; });
    if (name === "forge") { $("panelForge").style.display = "block"; UI.refreshForge(); }
    if (name === "hero") { $("panelHero").style.display = "block"; UI.refreshHero(); }
    if (name === "loot") { $("panelLoot").style.display = "block"; UI.refreshLoot(); }
    if (name === "saga") { $("panelSaga").style.display = "block"; UI.refreshSaga(); }
  };

  // --- Start from splash -------------------------------------------
  UI.startGame = function () {
    SFX.resume();
    if (window.Music && G.state.settings.music) Music.setEnabled(true);
    el.splash.classList.add("hidden");
    setTimeout(function () { el.splash.style.display = "none"; }, 450);
    if (window.OB) OB.show();
  };

  // --- Build static lists ------------------------------------------
  function buildForge() {
    let html = "";
    DATA.UPGRADES.forEach(function (u) {
      html +=
        '<div class="upg" data-id="' + u.id + '">' +
          '<div class="upg-icon">' + u.icon + '</div>' +
          '<div class="upg-body">' +
            '<div class="upg-name">' + u.name + ' <span class="upg-lv" data-lv></span></div>' +
            '<div class="upg-desc">' + u.desc + '</div>' +
          '</div>' +
          '<button class="upg-buy" data-buy><span class="bc"></span></button>' +
        '</div>';
    });
    el.forgeList.innerHTML = html;
    el.forgeList.querySelectorAll(".upg").forEach(function (card) {
      card.querySelector("[data-buy]").addEventListener("click", function () {
        const id = card.dataset.id;
        if (Sys.buyUpgrade(id, buyMode)) { SFX.upgrade(); }
        else { SFX.error(); }
        UI.refreshForge();
      });
    });
  }

  function buildStats() {
    let html = "";
    DATA.STATS.forEach(function (st) {
      html +=
        '<div class="stat" data-id="' + st.id + '">' +
          '<div class="stat-icon" style="color:' + st.color + '">' + st.icon + '</div>' +
          '<div class="stat-body">' +
            '<div class="stat-name">' + st.name + '</div>' +
            '<div class="stat-desc">' + st.desc + '</div>' +
            '<div class="stat-val" data-val>0</div>' +
          '</div>' +
          '<button class="stat-add" data-add>+</button>' +
        '</div>';
    });
    el.statList.innerHTML = html;
    el.statList.querySelectorAll(".stat").forEach(function (row) {
      row.querySelector("[data-add]").addEventListener("click", function () {
        if (Sys.allocStat(row.dataset.id)) { SFX.upgrade(); }
        else { SFX.error(); }
        UI.refreshHero();
      });
    });
  }

  function buildSaga() {
    let html = "";
    DATA.SAGA.forEach(function (s) {
      html +=
        '<div class="saga-upg" data-id="' + s.id + '">' +
          '<div class="upg-icon">' + s.icon + '</div>' +
          '<div class="upg-body">' +
            '<div class="upg-name">' + s.name + ' <span data-lv></span></div>' +
            '<div class="upg-desc">' + s.desc + '</div>' +
          '</div>' +
          '<button class="upg-buy shard" data-buy><span class="bc"></span></button>' +
        '</div>';
    });
    el.sagaList.innerHTML = html;
    el.sagaList.querySelectorAll(".saga-upg").forEach(function (card) {
      card.querySelector("[data-buy]").addEventListener("click", function () {
        if (Sys.buySaga(card.dataset.id)) { SFX.upgrade(); }
        else { SFX.error(); }
        UI.refreshSaga();
      });
    });
  }

  const AB_ART = {
    berserk: "assets/icons/ab_berserk.png",
    shield: "assets/icons/ab_shield.png",
    horn: "assets/icons/ab_horn.png",
    valkyrie: "assets/icons/ab_valkyrie.png",
  };
  function abIconHtml(id, fallback) {
    const src = id === "ragnarok" ? "assets/icons/ab_ragnarok.png" : AB_ART[id];
    if (src) return '<img class="ab-art" src="' + src + '" alt="" draggable="false" />';
    return '<span class="ab-icon">' + fallback + "</span>";
  }

  function buildAbilities() {
    let html = "";
    Object.keys(CONFIG.ABILITIES).forEach(function (id) {
      const a = CONFIG.ABILITIES[id];
      html +=
        '<button class="ab-btn locked" data-ab="' + id + '">' +
          abIconHtml(id, a.icon) +
          '<span class="ab-lock">Lv ' + a.unlockLevel + '</span>' +
          '<span class="ab-cd"></span>' +
        '</button>';
    });
    html +=
      '<button class="ab-btn rag" id="ragBtn" aria-label="Ragnarok ultimate">' +
        abIconHtml("ragnarok", "🌩️") +
        '<span class="ab-lock">RAGE</span>' +
        '<span class="ab-cd"></span>' +
      '</button>';
    el.abilities.innerHTML = html;
    abilityEls = {};
    el.abilities.querySelectorAll("[data-ab]").forEach(function (b) {
      const id = b.dataset.ab;
      abilityEls[id] = {
        btn: b, cd: b.querySelector(".ab-cd"), lock: b.querySelector(".ab-lock"),
      };
      b.addEventListener("click", function () {
        if (Sys.activateAbility(id)) SFX.ability();
        else SFX.error();
      });
    });
    const ragBtn = $("ragBtn");
    if (ragBtn) {
      el.ragBtn = ragBtn;
      el.ragCd = ragBtn.querySelector(".ab-cd");
      el.ragLock = ragBtn.querySelector(".ab-lock");
      ragBtn.addEventListener("click", function () {
        if (Sys.unleashRagnarok()) { SFX.boss(); }
        else { SFX.error(); }
      });
    }
  }

  // --- Refresh routines --------------------------------------------
  function buildUnits() {
    if (!el.unitList) return;
    let html = "";
    DATA.UNITS.forEach(function (u) {
      html +=
        '<div class="upg unit" data-unit="' + u.id + '">' +
          '<div class="upg-icon unit-icon"><img src="' + u.icon + '" alt="" onerror="this.outerHTML=\'' + u.emoji + '\'" /></div>' +
          '<div class="upg-body">' +
            '<div class="upg-name">' + u.name + ' <span class="upg-lv" data-count></span></div>' +
            '<div class="upg-desc">' + u.desc + '</div>' +
          '</div>' +
          '<button class="upg-buy" data-hire><span class="bc"></span></button>' +
        '</div>';
    });
    el.unitList.innerHTML = html;
    el.unitList.querySelectorAll(".unit").forEach(function (card) {
      card.querySelector("[data-hire]").addEventListener("click", function () {
        if (Sys.hireUnit(card.dataset.unit, buyMode)) { SFX.upgrade(); }
        else { SFX.error(); }
      });
    });
  }

  UI.refreshForge = function () {
    const gold = G.state.gold;
    el.forgeList.querySelectorAll(".upg").forEach(function (card) {
      const id = card.dataset.id;
      const def = DATA.UPGRADES.find(function (u) { return u.id === id; });
      const lvl = G.state.upgrades[id] || 0;
      card.querySelector("[data-lv]").textContent = "Lv " + lvl;
      const aff = Sys.maxAffordable(id, buyMode === "max" ? 100000 : buyMode);
      const buyBtn = card.querySelector("[data-buy]");
      const label = buyMode === "max"
        ? (aff.count > 0 ? "+" + aff.count + " · 🪙" + fmt(aff.spent) : "🪙" + fmt(Sys.upgradeCost(id, lvl)))
        : "🪙" + fmt(Sys.upgradeCost(id, lvl));
      buyBtn.querySelector(".bc").textContent = label;
      const affordable = buyMode === "max" ? aff.count > 0 : gold >= Sys.upgradeCost(id, lvl);
      buyBtn.classList.toggle("disabled", !affordable);
      card.classList.toggle("maxed", false);
    });
    // warband specialists
    if (el.unitList) el.unitList.querySelectorAll(".unit").forEach(function (card) {
      const id = card.dataset.unit;
      const def = DATA.UNIT_BY_ID[id];
      const n = (G.state.units && G.state.units[id]) || 0;
      const locked = !Sys.unitUnlocked(id);
      card.classList.toggle("locked", locked);
      card.querySelector("[data-count]").textContent = "×" + n;
      const buyBtn = card.querySelector("[data-hire]");
      if (locked) {
        buyBtn.querySelector(".bc").textContent = "Lv " + def.unlockLevel;
        buyBtn.classList.add("disabled");
        return;
      }
      const aff = Sys.unitMaxAffordable(id, buyMode === "max" ? 100000 : buyMode);
      const label = buyMode === "max"
        ? (aff.count > 0 ? "+" + aff.count + " · 🪙" + fmt(aff.spent) : "🪙" + fmt(Sys.unitCost(id, n)))
        : "🪙" + fmt(Sys.unitCost(id, n));
      buyBtn.querySelector(".bc").textContent = label;
      const affordable = buyMode === "max" ? aff.count > 0 : gold >= Sys.unitCost(id, n);
      buyBtn.classList.toggle("disabled", !affordable);
    });
  };

  UI.refreshHero = function () {
    const s = G.state;
    el.unspent.textContent = s.unspentStatPoints;
    el.unspent.classList.toggle("show", s.unspentStatPoints > 0);
    el.statList.querySelectorAll(".stat").forEach(function (row) {
      row.querySelector("[data-val]").textContent = s.stats[row.dataset.id] || 0;
      const can = s.unspentStatPoints > 0;
      row.querySelector("[data-add]").classList.toggle("disabled", !can);
    });
    // derived stats
    const d = G.derived;
    el.derivedStats.innerHTML =
      stat("Tap Damage", "⚔️", fmt(d.tapDmg)) +
      stat("Crew DPS", "🪓", fmt(d.crewDps) + "/s") +
      stat("Crit Chance", "🎯", (d.critChance * 100).toFixed(1) + "%") +
      stat("Crit Mult", "💥", d.critMult.toFixed(2) + "x") +
      stat("Longship HP", "🛡️", fmt(d.shipMaxHp)) +
      stat("Gold Bonus", "🍀", "+" + ((d.goldMult - 1) * 100).toFixed(0) + "%") +
      stat("Attack Speed", "🥁", (1 / d.crewInterval).toFixed(2) + "/s") +
      stat("Warband", "⚜️", Sys.totalUnits() + " specialists") +
      stat("Dmg Reduction", "🧿", "-" + ((d.shipDmgReduce || 0) * 100).toFixed(0) + "%") +
      stat("Best Frenzy", "🔥", "x" + (s.totals.maxFrenzy || 0));
    // ability unlock info
    let h = "";
    Object.keys(CONFIG.ABILITIES).forEach(function (id) {
      const a = CONFIG.ABILITIES[id];
      const unlocked = s.level >= a.unlockLevel;
      h += '<div class="ab-info' + (unlocked ? "" : " locked") + '">' +
        '<span class="ab-info-icon">' + a.icon + '</span>' +
        '<div><b>' + a.name + '</b> ' + (unlocked ? "" : '<i>(unlocks Lv ' + a.unlockLevel + ')</i>') +
        '<div class="ab-info-desc">' + a.desc + ' <span class="muted">CD ' + a.cooldownS + 's</span></div></div></div>';
    });
    el.abilityInfo.innerHTML = h;
  };

  UI.refreshSaga = function () {
    const s = G.state;
    el.sagaShards.textContent = fmt(s.saga.shards);
    el.sagaTotal.textContent = fmt(s.saga.totalEarned);
    const gain = Sys.sagaGain();
    el.sagaGain.textContent = "+" + gain;
    const can = Sys.canPrestige();
    el.sagaBtn.classList.toggle("disabled", !can);
    el.sagaBtn.textContent = can ? "SET SAIL FOR NEW LANDS" : "Clear Region " + (CONFIG.SAGA_MIN_REGION + 1) + " to unlock";
    el.sagaList.querySelectorAll(".saga-upg").forEach(function (card) {
      const id = card.dataset.id;
      const def = DATA.SAGA.find(function (u) { return u.id === id; });
      const lvl = s.saga.upgrades[id] || 0;
      card.querySelector("[data-lv]").textContent = "Lv " + lvl;
      const cost = Sys.sagaCost(id, lvl);
      const b = card.querySelector("[data-buy]");
      b.querySelector(".bc").textContent = "💎 " + cost;
      b.classList.toggle("disabled", s.saga.shards < cost);
    });
  };

  function stat(name, icon, val) {
    return '<div class="ds"><span>' + icon + " " + name + '</span><b>' + val + "</b></div>";
  }

  // ============================================================
  //  LOOT / HOARD
  // ============================================================
  function rarityColor(r) { return DATA.RARITY[r].color; }
  function rarityName(r) { return DATA.RARITY[r].name; }
  function fmtAffix(a, level) {
    const def = DATA.AFFIX_BY_ID[a.stat];
    const v = DATA.affixValue(a, level);
    const sign = v >= 0 ? "+" : "";
    if (def.fmt === "pct") return def.icon + " " + def.name + ": " + sign + (v * 100).toFixed(1) + "%";
    return def.icon + " " + def.name + ": " + sign + fmt(v);
  }

  function buildEquipSlots() {
    let html = "";
    DATA.SLOTS.forEach(function (sl) {
      html +=
        '<div class="eqslot" data-slot="' + sl.id + '">' +
          '<div class="eqslot-icon">' + sl.icon + '</div>' +
          '<div class="eqslot-item"></div>' +
          '<div class="eqslot-name">' + sl.name + '</div>' +
        '</div>';
    });
    el.equipSlots.innerHTML = html;
    el.equipSlots.querySelectorAll(".eqslot").forEach(function (slotEl) {
      slotEl.addEventListener("click", function () {
        const cur = G.state.loot.equipped[slotEl.dataset.slot];
        if (cur) { selectedUid = cur.uid; UI.refreshLoot(); }
      });
    });
  }

  UI.refreshLoot = function () {
    const s = G.state;
    if (!s || !el.equipSlots) return;
    el.lootRunes.textContent = fmt(s.loot.runes);
    el.invCap.textContent = CONFIG.LOOT_INV_CAP;
    el.invCount.textContent = s.loot.inventory.length;

    el.equipSlots.querySelectorAll(".eqslot").forEach(function (slotEl) {
      const it = s.loot.equipped[slotEl.dataset.slot];
      const itemDiv = slotEl.querySelector(".eqslot-item");
      if (it) {
        slotEl.classList.add("filled");
        slotEl.classList.toggle("sel", it.uid === selectedUid);
        slotEl.style.borderColor = rarityColor(it.rarity);
        itemDiv.innerHTML = '<span class="eq-name" style="color:' + rarityColor(it.rarity) + '">' + it.name + '</span>' +
          '<span class="eq-lv">+' + it.level + '</span>';
      } else {
        slotEl.classList.remove("filled", "sel");
        slotEl.style.borderColor = "";
        itemDiv.innerHTML = '<span class="eq-empty">empty</span>';
      }
    });

    const inv = s.loot.inventory.slice().sort(function (a, b) { return Sys.itemPower(b) - Sys.itemPower(a); });
    let html = "";
    if (!inv.length) html = '<div class="empty-state">No items yet — raid villages and defeat Boss Lairs to find loot!</div>';
    inv.forEach(function (it) {
      const sel = it.uid === selectedUid ? " selected" : "";
      html +=
        '<div class="inv-item r' + it.rarity + sel + '" data-uid="' + it.uid + '">' +
          '<div class="inv-bar" style="background:' + rarityColor(it.rarity) + '"></div>' +
          '<div class="inv-body">' +
            '<div class="inv-name" style="color:' + rarityColor(it.rarity) + '">' + it.name + '</div>' +
            '<div class="inv-sub">' + DATA.SLOT_BY_ID[it.slot].name + " · " + rarityName(it.rarity) + " · +" + it.level + '</div>' +
          '</div>' +
        '</div>';
    });
    el.invList.innerHTML = html;
    el.invList.querySelectorAll(".inv-item").forEach(function (node) {
      node.addEventListener("click", function () {
        selectedUid = parseInt(node.dataset.uid, 10);
        UI.refreshLoot();
      });
    });
    UI.refreshLootTools();
    UI.refreshItemDetail();
  };

  UI.refreshItemDetail = function () {
    if (selectedUid == null) {
      el.itemDetail.innerHTML = '<div class="empty-state subtle">Tap an item to inspect, equip, sell, salvage, or enchant it.</div>';
      return;
    }
    const s = G.state;
    let it = null, equipped = false, slot = null;
    const invItem = s.loot.inventory.find(function (i) { return i.uid === selectedUid; });
    if (invItem) it = invItem;
    else {
      for (const sl in s.loot.equipped) {
        if (s.loot.equipped[sl] && s.loot.equipped[sl].uid === selectedUid) { it = s.loot.equipped[sl]; equipped = true; slot = sl; break; }
      }
    }
    if (!it) { selectedUid = null; el.itemDetail.innerHTML = ""; return; }
    const R = DATA.RARITY[it.rarity];
    let aff = "";
    it.affixes.forEach(function (a) { aff += '<div class="detail-affix">' + fmtAffix(a, it.level) + '</div>'; });
    const cost = Sys.enchantCost(it);
    const maxed = it.level >= CONFIG.LOOT_ENCHANT_MAX_LEVEL;
    const canEnchant = !maxed && s.loot.runes >= cost.runes && s.gold >= cost.gold;
    let actions = "";
    if (equipped) {
      actions += '<button class="loot-act" data-act="unequip">Unequip</button>';
    } else {
      actions += '<button class="loot-act primary" data-act="equip">Equip</button>';
      actions += '<button class="loot-act" data-act="sell">Sell · 🪙' + fmt(Sys.sellValue(it)) + '</button>';
      actions += '<button class="loot-act" data-act="salvage">Salvage · 🔮' + Sys.salvageValue(it) + '</button>';
    }
    actions += '<button class="loot-act ' + (maxed ? "disabled" : (canEnchant ? "primary" : "")) + '" data-act="enchant">' +
      (maxed ? "Max Level" : "Enchant +1 · 🔮" + cost.runes + " · 🪙" + fmt(cost.gold)) + '</button>';

    el.itemDetail.innerHTML =
      '<div class="detail-head" style="color:' + R.color + '">' + it.name + ' <span class="detail-lv">+' + it.level + '</span></div>' +
      '<div class="detail-sub">' + DATA.SLOT_BY_ID[it.slot].name + " · " + R.name + (equipped ? ' · <i>Equipped</i>' : '') + '</div>' +
      aff + '<div class="detail-actions">' + actions + '</div>';

    el.itemDetail.querySelectorAll("[data-act]").forEach(function (b) {
      b.addEventListener("click", function () {
        const act = b.dataset.act;
        if (act === "equip") { Sys.equipItem(it.uid) ? SFX.upgrade() : SFX.error(); }
        else if (act === "unequip") { Sys.unequip(slot) ? SFX.upgrade() : SFX.error(); }
        else if (act === "sell") { const r = Sys.sellItem(it.uid); if (r) { SFX.upgrade(); UI.toast("Sold for 🪙" + fmt(r.gold)); selectedUid = null; } else SFX.error(); }
        else if (act === "salvage") { const r = Sys.salvageItem(it.uid); if (r) { SFX.upgrade(); UI.toast("Salvaged for 🔮" + r.runes + " runes"); selectedUid = null; } else SFX.error(); }
        else if (act === "enchant") { if (Sys.enchantItem(it.uid)) { SFX.upgrade(); UI.toast("Enchanted to +" + it.level + "!"); } else SFX.error(); }
        UI.refreshLoot();
      });
    });
  };

  // ============================================================
  //  DAILY QUESTS
  // ============================================================
  UI.refreshDailies = function () {
    const s = G.state;
    if (!s || !s.dailies) { Sys.dailyRollover(); }
    const d = s.dailies;
    if (!d) { el.dailyList.innerHTML = ""; return; }
    el.dailyStreak.textContent = d.streak || 0;
    let html = "";
    d.quests.forEach(function (q, i) {
      const prog = Math.min(q.goal, q.progress || 0);
      const done = prog >= q.goal;
      const claimable = done && !q.claimed;
      const rewardTxt = (q.reward.runes ? "🔮" + q.reward.runes + "  " : "") + (q.reward.shards ? "💎" + q.reward.shards + "  " : "") + "+ 🪙 bonus";
      html +=
        '<div class="daily-q' + (q.claimed ? " claimed" : "") + '">' +
          '<div class="dq-head"><b>' + q.verb + " " + q.goal + " " + q.noun + '</b><span class="dq-reward">' + rewardTxt + '</span></div>' +
          '<div class="dq-bar"><div class="dq-fill" style="width:' + (prog / q.goal * 100) + '%"></div><span class="dq-text">' + prog + '/' + q.goal + '</span></div>' +
          (q.claimed
            ? '<button class="dq-claim done" disabled>✓ Claimed</button>'
            : '<button class="dq-claim' + (claimable ? "" : " disabled") + '" data-dq="' + i + '">' + (claimable ? "Claim" : "In progress") + '</button>') +
        '</div>';
    });
    el.dailyList.innerHTML = html;
    el.dailyList.querySelectorAll("[data-dq]").forEach(function (b) {
      b.addEventListener("click", function () {
        const idx = parseInt(b.dataset.dq, 10);
        const r = Sys.claimDaily(idx);
        if (r) { SFX.level(); UI.toast("Quest complete!  +🔮" + r.runes + (r.shards ? "  💎" + r.shards : "") + "  +🪙" + fmt(r.gold), 2200); }
        else SFX.error();
        UI.refreshDailies();
      });
    });
  };

  function updateDailyBadge() {
    const s = G.state;
    if (!s || !s.dailies || !el.dailyBtn) { if (el.dailyBtn) el.dailyBtn.classList.remove("badge"); return; }
    const any = s.dailies.quests.some(function (q) { return !q.claimed && (q.progress || 0) >= q.goal; });
    el.dailyBtn.classList.toggle("badge", any);
  }

  // ============================================================
  //  STAT PRESETS
  // ============================================================
  function buildPresets() {
    if (!el.presetRow) return;
    const presets = [
      { id: "tap", label: "⚔️ Tap", w: { str: 2, fot: 1 } },
      { id: "crew", label: "🪓 Crew", w: { led: 2, fot: 1 } },
      { id: "tank", label: "🛡️ Tank", w: { vit: 2, led: 1 } },
      { id: "balanced", label: "⚖️ Balanced", w: { str: 1, led: 1, vit: 1, fot: 1 } },
    ];
    let html = "";
    presets.forEach(function (p) {
      html += '<button class="preset-btn" data-preset="' + p.id + '">' + p.label + "</button>";
    });
    el.presetRow.innerHTML = html;
    el.presetRow.querySelectorAll("[data-preset]").forEach(function (b) {
      b.addEventListener("click", function () {
        const def = presets.find(function (x) { return x.id === b.dataset.preset; });
        const n = Sys.applyStatPreset(def.w);
        if (n > 0) { SFX.upgrade(); UI.toast("Allocated " + n + " points (" + def.label + ")."); }
        else SFX.error();
        UI.refreshHero();
      });
    });
  }

  // ============================================================
  //  ACHIEVEMENTS
  // ============================================================
  UI.refreshAchievements = function () {
    const s = G.state;
    const unlocked = {};
    s.achievements.forEach(function (id) { unlocked[id] = true; });
    el.achCount.textContent = s.achievements.length + "/" + DATA.ACHIEVEMENTS.length;
    let html = "";
    DATA.ACHIEVEMENTS.forEach(function (a) {
      const got = !!unlocked[a.id];
      const rewardTxt = (a.reward.shards ? "💎" + a.reward.shards + " " : "") + (a.reward.runes ? "🔮" + a.reward.runes + " " : "") + (a.reward.goldFactor ? "🪙" : "");
      html +=
        '<div class="ach' + (got ? " done" : "") + '">' +
          '<div class="ach-icon">' + (got ? a.icon : "🔒") + "</div>" +
          '<div class="ach-body">' +
            '<div class="ach-name">' + a.name + '</div>' +
            '<div class="ach-desc">' + a.desc + '</div>' +
          '</div>' +
          '<div class="ach-reward">' + rewardTxt + '</div>' +
        '</div>';
    });
    el.achList.innerHTML = html;
  };

  // ============================================================
  //  LOOT TOOLS STATE
  // ============================================================
  UI.refreshLootTools = function () {
    if (el.ltAutoState) el.ltAutoState.textContent = G.state.settings.autoEquip ? "On" : "Off";
    if (el.ltAutoToggle) el.ltAutoToggle.classList.toggle("active", G.state.settings.autoEquip);
  };

  // ============================================================
  //  ONBOARDING (first-time coach)
  // ============================================================
  const OB = (global.OB = {});
  OB.steps = [
    { icon: "⚔️", title: "Raid the Coast", text: "Tap anywhere on the village to strike it. Keep tapping to build a COMBO for big damage!" },
    { icon: "🪓", title: "Your Warband", text: "Your crew attacks automatically. Watch the Longship bar — if it falls, reinforce with Armor & Rations." },
    { icon: "🔨", title: "The Forge", text: "Spend plundered gold on upgrades. Tap x1 / x10 / MAX to buy in bulk." },
    { icon: "🧔", title: "Level Up", text: "Earn XP, then spend stat points in the Hero tab. Unlock powerful Abilities as you grow." },
    { icon: "🎒", title: "Loot & Runes", text: "Villages and Bosses drop gear. Equip it, salvage the rest for runes, and Enchant your favourites." },
    { icon: "🌀", title: "Endless Saga", text: "Each region is harder than the last. Reach Region 3 to Set Sail and prestige for permanent power." },
  ];
  OB.show = function () {
    if (!el.onboarding) return;
    if (G.state.onboarding.dismissed) return;
    OB.render();
    el.onboarding.classList.add("show");
  };
  OB.render = function () {
    const step = G.state.onboarding.step || 0;
    const s = OB.steps[step] || OB.steps[0];
    el.obIcon.textContent = s.icon;
    el.obTitle.textContent = s.title;
    el.obText.textContent = s.text;
    el.obNext.textContent = step >= OB.steps.length - 1 ? "Begin Raiding" : "Next";
    let dots = "";
    for (let i = 0; i < OB.steps.length; i++) dots += '<span class="ob-dot' + (i === step ? " on" : "") + '"></span>';
    el.obDots.innerHTML = dots;
  };
  OB.next = function () {
    SFX.upgrade();
    G.state.onboarding.step = (G.state.onboarding.step || 0) + 1;
    if (G.state.onboarding.step >= OB.steps.length) { OB.skip(); return; }
    OB.render();
  };
  OB.skip = function () {
    G.state.onboarding.dismissed = true;
    if (el.onboarding) el.onboarding.classList.remove("show");
    State.save(G.state);
  };

  UI.refreshSettings = function () {
    const s = G.state.settings;
    $("setSfx").classList.toggle("on", s.sfx);
    $("setMusic").classList.toggle("on", s.music);
    $("setHaptics").classList.toggle("on", s.haptics);
    $("setFx").classList.toggle("on", !s.reducedFx);
  };

  // --- Per-frame HUD update ----------------------------------------
  UI.update = function () {
    const s = G.state;
    const d = G.derived;
    if (!s || !d) return;
    const v = G.village;
    // gold pop: scale-bump the counter whenever gold jumps meaningfully
    el.gold.textContent = "🪙 " + fmt(s.gold);
    if (UI._lastGold != null && s.gold > UI._lastGold * 1.001 + 1) {
      el.gold.classList.remove("pop");
      void el.gold.offsetWidth; // restart animation
      el.gold.classList.add("pop");
    }
    UI._lastGold = s.gold;
    el.shards.textContent = "💎 " + fmt(s.saga.shards);
    el.levelBadge.textContent = "LVL " + s.level;
    const need = F.xpForLevel(s.level);
    el.xpFill.style.width = Math.min(100, (s.xp / need) * 100) + "%";
    el.xpText.textContent = fmt(s.xp) + " / " + fmt(need) + " XP";
    const regName = DATA.regionName(s.region);
    const rt = Sys.currentRoute ? Sys.currentRoute() : null;
    el.regionBadge.innerHTML = '<span class="rb-name">' + regName + "</span>" +
      '<span class="rb-sub">Village ' + (s.villageIndex + 1) + "/" + CONFIG.VILLAGES_PER_REGION +
      (v && v.isBoss ? " · BOSS" : "") +
      (v && v.mod && v.mod.id !== "none" ? " · " + v.mod.icon + " " + v.mod.name : "") +
      (rt && rt.id !== "calm" ? " · " + rt.emoji + " " + rt.name : "") +
      (Sys.isCacheVillage && Sys.isCacheVillage(s.region, s.villageIndex) ? " · 💰 CACHE" : "") +
      "</span>";
    // map button glows when a treasure cache is within scouting range ahead
    if (el.mapBtn && Sys.cacheIndices) {
      const caches = Sys.cacheIndices(s.region);
      let near = false;
      for (let i = 0; i < caches.length; i++) {
        if (caches[i] >= s.villageIndex && caches[i] <= s.villageIndex + CONFIG.MAP_SCOUT_AHEAD) { near = true; break; }
      }
      el.mapBtn.classList.toggle("gold-badge", near);
    }
    el.tapVal.textContent = "⚔ " + fmt(d.tapDmg);
    el.crewVal.textContent = "🪓 " + fmt(d.crewDps) + "/s";

    // repair button visibility
    const damaged = s.shipHp < d.shipMaxHp * 0.999;
    el.repairBtn.style.display = damaged ? "flex" : "none";

    // abilities
    Object.keys(CONFIG.ABILITIES).forEach(function (id) {
      const a = CONFIG.ABILITIES[id];
      const st = s.abilities[id];
      const e = abilityEls[id];
      if (!e) return;
      const unlocked = s.level >= a.unlockLevel;
      e.btn.classList.toggle("locked", !unlocked);
      e.btn.classList.toggle("active", st.activeLeft > 0);
      const ready = unlocked && st.cdLeft <= 0 && st.activeLeft <= 0;
      e.btn.classList.toggle("ready", ready);
      if (!unlocked) { e.cd.style.height = "100%"; e.lock.textContent = "Lv " + a.unlockLevel; }
      else if (st.cdLeft > 0) { e.cd.style.height = (st.cdLeft / a.cooldownS) * 100 + "%"; e.lock.textContent = Math.ceil(st.cdLeft) + "s"; }
      else if (st.activeLeft > 0) { e.cd.style.height = "0%"; e.lock.textContent = "ON"; }
      else { e.cd.style.height = "0%"; e.lock.textContent = ""; }
    });

    // Ragnarök ultimate button
    if (el.ragBtn) {
      const rf = Sys.rageFrac();
      const ready = rf >= 1;
      el.ragCd.style.height = (1 - rf) * 100 + "%";
      el.ragLock.textContent = ready ? "GO!" : Math.floor(rf * 100) + "%";
      el.ragBtn.classList.toggle("ready", ready);
      el.ragBtn.classList.toggle("active", Sys.ragnarokActive());
    }

    if (tab === "forge") UI.refreshForge();
    if (tab === "loot") UI.refreshLoot();
    updateDailyBadge();
  };

  // --- Toast & modals ----------------------------------------------
  // --- Saga Chart (map) ---------------------------------------------
  UI.showMap = function () {
    if (!el.modalMap) return;
    const s = G.state;
    const nodes = Sys.regionNodes();
    el.mapRegionName.textContent = DATA.regionName(s.region);
    const cleared = nodes.filter(function (n) { return n.cleared; }).length;
    el.mapProgress.textContent = cleared + "/" + nodes.length + " conquered";
    let html = "";
    nodes.forEach(function (n, i) {
      const cls = ["map-node"];
      if (n.cleared) cls.push("cleared");
      if (n.current) cls.push("current");
      if (!n.scouted) cls.push("fog");
      if (n.isBoss) cls.push("boss");
      if (n.cache) cls.push("cache");
      const icon = !n.scouted ? "🌫" : n.isBoss ? "☠" : n.cache ? "💰" : n.cleared ? "✓" : "⚔";
      const sub = !n.scouted
        ? "Scout closer to reveal"
        : (n.isBoss ? "Boss Lair" : n.cache ? "Treasure cache — bonus plunder!" : "Village " + (n.index + 1)) +
          (n.mod ? " · " + n.mod.icon + " " + n.mod.name : "");
      html +=
        '<div class="' + cls.join(" ") + '">' +
          (i > 0 ? '<span class="map-link' + (n.cleared || n.current ? " lit" : "") + '"></span>' : "") +
          '<span class="map-dot">' + icon + '</span>' +
          '<span class="map-info">' +
            '<span class="map-name">' + n.name + '</span>' +
            '<span class="map-detail">' + sub + '</span>' +
          '</span>' +
          (n.scouted && !n.cleared && n.gold ? '<span class="map-gold">🪙 ' + fmt(n.gold) + '</span>' : "") +
          (n.cleared ? '<span class="map-gold done">plundered</span>' : "") +
        '</div>';
    });
    // next region teaser — the hook to keep pushing
    html +=
      '<div class="map-node teaser">' +
        '<span class="map-link"></span>' +
        '<span class="map-dot">🧭</span>' +
        '<span class="map-info">' +
          '<span class="map-name">' + DATA.regionName(s.region + 1) + '</span>' +
          '<span class="map-detail">Conquer this land to chart a new course…</span>' +
        '</span>' +
      '</div>';
    el.mapTrail.innerHTML = html;
    UI.openModal("modalMap");
    // auto-scroll the trail to the current node
    const cur = el.mapTrail.querySelector(".map-node.current");
    if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: "center" });
  };

  // --- Expedition route choice -------------------------------------
  UI.showRouteChoice = function () {
    if (!el.modalRoute) return;
    let html = "";
    DATA.ROUTES.forEach(function (r) {
      html +=
        '<button class="route-card" data-route="' + r.id + '">' +
          '<img class="route-img" src="' + r.icon + '" alt="" onerror="this.style.display=\'none\'" />' +
          '<span class="route-body">' +
            '<span class="route-name">' + r.emoji + " " + r.name + '</span>' +
            '<span class="route-desc">' + r.desc + '</span>' +
            '<span class="route-flavor">' + r.flavor + '</span>' +
          '</span>' +
        '</button>';
    });
    el.routeList.innerHTML = html;
    el.routeList.querySelectorAll(".route-card").forEach(function (b) {
      b.addEventListener("click", function () {
        Sys.chooseRoute(b.dataset.route);
        UI.closeModal("modalRoute");
        SFX.ability && SFX.ability();
      });
    });
    UI.openModal("modalRoute");
  };

  // --- Epic+ drop banner (AAA loot moment) ---------------------------
  UI.dropBanner = function (it) {
    const bn = $("dropBanner");
    if (!bn) return;
    const R = DATA.RARITY[it.rarity];
    bn.style.setProperty("--db-color", R.color);
    bn.style.setProperty("--db-glow", R.color + "88");
    $("dbRarity").textContent = R.name + " DROP";
    $("dbName").textContent = it.name;
    $("dbSub").textContent = DATA.SLOT_BY_ID[it.slot].name + " · " + it.affixes.length + " affixes";
    bn.classList.remove("show");
    void bn.offsetWidth;
    bn.classList.add("show");
  };

  UI.toast = function (msg, ms) {
    el.toast.textContent = msg;
    el.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.toast.classList.remove("show"); }, ms || 1800);
  };
  UI.openModal = function (id) { $(id).classList.add("show"); };
  UI.closeModal = function (id) { $(id).classList.remove("show"); };

  UI.showOffline = function (report) {
    if (!report) return;
    const mins = Math.floor(report.seconds / 60);
    el.offReport.innerHTML =
      "<h3>⚖️ Away Report</h3>" +
      "<p>Your warband raided while you were gone for <b>" + mins + " min</b>" + (report.capped ? " (capped)" : "") + ".</p>" +
      '<div class="off-row"><span>🪙 Gold plundered</span><b>+' + fmt(report.gold) + "</b></div>" +
      '<div class="off-row"><span>⭐ Experience</span><b>+' + fmt(report.xp) + "</b></div>";
    UI.openModal("modalOffline");
  };

  UI.openPrestige = function () {
    if (!Sys.canPrestige()) { SFX.error(); UI.toast("Defeat more region bosses first."); return; }
    const gain = Sys.sagaGain();
    el.prestigeDetail.innerHTML =
      "<p>Sail beyond the known seas. Your gold, upgrades, level and regions reset — but you earn <b>💎 " + gain +
      " Saga Shards</b> and keep all permanent Saga bonuses.</p>" +
      '<div class="off-row"><span>Highest region reached</span><b>' + (G.state.highestRegion + 1) + "</b></div>" +
      '<div class="off-row"><span>Shards earned now</span><b>+' + gain + "</b></div>" +
      '<div class="off-row"><span>Total shards after</span><b>' + (G.state.saga.shards + gain) + "</b></div>";
    UI.openModal("modalPrestige");
  };
  UI.doPrestige = function () {
    Sys.doPrestige();
    SFX.prestige();
    UI.closeModal("modalPrestige");
    UI.setTab("raid");
    UI.toast("A new saga begins! ⛵");
  };

  UI.doExport = function () {
    const code = State.exportCode(G.state);
    $("exportCode").value = code;
    $("exportCode").select();
    try { document.execCommand("copy"); UI.toast("Save code copied!"); } catch (e) {}
  };
  UI.doImport = function () {
    const code = prompt("Paste your VR1- save code:");
    if (!code) return;
    const st = State.importCode(code);
    if (!st) { SFX.error(); UI.toast("Invalid save code."); return; }
    Sys.init(st);
    State.save(G.state);
    UI.closeModal("modalSettings");
    UI.toast("Save imported!");
    location.reload();
  };
  UI.confirmWipe = function () {
    if (confirm("Erase ALL progress? This cannot be undone.")) {
      State.wipe();
      location.reload();
    }
  };
})(typeof window !== "undefined" ? window : this);
