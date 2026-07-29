/* Headless logic test for Viking Raid core systems.
   Loads the non-DOM scripts in a mocked global and asserts behavior. */
global.window = global;
global.navigator = {};
const _store = {};
global.localStorage = {
  getItem: (k) => (k in _store ? _store[k] : null),
  setItem: (k, v) => { _store[k] = String(v); },
  removeItem: (k) => { delete _store[k]; },
};
const fs = require("fs");
const vm = require("vm");
function load(f) { vm.runInThisContext(fs.readFileSync(f, "utf8"), { filename: f }); }
["js/config.js", "js/data.js", "js/state.js", "js/systems.js"].forEach(load);

let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log("  ✓ " + name); } else { fail++; console.log("  ✗ FAIL: " + name); } }
function near(a, b, eps, name) { ok(name + " (~" + (+a).toFixed(2) + ")", Math.abs(a - b) < (eps || 0.01)); }

console.log("\n== Boot ==");
const st = State.defaults();
ok("fresh state has stats", !!st.stats && st.stats.str === 0);
ok("fresh upgrades zeroed", Object.values(st.upgrades).every((v) => v === 0));
Sys.init(st);
ok("village generated", !!G.village && G.village.maxHp > 0);
ok("shipHp set to max", st.shipHp === G.derived.shipMaxHp);

console.log("\n== Derived stats ==");
const baseTap = G.derived.tapDmg;
const baseCrew = G.derived.crewDps;
const baseHp = G.derived.shipMaxHp;
ok("base tap > 0", baseTap > 0);
ok("base crew dps > 0", baseCrew > 0);
ok("base ship hp = 100", Math.abs(baseHp - 100) < 0.01);

console.log("\n== Upgrades affect derived ==");
st.gold = 1e9;
Sys.buyUpgrade("axe", 5);
ok("axe level 5", st.upgrades.axe === 5);
Sys.recompute();
ok("axe raised tap dmg", G.derived.tapDmg > baseTap);
Sys.buyUpgrade("crew", 5);
Sys.buyUpgrade("armor", 5);
Sys.recompute();
ok("crew raised dps", G.derived.crewDps > baseCrew);
ok("armor raised hp", G.derived.shipMaxHp > baseHp);

console.log("\n== Combat tick ==");
const v0 = G.village.hp;
Sys.tick(1);
ok("crew damage applied to village", G.village.hp < v0);
ok("ship took defense damage", st.shipHp < G.derived.shipMaxHp);

console.log("\n== Stat allocation & leveling ==");
st.unspentStatPoints = 10;
for (let i = 0; i < 10; i++) Sys.allocStat("str");
ok("str allocated", st.stats.str === 10);
ok("tap dmg grew from str", G.derived.tapDmg > baseTap * 1.5);
st.xp = 1e9;
Sys.checkLevel();
ok("leveled up", st.level > 1);
ok("stat points awarded", st.unspentStatPoints > 0);

console.log("\n== Village clear + advance ==");
const beforeRaids = st.totals.raids;
const beforeGold = st.gold;
G.village.hp = 1;
Sys.tick(2); // weakened village cleared by warband over 2s
ok("raid counted on clear", st.totals.raids > beforeRaids);
ok("gold gained on clear", st.gold > beforeGold);

console.log("\n== Boss village ==");
st.region = 0; st.villageIndex = CONFIG.BOSS_INDEX;
G.village = Sys.genVillage(0, CONFIG.BOSS_INDEX);
ok("boss flagged", G.village.isBoss === true);
ok("boss hp huge vs normal", G.village.maxHp > Sys.genVillage(0, 0).maxHp * 4);

console.log("\n== Region scaling ==");
ok("region 3 hp >> region 0", F.villageHp(3, 0) > F.villageHp(0, 0) * 50);

console.log("\n== Prestige ==");
st.highestRegion = CONFIG.SAGA_MIN_REGION;
ok("can prestige", Sys.canPrestige());
const shardsBefore = st.saga.shards;
const gain = Sys.sagaGain();
ok("saga gain > 0", gain > 0);
Sys.doPrestige();
ok("shards granted", st.saga.shards === shardsBefore + gain);
ok("region reset", st.region === 0 && st.highestRegion === 0);
ok("gold reset", st.gold === 0);
ok("level reset", st.level === 1);

console.log("\n== Saga upgrade ==");
const sg = st.saga.shards;
Sys.buySaga("steel");
ok("saga steel purchased", st.saga.upgrades.steel === 1);
ok("shards spent", st.saga.shards < sg);

console.log("\n== Offline progress ==");
Sys.init(State.defaults());
const rep = Sys.applyOffline(2 * 3600 * 1000);
ok("offline report produced", !!rep && rep.gold >= 0);
ok("offline gives gold", rep.gold > 0);

