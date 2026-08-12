/**
 * generate-logo.js
 * Generates MalumeScholarTrack app icons using pngjs
 * Outputs: icon.png (1024), splash-icon.png, adaptive-icon.png, favicon.png (128)
 */
const PNG = require('pngjs').PNG;
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = __dirname + '/../assets';

// SA Brand palette
const SA_GOLD   = [255, 184, 28];
const SA_GREEN  = [0,   119, 73];
const SA_BLUE   = [0,   35,  149];
const SA_RED    = [224, 60,  49];
const WHITE     = [255, 255, 255];
const DARK      = [10,  10,  10];
const BLACK     = [0,   0,   0];

// ---------------------------------------------------------------------------
// Pixel helpers
// ---------------------------------------------------------------------------

function setPixel(img, x, y, color, alpha = 255) {
  if (x < 0 || x >= img.width || y < 0 || y >= img.height) return;
  const idx = (img.width * y + x) << 2;
  img.data[idx]     = color[0];
  img.data[idx + 1] = color[1];
  img.data[idx + 2] = color[2];
  img.data[idx + 3] = alpha;
}

function blendPixel(img, x, y, color, opacity) {
  if (x < 0 || x >= img.width || y < 0 || y >= img.height) return;
  const idx = (img.width * Math.floor(y) + Math.floor(x)) << 2;
  const a = opacity;
  img.data[idx]     = Math.round(img.data[idx]     * (1 - a) + color[0] * a);
  img.data[idx + 1] = Math.round(img.data[idx + 1] * (1 - a) + color[1] * a);
  img.data[idx + 2] = Math.round(img.data[idx + 2] * (1 - a) + color[2] * a);
  img.data[idx + 3] = 255;
}

function fillCircle(img, cx, cy, r, color, alpha = 255) {
  const r2 = r * r;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy <= r2) {
        setPixel(img, Math.round(cx + dx), Math.round(cy + dy), color, alpha);
      }
    }
  }
}

function fillRect(img, x, y, w, h, color, alpha = 255) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      setPixel(img, x + dx, y + dy, color, alpha);
    }
  }
}

function fillTriangle(img, x1, y1, x2, y2, x3, y3, color, alpha = 255) {
  const minX = Math.floor(Math.min(x1, x2, x3));
  const maxX = Math.ceil(Math.max(x1, x2, x3));
  const minY = Math.floor(Math.min(y1, y2, y3));
  const maxY = Math.ceil(Math.max(y1, y2, y3));
  const area = (x2 - x1) * (y3 - y1) - (x3 - x1) * (y2 - y1);
  for (let py = minY; py <= maxY; py++) {
    for (let px = minX; px <= maxX; px++) {
      const w0 = (x2 - px) * (y3 - py) - (x3 - px) * (y2 - py);
      const w1 = (x3 - px) * (y1 - py) - (x1 - px) * (y3 - py);
      const w2 = (x1 - px) * (y2 - py) - (x2 - px) * (y1 - py);
      const inside = area > 0
        ? w0 >= 0 && w1 >= 0 && w2 >= 0
        : w0 <= 0 && w1 <= 0 && w2 <= 0;
      if (inside) setPixel(img, px, py, color, alpha);
    }
  }
}

function drawLine(img, x0, y0, x1, y1, color, alpha = 255, thickness = 1) {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let cx = x0;
  let cy = y0;
  const t = Math.floor(thickness / 2);
  while (true) {
    for (let ty = -t; ty <= t; ty++) {
      for (let tx = -t; tx <= t; tx++) {
        setPixel(img, cx + tx, cy + ty, color, alpha);
      }
    }
    if (cx === x1 && cy === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; cx += sx; }
    if (e2 < dx)  { err += dx; cy += sy; }
  }
}

function drawGlow(img, cx, cy, radius, color, intensity = 0.15) {
  const r = Math.round(radius);
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= r) {
        blendPixel(img, cx + dx, cy + dy, color, intensity * (1 - dist / r));
      }
    }
  }
}

