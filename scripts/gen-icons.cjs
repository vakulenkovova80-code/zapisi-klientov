#!/usr/bin/env node
// gen-icons.js — generates heart PWA icons (no external dependencies, pure Node.js)
'use strict';

const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');

/* ── CRC32 ──────────────────────────────────────────────────── */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function u32(n) {
  return Buffer.from([(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff]);
}

function pngChunk(type, data) {
  const tb = Buffer.from(type, 'ascii');
  return Buffer.concat([u32(data.length), tb, data, u32(crc32(Buffer.concat([tb, data])))]);
}

/* ── PNG encoder ────────────────────────────────────────────── */
function makePNG(size, rgb) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR: width, height, bit-depth=8, color-type=2 (RGB), compression=0, filter=0, interlace=0
  const ihdr = Buffer.concat([u32(size), u32(size), Buffer.from([8, 2, 0, 0, 0])]);

  // Raw image data: filter-byte(0) + RGB per row
  const stride = 1 + size * 3;
  const raw = Buffer.alloc(size * stride, 0);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0; // filter: None
    rgb.copy(raw, y * stride + 1, y * size * 3, (y + 1) * size * 3);
  }

  const idat = zlib.deflateSync(raw, { level: 6 });

  return Buffer.concat([sig, pngChunk('IHDR', ihdr), pngChunk('IDAT', idat), pngChunk('IEND', Buffer.alloc(0))]);
}

/* ── Pixel generator ────────────────────────────────────────── */
function generatePixels(size) {
  const rgb = Buffer.alloc(size * size * 3);

  // Gradient: #f7b9cd (top) → #e0789c (bottom)
  const [tr, tg, tb] = [0xf7, 0xb9, 0xcd];
  const [br, bg, bb] = [0xe0, 0x78, 0x9c];

  // Heart fitting: heart spans ~x∈[-1.15, 1.15] → 2.3 units wide ≈ 55% of icon
  const scale   = (size * 0.55) / 2.3;   // pixels per unit
  const yOffset = 0.05;                   // slight upward visual correction

  for (let py = 0; py < size; py++) {
    const t = py / (size - 1);
    const bgR = Math.round(tr + (br - tr) * t);
    const bgG = Math.round(tg + (bg - tg) * t);
    const bgB = Math.round(tb + (bb - tb) * t);

    for (let px = 0; px < size; px++) {
      const nx = (px - size / 2) / scale;
      const ny = -(py - size / 2) / scale + yOffset;

      // Inside heart: (x² + y² − 1)³ − x²·y³ ≤ 0
      const x2 = nx * nx, y2 = ny * ny;
      const v  = (x2 + y2 - 1) ** 3 - x2 * (ny * y2);   // ny*y2 = y³

      const i = (py * size + px) * 3;
      if (v <= 0) {
        // White heart
        rgb[i] = 255; rgb[i + 1] = 255; rgb[i + 2] = 255;
      } else {
        // Background gradient
        rgb[i] = bgR; rgb[i + 1] = bgG; rgb[i + 2] = bgB;
      }
    }
  }

  return rgb;
}

/* ── Main ───────────────────────────────────────────────────── */
const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons');

const ICONS = [
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
];

for (const { size, name } of ICONS) {
  const pixels = generatePixels(size);
  const png    = makePNG(size, pixels);
  fs.writeFileSync(path.join(ICONS_DIR, name), png);
  console.log(`generated ${name} (${size}x${size}, ${png.length} bytes)`);
}
