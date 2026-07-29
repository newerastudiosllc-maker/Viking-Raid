/* scripts/process-icons.js
   Turns raw AI icon art (assets/icons/raw/) into game-ready UI icons:
   - Ability medallions (ab_*)  → 256×256 with circular alpha mask
   - Tab glyphs (tab_*)         → 128×128 with the dark backplate keyed out
                                  (luminance→alpha, tinted gold) so they sit
                                  cleanly on any tab-bar background
   Output: assets/icons/*.png
   Run: node scripts/process-icons.js   (needs: npm i @napi-rs/canvas) */
const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("@napi-rs/canvas");

const RAW = path.resolve(__dirname, "..", "assets", "icons", "raw");
const OUT = path.resolve(__dirname, "..", "assets", "icons");

function save(cv, file) {
  fs.writeFileSync(path.join(OUT, file), cv.toBuffer("image/png"));
  console.log("wrote assets/icons/" + file, cv.width + "x" + cv.height);
}

async function circleIcon(name, size) {
  const im = await loadImage(path.join(RAW, name + ".png"));
  const cv = createCanvas(size, size), c = cv.getContext("2d");
  c.beginPath(); c.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2); c.clip();
  const sc = Math.max(size / im.width, size / im.height);
  // raw medallions have a small margin — zoom slightly so the ring meets the clip
  const z = 1.06, dw = im.width * sc * z, dh = im.height * sc * z;
  c.drawImage(im, (size - dw) / 2, (size - dh) / 2, dw, dh);
  save(cv, name + ".png");
}

async function glyphIcon(name, size) {
  const im = await loadImage(path.join(RAW, name + ".png"));
  // sample at 2x then downscale for smoother edges
  const S = size * 2;
  const tmp = createCanvas(S, S), t = tmp.getContext("2d");
  // crop 10% inward — trims any rounded-corner artifacts on the raw plate
  const crop = 0.10, sx = im.width * crop, sy = im.height * crop;
  t.drawImage(im, sx, sy, im.width - sx * 2, im.height - sy * 2, 0, 0, S, S);
  const id = t.getImageData(0, 0, S, S), d = id.data;
  // sample the backplate at edge midpoints (corners may be rounded/white)
  const lumAt = (x, y) => { const i = (y * S + x) * 4; return 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; };
  const m = Math.floor(S * 0.08), h = Math.floor(S / 2);
  const bg = Math.min(lumAt(h, m), lumAt(h, S - m), lumAt(m, h), lumAt(S - m, h));
  const lo = bg + 14, hi = bg + 70;
  for (let i = 0; i < d.length; i += 4) {
    const lum = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    let a = (lum - lo) / (hi - lo);
    a = a < 0 ? 0 : a > 1 ? 1 : a;
    d[i + 3] = Math.round(a * 255);
  }
  t.putImageData(id, 0, 0);
  const cv = createCanvas(size, size), c = cv.getContext("2d");
  c.imageSmoothingQuality = "high";
  c.drawImage(tmp, 0, 0, size, size);
  save(cv, name + ".png");
}

async function main() {
  for (const n of ["ab_berserk", "ab_shield", "ab_horn", "ab_valkyrie", "ab_ragnarok", "unit_berserker", "unit_archer", "unit_shieldmaiden"]) await circleIcon(n, 256);
  for (const n of ["tab_raid", "tab_forge", "tab_hero", "tab_loot", "tab_saga"]) await glyphIcon(n, 128);
  console.log("\nAll UI icons processed.");
}
main().catch((e) => { console.error(e); process.exit(1); });
