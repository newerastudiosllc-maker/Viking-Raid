/* scripts/screenshot.js
   Renders TRUE screenshots of Viking Raid by re-painting the real game frame
   (real assets, real config/formulas, real data) onto @napi-rs/canvas.
   Output: screenshots/*.png  (mobile portrait, store-listing quality)
   Run: node scripts/screenshot.js   (after: npm i @napi-rs/canvas) */
const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("@napi-rs/canvas");

global.window = global;
global.navigator = {};
const vm = require("vm");
function load(f) { vm.runInThisContext(fs.readFileSync(f, "utf8"), { filename: f }); }
["js/config.js", "js/data.js", "js/state.js", "js/systems.js"].forEach(load);
const { CONFIG, DATA, F, Sys, G } = global;

const W = 1080, H = 2340;
const OUT = path.resolve(__dirname, "..", "screenshots");
fs.mkdirSync(OUT, { recursive: true });

const IMG = {};
async function loadIm(name, file) { IMG[name] = await loadImage(path.resolve(__dirname, "..", "assets", file)); }

function fmt(n) { n = Math.floor(n); if (n < 1000) return "" + n; const u = ["K","M","B","T","aa","ab"]; let i=-1; while(n>=1000&&i<u.length-1){n/=1000;i++;} return n.toFixed(n<10?1:0)+u[i]; }
function hpColor(f) { return f > 0.5 ? "#5fd17a" : f > 0.25 ? "#e0c14a" : "#e0533d"; }
function roundRect(c, x, y, w, h, r) { r = Math.min(r, w/2, h/2); c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function sceneImg(region, isBoss) { if (isBoss && IMG.scene_bosslair) return IMG.scene_bosslair; const a = DATA.regionArt(region).art; return IMG[a] || IMG.scene_village; }

function drawBackground(c, region, isBoss) {
  const tint = DATA.regionArt(region).tint || "#10131f";
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, tint); g.addColorStop(1, "#05070c");
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  const im = sceneImg(region, isBoss);
  if (im) { const sc = Math.max(W / im.width, H / im.height), dw = im.width * sc, dh = im.height * sc; c.globalAlpha = 0.94; c.drawImage(im, (W - dw) / 2, (H - dh) / 2, dw, dh); c.globalAlpha = 1; }
  const top = c.createLinearGradient(0, 0, 0, H * 0.30); top.addColorStop(0, "rgba(5,7,12,0.78)"); top.addColorStop(1, "rgba(5,7,12,0)"); c.fillStyle = top; c.fillRect(0, 0, W, H * 0.30);
  const bot = c.createLinearGradient(0, H * 0.52, 0, H); bot.addColorStop(0, "rgba(5,7,12,0)"); bot.addColorStop(1, "rgba(5,7,12,0.93)"); c.fillStyle = bot; c.fillRect(0, H * 0.52, W, H * 0.48);
}

let wparts = [];
function buildWeather(region) { const cfg = DATA.weatherFor(region); wparts = []; if (!cfg || cfg.count <= 0) return; const n = Math.min(cfg.count, 120); for (let i=0;i<n;i++) wparts.push({x:Math.random(),y:Math.random(),v:0.4+Math.random()*0.8,s:1+Math.random()*1.5}); }
function drawWeather(c, region) {
  const cfg = DATA.weatherFor(region); if (!cfg || cfg.count <= 0) return;
  c.save(); c.strokeStyle = cfg.color; c.fillStyle = cfg.color; c.lineWidth = 3;
  for (const p of wparts) { const x=p.x*W, y=p.y*H; if (cfg.len>0){c.globalAlpha=0.5;c.beginPath();c.moveTo(x,y);c.lineTo(x-cfg.wind*cfg.len*2.2,y+cfg.len*2.2);c.stroke();} else {c.globalAlpha=(cfg.glow?0.8:0.5)*p.s;c.beginPath();c.arc(x,y,(cfg.glow?3.4:2.4)*p.s,0,Math.PI*2);c.fill();} }
  c.globalAlpha = 1; c.restore();
}