function lerp(a, b, t) {
  return Math.round(a * (1 - t) + b * t);
}
function lerpColor(c1, c2, t) {
  return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
}

// ---------------------------------------------------------------------------
// Logo drawing functions
// ---------------------------------------------------------------------------

function drawSARays(img, cx, cy, outerR, innerR, rayCount, color, opacity) {
  const step = (Math.PI * 2) / rayCount;
  for (let i = 0; i < rayCount; i++) {
    const angle = i * step;
    const x1 = cx + Math.cos(angle) * outerR;
    const y1 = cy + Math.sin(angle) * outerR;
    const x2 = cx + Math.cos(angle) * innerR;
    const y2 = cy + Math.sin(angle) * innerR;
    drawLine(img, Math.round(x1), Math.round(y1), Math.round(x2), Math.round(y2), color, Math.round(opacity * 255), 2);
  }
}

/**
 * Draw a bus silhouette centered at cx, cy
 * Scale factor s multiplies all dimensions (s = size/1024)
 */
function drawBus(img, cx, cy, s) {
  const body = SA_GOLD;
  const window_ = WHITE;
  const windowAlpha = 220;
  const darkWindowAlpha = 160;
  const wheel = DARK;
  const wheelRim = SA_GOLD;

  // Body
  fillRect(img, Math.round(cx - 70*s), Math.round(cy - 30*s), Math.round(140*s), Math.round(50*s), body);
  // Roof
  fillRect(img, Math.round(cx - 66*s), Math.round(cy - 44*s), Math.round(132*s), Math.round(16*s), body);
  // Front cap
  fillRect(img, Math.round(cx + 52*s), Math.round(cy - 22*s), Math.round(22*s), Math.round(34*s), body);

  // Windows — left group
  fillRect(img, Math.round(cx - 64*s), Math.round(cy - 26*s), Math.round(26*s), Math.round(22*s), window_, windowAlpha);
  fillRect(img, Math.round(cx - 33*s), Math.round(cy - 26*s), Math.round(26*s), Math.round(22*s), window_, windowAlpha);
  fillRect(img, Math.round(cx - 2*s),  Math.round(cy - 26*s), Math.round(26*s), Math.round(22*s), window_, windowAlpha);
  // Driver window
  fillRect(img, Math.round(cx + 34*s), Math.round(cy - 22*s), Math.round(22*s), Math.round(18*s), window_, darkWindowAlpha);

  // Door slit
  fillRect(img, Math.round(cx + 27*s), Math.round(cy - 4*s), Math.round(5*s), Math.round(28*s), DARK, 80);

  // Safety stripe
  for (let dx = -68; dx < 70; dx += 9) {
    setPixel(img, Math.round(cx + dx*s), Math.round(cy + 18*s), SA_GREEN, 200);
    setPixel(img, Math.round(cx + dx*s), Math.round(cy + 20*s), SA_GREEN, 200);
  }

  // Wheels
  const wr = Math.round(15*s);
  fillCircle(img, Math.round(cx + 46*s), Math.round(cy + 22*s), wr, wheel);
  fillCircle(img, Math.round(cx + 46*s), Math.round(cy + 22*s), Math.round(7*s), wheelRim);
  fillCircle(img, Math.round(cx - 42*s), Math.round(cy + 22*s), wr, wheel);
  fillCircle(img, Math.round(cx - 42*s), Math.round(cy + 22*s), Math.round(7*s), wheelRim);

  // Headlights
  fillRect(img, Math.round(cx + 68*s), Math.round(cy + 2*s),  Math.round(7*s), Math.round(9*s), SA_GOLD, 245);
  fillRect(img, Math.round(cx + 68*s), Math.round(cy - 13*s), Math.round(7*s), Math.round(9*s), SA_GOLD, 245);
}

