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

function rmrf(p) {
  if (!fs.existsSync(p)) return;
  fs.rmSync(p, { recursive: true, force: true });
}
function copy(src, dest) {
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