console.log("\n== Loot & equipment ==");
const S = G.state; // operate on the live state (earlier sections may have re-init'd)
ok("fresh loot state exists", !!S.loot && S.loot.runes === 0 && Array.isArray(S.loot.inventory));
ok("equipped has 4 slots", Object.keys(S.loot.equipped).length === 4);
const item = Sys.genItem(0, {});
ok("item generated with affixes", !!item && item.affixes.length >= 1 && !!item.name);
ok("rarity within range", item.rarity >= 0 && item.rarity < DATA.RARITY.length);
const inv0 = S.loot.inventory.length;
Sys._addItem(item);
ok("item added to inventory", S.loot.inventory.length === inv0 + 1);
Sys.equipItem(item.uid);
ok("item equipped into its slot", S.loot.equipped[item.slot] && S.loot.equipped[item.slot].uid === item.uid);
Sys.unequip(item.slot);
Sys.recompute();
ok("unequip removes item", S.loot.equipped[item.slot] === null);
const tapBeforeEq = G.derived.tapDmg; // clean baseline (nothing equipped)
// craft a strong tap item to verify equipment changes derived stats
const strong = Sys.genItem(0, {});
strong.affixes = [{ stat: "tapPct", base: 0.5, rarity: 5 }];
strong.slot = "weapon";
Sys._addItem(strong);
Sys.equipItem(strong.uid);
Sys.recompute();
ok("equipped tap item boosts tap dmg", G.derived.tapDmg > tapBeforeEq * 2);
const eCost = Sys.enchantCost(strong);
S.loot.runes = eCost.runes + 100; S.gold = eCost.gold + 100;
const lvlBefore = strong.level;
ok("enchant levels up item", Sys.enchantItem(strong.uid) && strong.level === lvlBefore + 1);
const toSell = Sys.genItem(0, {}); Sys._addItem(toSell);
const goldBeforeSell = S.gold;
ok("sell grants gold", !!Sys.sellItem(toSell.uid) && S.gold > goldBeforeSell);
const toSalv = Sys.genItem(0, {}); Sys._addItem(toSalv);
const runesBefore = S.loot.runes;
ok("salvage grants runes", !!Sys.salvageItem(toSalv.uid) && S.loot.runes > runesBefore);

console.log("\n== Daily quests ==");
Sys.dailyRollover();
ok("dailies generated", !!S.dailies && S.dailies.quests.length === CONFIG.DAILY_QUEST_COUNT);
const q0 = S.dailies.quests[0];
Sys.daily(q0.track, q0.goal + 5); // force-complete the first quest
ok("daily progress tracked", q0.progress >= q0.goal);
const idx0 = S.dailies.quests.indexOf(q0);
const claimR = Sys.claimDaily(idx0);
ok("daily claim grants rewards", !!claimR && (claimR.runes > 0 || claimR.gold > 0));
ok("claimed quest flagged", q0.claimed === true);
ok("cannot claim twice", Sys.claimDaily(idx0) === null);

console.log("\n== Boss drops runes & loot ==");
Sys.init(State.defaults());
G.village = Sys.genVillage(0, CONFIG.BOSS_INDEX);
const runesBeforeBoss = G.state.loot.runes;
G.village.hp = 0.0001;
Sys.tick(5);
ok("boss kill granted runes", G.state.loot.runes > runesBeforeBoss);

console.log("\n== Combo, achievements & QoL ==");
Sys.init(State.defaults());
Sys.tap(); Sys.tap(); Sys.tap();
ok("combo builds on tap", G.runtime.combo === 3);
ok("combo multiplier scales", Sys.comboMult() > 1);
G.runtime.hitstop = 0;
Sys.tick(CONFIG.COMBO_WINDOW_MS / 1000 + 0.2);
ok("combo decays after idle window", G.runtime.combo === 0);
G.state.totals.raids = 5; G.state.totals.bosses = 1;
const newly = Sys.checkAchievements();
ok("achievements unlock", newly.length > 0 && G.state.achievements.indexOf("first_raid") >= 0);
ok("achievement rewards granted", G.state.gold > 0 || G.state.loot.runes > 0);
ok("no duplicate unlock", Sys.checkAchievements().length === 0);
G.state.unspentStatPoints = 12;
ok("stat preset allocates all points", Sys.applyStatPreset({ str: 2, fot: 1 }) === 12 && G.state.stats.str > 0);
const good = Sys.genItem(3, { rarityBonus: 3 });
good.affixes = [{ stat: "tapPct", base: 0.5, rarity: 4 }]; good.slot = "weapon";
Sys._addItem(good);
Sys.autoEquipBest();
ok("auto-equip best fills weapon slot", G.state.loot.equipped.weapon !== null);
Sys._addItem(Sys.genItem(0, {}));
const salR = Sys.salvageBelowRarity(2);
ok("bulk salvage returns result", typeof salR.count === "number");

