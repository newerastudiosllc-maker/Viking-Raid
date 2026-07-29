/* ============================================================
   VIKING RAID — audio.js
   Procedural sound effects via WebAudio (no asset files).
   New Era Studios LLC
   ============================================================ */
(function (global) {
  "use strict";

  const SFX = (global.SFX = {});
  let ctx = null;
  let master = null;
  let lastTap = 0;
  let enabled = true;

  function ac() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    } catch (e) { ctx = null; }
    return ctx;
  }

  SFX.setEnabled = function (on) { enabled = on; };
  SFX.resume = function () { const c = ac(); if (c && c.state === "suspended") c.resume(); };

  function tone(freq, dur, type, vol, slideTo) {
    if (!enabled) return;
    const c = ac();
    if (!c) return;
    const t = c.currentTime;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(master);
    osc.start(t); osc.stop(t + dur + 0.02);
  }
  function noise(dur, vol, filterFreq) {
    if (!enabled) return;
    const c = ac();
    if (!c) return;
    const t = c.currentTime;
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = c.createBufferSource(); src.buffer = buf;
    const filt = c.createBiquadFilter(); filt.type = "lowpass"; filt.frequency.value = filterFreq || 1200;
    const g = c.createGain(); g.gain.value = vol || 0.2;
    src.connect(filt); filt.connect(g); g.connect(master);
    src.start(t);
  }

  SFX.tap = function (crit) {
    const now = performance.now();
    if (now - lastTap < 28) return;
    lastTap = now;
    if (crit) { tone(880, 0.12, "triangle", 0.18, 1500); }
    else { tone(220 + Math.random() * 60, 0.05, "square", 0.08, 140); }
  };
  SFX.crew = function () { tone(140, 0.04, "sawtooth", 0.05, 90); };
  SFX.clear = function () {
    tone(523, 0.12, "triangle", 0.2);
    setTimeout(function () { tone(784, 0.16, "triangle", 0.2); }, 90);
  };
  SFX.boss = function () {
    noise(0.3, 0.25, 800);
    tone(110, 0.4, "sawtooth", 0.25, 60);
    setTimeout(function () { tone(880, 0.25, "triangle", 0.22, 1320); }, 160);
  };
  SFX.level = function () {
    [523, 659, 784, 1046].forEach(function (f, i) {
      setTimeout(function () { tone(f, 0.16, "triangle", 0.18); }, i * 70);
    });
  };
  SFX.ability = function () { tone(330, 0.25, "sawtooth", 0.2, 990); noise(0.2, 0.12, 1600); };
  SFX.retreat = function () { tone(200, 0.4, "sawtooth", 0.22, 70); noise(0.3, 0.15, 500); };
  SFX.upgrade = function () { tone(660, 0.08, "square", 0.12, 990); };
  SFX.error = function () { tone(160, 0.12, "square", 0.12, 120); };
  SFX.prestige = function () {
    [392, 523, 659, 784, 1046, 1318].forEach(function (f, i) {
      setTimeout(function () { tone(f, 0.3, "triangle", 0.2); }, i * 90);
    });
  };
})(typeof window !== "undefined" ? window : this);