function drawCracks(c, cx, cy, R, frac) {
  if (frac > 0.66) return;
  c.save(); c.translate(cx, cy); c.strokeStyle = "rgba(0,0,0,0.55)"; c.lineWidth = Math.max(2, R*0.02);
  const n = frac < 0.25 ? 5 : frac < 0.5 ? 3 : 1;
  for (let i=0;i<n;i++){ const a=(i/n)*Math.PI*2+0.3; c.beginPath(); c.moveTo(0,0); for(let s=1;s<=3;s++){const rr=R*0.92*(s/3),aa=a+Math.sin(i*7+s*3)*0.3; c.lineTo(Math.cos(aa)*rr,Math.sin(aa)*rr);} c.stroke(); }
  c.restore();
}

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
  c.textAlign="center"; c.textBaseline="alphabetic"; c.fillStyle=v.isBoss?"#ff8a6a":"#ffe9c7";
  c.font="bold "+Math.max(34,Math.floor(W*0.05))+"px serif"; c.fillText(v.name, cx, cy - R*1.62);
  if (v.isBoss) {
    if (v.stagger>0) { c.fillStyle="rgba(120,210,255,"+(0.7+Math.sin(time*10)*0.3)+")"; c.font="bold "+Math.max(24,Math.floor(W*0.034))+"px sans-serif"; c.fillText("STAGGERED — BURST NOW!", cx, cy - R*1.62 - 44); }
    else if (v.fury) { c.fillStyle="rgba(255,70,40,"+(0.7+Math.sin(time*10)*0.3)+")"; c.font="bold "+Math.max(24,Math.floor(W*0.034))+"px sans-serif"; c.fillText("ENRAGED — defenses furious!", cx, cy - R*1.62 - 44); }
  }
  c.fillStyle="rgba(255,255,255,0.65)"; c.font=Math.max(24,Math.floor(W*0.032))+"px sans-serif";
  c.fillText((v.isBoss?"BOSS LAIR · ":"")+fmt(Math.max(0,v.hp))+" / "+fmt(v.maxHp), cx, cy + R*1.62);
  if (v.mod && v.mod.id && v.mod.id!=="none") {
    const my=cy+R*1.62+46; c.font=Math.max(24,Math.floor(W*0.032))+"px sans-serif";
    const label=v.mod.icon+" "+v.mod.name, tw=c.measureText(label).width+48;
    c.fillStyle="rgba(0,0,0,0.55)"; roundRect(c,cx-tw/2,my-24,tw,48,24); c.fill();
    c.fillStyle=v.fury?"#ff8a6a":"#ffd870"; c.textBaseline="middle"; c.fillText(label,cx,my); c.textBaseline="alphabetic";
  }
}

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

function drawCombo(c, combo, comboTimer) {
  if (combo < 2) return;
  const mult = Math.min(CONFIG.COMBO_MULT_CAP, 1+combo*CONFIG.COMBO_MULT_PER_HIT);
  const cx=W/2, cy=H*0.42+Math.min(W,H)*0.32, heat=Math.min(1,combo/100);
  c.save(); c.textAlign="center"; c.textBaseline="middle";
  c.font="bold "+(38+heat*22)+"px sans-serif"; c.fillStyle=heat>0.6?"#ff5a3c":"#ffd54a";
  c.fillText(combo+" HITS  ·  "+mult.toFixed(2)+"x", cx, cy);
  const bw=300, bf=Math.max(0, comboTimer/(CONFIG.COMBO_WINDOW_MS/1000));
  c.fillStyle="rgba(255,255,255,0.15)"; c.fillRect(cx-bw/2,cy+34,bw,10);
  c.fillStyle=heat>0.6?"#ff5a3c":"#ffd54a"; c.fillRect(cx-bw/2,cy+34,bw*bf,10); c.restore();
}

function drawShip(c, shipHp, shipMax) {
  const frac=Math.max(0,shipHp/shipMax), bw=W*0.78, bh=36, bx=(W-bw)/2, by=H-300;
  c.fillStyle="rgba(0,0,0,0.5)"; roundRect(c,bx-4,by-4,bw+8,bh+8,16); c.fill();
  c.fillStyle="rgba(255,255,255,0.08)"; roundRect(c,bx,by,bw,bh,12); c.fill();
  c.fillStyle=hpColor(frac); roundRect(c,bx,by,bw*frac,bh,12); c.fill();
  c.fillStyle="#fff"; c.font="bold 26px sans-serif"; c.textAlign="center"; c.textBaseline="middle";
  c.fillText("LONGSHIP  "+Math.ceil(shipHp)+" / "+Math.ceil(shipMax), W/2, by+bh/2);
}

