/* Full runtime smoke test: real DOM (jsdom) + mocked canvas/audio.
   Injects each script as a real <script> (runScripts:"dangerously") so
   globals attach to the window, then boots and exercises the UI. */
const { JSDOM } = require("jsdom");
const fs = require("fs");

function noop() {}
function makeCtx() {
  const store = {};
  return new Proxy(store, {
    get(t, p) {
      if (p === "createLinearGradient" || p === "createRadialGradient" || p === "createPattern")
        return () => ({ addColorStop: noop });
      if (p === "measureText") return () => ({ width: 12 });
      if (p in t) return t[p];
      if (p === "canvas") return { width: 0, height: 0, getBoundingClientRect: () => ({ width: 320, height: 560, left: 0, top: 0 }) };
      return noop;
    },
    set(t, p, v) { t[p] = v; return true; },
  });
}

const rawHtml = fs.readFileSync("index.html", "utf8").replace(/<script[\s\S]*?<\/script>/g, "");
const dom = new JSDOM(rawHtml, { url: "http://localhost/", runScripts: "dangerously", pretendToBeVisual: true });
const { window } = dom;

// ---- install mocks BEFORE scripts run ----
window.HTMLCanvasElement.prototype.getContext = function () { return makeCtx(); };
let rafCb = null;
window.requestAnimationFrame = (cb) => { rafCb = cb; return 1; };
window.cancelAnimationFrame = noop;
window.AudioContext = window.webkitAudioContext = function () {
  const param = () => ({ value: 0, setValueAtTime: noop, exponentialRampToValueAtTime: noop, linearRampToValueAtTime: noop });
  return { state: "running", currentTime: 0, destination: {}, createGain: () => ({ gain: param(), connect: noop }), createOscillator: () => ({ frequency: param(), type: "", connect: noop, start: noop, stop: noop }), createBuffer: () => ({ getChannelData: () => new Float32Array(8) }), createBufferSource: () => ({ connect: noop, start: noop }), createBiquadFilter: () => ({ frequency: param(), connect: noop }), resume: noop };
};
try { Object.defineProperty(window.navigator, "vibrate", { value: () => true, configurable: true }); } catch (e) {}

let errors = [];
window.addEventListener("error", (e) => errors.push("window.error: " + (e.error ? e.error.stack : e.message)));

// ---- inject scripts in order ----
const files = ["js/config.js", "js/data.js", "js/state.js", "js/systems.js", "js/render.js", "js/audio.js", "js/ui.js", "js/main.js"];
for (const f of files) {
  const s = window.document.createElement("script");
  s.textContent = fs.readFileSync(f, "utf8");
  window.document.body.appendChild(s);
}
// Mirror real-browser timing: scripts are parsed in-document before
// DOMContentLoaded fires, so dispatch it now to trigger main.js boot.
window.document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true }));

const doc = window.document;
const G = () => window.G;
function driveFrames(n) {
  let t = 1000;
  for (let i = 0; i < n; i++) {
    t += 16;
    try { if (rafCb) rafCb(t); } catch (e) { errors.push("frame " + i + ": " + e.stack); }
  }
}
function click(sel) {
  const elx = doc.querySelector(sel);
  if (!elx) { errors.push("click: not found " + sel); return null; }
  try { elx.dispatchEvent(new window.Event("click", { bubbles: true })); } catch (e) { errors.push("click " + sel + ": " + e.stack); }
  return elx;
}
let checks = [];
function check(name, fn) { try { fn(); checks.push("✓ " + name); } catch (e) { checks.push("✗ " + name + " — " + e.message); errors.push(name + ": " + e.stack); } }

driveFrames(5);

check("game booted (G.state)", () => { if (!G() || !G().state) throw new Error("no state"); });
check("village present", () => { if (!G().village) throw new Error("no village"); });
check("derived computed", () => { if (!G().derived || !G().derived.tapDmg) throw new Error("no derived"); });

G().state.gold = 1e12; G().state.unspentStatPoints = 20; G().state.level = 30;
window.Sys.recompute();

check("switch to Forge", () => { click('#tabs .tab[data-tab="forge"]'); if (doc.querySelector("#panelForge").style.display !== "block") throw new Error("forge not shown"); });
check("forge list populated", () => { if (!doc.querySelector("#forgeList .upg")) throw new Error("no cards"); });
check("buy axe upgrade", () => {
  const card = doc.querySelector('#forgeList .upg[data-id="axe"]');
  card.querySelector("[data-buy]").dispatchEvent(new window.Event("click", { bubbles: true }));
  if ((G().state.upgrades.axe || 0) < 1) throw new Error("not bought");
});
check("switch to Hero", () => { click('#tabs .tab[data-tab="hero"]'); });
check("allocate stat point", () => {
  const row = doc.querySelector('#statList .stat[data-id="str"]');
  row.querySelector("[data-add]").dispatchEvent(new window.Event("click", { bubbles: true }));
  if (G().state.stats.str < 1) throw new Error("not allocated");
});
check("derived stats render", () => { if (!doc.querySelector("#derivedStats .ds")) throw new Error("no rows"); });
check("switch to Saga", () => { click('#tabs .tab[data-tab="saga"]'); });
check("prestige locked below req", () => { G().state.highestRegion = 1; window.UI.refreshSaga(); if (!doc.querySelector("#sagaPrestige").classList.contains("disabled")) throw new Error("should be locked"); });

