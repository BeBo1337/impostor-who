// Generates the PNG app icons in /public from simple shapes, with no dependencies.
// Run: node scripts/make-icons.mjs
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'public');
mkdirSync(outDir, { recursive: true });

const INK = [0x17, 0x13, 0x2e];
const CREAM = [0xff, 0xf4, 0xdd];
const PAPER = [0xff, 0xfb, 0xf1];
const VIOLET = [0x62, 0x36, 0xe8];
const LIME = [0xd7, 0xff, 0x3c];

const crcTable = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});

function crc32(buf) {
  let c = -1;
  for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Tiny painter with anti-aliasing via 4x4 supersampling per pixel. */
function paint(size, shapes, background) {
  const rgba = Buffer.alloc(size * size * 4);
  const ss = 4;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < ss; sy += 1) {
        for (let sx = 0; sx < ss; sx += 1) {
          const px = (x + (sx + 0.5) / ss) / size;
          const py = (y + (sy + 0.5) / ss) / size;
          let color = background;
          for (const shape of shapes) {
            if (shape.test(px, py)) color = shape.color;
          }
          if (color) {
            r += color[0];
            g += color[1];
            b += color[2];
            a += 255;
          }
        }
      }
      const n = ss * ss;
      const i = (y * size + x) * 4;
      if (a > 0) {
        rgba[i] = Math.round(r / (a / 255));
        rgba[i + 1] = Math.round(g / (a / 255));
        rgba[i + 2] = Math.round(b / (a / 255));
      }
      rgba[i + 3] = Math.round(a / n);
    }
  }
  return rgba;
}

// Shape helpers in unit coordinates (0..1).
const roundedRect = (x, y, w, h, radius, color) => ({
  color,
  test(px, py) {
    const cx = Math.min(Math.max(px, x + radius), x + w - radius);
    const cy = Math.min(Math.max(py, y + radius), y + h - radius);
    return (px - cx) ** 2 + (py - cy) ** 2 <= radius ** 2;
  },
});
const ellipse = (cx, cy, rx, ry, color) => ({
  color,
  test: (px, py) => ((px - cx) / rx) ** 2 + ((py - cy) / ry) ** 2 <= 1,
});
const halfPlaneAbove = (cx, cy, rx, ry, lidY, color) => ({
  color,
  test: (px, py) => py < lidY && ((px - cx) / rx) ** 2 + ((py - cy) / ry) ** 2 <= 1,
});
const thickArc = (cx, cy, r, from, to, width, color) => ({
  color,
  test(px, py) {
    const d = Math.hypot(px - cx, py - cy);
    if (Math.abs(d - r) > width / 2) return false;
    const ang = Math.atan2(py - cy, px - cx);
    return ang >= from && ang <= to;
  },
});

function eyes(offsetY = 0) {
  const L = [0.345, 0.415 + offsetY];
  const R = [0.655, 0.415 + offsetY];
  const shapes = [];
  for (const [cx, cy] of [L, R]) {
    shapes.push(ellipse(cx, cy, 0.175, 0.15, INK));
    shapes.push(ellipse(cx, cy, 0.152, 0.127, PAPER));
    shapes.push(halfPlaneAbove(cx, cy, 0.152, 0.127, cy - 0.055, INK));
    shapes.push(ellipse(cx + 0.02, cy + 0.03, 0.055, 0.055, INK));
    shapes.push(ellipse(cx + 0.04, cy + 0.008, 0.016, 0.016, PAPER));
  }
  // Brows: one raised (right), one flatter (left).
  shapes.push(thickArc(0.345, 0.48 + offsetY, 0.245, -2.35, -0.9, 0.038, INK));
  shapes.push(thickArc(0.655, 0.42 + offsetY, 0.245, -2.3, -0.85, 0.038, INK));
  return shapes;
}

function iconShapes({ maskable }) {
  const pad = maskable ? 0.1 : 0;
  const card = roundedRect(0.125 + pad * 0.6, 0.57 - pad * 0.15, 0.75 - pad * 1.2, 0.36 - pad * 0.2, 0.09, VIOLET);
  const cardEdge = roundedRect(0.11 + pad * 0.6, 0.555 - pad * 0.15, 0.78 - pad * 1.2, 0.39 - pad * 0.2, 0.1, CREAM);
  const dot = ellipse(0.5, 0.78 - pad * 0.2, 0.05, 0.05, LIME);
  return [...eyes(maskable ? 0.03 : 0), cardEdge, card, dot];
}

function render(size, { maskable = false, transparent = false } = {}) {
  const background = transparent ? null : INK;
  const shapes = [];
  if (transparent) shapes.push(roundedRect(0, 0, 1, 1, 0.22, INK));
  shapes.push(...iconShapes({ maskable }));
  return encodePng(size, size, paint(size, shapes, background));
}

writeFileSync(join(outDir, 'icon-192.png'), render(192, { transparent: true }));
writeFileSync(join(outDir, 'icon-512.png'), render(512, { transparent: true }));
writeFileSync(join(outDir, 'icon-512-maskable.png'), render(512, { maskable: true }));
writeFileSync(join(outDir, 'apple-touch-icon.png'), render(180));
console.log('icons written to', outDir);