function drawChrome(c, st, v) {
  c.textBaseline="middle";
  c.textAlign="left"; c.fillStyle="#ffd870"; c.font="bold 38px serif"; c.fillText(DATA.regionName(st.region), 40, 60);
  c.fillStyle="#9a9484"; c.font="26px sans-serif"; c.fillText("Village "+(st.villageIndex+1)+"/"+CONFIG.VILLAGES_PER_REGION+(v&&v.isBoss?" · BOSS":"")+(v&&v.mod&&v.mod.id!=="none"?" · "+v.mod.icon+" "+v.mod.name:""), 40, 104);
  c.textAlign="center";
  const lx=W-70; c.fillStyle="#caa24a"; roundRect(c, lx-70, 34, 100, 52, 16); c.fill();
  c.fillStyle="#1a1206"; c.font="bold 28px serif"; c.fillText("LVL "+st.level, lx-20, 61);
  const need=F.xpForLevel(st.level), xw=W-260, xx=130, xy=110, xh=14;
  c.fillStyle="rgba(255,255,255,0.1)"; roundRect(c,xx,xy,xw,xh,8); c.fill();
  c.fillStyle="#56b4e6"; roundRect(c,xx,xy,xw*Math.min(1,st.xp/need),xh,8); c.fill();
  c.font="bold 34px sans-serif"; c.textAlign="left"; c.fillStyle="#ffd870"; c.fillText("GOLD "+fmt(st.gold), 40, 168);
  c.textAlign="center"; c.fillStyle="#ece7d8"; c.font="bold 24px sans-serif"; c.fillText("TAP "+fmt(G.derived.tapDmg)+"    CREW "+fmt(G.derived.crewDps)+"/s", W/2, 168);
  c.textAlign="right"; c.fillStyle="#b9e6ff"; c.font="bold 34px sans-serif"; c.fillText("SAGA "+fmt(st.saga.shards), W-40, 168);
  const abs=["ab_berserk","ab_shield","ab_horn","ab_valkyrie"]; const aw=110, gap=26; const total=abs.length*aw+(abs.length-1)*gap; let ax=(W-total)/2; const ay=H-360;
  abs.forEach((key)=>{ const im=IMG[key]; c.save(); c.beginPath(); c.arc(ax+aw/2, ay+aw/2, aw/2, 0, Math.PI*2); c.clip(); if(im) c.drawImage(im, ax, ay, aw, aw); else { c.fillStyle="#1b2230"; c.fillRect(ax,ay,aw,aw); } c.restore(); c.lineWidth=4; c.strokeStyle="#3a4356"; c.beginPath(); c.arc(ax+aw/2,ay+aw/2,aw/2,0,Math.PI*2); c.stroke(); ax+=aw+gap; });
  // Ragnarok button (5th, gold)
  const rage=st._shotRage!=null?st._shotRage:0;
  c.save(); c.beginPath(); c.arc(ax+aw/2, ay+aw/2, aw/2, 0, Math.PI*2); c.clip();
  if(IMG.ab_ragnarok) c.drawImage(IMG.ab_ragnarok, ax, ay, aw, aw); else { c.fillStyle="#3a1a12"; c.fillRect(ax,ay,aw,aw); }
  c.restore();
  c.lineWidth=5; c.strokeStyle = rage>=1?"#ffd870":"#8a4a2a"; c.beginPath(); c.arc(ax+aw/2,ay+aw/2,aw/2,0,Math.PI*2); c.stroke();
  c.textBaseline="alphabetic";
  // rage meter
  const rbw=640, rbx=(W-rbw)/2, rby=H-215, rbh=18, ready=rage>=1;
  c.fillStyle="rgba(0,0,0,0.5)"; roundRect(c,rbx-4,rby-4,rbw+8,rbh+8,11); c.fill();
  c.fillStyle="rgba(255,255,255,0.1)"; roundRect(c,rbx,rby,rbw,rbh,9); c.fill();
  const rg=c.createLinearGradient(rbx,0,rbx+rbw,0); rg.addColorStop(0,"#ff5a3c"); rg.addColorStop(1,"#ffd870");
  c.fillStyle=rg; roundRect(c,rbx,rby,rbw*Math.min(1,rage),rbh,9); c.fill();
  c.fillStyle=ready?"#ffd870":"#fff"; c.font="bold 26px sans-serif"; c.textAlign="center"; c.textBaseline="middle";
  c.fillText(ready?"RAGNAROK READY — TAP":"RAGE "+Math.floor(rage*100)+"%", W/2, rby+rbh/2); c.textBaseline="alphabetic";
  // tabs
  const th=150; c.fillStyle="#10141e"; c.fillRect(0, H-th, W, th); c.fillStyle="#caa24a"; c.fillRect(0, H-th, W, 5);
  const tabs=[["tab_raid","Raid",true],["tab_forge","Forge",false],["tab_hero","Hero",false],["tab_loot","Loot",false],["tab_saga","Saga",false]]; const tw=W/tabs.length;
  tabs.forEach((t,i)=>{ const cx2=i*tw+tw/2; const im=IMG[t[0]]; const isz=56;
    if(im){ c.save(); if(!t[2]){c.globalAlpha=0.5;} c.drawImage(im, cx2-isz/2, H-th+24, isz, isz); c.restore(); }
    c.textAlign="center"; c.textBaseline="middle"; c.font="bold 24px sans-serif"; c.fillStyle=t[2]?"#ffd870":"#8c8674"; c.fillText(t[1], cx2, H-th+112);
    if(t[2]){c.fillStyle="#ffd870"; c.fillRect(cx2-30, H-th, 60, 6);} });
}

