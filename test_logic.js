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