/**
 * Draw shield shape — layered gradient from SA_BLUE (top) to darker blue
 */
function drawShield(img, cx, cy, scale) {
  const s = scale;
  const w = Math.round(130*s);
  const h = Math.round(155*s);
  const topY = Math.round(cy - h/2);

  // Outer shield filled with gradient
  for (let row = 0; row < h; row++) {
    const t = row / h;
    let halfW;
    if (row < h * 0.68) {
      // Taper from narrow top to wide
      halfW = w/2 * (0.28 + 0.72 * (row / (h * 0.68)));
    } else {
      // Rounded bottom
      const bt = (row - h * 0.68) / (h * 0.32);
      halfW = w/2 * (0.28 + 0.72 * (1 - Math.pow(bt, 0.55)));
    }
    // Layered color: outer SA_BLUE, inner darker
    const outerCol = lerpColor(SA_BLUE, [0, 15, 80], t);
    const innerCol = lerpColor([0, 20, 100], [0, 8, 50], t);

    // Draw outer row
    for (let px = Math.round(cx - halfW); px <= Math.round(cx + halfW); px++) {
      const distFromEdge = Math.min(px - (cx - halfW), (cx + halfW) - px);
      if (distFromEdge < 4*s) {
        blendPixel(img, px, topY + row, SA_GOLD, 0.4 * (1 - distFromEdge / (4*s)));
      } else {
        blendPixel(img, px, topY + row, outerCol, 0.9);
      }
    }
  }

  // Gold border lines
  for (let row = 0; row < h * 0.7; row++) {
    const t = row / (h * 0.7);
    let halfW = w/2 * (0.28 + 0.72 * (row / (h * 0.7)));
    // Left border
    blendPixel(img, Math.round(cx - halfW), topY + row, SA_GOLD, 0.7);
    // Right border
    blendPixel(img, Math.round(cx + halfW), topY + row, SA_GOLD, 0.7);
  }

  // Inner shield overlay (slightly darker)
  const iw = Math.round(w * 0.78);
  const ih = Math.round(h * 0.78);
  const itlX = Math.round(cx - iw/2);
  const itlY = Math.round(cy - ih/2);
  for (let row = 0; row < ih; row++) {
    const t = row / ih;
    let halfW;
    if (row < ih * 0.68) {
      halfW = iw/2 * (0.28 + 0.72 * (row / (ih * 0.68)));
    } else {
      const bt = (row - ih * 0.68) / (ih * 0.32);
      halfW = iw/2 * (0.28 + 0.72 * (1 - Math.pow(bt, 0.55)));
    }
    const col = lerpColor([0, 20, 100], [0, 8, 50], t);
    for (let px = Math.round(cx - halfW); px <= Math.round(cx + halfW); px++) {
      setPixel(img, px, itlY + row, col, 140);
    }
  }

  // Gold ring inside shield
  const ringR = Math.round(105*s);
  for (let angle = 0; angle < Math.PI * 2; angle += 0.04) {
    const rx = cx + Math.cos(angle) * ringR;
    const ry = cy + Math.sin(angle) * ringR;
    blendPixel(img, Math.round(rx), Math.round(ry), SA_GOLD, 0.5);
  }
}

/**
 * Draw dot-letter text: "ST" monogram
 */
function drawMonogram(img, cx, cy, color, s) {
  const dotR = Math.round(2.5*s);
  const gap = Math.round(6*s);
  const dotY = cy;

  function drawChar(offsets, startX) {
    offsets.forEach(([dx, dy]) => {
      fillCircle(img, Math.round(startX + dx * gap), Math.round(dotY + dy * gap), dotR, color);
    });
  }

  // 'S' — 8 dots
  drawChar([
    [0,0],[1,0],[2,0],[3,0],  // top
    [0,1],[0,2],              // left
    [1,2],[2,2],[3,2],       // mid
    [3,3],[3,4],             // right
    [0,4],[1,4],[2,4],[3,4], // bottom
  ], cx - Math.round(14*s));

  // 'T' — 7 dots
  drawChar([
    [0,0],[1,0],[2,0],[3,0], // top
    [1.5,1],[1.5,2],[1.5,3],[1.5,4], // stem
  ], cx + Math.round(4*s));
}