check("activate berserk ability", () => {
  G().state.abilities.berserk.cdLeft = 0; G().state.abilities.berserk.activeLeft = 0;
  window.Sys.recompute();
  doc.querySelector('.ab-btn[data-ab="berserk"]').dispatchEvent(new window.Event("click", { bubbles: true }));
  if (G().state.abilities.berserk.activeLeft <= 0) throw new Error("not activated");
});

check("raid tab + canvas tap damages", () => {
  click('#tabs .tab[data-tab="raid"]');
  const stage = doc.getElementById("stage");
  const before = G().village.hp;
  const ev = new window.Event("pointerdown", { bubbles: true });
  stage.dispatchEvent(ev);
  if (G().village.hp >= before && G().village.hp > 0) throw new Error("no damage");
});

check("ticks advance raids", () => {
  const r0 = G().state.totals.raids;
  G().village.hp = 0.0001;
  for (let i = 0; i < 3; i++) window.Sys.tick(2);
  if (G().state.totals.raids <= r0) throw new Error("no advance");
});

check("prestige grants shards + reset", () => {
  G().state.highestRegion = 5;
  const before = G().state.saga.shards;
  window.Sys.doPrestige();
  if (G().state.saga.shards <= before || G().state.region !== 0) throw new Error("prestige failed");
});

check("buy saga upgrade", () => {
  G().state.saga.shards = 1000;
  window.Sys.buySaga("plunder");
  if ((G().state.saga.upgrades.plunder || 0) < 1) throw new Error("not bought");
});

check("settings toggle", () => {
  const s = G().state.settings.sfx;
  doc.getElementById("setSfx").dispatchEvent(new window.Event("click", { bubbles: true }));
  if (G().state.settings.sfx === s) throw new Error("did not toggle");
});

check("save round-trips", () => { window.State.save(G().state); const ld = window.State.load(); if (!ld || !ld.state) throw new Error("no load"); });

check("loot tab renders equip slots", () => {
  click('#tabs .tab[data-tab="loot"]');
  if (doc.querySelectorAll("#equipSlots .eqslot").length !== 4) throw new Error("expected 4 slots");
  if (!doc.querySelector("#invList")) throw new Error("no inventory");
});
check("equip an item updates derived", () => {
  const it = window.Sys.genItem(0, {});
  it.affixes = [{ stat: "tapPct", base: 0.5, rarity: 5 }];
  it.slot = "weapon";
  window.Sys._addItem(it);
  const before = window.Sys.ensureDerived().tapDmg;
  window.Sys.equipItem(it.uid);
  window.Sys.recompute();
  if (window.Sys.ensureDerived().tapDmg <= before) throw new Error("equip did not boost");
});
check("enchant via UI detail button", () => {
  const it = window.Sys.genItem(0, {});
  window.Sys._addItem(it);
  G().state.loot.runes = 1e6; G().state.gold = 1e9;
  window.UI.refreshLoot(); // sync DOM after Sys mutation
  const node = doc.querySelector('.inv-item[data-uid="' + it.uid + '"]');
  if (!node) throw new Error("item not rendered");
  node.dispatchEvent(new window.Event("click", { bubbles: true })); // select
  const before = it.level;
  const btn = doc.querySelector('[data-act="enchant"]');
  if (!btn) throw new Error("no enchant button");
  btn.dispatchEvent(new window.Event("click", { bubbles: true }));
  if (it.level !== before + 1) throw new Error("enchant did not apply");
});
check("daily modal open + claim", () => {
  window.Sys.dailyRollover();
  const q0 = G().state.dailies.quests[0];
  window.Sys.daily(q0.track, q0.goal + 5);
  doc.getElementById("dailyBtn").dispatchEvent(new window.Event("click", { bubbles: true }));
  if (!doc.getElementById("modalDaily").classList.contains("show")) throw new Error("modal not shown");
  const claimBtn = doc.querySelector("#dailyList .dq-claim");
  if (!claimBtn || claimBtn.classList.contains("disabled")) throw new Error("claim not ready");
  claimBtn.dispatchEvent(new window.Event("click", { bubbles: true }));
  if (!q0.claimed) throw new Error("not claimed");
  window.UI.closeModal("modalDaily");
});

driveFrames(10);

console.log("\n== CHECKS ==");
checks.forEach((c) => console.log("  " + c));
console.log("\n== ERRORS (" + errors.length + ") ==");
errors.forEach((e) => console.log("  " + e.split("\n")[0]));
const cp = checks.filter((c) => c.startsWith("✓")).length;
console.log("\nSMOKE: " + cp + "/" + checks.length + " checks passed, " + errors.length + " errors\n");
process.exit(errors.length || cp < checks.length ? 1 : 0);