function drawFloaters(c, list) {
  c.textAlign="center"; c.textBaseline="middle";
  list.forEach(f=>{ c.globalAlpha=f.a; c.font="bold "+(f.big?60:42)+"px sans-serif"; c.fillStyle="rgba(0,0,0,"+(0.5*f.a)+")"; c.fillText(f.t,f.x+2,f.y+2); c.fillStyle=f.c; c.fillText(f.t,f.x,f.y); });
  c.globalAlpha=1;
}

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
  st._shotRage = opts.rage != null ? opts.rage : 0.4;
  return st;
}

async function shot(name, drawFn) {
  const cv = createCanvas(W, H); const c = cv.getContext("2d"); drawFn(c);
  fs.writeFileSync(path.join(OUT, name + ".png"), await cv.encode("png"));
  console.log("  + " + name + ".png");
}

async function main() {
  await loadIm("scene_village", "scene_village.png");
  await loadIm("scene_forest", "scene_forest.png");
  await loadIm("scene_fortress", "scene_fortress.png");
  await loadIm("scene_frozen_shore", "scene_frozen_shore.png");
  await loadIm("scene_fjords", "scene_fjords.png");
  await loadIm("scene_marches", "scene_marches.png");
  await loadIm("scene_cliffs", "scene_cliffs.png");
  await loadIm("scene_bosslair", "scene_bosslair.png");
  await loadIm("hero", "hero_chieftain.png");
  await loadIm("logo", "logo.png");
  for (const n of ["ab_berserk","ab_shield","ab_horn","ab_valkyrie","ab_ragnarok","tab_raid","tab_forge","tab_hero","tab_loot","tab_saga","unit_berserker","unit_archer","unit_shieldmaiden","route_calm","route_storm","route_cursed"]) {
    IMG[n] = await loadImage(path.resolve(__dirname, "..", "assets", "icons", n + ".png"));
  }
  IMG.map_chart = await loadImage(path.resolve(__dirname, "..", "assets", "map_chart.png"));
  const time = 1.2;

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
    c.fillStyle="#1a1206"; c.font="bold 44px serif"; c.textBaseline="middle"; c.fillText("TAP TO BEGIN", W/2, by+bh/2);
    c.fillStyle="#6f6a5c"; c.font="28px sans-serif"; c.textBaseline="alphabetic"; c.fillText("N E W   E R A   S T U D I O S   L L C", W/2, H*0.93);
  });

  await shot("02_raid", function (c) {
    const st = makeState({ region: 0, villageIndex: 3, rage: 0.42 });
    Sys.init(st); const v = G.village; v.hp = v.maxHp * 0.62; v.hitFlash = 0.5;
    G.runtime.combo = 34; G.runtime.comboTimer = 1.4;
    buildWeather(st.region); drawBackground(c, st.region); drawWeather(c, st.region);
    drawTarget(c, v, time); drawCombo(c, G.runtime.combo, G.runtime.comboTimer); drawShip(c, st.shipHp, G.derived.shipMaxHp);
    drawFloaters(c, [ {x:W*0.5,y:H*0.30,t:"2480",c:"#fff",a:0.9},{x:W*0.42,y:H*0.34,t:"6120!",c:"#ffd54a",a:1,big:true},{x:W*0.6,y:H*0.37,t:"1980",c:"#fff",a:0.8} ]);
    drawChrome(c, st, v);
  });

  await shot("03_boss", function (c) {
    const st = makeState({ region: 0, villageIndex: CONFIG.BOSS_INDEX, rage: 0.6 });
    Sys.init(st); const v = G.village; v.hp = v.maxHp * 0.30; v.hitFlash = 0.7; v.staggered = true; v.fury = true;
    G.runtime.bossBanner = 1.35;
    buildWeather(st.region); drawBackground(c, st.region, true); drawWeather(c, st.region);
    drawTarget(c, v, time); drawBossBanner(c, v, G.runtime.bossBanner); drawShip(c, st.shipHp*0.6, G.derived.shipMaxHp);
    drawFloaters(c, [ {x:W*0.5,y:H*0.34,t:"18,420!",c:"#ffd54a",a:1,big:true},{x:W*0.4,y:H*0.30,t:"7,310",c:"#fff",a:0.85} ]);
    drawChrome(c, st, v);
  });

  await shot("04_forest", function (c) {
    const st = makeState({ region: 2, villageIndex: 6, gold: 9480000, level: 31, rage: 0.85 });
    Sys.init(st); const v = G.village; v.hp = v.maxHp * 0.78;
    G.runtime.combo = 64; G.runtime.comboTimer = 1.0;
    buildWeather(st.region); drawBackground(c, st.region); drawWeather(c, st.region);
    drawTarget(c, v, time); drawCombo(c, G.runtime.combo, G.runtime.comboTimer); drawShip(c, st.shipHp, G.derived.shipMaxHp);
    drawChrome(c, st, v);
  });

  await shot("05_fortress", function (c) {
    const st = makeState({ region: 4, villageIndex: 0, gold: 48200000, level: 44, shards: 38, rage: 0.18 });
    Sys.init(st); const v = G.village; v.hp = v.maxHp * 0.45;
    buildWeather(st.region); drawBackground(c, st.region); drawWeather(c, st.region);
    c.fillStyle="rgba(200,225,255,0.25)"; c.fillRect(0,0,W,H);
    drawTarget(c, v, time); drawShip(c, st.shipHp*0.7, G.derived.shipMaxHp); drawChrome(c, st, v);
  });

  await shot("06_modifier", function (c) {
    const st = makeState({ region: 1, villageIndex: 4, gold: 6200000, level: 27, rage: 1.0 });
    Sys.init(st); const v = G.village; v.mod = DATA.MODIFIER_BY_ID["wealthy"]; v.hp = v.maxHp * 0.55; v.hitFlash = 0.4;
    G.runtime.combo = 48; G.runtime.comboTimer = 1.2;
    buildWeather(st.region); drawBackground(c, st.region); drawWeather(c, st.region);
    drawTarget(c, v, time); drawCombo(c, G.runtime.combo, G.runtime.comboTimer); drawShip(c, st.shipHp, G.derived.shipMaxHp);
    drawFloaters(c, [ {x:W*0.46,y:H*0.33,t:"9,240!",c:"#ffd54a",a:1,big:true} ]);
    drawChrome(c, st, v);
  });

  await shot("07_warband", function (c) {
    const st = makeState({ region: 3, villageIndex: 2, gold: 21500000, level: 36, rage: 0.55 });
    st.units = { berserker: 42, archer: 28, shieldmaiden: 17 };
    Sys.init(st); const v = G.village; v.hp = v.maxHp * 0.7;
    buildWeather(st.region); drawBackground(c, st.region); drawWeather(c, st.region);
    // dark panel like the forge sheet
    const py = H*0.30, ph = H*0.395;
    c.fillStyle = "rgba(8,11,18,0.94)"; roundRect(c, 40, py, W-80, ph, 36); c.fill();
    c.strokeStyle = "#caa24a"; c.lineWidth = 3; roundRect(c, 40, py, W-80, ph, 36); c.stroke();
    c.textAlign="left"; c.fillStyle="#ffd870"; c.font="bold 52px serif"; c.fillText("⚜️ Warband Specialists", 90, py+90);
    c.fillStyle="#9a9484"; c.font="30px sans-serif"; c.fillText("Hire elite units — every recruit makes the raid stronger", 90, py+140);
    const rows = [
      ["unit_berserker","Berserkers","×42","+2% Crew DPS each","48.2K"],
      ["unit_archer","Archers","×28","+2% Tap dmg & Crit each","112K"],
      ["unit_shieldmaiden","Shieldmaidens","×17","-0.8% ship damage taken each","96.4K"],
    ];
    let ry = py + 200;
    rows.forEach((r)=>{
      c.fillStyle="rgba(255,255,255,0.05)"; roundRect(c, 80, ry, W-160, 190, 24); c.fill();
      const im = IMG[r[0]]; const isz = 140;
      if (im) { c.save(); c.beginPath(); c.arc(80+40+isz/2, ry+95, isz/2, 0, Math.PI*2); c.clip(); c.drawImage(im, 120, ry+95-isz/2, isz, isz); c.restore(); }
      c.textAlign="left"; c.fillStyle="#ece7d8"; c.font="bold 40px serif"; c.fillText(r[1]+"  ", 300, ry+75);
      c.fillStyle="#ffd870"; c.font="bold 34px sans-serif"; c.fillText(r[2], 300 + c.measureText(r[1]).width + 60, ry+75);
      c.fillStyle="#9a9484"; c.font="28px sans-serif"; c.fillText(r[3], 300, ry+125);
      const bw=210, bx=W-120-bw;
      c.fillStyle="#2c3446"; roundRect(c, bx, ry+55, bw, 80, 16); c.fill();
      c.strokeStyle="#caa24a"; c.lineWidth=2; roundRect(c, bx, ry+55, bw, 80, 16); c.stroke();
      // drawn coin + price
      c.fillStyle="#ffd870"; c.beginPath(); c.arc(bx+44, ry+95, 17, 0, Math.PI*2); c.fill();
      c.strokeStyle="#8a6620"; c.lineWidth=3; c.beginPath(); c.arc(bx+44, ry+95, 17, 0, Math.PI*2); c.stroke();
      c.textAlign="left"; c.fillStyle="#ffd870"; c.font="bold 30px sans-serif"; c.textBaseline="middle"; c.fillText(r[4], bx+74, ry+95); c.textBaseline="alphabetic";
      ry += 220;
    });
    drawChrome(c, st, v);
  });

  await shot("08_routes", function (c) {
    const st = makeState({ region: 4, villageIndex: 0, gold: 61000000, level: 41, rage: 0.3 });
    Sys.init(st); const v = G.village; v.hp = v.maxHp;
    buildWeather(st.region); drawBackground(c, st.region); drawWeather(c, st.region);
    // dark veil + modal
    c.fillStyle = "rgba(3,5,9,0.62)"; c.fillRect(0, 0, W, H);
    const py = H*0.215, ph = H*0.50;
    c.fillStyle = "rgba(10,13,21,0.97)"; roundRect(c, 60, py, W-120, ph, 36); c.fill();
    c.strokeStyle = "#caa24a"; c.lineWidth = 3; roundRect(c, 60, py, W-120, ph, 36); c.stroke();
    c.textAlign="left"; c.fillStyle="#ffd870"; c.font="bold 54px serif"; c.fillText("Chart Your Course", 110, py+95);
    c.fillStyle="#9a9484"; c.font="30px sans-serif"; c.fillText("A new region lies ahead. Choose your passage —", 110, py+150);
    c.fillText("it shapes every raid in this land.", 110, py+192);
    const rows = [
      ["route_calm","Calm Passage","Safe waters. A steady raid.","The sea is kind today.","#3a4356"],
      ["route_storm","Storm Strait","+40% enemy attack — +65% gold, +30% XP","Fortune favors those who dare the gale.","#4a7ab0"],
      ["route_cursed","Cursed Channel","+60% HP, +25% attack — 2.2x gold & drops","The dead guard the richest shores.","#6a4a9a"],
    ];
    let ry = py + 250;
    rows.forEach((r)=>{
      c.fillStyle="rgba(255,255,255,0.05)"; roundRect(c, 100, ry, W-200, 230, 24); c.fill();
      c.strokeStyle=r[4]; c.lineWidth=3; roundRect(c, 100, ry, W-200, 230, 24); c.stroke();
      const im = IMG[r[0]]; const isz = 150;
      if (im) { c.save(); c.beginPath(); c.arc(140+isz/2, ry+115, isz/2, 0, Math.PI*2); c.clip(); c.drawImage(im, 140, ry+115-isz/2, isz, isz); c.restore(); }
      c.textAlign="left"; c.fillStyle="#ece7d8"; c.font="bold 42px serif"; c.fillText(r[1], 330, ry+80);
      c.fillStyle="#b9b3a4"; c.font="26px sans-serif"; c.fillText(r[2], 330, ry+130);
      c.fillStyle="#caa24a"; c.font="italic 26px serif"; c.fillText(r[3], 330, ry+180);
      ry += 260;
    });
    drawChrome(c, st, v);
  });

  await shot("09_map", function (c) {
    const st = makeState({ region: 2, villageIndex: 5, gold: 12400000, level: 33, rage: 0.5 });
    Sys.init(st); const v = G.village;
    buildWeather(st.region); drawBackground(c, st.region); drawWeather(c, st.region);
    c.fillStyle = "rgba(3,5,9,0.66)"; c.fillRect(0, 0, W, H);
    const px = 60, py = H*0.155, pw = W-120, ph = H*0.62;
    // parchment chart backdrop
    c.save(); roundRect(c, px, py, pw, ph, 36); c.clip();
    if (IMG.map_chart) { const im = IMG.map_chart, sc = Math.max(pw/im.width, ph/im.height); c.globalAlpha=0.9; c.drawImage(im, px+(pw-im.width*sc)/2, py+(ph-im.height*sc)/2, im.width*sc, im.height*sc); c.globalAlpha=1; }
    c.fillStyle = "rgba(8,10,16,0.82)"; c.fillRect(px, py, pw, ph);
    c.restore();
    c.strokeStyle = "#caa24a"; c.lineWidth = 3; roundRect(c, px, py, pw, ph, 36); c.stroke();
    c.textAlign="left"; c.fillStyle="#ffd870"; c.font="bold 52px serif"; c.fillText("Saga Chart", px+50, py+85);
    c.fillStyle="#9a9484"; c.font="30px sans-serif"; c.fillText("Ironwood Forest — 5/10 conquered", px+50, py+135);
    const nodes = [
      ["✓","Wolfmere Village","plundered","#5fd17a",true,false],
      ["✓","Ashby Camp","plundered","#5fd17a",true,false],
      ["✦","Ravenholt Hamlet","Treasure cache — plundered!","#5fd17a",true,false],
      ["✓","Thornwick Village","plundered","#5fd17a",true,false],
      ["✓","Saltfell Camp","plundered","#5fd17a",true,false],
      ["⚔","Bonegard Village","YOU ARE HERE","#ffd870",false,true],
      ["✦","Frostpeak Hamlet","Treasure cache ahead!","#caa24a",false,false],
      ["⚔","Greyness Village","Frenzied — deadlier defenses","#b9b3a4",false,false],
      ["?","Uncharted","Scout closer to reveal","#6f6a5c",false,false],
      ["☠","Jarl Skullsplitter's Lair","Boss Lair","#e0533d",false,false],
    ];
    let ny = py + 185; const rowH = (ph - 200) / nodes.length;
    nodes.forEach((n, i)=>{
      const dx = px+95;
      if (i>0) { c.strokeStyle = nodes[i-1][4] || n[5] ? "#caa24a" : "rgba(255,255,255,0.15)"; c.lineWidth=4; c.beginPath(); c.moveTo(dx, ny-rowH+26+26); c.lineTo(dx, ny+26-26); c.stroke(); }
      c.beginPath(); c.arc(dx, ny+26, 32, 0, Math.PI*2);
      c.fillStyle = n[5] ? "rgba(255,216,112,0.2)" : n[4] ? "rgba(95,209,122,0.15)" : "rgba(255,255,255,0.06)"; c.fill();
      c.lineWidth = n[5] ? 5 : 3; c.strokeStyle = n[3]; c.stroke();
      c.font="30px serif"; c.textAlign="center"; c.textBaseline="middle"; c.fillStyle=n[3]; c.fillText(n[0], dx, ny+27); c.textBaseline="alphabetic";
      c.textAlign="left"; c.fillStyle = n[5] ? "#ffd870" : "#ece7d8"; c.font=(n[5]?"bold ":"")+"33px serif"; c.fillText(n[1], dx+70, ny+18);
      c.fillStyle="#9a9484"; c.font="24px sans-serif"; c.fillText(n[2], dx+70, ny+52);
      ny += rowH;
    });
    drawChrome(c, st, v);
  });

  await shot("10_frenzy", function (c) {
    const st = makeState({ region: 2, villageIndex: 7, gold: 18700000, level: 34, rage: 0.9 });
    Sys.init(st); const v = G.village; v.hp = v.maxHp * 0.35; v.hitFlash = 0.6;
    G.runtime.combo = 52; G.runtime.comboTimer = 1.5;
    buildWeather(st.region); drawBackground(c, st.region); drawWeather(c, st.region);
    // frenzy ember vignette
    const vg = c.createRadialGradient(W/2, H/2, Math.min(W,H)*0.38, W/2, H/2, Math.max(W,H)*0.78);
    vg.addColorStop(0, "rgba(255,90,40,0)"); vg.addColorStop(1, "rgba(255,60,30,0.32)");
    c.fillStyle = vg; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) {
      c.globalAlpha = 0.3 + Math.random()*0.5;
      c.fillStyle = i % 3 ? "#ff9a3c" : "#ffd54a";
      c.beginPath(); c.arc(Math.random()*W, H*0.25 + Math.random()*H*0.7, 2 + Math.random()*4, 0, Math.PI*2); c.fill();
    }
    c.globalAlpha = 1;
    drawTarget(c, v, time); drawCombo(c, G.runtime.combo, G.runtime.comboTimer);
    // frenzy banner
    (function () {
      const bx = W/2, by = H*0.135, label = "PLUNDER FRENZY x5";
      c.font = "bold 44px serif"; c.textAlign="center"; c.textBaseline="middle";
      const tw = c.measureText(label).width + 70;
      c.fillStyle = "rgba(40,8,0,0.78)"; roundRect(c, bx-tw/2, by-40, tw, 80, 40); c.fill();
      c.strokeStyle = "#ffd870"; c.lineWidth = 4; roundRect(c, bx-tw/2, by-40, tw, 80, 40); c.stroke();
      c.fillStyle = "#ffd870"; c.fillText(label, bx, by);
      c.fillStyle = "rgba(255,255,255,0.18)"; c.fillRect(bx-tw/2+40, by+48, tw-80, 8);
      c.fillStyle = "#ffd870"; c.fillRect(bx-tw/2+40, by+48, (tw-80)*0.72, 8);
      c.textBaseline="alphabetic";
    })();
    // legendary drop banner
    (function () {
      const bw = 660, bh = 210, bx = (W-bw)/2, by = H*0.585;
      c.fillStyle = "rgba(10,12,20,0.96)"; roundRect(c, bx, by, bw, bh, 22); c.fill();
      c.strokeStyle = "#e8a23a"; c.lineWidth = 4; roundRect(c, bx, by, bw, bh, 22); c.stroke();
      c.textAlign = "center";
      c.fillStyle = "#e8a23a"; c.font = "900 34px serif"; c.fillText("L E G E N D A R Y   D R O P", W/2, by+62);
      c.fillStyle = "#ece7d8"; c.font = "bold 42px serif"; c.fillText("Runebound Axe of the North", W/2, by+120);
      c.fillStyle = "#9a9484"; c.font = "26px sans-serif"; c.fillText("Weapon · 3 affixes", W/2, by+168);
    })();
    drawFloaters(c, [ {x:W*0.45,y:H*0.30,t:"12,840!",c:"#ffd54a",a:1,big:true},{x:W*0.58,y:H*0.35,t:"4,410",c:"#fff",a:0.85} ]);
    drawChrome(c, st, v);
  });

  await shot("11_valhalla", function (c) {
    const st = makeState({ region: 5, villageIndex: 3, gold: 240000000, level: 52, rage: 0.7 });
    Sys.init(st); const v = G.village;
    buildWeather(st.region); drawBackground(c, st.region); drawWeather(c, st.region);
    c.fillStyle = "rgba(3,5,9,0.7)"; c.fillRect(0, 0, W, H);
    const px = 60, py = H*0.14, pw = W-120, ph = H*0.66;
    c.fillStyle = "rgba(14,10,26,0.97)"; roundRect(c, px, py, pw, ph, 36); c.fill();
    const vgrad = c.createLinearGradient(0, py, 0, py+ph); vgrad.addColorStop(0, "#a88cf0"); vgrad.addColorStop(1, "#5a3fa0");
    c.strokeStyle = vgrad; c.lineWidth = 4; roundRect(c, px, py, pw, ph, 36); c.stroke();
    c.textAlign="center"; c.fillStyle="#d8c8ff"; c.font="bold 58px serif"; c.fillText("⚡ VALHALLA", W/2, py+95);
    c.fillStyle="#9a8cc8"; c.font="30px sans-serif";
    c.fillText("Sacrifice your Saga. Gain powers", W/2, py+150);
    c.fillText("that never reset.", W/2, py+192);
    // marks banner
    c.fillStyle="rgba(138,108,224,0.15)"; roundRect(c, px+60, py+230, pw-120, 100, 20); c.fill();
    c.strokeStyle="#8a6ce0"; c.lineWidth=2; roundRect(c, px+60, py+230, pw-120, 100, 20); c.stroke();
    c.fillStyle="#f0eaff"; c.font="bold 40px serif"; c.fillText("⚡ 7 Marks of Valhalla · Ascension III", W/2, py+292);
    const boons = [
      ["⚡","Odin's Wrath","Rank 3/5","+25% ALL damage per rank. Forever."],
      ["❁","Freyja's Favor","Rank 2/5","+30% gold plundered per rank. Forever."],
      ["◉","Heimdall's Sight","Rank 1/5","+15% Saga Shards on prestige. Forever."],
      ["⚒","Thor's Vigor","Rank 1/3","-10% ship damage taken per rank. Forever."],
    ];
    let by = py + 380;
    boons.forEach((b)=>{
      c.fillStyle="rgba(255,255,255,0.05)"; roundRect(c, px+50, by, pw-100, 170, 22); c.fill();
      c.strokeStyle="#6a4fc0"; c.lineWidth=2; roundRect(c, px+50, by, pw-100, 170, 22); c.stroke();
      c.textAlign="center"; c.font="56px serif"; c.fillStyle="#d8c8ff"; c.fillText(b[0], px+125, by+100);
      c.textAlign="left"; c.fillStyle="#ece7d8"; c.font="bold 38px serif"; c.fillText(b[1], px+200, by+68);
      c.fillStyle="#a88cf0"; c.font="bold 27px sans-serif"; c.fillText(b[2], px+200 + c.measureText(b[1]).width + 340, by+66);
      c.fillStyle="#9a8cc8"; c.font="26px sans-serif"; c.fillText(b[3], px+200, by+120);
      by += 195;
    });
    drawChrome(c, st, v);
  });

  console.log("\nWrote screenshots to " + OUT);
}
main().catch(function (e) { console.error(e); process.exit(1); });
