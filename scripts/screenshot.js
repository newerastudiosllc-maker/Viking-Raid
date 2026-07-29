/* scripts/screenshot.js
   Renders TRUE screenshots of Viking Raid by re-painting the real game frame
   (real assets, real config/formulas, real data) onto @napi-rs/canvas.
   Output: screenshots/*.png  (mobile portrait, store-listing quality)
   Run: node scripts/screenshot.js   (after: npm i @napi-rs/canvas) */
const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");

// --- load real game data (config/data/state/systems) into a mocked global ---
global.window = global;
global.navigator = {};
const vm = require("vm");
function load(f) { vm.runInThisContext(fs.readFileSync(f, "utf8"), { filename: f }); }
["js/config.js", "js/data.js", "js/state.js", "js/systems.js"].forEach(load);
const { CONFIG, DATA, F, Sys, G } = global;

const W = 1080, H = 2340; // phone portrait, ~1:2.17
const OUT = path.resolve(__dirname, "..", "screenshots");
fs.mkdirSync(OUT, { recursive: true });

const IMG = {};
async function loadIm(name, file) { IMG[name] = await loadImage(path.resolve(__dirname, "..", "assets", file)); }

// ---- number format (mirrors Render.formatNum) ----
function fmt(n) { n = Math.floor(n); if (n < 1000) return "" + n; const u = ["K","M","B","T","aa","ab"]; let i=-1; while(n>=1000&&i<u.length-1){n/=1000;i++;} return n.toFixed(n<10?1:0)+u[i]; }

function hpColor(f) { return f > 0.5 ? "#5fd17a" : f > 0.25 ? "#e0c14a" : "#e0533d"; }

function roundRect(c, x, y, w, h, r) { r = Math.min(r, w/2, h/2); c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }

// ---- scene image for a region ----
function sceneImg(region) { const a = DATA.regionArt(region).art; return a === "scene_forest" ? IMG.forest : a === "scene_fortress" ? IMG.fortress : IMG.village; }

// ---- background (ported from render.js) ----
function drawBackground(c, region) {
  const tint = DATA.regionArt(region).tint || "#10131f";
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, tint); g.addColorStop(1, "#05070c");
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  const im = sceneImg(region);
  if (im) {
    const sc = Math.max(W / im.width, H / im.height), dw = im.width * sc, dh = im.height * sc;
    c.globalAlpha = 0.94; c.drawImage(im, (W - dw) / 2, (H - dh) / 2, dw, dh); c.globalAlpha = 1;
  }
  const top = c.createLinearGradient(0, 0, 0, H * 0.30); top.addColorStop(0, "rgba(5,7,12,0.78)"); top.addColorStop(1, "rgba(5,7,12,0)");
  c.fillStyle = top; c.fillRect(0, 0, W, H * 0.30);
  const bot = c.createLinearGradient(0, H * 0.52, 0, H); bot.addColorStop(0, "rgba(5,7,12,0)"); bot.addColorStop(1, "rgba(5,7,12,0.93)");
  c.fillStyle = bot; c.fillRect(0, H * 0.52, W, H * 0.48);
}

// ---- weather (ported) ----
let wparts = [];
function buildWeather(region) { const cfg = DATA.weatherFor(region); wparts = []; if (!cfg || cfg.count <= 0) return; const n = Math.min(cfg.count, 120); for (let i=0;i<n;i++) wparts.push({x:Math.random(),y:Math.random(),v:0.4+Math.random()*0.8,s:1+Math.random()*1.5}); }
function drawWeather(c, region) {
  const cfg = DATA.weatherFor(region); if (!cfg || cfg.count <= 0) return;
  c.save(); c.strokeStyle = cfg.color; c.fillStyle = cfg.color; c.lineWidth = 3;
  for (const p of wparts) {
    const x = p.x*W, y = p.y*H;
    if (cfg.len > 0) { c.globalAlpha = 0.5; c.beginPath(); c.moveTo(x,y); c.lineTo(x - cfg.wind*cfg.len*2.2, y + cfg.len*2.2); c.stroke(); }
    else { c.globalAlpha = (cfg.glow?0.8:0.5)*p.s; c.beginPath(); c.arc(x,y,(cfg.glow?3.4:2.4)*p.s,0,Math.PI*2); c.fill(); }
  }
  c.globalAlpha = 1; c.restore();
}