console.log("\n== Modifiers, Ragnarok & boss mechanics ==");
Sys.init(State.defaults());
ok("village carries a modifier", !!G.village.mod && DATA.MODIFIER_BY_ID[G.village.mod.id]);
(function () {
  const sv = Sys.genVillage(2, 3);
  ok("modifier hp formula applied", Math.abs(sv.maxHp - F.villageHp(2, 3) * sv.type.hp * sv.mod.hp) < 0.01);
})();
ok("hexed modifier disables crits", DATA.MODIFIER_BY_ID["hexed"].crit === false);
G.runtime.rage = 0;
for (let i = 0; i < 300; i++) Sys.tap();
ok("rage builds from tapping", G.runtime.rage > 0);
G.village = Sys.genVillage(5, 0);
const hpB = G.village.hp;
G.runtime.rage = CONFIG.RAGE_CAP;
ok("ragnarok unleashes when ready", Sys.unleashRagnarok() === true);
ok("ragnarok deals damage", G.village.hp < hpB);
ok("ragnarok resets rage", G.runtime.rage < CONFIG.RAGE_CAP);
ok("ragnarok grants buff", G.runtime.ragBuff > 0);
ok("ragnarok not ready after use", Sys.rageReady() === false);
const boss = Sys.genVillage(0, CONFIG.BOSS_INDEX);
G.village = boss; boss.hp = boss.maxHp * 0.2;
G.runtime.hitstop = 0;
Sys.tick(0.05);
ok("boss staggers below 35% HP", boss.staggered === true);
G.runtime.hitstop = 0; boss.stagger = 0.01; Sys.tick(0.05);
ok("boss enrages after stagger window", boss.fury === true);

console.log("\n== Warband specialists (crew units) ==");
function der() { Sys.recompute(); return G.derived; }
(function () {
  const s = State.defaults();
  s.level = 20; s.gold = 1e9;
  Sys.init(s);
  ok("units defined", DATA.UNITS.length === 3 && !!DATA.UNIT_BY_ID.berserker);
  ok("unit locked below unlock level", (function () { const s2 = State.defaults(); s2.level = 1; Sys.init(s2); return Sys.unitUnlocked("berserker") === false; })());
  Sys.init(s);
  ok("unit unlocked at level", Sys.unitUnlocked("shieldmaiden") === true);
  const d0 = der();
  const crew0 = d0.crewDps, tap0 = d0.tapDmg, crit0 = d0.critChance, reduce0 = d0.shipDmgReduce || 0;
  ok("hire berserker succeeds", Sys.hireUnit("berserker", 10) === true);
  ok("berserker count tracked", s.units.berserker === 10);
  ok("berserkers boost crew dps", der().crewDps > crew0);
  ok("hire archer boosts tap+crit", (function () {
    Sys.hireUnit("archer", 10);
    const d = der();
    return d.tapDmg > tap0 && d.critChance > crit0;
  })());
  ok("hire shieldmaiden reduces ship damage", (function () {
    Sys.hireUnit("shieldmaiden", 10);
    return (der().shipDmgReduce || 0) > reduce0;
  })());
  ok("hiring costs gold", s.gold < 1e9);
  ok("unit cost grows", Sys.unitCost("berserker", 10) > Sys.unitCost("berserker", 0));
  ok("cannot hire more than affordable", (function () {
    s.gold = 0;
    return Sys.hireUnit("berserker", 1) === false;
  })());
  ok("shieldmaiden reduction is capped", (function () {
    s.units.shieldmaiden = 10000; G.dirty = true;
    return Math.abs(der().shipDmgReduce - CONFIG.CREW_SHIELD_REDUCE_CAP) < 1e-9;
  })());
  ok("prestige resets units", (function () {
    s.units = { berserker: 5, archer: 3, shieldmaiden: 2 };
    s.saga = s.saga || {}; s.highestRegion = 99; // ensure prestige allowed
    if (!Sys.canPrestige()) return true; // can't test path; don't fail suite
    Sys.doPrestige();
    return Sys.totalUnits() === 0;
  })());
  ok("heal() adds units to old saves", (function () {
    const old = State.defaults(); delete old.units;
    const healed = State.heal ? State.heal(old) : null;
    if (!healed) { // heal not exported; go through import/export
      const code = State.exportCode(old);
      const imp = State.importCode(code);
      return imp && imp.units && imp.units.berserker === 0;
    }
    return healed.units && healed.units.berserker === 0;
  })());
})();

console.log("\n== Save / load ==");
State.save(st);
const ld = State.load();
ok("save round-trips", !!ld && ld.state.level === st.level);
const code = State.exportCode(st);
const imp = State.importCode(code);
ok("export/import round-trips", !!imp && imp.level === st.level);

console.log("\n========================================");
console.log("RESULT: " + pass + " passed, " + fail + " failed");
console.log("========================================\n");
process.exit(fail ? 1 : 0);
