/* ============================================================
   VIKING RAID — render.js
   Canvas renderer: animated scenes, raid target, HP rings,
   damage floaters, particles, screen shake, ability FX.
   Also implements the G.fx API used by systems.js.
   New Era Studios LLC
   ============================================================ */
(function (global) {
  "use strict";

  const Render = (global.Render = {});
  let cv, ctx, W = 0, H = 0, dpr = 1;
  let images = {};
  let imgReady = {};
  let time = 0;
  let mist = [];
  let sparks = [];
  let rings = [];
  let floaters = [];
  let shakeMag = 0;
  let auraState = { berserk: 0, valkyrie: 0, shield: 0 };

  function loadImage(name, src) {
    const im = new Image();
    im.onload = function () { imgReady[name] = true; };
    im.onerror = function () { imgReady[name] = false; };
    im.src = src;
    images[name] = im;
  }

  Render.init = function (canvas) {
    cv = canvas;
    ctx = canvas.getContext("2d");
    loadImage("village", "assets/scene_village.png");
    loadImage("forest", "assets/scene_forest.png");
    loadImage("fortress", "assets/scene_fortress.png");
    loadImage("hero", "assets/hero_chieftain.png");
    loadImage("logo", "assets/logo.png");
    for (let i = 0; i < 26; i++) {
      mist.push({
        x: Math.random(), y: Math.random(), r: 30 + Math.random() * 80,
        s: 0.01 + Math.random() * 0.03, a: 0.04 + Math.random() * 0.08,
      });
    }
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("orientationchange", resize);
  };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = cv.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  Render.resize = resize;

  // ---- FX API (called by systems) ---------------------------------
  function spawnFloater(x, y, text, color, big) {
    if (floaters.length > CONFIG.MAX_FLOATERS) floaters.shift();
    floaters.push({ x: x, y: y, vy: -0.05 - Math.random() * 0.03, vx: (Math.random() - 0.5) * 0.04, life: 1, text: text, color: color, big: !!big });
  }
  function burst(x, y, color, count) {
    if (G.state && G.state.settings.reducedFx) count = Math.min(count, 4);
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = 0.05 + Math.random() * 0.18;
      sparks.push({ x: x, y: y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 0.05, life: 1, color: color, size: 1.5 + Math.random() * 2.5 });
    }
  }
  function ring(x, y, color) {
    rings.push({ x: x, y: y, r: 6, life: 1, color: color });
  }
  function shake(m) { shakeMag = Math.min(18, shakeMag + m); }

  global.G.fx = {
    tapImpact: function (px, py, dmg, crit) {
      const tx = px != null ? px : W / 2;
      const ty = py != null ? py : H * 0.42;
      spawnFloater(tx, ty, formatNum(dmg) + (crit ? "!" : ""), crit ? "#ffd54a" : "#ffffff", crit);
      burst(tx, ty, crit ? "#ffd54a" : "#ffb3a0", crit ? 16 : 7);
      ring(tx, ty, crit ? "rgba(255,213,74,0.9)" : "rgba(255,180,160,0.7)");
      if (crit) shake(6); else shake(2);
    },
    spawnFloater: spawnFloater,
    burst: burst,
    shake: shake,
    abilityAura: function (id) {
      if (id === "berserk") auraState.berserk = 1;
      if (id === "valkyrie") auraState.valkyrie = 1;
      shake(8);
      burst(W / 2, H * 0.42, id === "berserk" ? "#ff5a3c" : "#7fd4ff", 40);
    },
    abilityBurst: function (v) {
      burst(W / 2, H * 0.42, "#ffd54a", 50);
      shake(10);
      spawnFloater(W / 2, H * 0.42, "RAID HORN!", "#ffd54a", true);
    },
    clearBurst: function (boss) {
      const c = boss ? "#ffd54a" : "#9fe8ff";
      for (let i = 0; i < (boss ? 60 : 30); i++) burst(W / 2 + (Math.random() - 0.5) * W * 0.5, H * 0.42 + (Math.random() - 0.5) * 80, c, 1);
      shake(boss ? 14 : 6);
    },
    retreatFx: function () {
      shake(12);
      burst(W / 2, H * 0.8, "#ff5a3c", 30);
    },
  };

  function formatNum(n) {
    n = Math.floor(n);
    if (n < 1000) return "" + n;
    const units = ["K", "M", "B", "T", "aa", "ab", "ac"];
    let u = -1;
    while (n >= 1000 && u < units.length - 1) { n /= 1000; u++; }
    return n.toFixed(n < 10 ? 1 : 0) + units[u];
  }
  Render.formatNum = formatNum;

  // ---- Main frame --------------------------------------------------
  Render.frame = function (dtMs) {
    const dt = Math.min(0.05, dtMs / 1000);
    time += dt;
    if (!ctx) return;
    const s = G.state;
    const v = G.village;
    const reduced = s && s.settings.reducedFx;

    // decay shake
    const sx = (Math.random() - 0.5) * shakeMag;
    const sy = (Math.random() - 0.5) * shakeMag;
    shakeMag *= CONFIG.SCREEN_SHAKE_DECAY;
    if (shakeMag < 0.2) shakeMag = 0;

    ctx.save();
    ctx.translate(sx, sy);

    drawBackground();
    drawMist(dt, reduced);
    drawTarget(v, dt);
    drawShip(dt);
    drawAuras(dt);

    // particles
    updateSparks(dt);
    drawSparks();
    updateRings(dt);
    drawRings();

    // floaters
    updateFloaters(dt);
    drawFloaters();

    ctx.restore();

    // aura decay (for visual lerp)
    if (s) {
      auraState.berserk *= 0.96;
      auraState.valkyrie *= 0.96;
      if (s.abilities.shield.activeLeft > 0) auraState.shield = Math.min(1, auraState.shield + dt * 4);
      else auraState.shield *= 0.9;
    }
  };

  function regionArtName(region) {
    const art = DATA.regionArt(region).art;
    return art; // scene_village/forest/fortress
  }
  function artImage(region) {
    const a = regionArtName(region);
    if (a === "scene_forest") return images.forest;
    if (a === "scene_fortress") return images.fortress;
    return images.village;
  }

  function drawBackground() {
    const v = G.village;
    const tint = DATA.regionArt(v.region).tint || "#10131f";
    // base gradient fallback
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, tint);
    g.addColorStop(1, "#05070c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const im = artImage(v.region);
    if (im && imgReady[im === images.village ? "village" : im === images.forest ? "forest" : "fortress"]) {
      // cover-fit with subtle bob
      const bob = Math.sin(time * 0.6) * 4;
      const iw = im.naturalWidth, ih = im.naturalHeight;
      const scale = Math.max(W / iw, H / ih);
      const dw = iw * scale, dh = ih * scale;
      ctx.globalAlpha = 0.92;
      ctx.drawImage(im, (W - dw) / 2, (H - dh) / 2 + bob, dw, dh);
      ctx.globalAlpha = 1;
    }

    // readability gradient
    const top = ctx.createLinearGradient(0, 0, 0, H * 0.3);
    top.addColorStop(0, "rgba(5,7,12,0.75)");
    top.addColorStop(1, "rgba(5,7,12,0)");
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, W, H * 0.3);

    const bot = ctx.createLinearGradient(0, H * 0.55, 0, H);
    bot.addColorStop(0, "rgba(5,7,12,0)");
    bot.addColorStop(1, "rgba(5,7,12,0.9)");
    ctx.fillStyle = bot;
    ctx.fillRect(0, H * 0.55, W, H * 0.45);
  }

  function drawMist(dt, reduced) {
    const n = reduced ? 8 : mist.length;
    ctx.save();
    for (let i = 0; i < n; i++) {
      const m = mist[i];
      m.x += m.s * dt * 6;
      if (m.x > 1.2) m.x = -0.2;
      ctx.globalAlpha = m.a;
      ctx.fillStyle = "#cfe0ee";
      ctx.beginPath();
      ctx.arc(m.x * W, H * 0.5 + m.y * H * 0.5, m.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function hpColor(frac) {
    if (frac > 0.5) return "#5fd17a";
    if (frac > 0.25) return "#e0c14a";
    return "#e0533d";
  }

  function drawTarget(v, dt) {
    if (!v) return;
    const cx = W / 2;
    const cy = H * 0.42;
    const baseR = Math.min(W, H) * (v.isBoss ? 0.26 : 0.2);
    // wobble decay
    v.wobble *= 0.86;
    v.hitFlash *= 0.86;
    const pulse = 1 + Math.sin(time * 2.2) * 0.02 + v.wobble * 0.12;
    const R = baseR * pulse;

    // outer glow
    const glow = ctx.createRadialGradient(cx, cy, R * 0.4, cx, cy, R * 1.8);
    const gc = v.isBoss ? "rgba(255,90,60," : "rgba(120,180,255,";
    glow.addColorStop(0, gc + (0.35 + v.hitFlash * 0.4) + ")");
    glow.addColorStop(1, gc + "0)");
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(cx, cy, R * 1.8, 0, Math.PI * 2); ctx.fill();

    // emblem disc
    ctx.save();
    ctx.translate(cx, cy);
    const squash = 1 - v.wobble * 0.08;
    ctx.scale(pulse, pulse * squash);
    // disc
    const dg = ctx.createRadialGradient(0, -R * 0.3, R * 0.2, 0, 0, R);
    dg.addColorStop(0, "#2a2118");
    dg.addColorStop(1, "#120d09");
    ctx.fillStyle = dg;
    ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
    // hit flash overlay
    if (v.hitFlash > 0.02) {
      ctx.fillStyle = "rgba(255,240,200," + (v.hitFlash * 0.6) + ")";
      ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
    }
    // runic border
    ctx.lineWidth = R * 0.06;
    ctx.strokeStyle = v.isBoss ? "#ff6a4a" : "#caa24a";
    ctx.beginPath(); ctx.arc(0, 0, R * 0.92, 0, Math.PI * 2); ctx.stroke();
    // inner ring
    ctx.lineWidth = R * 0.02;
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.beginPath(); ctx.arc(0, 0, R * 0.74, 0, Math.PI * 2); ctx.stroke();

    // glyph (rotating rune marks)
    ctx.save();
    ctx.rotate(time * 0.3);
    ctx.strokeStyle = "rgba(202,162,74,0.5)";
    ctx.lineWidth = R * 0.03;
    const marks = v.isBoss ? 8 : 6;
    for (let i = 0; i < marks; i++) {
      const a = (i / marks) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * R * 0.82, Math.sin(a) * R * 0.82);
      ctx.lineTo(Math.cos(a) * R * 0.92, Math.sin(a) * R * 0.92);
      ctx.stroke();
    }
    ctx.restore();

    // center icon
    ctx.font = "" + Math.floor(R * 0.7) + "px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(v.isBoss ? "☠" : "⚔", 0, R * 0.04);
    ctx.restore();

    // HP ring arc around emblem
    const frac = Math.max(0, v.hp / v.maxHp);
    ctx.lineWidth = Math.max(6, R * 0.12);
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.beginPath(); ctx.arc(cx, cy, R * 1.18, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = hpColor(frac);
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.18, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
    ctx.stroke();

    // name plate
    ctx.textAlign = "center";
    ctx.fillStyle = v.isBoss ? "#ff8a6a" : "#ffe9c7";
    ctx.font = "bold " + Math.max(13, Math.floor(W * 0.045)) + "px 'Cinzel', serif";
    ctx.fillText(v.name, cx, cy - R * 1.55);
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "" + Math.max(10, Math.floor(W * 0.03)) + "px sans-serif";
    ctx.fillText(
      (v.isBoss ? "BOSS LAIR · " : "") + formatNum(Math.max(0, v.hp)) + " / " + formatNum(v.maxHp),
      cx, cy + R * 1.55
    );
  }

  function drawShip(dt) {
    const s = G.state;
    const d = G.derived;
    if (!s || !d) return;
    // ship hp bar
    const frac = Math.max(0, s.shipHp / d.shipMaxHp);
    const bw = W * 0.78, bh = 16, bx = (W - bw) / 2, by = H - 34;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    roundRect(bx - 2, by - 2, bw + 4, bh + 4, 8); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    roundRect(bx, by, bw, bh, 6); ctx.fill();
    ctx.fillStyle = hpColor(frac);
    roundRect(bx, by, bw * frac, bh, 6); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("LONGSHIP  " + Math.ceil(s.shipHp) + " / " + Math.ceil(d.shipMaxHp), W / 2, by + bh / 2);

    // shield wall indicator
    if (s.abilities.shield.activeLeft > 0) {
      ctx.strokeStyle = "rgba(120,210,255," + (0.5 + Math.sin(time * 8) * 0.2) + ")";
      ctx.lineWidth = 3;
      roundRect(bx - 6, by - 6, bw + 12, bh + 12, 10);
      ctx.stroke();
    }
  }

  function drawAuras(dt) {
    // berserk red vignette
    if (auraState.berserk > 0.02) {
      const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.75);
      g.addColorStop(0, "rgba(255,60,30,0)");
      g.addColorStop(1, "rgba(255,40,20," + (0.4 * auraState.berserk) + ")");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    if (auraState.valkyrie > 0.02) {
      const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.75);
      g.addColorStop(0, "rgba(120,210,255,0)");
      g.addColorStop(1, "rgba(80,170,255," + (0.4 * auraState.valkyrie) + ")");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
  }

  function updateSparks(dt) {
    const reduced = G.state && G.state.settings.reducedFx;
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.004;
      p.life -= dt * (reduced ? 3 : 1.6);
      if (p.life <= 0) sparks.splice(i, 1);
    }
  }
  function drawSparks() {
    for (let i = 0; i < sparks.length; i++) {
      const p = sparks[i];
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function updateRings(dt) {
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i];
      r.r += dt * 260; r.life -= dt * 2.2;
      if (r.life <= 0) rings.splice(i, 1);
    }
  }
  function drawRings() {
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      ctx.globalAlpha = Math.max(0, r.life);
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 3 * r.life;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  function updateFloaters(dt) {
    for (let i = floaters.length - 1; i >= 0; i--) {
      const f = floaters[i];
      f.x += f.vx; f.y += f.vy;
      f.life -= dt / (CONFIG.FLOATER_LIFE_MS / 1000);
      if (f.life <= 0) floaters.splice(i, 1);
    }
  }
  function drawFloaters() {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = 0; i < floaters.length; i++) {
      const f = floaters[i];
      const a = Math.max(0, f.life);
      ctx.globalAlpha = a;
      const size = f.big ? 26 : 18;
      ctx.font = "bold " + size + "px sans-serif";
      ctx.fillStyle = "rgba(0,0,0," + (0.5 * a) + ")";
      ctx.fillText(f.text, f.x + 1, f.y + 1);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }

  function roundRect(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
})(typeof window !== "undefined" ? window : this);