// ---- cracks ----
function drawCracks(c, cx, cy, R, frac) {
  if (frac > 0.66) return;
  c.save(); c.translate(cx, cy); c.strokeStyle = "rgba(0,0,0,0.55)"; c.lineWidth = Math.max(2, R*0.02);
  const n = frac < 0.25 ? 5 : frac < 0.5 ? 3 : 1;
  for (let i=0;i<n;i++){ const a=(i/n)*Math.PI*2+0.3; c.beginPath(); c.moveTo(0,0); for(let s=1;s<=3;s++){const rr=R*0.92*(s/3),aa=a+Math.sin(i*7+s*3)*0.3; c.lineTo(Math.cos(aa)*rr,Math.sin(aa)*rr);} c.stroke(); }
  c.restore();
}

// ---- target emblem (ported) ----
function drawTarget(c, v, time) {
  const cx = W/2, cy = H*0.42, baseR = Math.min(W,H)*(v.isBoss?0.26:0.2);
  const pulse = 1 + Math.sin(time*2.2)*0.02 + (v.wobble||0)*0.12; const R = baseR*pulse;
  const glow = c.createRadialGradient(cx,cy,R*0.4,cx,cy,R*1.8); const gc = v.isBoss?"rgba(255,90,60,":"rgba(120,180,255,";
  glow.addColorStop(0, gc+(0.35+(v.hitFlash||0)*0.4)+")"); glow.addColorStop(1, gc+"0)");
  c.fillStyle = glow; c.beginPath(); c.arc(cx,cy,R*1.8,0,Math.PI*2); c.fill();
  c.save(); c.translate(cx,cy); c.scale(pulse, pulse*(1-(v.wobble||0)*0.08));
  const dg = c.createRadialGradient(0,-R*0.3,R*0.2,0,0,R); dg.addColorStop(0,"#2a2118"); dg.addColorStop(1,"#120d09");
  c.fillStyle = dg; c.beginPath(); c.arc(0,0,R,0,Math.PI*2); c.fill();
  if ((v.hitFlash||0) > 0.02){ c.fillStyle="rgba(255,240,200,"+((v.hitFlash||0)*0.6)+")"; c.beginPath(); c.arc(0,0,R,0,Math.PI*2); c.fill(); }
  c.lineWidth = R*0.06; c.strokeStyle = v.isBoss?"#ff6a4a":"#caa24a"; c.beginPath(); c.arc(0,0,R*0.92,0,Math.PI*2); c.stroke();
  c.lineWidth = R*0.02; c.strokeStyle = "rgba(255,255,255,0.15)"; c.beginPath(); c.arc(0,0,R*0.74,0,Math.PI*2); c.stroke();
  c.save(); c.rotate(time*0.3); c.strokeStyle="rgba(202,162,74,0.5)"; c.lineWidth=R*0.03; const marks=v.isBoss?8:6;
  for(let i=0;i<marks;i++){const a=(i/marks)*Math.PI*2; c.beginPath(); c.moveTo(Math.cos(a)*R*0.82,Math.sin(a)*R*0.82); c.lineTo(Math.cos(a)*R*0.92,Math.sin(a)*R*0.92); c.stroke();}
  c.restore();
  c.font = Math.floor(R*0.7)+"px serif"; c.textAlign="center"; c.textBaseline="middle"; c.fillText(v.isBoss?"☠":"⚔", 0, R*0.04);
  c.restore();
  const frac = Math.max(0, v.hp/v.maxHp);
  c.lineWidth = Math.max(12,R*0.12); c.lineCap="round";
  c.strokeStyle="rgba(255,255,255,0.12)"; c.beginPath(); c.arc(cx,cy,R*1.18,0,Math.PI*2); c.stroke();
  c.strokeStyle=hpColor(frac); c.beginPath(); c.arc(cx,cy,R*1.18,-Math.PI/2,-Math.PI/2+frac*Math.PI*2); c.stroke();
  drawCracks(c, cx, cy, R, frac);
  c.textAlign="center"; c.fillStyle=v.isBoss?"#ff8a6a":"#ffe9c7";
  c.font="bold "+Math.max(34,Math.floor(W*0.05))+"px serif"; c.fillText(v.name, cx, cy - R*1.62);
  c.fillStyle="rgba(255,255,255,0.65)"; c.font=Math.max(24,Math.floor(W*0.032))+"px sans-serif";
  c.fillText((v.isBoss?"BOSS LAIR · ":"")+fmt(Math.max(0,v.hp))+" / "+fmt(v.maxHp), cx, cy + R*1.62);
}

