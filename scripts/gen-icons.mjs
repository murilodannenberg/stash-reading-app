// Generates Android launcher icons (legacy + adaptive) from the Stash page logo.
// Run: node scripts/gen-icons.mjs   (requires @resvg/resvg-js, installed --no-save)
import { Resvg } from '@resvg/resvg-js';
import { writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RES = join(ROOT, 'android', 'app', 'src', 'main', 'res');

const AMBAR = '#C97B4B';
const PAPEL = '#FAF8F5';
const TINTA = '#1C1917';
const CINZA = '#9B9189';
const BORDER = '#E5DFD7';

// The page mark, authored in a 108×108 square viewBox, centered with generous
// padding so it sits comfortably inside the adaptive-icon safe zone (and the
// launcher mask) without crowding the edges.
function pageMark() {
  return `
    <path d="M36,31 L63,31 L72,40 L72,77 L36,77 Z" fill="${PAPEL}" stroke="${BORDER}" stroke-width="1"/>
    <path d="M63,31 L72,40 L63,40 Z" fill="${TINTA}" opacity="0.92"/>
    <line x1="43" y1="45" x2="65" y2="45" stroke="${AMBAR}" stroke-width="2.8" stroke-linecap="round"/>
    <line x1="43" y1="54" x2="65" y2="54" stroke="${CINZA}" stroke-width="2" stroke-linecap="round"/>
    <line x1="43" y1="62" x2="65" y2="62" stroke="${CINZA}" stroke-width="2" stroke-linecap="round"/>
    <line x1="43" y1="70" x2="57" y2="70" stroke="${CINZA}" stroke-width="2" stroke-linecap="round"/>
  `;
}

const svgForeground = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108">${pageMark()}</svg>`;

const svgLegacySquare = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108">
  <rect width="108" height="108" rx="18" fill="${AMBAR}"/>
  ${pageMark()}
</svg>`;

const svgLegacyRound = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108">
  <circle cx="54" cy="54" r="54" fill="${AMBAR}"/>
  ${pageMark()}
</svg>`;

function render(svg, size) {
  const r = new Resvg(svg, { fitTo: { mode: 'width', value: size } });
  return r.render().asPng();
}

// density -> legacy px (48dp base), adaptive px (108dp base)
const DENSITIES = {
  mdpi:    { legacy: 48,  adaptive: 108 },
  hdpi:    { legacy: 72,  adaptive: 162 },
  xhdpi:   { legacy: 96,  adaptive: 216 },
  xxhdpi:  { legacy: 144, adaptive: 324 },
  xxxhdpi: { legacy: 192, adaptive: 432 },
};

for (const [d, { legacy, adaptive }] of Object.entries(DENSITIES)) {
  const dir = join(RES, `mipmap-${d}`);
  mkdirSync(dir, { recursive: true });

  // Remove old Expo webp icons (can't coexist with .png of the same name)
  for (const name of ['ic_launcher.webp', 'ic_launcher_round.webp']) {
    const p = join(dir, name);
    if (existsSync(p)) rmSync(p);
  }

  writeFileSync(join(dir, 'ic_launcher.png'), render(svgLegacySquare, legacy));
  writeFileSync(join(dir, 'ic_launcher_round.png'), render(svgLegacyRound, legacy));
  writeFileSync(join(dir, 'ic_launcher_foreground.png'), render(svgForeground, adaptive));
  console.log(`mipmap-${d}: legacy ${legacy}px, foreground ${adaptive}px`);
}

// Adaptive icon descriptors (API 26+)
const anydpi = join(RES, 'mipmap-anydpi-v26');
mkdirSync(anydpi, { recursive: true });
const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_bg"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`;
writeFileSync(join(anydpi, 'ic_launcher.xml'), adaptiveXml);
writeFileSync(join(anydpi, 'ic_launcher_round.xml'), adaptiveXml);
console.log('mipmap-anydpi-v26: ic_launcher.xml + ic_launcher_round.xml');

// Store-facing assets referenced by app.json (kept in sync with the launcher icon).
const assets = join(ROOT, 'assets');
mkdirSync(assets, { recursive: true });
const svgLegacyFlat = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108">
  <rect width="108" height="108" fill="${AMBAR}"/>
  ${pageMark()}
</svg>`;
writeFileSync(join(assets, 'icon.png'), render(svgLegacyFlat, 1024));
writeFileSync(join(assets, 'adaptive-icon.png'), render(svgForeground, 1024));
writeFileSync(join(assets, 'splash.png'), render(svgLegacyFlat, 1024));
console.log('assets: icon.png, adaptive-icon.png, splash.png (1024px)');

console.log('Done.');
