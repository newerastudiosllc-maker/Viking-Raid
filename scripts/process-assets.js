/* scripts/process-assets.js
   Normalizes raw art into store/packaging-ready assets:
   - assets/icon-1024.png            (1024x1024 app icon, already square — validated)
   - assets/icon-512.png / icon-192.png  (PWA manifest icons)
   - assets/icon-foreground.png      (1024x1024, emblem scaled into adaptive-icon safe zone)
   - assets/icon-background.png      (1024x1024 edge-to-edge layer)
   - assets/splash-2732.png          (2732x2732 for @capacitor/assets)
   - screenshots/feature_graphic.png (1024x500 Play Store feature graphic, cover-cropped)
   Run: node scripts/process-assets.js   (needs: npm i @napi-rs/canvas) */
const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("@napi-rs/canvas");

const A = (f) => path.resolve(__dirname, "..", "assets", f);
const S = (f) => path.resolve(__dirname, "..", "screenshots", f);

function save(canvas, file) {
  fs.writeFileSync(file, canvas.toBuffer("image/png"));
  console.log("wrote", path.relative(path.resolve(__dirname, ".."), file), canvas.width + "x" + canvas.height);
}

// cover-crop an image onto a w×h canvas
function cover(im, w, h) {
  const cv = createCanvas(w, h), c = cv.getContext("2d");
  const sc = Math.max(w / im.width, h / im.height);
  const dw = im.width * sc, dh = im.height * sc;
  c.drawImage(im, (w - dw) / 2, (h - dh) / 2, dw, dh);
  return cv;
}

// contain image at `frac` of canvas onto a solid background
function contain(im, w, h, frac, bg) {
  const cv = createCanvas(w, h), c = cv.getContext("2d");
  c.fillStyle = bg; c.fillRect(0, 0, w, h);
  const sc = Math.min(w / im.width, h / im.height) * frac;
  const dw = im.width * sc, dh = im.height * sc;
  c.drawImage(im, (w - dw) / 2, (h - dh) / 2, dw, dh);
  return cv;
}

async function main() {
  // 1) Feature graphic: 1024x500 exact
  const fg = await loadImage(A("feature_graphic_art.png"));
  save(cover(fg, 1024, 500), S("feature_graphic.png"));

  // 2) Adaptive icon foreground: emblem must sit inside the 66% safe zone.
  //    Raw art's emblem spans ~82% of the frame → rescale whole layer to 72%
  //    so the emblem lands at ~59% of the canvas (inside safe zone).
  const fore = await loadImage(A("icon-foreground.png"));
  save(contain(fore, 1024, 1024, 0.72, "#0a0e18"), A("icon-foreground.png"));

  // 3) Adaptive icon background: exact 1024 square
  const back = await loadImage(A("icon-background.png"));
  save(cover(back, 1024, 1024), A("icon-background.png"));

  // 4) Splash: 2732x2732 (Capacitor universal splash source)
  const splash = await loadImage(A("splash-2732.png"));
  save(cover(splash, 2732, 2732), A("splash-2732.png"));

  // 5) PWA manifest icons from the master 1024 icon
  const icon = await loadImage(A("icon-1024.png"));
  save(cover(icon, 512, 512), A("icon-512.png"));
  save(cover(icon, 192, 192), A("icon-192.png"));

  console.log("\nAll assets normalized.");
}
main().catch((e) => { console.error(e); process.exit(1); });
