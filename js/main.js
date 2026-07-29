/* ============================================================
   VIKING RAID — main.js
   Bootstrap, fixed-timestep loop, input, autosave, offline,
   event wiring (sfx + toast + fx hooks).
   New Era Studios LLC
   ============================================================ */
(function () {
  "use strict";

  let canvas, lastFrame, acc = 0;
  let hiddenAt = 0;
  let frameCount = 0;

  function boot() {
    canvas = document.getElementById("stage");
    Render.init(canvas);
    UI.init();

    // load or fresh
    const loaded = State.load();
    let offlineReport = null;
    if (loaded) {
      Sys.init(loaded.state);
      SFX.setEnabled(G.state.settings.sfx);
      if (loaded.offlineMs > 60000) {
        offlineReport = Sys.applyOffline(loaded.offlineMs);
      }
    } else {
      Sys.init(State.defaults());
      SFX.setEnabled(true);
    }

    wireEvents();
    UI.setTab("raid");
    UI.refreshHero();
    UI.refreshSaga();

    // autosave
    setInterval(function () { State.save(G.state); }, CONFIG.SAVE_INTERVAL_MS);
    window.addEventListener("beforeunload", function () { State.save(G.state); });
    document.addEventListener("visibilitychange", onVisibility);

    lastFrame = performance.now();
    requestAnimationFrame(loop);

    if (offlineReport) setTimeout(function () { UI.showOffline(offlineReport); }, 600);
  }

  function onVisibility() {
    if (document.hidden) {
      G.paused = true;
      hiddenAt = Date.now();
      State.save(G.state);
    } else {
      G.paused = false;
      const away = Date.now() - hiddenAt;
      if (hiddenAt && away > 60000) {
        const rep = Sys.applyOffline(away);
        if (rep) UI.showOffline(rep);
      }
      hiddenAt = 0;
      lastFrame = performance.now();
      acc = 0;
    }
  }

  function wireEvents() {
    G.on("clear", function (d) {
      if (G.fx) G.fx.clearBurst(d.boss);
      if (d.boss) { SFX.boss(); UI.toast("☠ BOSS LAIR SACKED! +" + Render.formatNum(d.gold) + " 🪙", 2400); }
      else SFX.clear();
    });
    G.on("levelup", function (lvl) {
      SFX.level();
      UI.toast("⭐ Level " + lvl + "! +" + CONFIG.STAT_POINTS_PER_LEVEL + " stat points");
      UI.refreshHero();
    });
    G.on("retreat", function () {
      if (G.fx) G.fx.retreatFx();
      SFX.retreat();
      UI.toast("⛵ Your longship retreated! Repair or reinforce.", 2600);
    });
    G.on("newRegion", function (reg) {
      UI.toast("🗺️ New region: " + DATA.regionName(reg));
    });
    G.on("drop", function (it) {
      const R = DATA.RARITY[it.rarity];
      if (it.rarity >= 3) { SFX.boss(); UI.toast("✨ " + R.name + " loot — " + it.name + "!", 2600); }
      else UI.toast(R.name + " loot — " + it.name, 1400);
    });
    G.on("newDay", function () {
      SFX.level();
      UI.toast("📜 New daily Saga quests available!", 2800);
    });
    G.on("dailyClaim", function () { SFX.level(); });
    G.on("loot", function () { UI.refreshLoot && UI.refreshLoot(); });
    G.on("enchant", function () { SFX.upgrade(); });
    G.on("stat", function () { UI.refreshHero(); });
    G.on("upgrade", function () { UI.refreshForge(); });
    G.on("sagaUpgrade", function () { UI.refreshSaga(); });
    G.on("abilityEnd", function () {});
    G.on("prestige", function () {});
  }

  function loop(now) {
    let dtMs = now - lastFrame;
    lastFrame = now;
    if (dtMs > 250) dtMs = 250; // clamp after stalls
    if (!G.paused) {
      acc += dtMs;
      const step = 1000 / CONFIG.TICK_HZ;
      let guard = 0;
      while (acc >= step && guard < 12) {
        Sys.tick(step / 1000);
        acc -= step;
        guard++;
      }
      if (acc > step * 6) acc = 0;
      Render.frame(dtMs);
    }
    frameCount++;
    if (frameCount % 120 === 0) Sys.dailyRollover(); // detect midnight while playing
    UI.update();
    requestAnimationFrame(loop);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
