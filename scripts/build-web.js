/* Builds the offline web bundle into ./www for Capacitor packaging.
   Copies the game shell + assets (excludes dev/test/tooling files).
   Run: npm run build:web   (then: npx cap sync) */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "www");

const INCLUDE = [
  "index.html",
  "style.css",
  "manifest.webmanifest",
  "sw.js",
  "assets",
  "js",
];

// Packaging-only art (icon/splash sources for @capacitor/assets, store art).
// Not referenced at runtime — keep them out of the shipped web bundle.
const EXCLUDE = new Set([
  "assets/splash.png",
  "assets/splash-dark.png",
  "assets/splash-2732.png",
  "assets/icon-only.png",
  "assets/icon-foreground.png",
  "assets/icon-background.png",
  "assets/icon-1024.png",
  "assets/feature_graphic_art.png",
]);
// Raw AI icon sources — processed versions live in assets/icons/*.png
const EXCLUDE_DIRS = new Set(["assets/icons/raw"]);

function rmrf(p) {
  if (!fs.existsSync(p)) return;
  fs.rmSync(p, { recursive: true, force: true });
}
function copy(src, dest) {
  const rel = path.relative(ROOT, src).split(path.sep).join("/");
  if (EXCLUDE.has(rel) || EXCLUDE_DIRS.has(rel)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copy(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

rmrf(OUT);
fs.mkdirSync(OUT, { recursive: true });
let count = 0;
for (const item of INCLUDE) {
  const src = path.join(ROOT, item);
  if (!fs.existsSync(src)) {
    console.warn("  ! missing (skipped): " + item);
    continue;
  }
  copy(src, path.join(OUT, item));
  count++;
}
console.log("✓ Built web bundle → ./www  (" + count + " top-level entries copied)");
console.log("  Next: npx cap sync android  →  npx cap open android");