// ---------------------------------------------------------------------------
// Main logo composition
// ---------------------------------------------------------------------------
function createLogo(size) {
  const img = new PNG({ width: size, height: size });
  // Transparent fill
  for (let i = 0; i < img.data.length; i += 4) {
    img.data[i] = 0;     // R
    img.data[i+1] = 0;   // G
    img.data[i+2] = 0;   // B
    img.data[i+3] = 0;   // A = transparent
  }

  const cx = size / 2;
  const cy = size / 2;
  const s = size / 1024; // scale factor

  // Background glows
  drawGlow(img, Math.round(cx), Math.round(cy - 20*s), Math.round(420*s), SA_GOLD, 0.07);
  drawGlow(img, Math.round(cx + 130*s), Math.round(cy + 100*s), Math.round(220*s), SA_BLUE, 0.06);
  drawGlow(img, Math.round(cx - 110*s), Math.round(cy - 90*s), Math.round(160*s), SA_GREEN, 0.05);

  // SA rays
  drawSARays(img, Math.round(cx), Math.round(cy - 20*s), Math.round(410*s), Math.round(320*s), 12, SA_GOLD, 0.1);

  // Shield
  drawShield(img, cx, cy - 30*s, s);

  // Bus in shield
  drawBus(img, cx, cy - 30*s, s * 0.58);

  // Gold gradient bar below shield
  const barW = Math.round(300*s);
  const barH = Math.round(4*s);
  const barX = Math.round(cx - barW/2);
  const barY = Math.round(cy + Math.round(145*s));
  for (let bx = 0; bx < barW; bx++) {
    const t = bx / barW;
    const col = lerpColor(SA_GOLD, SA_GREEN, t);
    fillRect(img, barX + bx, barY, 1, barH, col, 200);
  }

  // ST monogram
  drawMonogram(img, cx, barY + Math.round(20*s), SA_GOLD, s);

  // Small "SCHOLARTRACK" text as dot letters below monogram
  const labelY = barY + Math.round(50*s);
  const labelScale = s * 0.7;
  const letterGap = Math.round(5 * labelScale);
  const letterH = 3;

  // Simplified: just draw a gradient underline bar instead of full text
  const labelBarW = Math.round(360*s);
  const labelBarH = Math.round(2*s);
  const labelBarX = Math.round(cx - labelBarW/2);
  for (let bx = 0; bx < labelBarW; bx++) {
    const t = bx / labelBarW;
    const col = lerpColor(SA_BLUE, SA_GREEN, t);
    setPixel(img, labelBarX + bx, labelY, col, 100);
  }

  return img;
}

// ---------------------------------------------------------------------------
// Generate & save
// ---------------------------------------------------------------------------
async function writePNG(img, outPath) {
  return new Promise((resolve, reject) => {
    const out = fs.createWriteStream(outPath);
    out.on('finish', resolve);
    out.on('error', reject);
    img.pack().pipe(out);
  });
}

async function main() {
  console.log('Generating MalumeScholarTrack logos...\n');

  const sizes = [
    { name: 'icon.png',           size: 1024 },
    { name: 'splash-icon.png',   size: 1024 },
    { name: 'adaptive-icon.png', size: 1024 },
    { name: 'favicon.png',       size: 128  },
  ];

  for (const { name, size } of sizes) {
    const img = createLogo(size);
    const outPath = path.join(OUTPUT_DIR, name);
    await writePNG(img, outPath);
    console.log(`  ${name.padEnd(22)} ${size}×${size}`);
  }

  console.log('\nAll logos saved to', OUTPUT_DIR);
}

main().catch(console.error);