// ---- boss banner ----
function drawBossBanner(c, v, bannerT) {
  const t = 1.5 - bannerT, inP = Math.min(1, t/0.35), a = Math.min(inP, 1), slide=(1-inP)*120;
  c.save(); c.globalAlpha=a;
  c.fillStyle="rgba(120,10,10,"+(0.6*a)+")"; c.fillRect(0, H*0.3+slide, W, 150);
  c.fillStyle="#ff5a3c"; c.fillRect(0,H*0.3+slide,W,7); c.fillRect(0,H*0.3+143+slide,W,7);
  c.textAlign="center"; c.textBaseline="middle"; c.fillStyle="#ffe9c7";
  c.font="bold "+Math.max(40,Math.floor(W*0.06))+"px serif"; c.fillText("☠  BOSS LAIR  ☠", W/2, H*0.3+55+slide);
  c.font=Math.max(26,Math.floor(W*0.035))+"px sans-serif"; c.fillStyle="rgba(255,255,255,0.78)";
  c.fillText(v.name, W/2, H*0.3+105+slide); c.restore();
}

// ---- combo meter ----
function drawCombo(c, combo, comboTimer) {
  if (combo < 2) return;
  const mult = Math.min(CONFIG.COMBO_MULT_CAP, 1+combo*CONFIG.COMBO_MULT_PER_HIT);
  const cx=W/2, cy=H*0.42+Math.min(W,H)*0.32, heat=Math.min(1,combo/100);
  c.save(); c.globalAlpha=1; c.textAlign="center"; c.textBaseline="middle";
  c.font="bold "+(38+heat*22)+"px sans-serif"; c.fillStyle=heat>0.6?"#ff5a3c":"#ffd54a";
  c.fillText(combo+" HITS  ·  "+mult.toFixed(2)+"x", cx, cy);
  const bw=300, bf=Math.max(0, comboTimer/(CONFIG.COMBO_WINDOW_MS/1000));
  c.fillStyle="rgba(255,255,255,0.15)"; c.fillRect(cx-bw/2,cy+34,bw,10);
  c.fillStyle=heat>0.6?"#ff5a3c":"#ffd54a"; c.fillRect(cx-bw/2,cy+34,bw*bf,10); c.restore();
}

// ---- ship HP bar ----
function drawShip(c, shipHp, shipMax) {
  const frac=Math.max(0,shipHp/shipMax), bw=W*0.78, bh=36, bx=(W-bw)/2, by=H-260;
  c.fillStyle="rgba(0,0,0,0.5)"; roundRect(c,bx-4,by-4,bw+8,bh+8,16); c.fill();
  c.fillStyle="rgba(255,255,255,0.08)"; roundRect(c,bx,by,bw,bh,12); c.fill();
  c.fillStyle=hpColor(frac); roundRect(c,bx,by,bw*frac,bh,12); c.fill();
  c.fillStyle="#fff"; c.font="bold 26px sans-serif"; c.textAlign="center"; c.textBaseline="middle";
  c.fillText("LONGSHIP  "+Math.ceil(shipHp)+" / "+Math.ceil(shipMax), W/2, by+bh/2);
}

// ---- HUD + tabs + abilities (chrome) ----
function drawChrome(c, st, v) {
  // top gradient already part of bg; draw HUD elements
  c.textBaseline="middle";
  // region badge
  c.textAlign="left"; c.fillStyle="#ffd870"; c.font="bold 38px serif";
  c.fillText(DATA.regionName(st.region), 40, 60);
  c.fillStyle="#9a9484"; c.font="26px sans-serif";
  c.fillText("Village "+(st.villageIndex+1)+"/"+CONFIG.VILLAGES_PER_REGION+(v&&v.isBoss?" · BOSS":""), 40, 104);
  // level pill + icons (right)
  c.textAlign="center";
  const lx=W-70; c.fillStyle="#caa24a"; roundRect(c, lx-70, 34, 100, 52, 16); c.fill();
  c.fillStyle="#1a1206"; c.font="bold 28px serif"; c.fillText("LVL "+st.level, lx-20, 61);
  // xp bar
  const need=F.xpForLevel(st.level), xw=W-260, xx=130, xy=110, xh=14;
  c.fillStyle="rgba(255,255,255,0.1)"; roundRect(c,xx,xy,xw,xh,8); c.fill();
  c.fillStyle="#56b4e6"; roundRect(c,xx,xy,xw*Math.min(1,st.xp/need),xh,8); c.fill();
  // gold / combat / shards row
  c.font="bold 34px sans-serif"; c.textAlign="left";
  c.fillStyle="#ffd870"; c.fillText("🪙 "+fmt(st.gold), 40, 168);
  c.textAlign="center"; c.fillStyle="#ece7d8"; c.font="bold 24px sans-serif";
  c.fillText("⚔ "+fmt(G.derived.tapDmg)+"    🪓 "+fmt(G.derived.crewDps)+"/s", W/2, 168);
  c.textAlign="right"; c.fillStyle="#b9e6ff"; c.font="bold 34px sans-serif";
  c.fillText("💎 "+fmt(st.saga.shards), W-40, 168);

  // ability buttons (floating)
  const abs=["🔥","🛡️","📯","⚡"]; const aw=110, gap=26; const total=abs.length*aw+(abs.length-1)*gap; let ax=(W-total)/2; const ay=H-360;
  abs.forEach((ic)=>{ c.fillStyle="#1b2230"; c.beginPath(); c.arc(ax+aw/2, ay+aw/2, aw/2, 0, Math.PI*2); c.fill(); c.lineWidth=4; c.strokeStyle="#3a4356"; c.beginPath(); c.arc(ax+aw/2,ay+aw/2,aw/2,0,Math.PI*2); c.stroke(); c.font="48px sans-serif"; c.textAlign="center"; c.textBaseline="middle"; c.fillText(ic, ax+aw/2, ay+aw/2); ax+=aw+gap; });

  // bottom tab bar
  const th=150; c.fillStyle="#10141e"; c.fillRect(0, H-th, W, th);
  c.fillStyle="#caa24a"; c.fillRect(0, H-th, W, 5);
  const tabs=[["⚔","Raid",true],["🔨","Forge",false],["🧔","Hero",false],["🎒","Loot",false],["🌀","Saga",false]];
  const tw=W/tabs.length;
  tabs.forEach((t,i)=>{ const cx=i*tw+tw/2; c.textAlign="center"; c.textBaseline="middle"; c.font="52px sans-serif"; c.fillStyle=t[2]?"#ffd870":"#8c8674"; c.fillText(t[0], cx, H-th+52); c.font="bold 24px sans-serif"; c.fillText(t[1], cx, H-th+108); if(t[2]){c.fillStyle="#ffd870"; c.fillRect(cx-30, H-th, 60, 6);} });
}

// ---- floaters for liveliness ----
function drawFloaters(c, list) {
  c.textAlign="center"; c.textBaseline="middle";
  list.forEach(f=>{ c.globalAlpha=f.a; c.font="bold "+(f.big?60:42)+"px sans-serif"; c.fillStyle="rgba(0,0,0,"+(0.5*f.a)+")"; c.fillText(f.t,f.x+2,f.y+2); c.fillStyle=f.c; c.fillText(f.t,f.x,f.y); });
  c.globalAlpha=1;
}

// ---- build a mid-game state ----
function makeState(opts) {
  opts = opts || {};
  const st = State.defaults();
  st.gold = opts.gold != null ? opts.gold : 1284000;
  st.level = opts.level || 23;
  st.xp = Math.floor(F.xpForLevel(st.level) * 0.4);
  st.unspentStatPoints = opts.unspent || 9;
  st.stats = { str: 18, led: 14, vit: 9, fot: 11 };
  st.upgrades = { axe: 22, crew: 18, drum: 9, mead: 7, armor: 15, rations: 12, banner: 4 };
  st.saga.shards = opts.shards || 14;
  st.region = opts.region || 0;
  st.villageIndex = opts.villageIndex != null ? opts.villageIndex : 3;
  return st;
}

async function shot(name, drawFn) {
  const cv = createCanvas(W, H); const c = cv.getContext("2d");
  drawFn(c);
  const buf = await cv.encode("png");
  fs.writeFileSync(path.join(OUT, name + ".png"), buf);
  console.log("  ✓ " + name + ".png");
}

async function main() {
  await loadIm("village", "scene_village.png");
  await loadIm("forest", "scene_forest.png");
  await loadIm("fortress", "scene_fortress.png");
  await loadIm("hero", "hero_chieftain.png");
  await loadIm("logo", "logo.png");

  // ---- SPLASH ----
  await shot("01_splash", function (c) {
    const g = c.createRadialGradient(W/2, H*0.3, 100, W/2, H*0.3, H); g.addColorStop(0, "#1a2438"); g.addColorStop(1, "#06080d");
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    const im = IMG.logo, sc = 900 / im.width; c.drawImage(im, (W - im.width*sc)/2, H*0.22, im.width*sc, im.height*sc);
    c.textAlign="center";
    const tg = c.createLinearGradient(0, H*0.5, 0, H*0.66); tg.addColorStop(0,"#ffe7ad"); tg.addColorStop(0.5,"#e8b94e"); tg.addColorStop(1,"#8a6620");
    c.fillStyle=tg; c.font="900 150px serif"; c.fillText("VIKING", W/2, H*0.58); c.fillText("RAID", W/2, H*0.66);
    c.fillStyle="#9a9484"; c.font="italic 38px sans-serif"; c.fillText("Plunder. Level. Set sail for new lands.", W/2, H*0.73);
    const bw=520, bx=(W-bw)/2, by=H*0.8, bh=110;
    const bg=c.createLinearGradient(0,by,0,by+bh); bg.addColorStop(0,"#ffd870"); bg.addColorStop(1,"#caa24a"); c.fillStyle=bg; roundRect(c,bx,by,bw,bh,60); c.fill();
    c.fillStyle="#1a1206"; c.font="bold 44px serif"; c.textBaseline="middle"; c.fillText("⚔  TAP TO BEGIN", W/2, by+bh/2);
    c.fillStyle="#6f6a5c"; c.font="28px sans-serif"; c.textBaseline="alphabetic"; c.fillText("N E W   E R A   S T U D I O S   L L C", W/2, H*0.93);
  });

  const time = 1.2;

  // ---- RAID (normal, snow, combo) ----
  await shot("02_raid", function (c) {
    const st = makeState({ region: 0, villageIndex: 3 });
    Sys.init(st); const v = G.village; v.hp = v.maxHp * 0.62; v.hitFlash = 0.5;
    G.runtime.combo = 34; G.runtime.comboTimer = 1.4;
    buildWeather(st.region); drawBackground(c, st.region); drawWeather(c, st.region);
    drawTarget(c, v, time); drawCombo(c, G.runtime.combo, G.runtime.comboTimer); drawShip(c, st.shipHp, G.derived.shipMaxHp);
    drawFloaters(c, [ {x:W*0.5,y:H*0.30,t:"2480",c:"#fff",a:0.9,big:false},{x:W*0.42,y:H*0.34,t:"6120!",c:"#ffd54a",a:1,big:true},{x:W*0.6,y:H*0.37,t:"1980",c:"#fff",a:0.8} ]);
    drawChrome(c, st, v);
  });

  // ---- BOSS fight ----
  await shot("03_boss", function (c) {
    const st = makeState({ region: 0, villageIndex: CONFIG.BOSS_INDEX });
    Sys.init(st); const v = G.village; v.hp = v.maxHp * 0.30; v.hitFlash = 0.7;
    G.runtime.bossBanner = 1.35;
    buildWeather(st.region); drawBackground(c, st.region); drawWeather(c, st.region);
    drawTarget(c, v, time); drawBossBanner(c, v, G.runtime.bossBanner); drawShip(c, st.shipHp*0.6, G.derived.shipMaxHp);
    drawFloaters(c, [ {x:W*0.5,y:H*0.34,t:"18,420!",c:"#ffd54a",a:1,big:true},{x:W*0.4,y:H*0.30,t:"7,310",c:"#fff",a:0.85} ]);
    drawChrome(c, st, v);
  });

  // ---- FOREST region (embers, variety) ----
  await shot("04_forest", function (c) {
    const st = makeState({ region: 2, villageIndex: 6, gold: 9480000, level: 31 });
    Sys.init(st); const v = G.village; v.hp = v.maxHp * 0.78;
    G.runtime.combo = 64; G.runtime.comboTimer = 1.0;
    buildWeather(st.region); drawBackground(c, st.region); drawWeather(c, st.region);
    drawTarget(c, v, time); drawCombo(c, G.runtime.combo, G.runtime.comboTimer); drawShip(c, st.shipHp, G.derived.shipMaxHp);
    drawChrome(c, st, v);
  });

  // ---- FORTRESS deep region (storm) ----
  await shot("05_fortress", function (c) {
    const st = makeState({ region: 4, villageIndex: 0, gold: 48200000, level: 44, shards: 38 });
    Sys.init(st); const v = G.village; v.hp = v.maxHp * 0.45;
    buildWeather(st.region); drawBackground(c, st.region); drawWeather(c, st.region);
    // lightning flash
    c.fillStyle="rgba(200,225,255,0.25)"; c.fillRect(0,0,W,H);
    drawTarget(c, v, time); drawShip(c, st.shipHp*0.7, G.derived.shipMaxHp);
    drawChrome(c, st, v);
  });

  console.log("\nWrote screenshots to " + OUT);
}
main().catch(function (e) { console.error(e); process.exit(1); });
