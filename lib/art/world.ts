// Scenery art. Backgrounds are baked once into wide canvases and drawn as
// parallax layers; props are individual sprites the scene y-sorts against the
// player. Everything is drawn at native resolution — one canvas pixel is one
// game pixel, at one pixel density across the whole scene, which is what keeps
// sprites and scenery looking like they belong to the same drawing.
//
// Scale reference: the player is 26px tall, so 1px ≈ 6.7cm. Every prop below is
// sized off that (a 2.4m stand is 36px of structure on 26px legs, a 5m tree is
// ~75px) — getting this wrong is what made the old scene read as toy-like.

import { dither, rect, seeded, surface } from "./pixel";

export const VIEW_W = 320;
export const VIEW_H = 240;
export const WORLD_W = 760;
/** Ground plane starts here; everything above is sky. */
export const HORIZON = 140;

const INK = "#3a2718";

// ── Sky ──────────────────────────────────────────────────────────────────────

export function buildSky() {
  const { canvas, ctx } = surface(VIEW_W, HORIZON + 12);
  const bands = [
    "#5aa7d6", "#71b8de", "#8ac9e4", "#a5d8e8",
    "#c2e4e6", "#ddeade", "#f2e9c8", "#ffd9a0",
  ];
  const h = canvas.height;
  const step = h / bands.length;
  for (let i = 0; i < bands.length; i++) {
    const y = Math.floor(i * step);
    const next = Math.floor((i + 1) * step);
    rect(ctx, 0, y, VIEW_W, next - y, bands[i]);
    // Dither the seam so gradient bands read as texture, not as stripes.
    if (i < bands.length - 1) dither(ctx, 0, next - 3, VIEW_W, 3, bands[i], bands[i + 1], 0.5);
  }

  // Sun, low and to the left for late-afternoon light.
  const sx = 64, sy = 40;
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = "#fff2c0";
  for (let r = 20; r >= 13; r -= 3) disc(ctx, sx, sy, r);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#fff6d8";
  disc(ctx, sx, sy, 9);
  ctx.fillStyle = "#ffffff";
  disc(ctx, sx - 1, sy - 2, 5);

  return canvas;
}

function disc(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  for (let dy = -r; dy <= r; dy++) {
    const span = Math.floor(Math.sqrt(Math.max(0, r * r - dy * dy)));
    ctx.fillRect(Math.round(cx - span), Math.round(cy + dy), span * 2 + 1, 1);
  }
}

// ── Clouds ───────────────────────────────────────────────────────────────────

export function buildClouds() {
  const { canvas, ctx } = surface(520, 70);
  const rnd = seeded(7);
  for (let i = 0; i < 7; i++) {
    cloud(ctx, Math.floor(rnd() * 460) + 10, Math.floor(rnd() * 40) + 6, 0.5 + rnd() * 0.4);
  }
  return canvas;
}

function cloud(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  const puffs: [number, number, number][] = [
    [0, 8, 7], [9, 4, 10], [22, 6, 8], [32, 10, 6], [15, 11, 9],
  ];
  for (const [dx, dy, r] of puffs) {
    ctx.fillStyle = "#ffffff";
    disc(ctx, x + dx * s, y + dy * s, Math.max(2, r * s));
  }
  // Warm underside, so clouds catch the low sun instead of floating flat.
  for (const [dx, dy, r] of puffs) {
    ctx.fillStyle = "#e6d8e2";
    disc(ctx, x + dx * s, y + (dy + r * 0.6) * s, Math.max(1, r * 0.5 * s));
  }
}

// ── Far hills + town silhouette ──────────────────────────────────────────────

export function buildHills() {
  const { canvas, ctx } = surface(520, 70);
  const { width: w, height: h } = canvas;
  // No town silhouette: at this distance the rooftops competed with the
  // treeline and read as smokestacks. Three clean ridges say "somewhere else
  // exists" without the clutter.
  ridge(ctx, w, h, 44, 15, 0.018, "#a3c8b4", 3);
  ridge(ctx, w, h, 24, 11, 0.027, "#84b398", 11);
  ridge(ctx, w, h, 10, 7, 0.041, "#6da483", 23);
  return canvas;
}

function ridge(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  base: number, amp: number, freq: number, color: string, phase: number,
) {
  for (let x = 0; x < w; x++) {
    const top = h - base - Math.round(
      Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 2.7) * amp * 0.3,
    );
    rect(ctx, x, top, 1, h - top, color);
    rect(ctx, x, top, 1, 2, lighten(color, 20));
  }
}

// ── Mid treeline ─────────────────────────────────────────────────────────────

export function buildTreeline() {
  const { canvas, ctx } = surface(640, 76);
  const rnd = seeded(43);
  const h = canvas.height;
  rect(ctx, 0, h - 9, canvas.width, 9, "#4c8a48");
  for (let x = -8; x < canvas.width; x += 12 + Math.floor(rnd() * 10)) {
    bgTree(ctx, x, h - 8, 18 + Math.floor(rnd() * 22), rnd);
  }
  return canvas;
}

function bgTree(ctx: CanvasRenderingContext2D, x: number, y: number, height: number, rnd: () => number) {
  rect(ctx, x - 1, y - height * 0.42, 2, height * 0.42, "#5d4326");
  const greens = ["#579b4d", "#4a8c44", "#3f7c3b"];
  const tone = greens[Math.floor(rnd() * greens.length)];
  const r = height * 0.32;
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i === 0 ? lighten(tone, 14) : tone;
    disc(ctx, x + (i - 1) * r * 0.55, y - height * 0.5 - i * r * 0.42, Math.max(2, r * (1 - i * 0.16)));
  }
}

// ── Ground ───────────────────────────────────────────────────────────────────

const GRASS = ["#7cbf58", "#72b34f", "#68a747"];
const DIRT = ["#c9a978", "#bd9a68", "#b08d5e"];
/** Where the path runs, measured up from the bottom of the ground canvas. */
const PATH_UP = 34;

export function buildGround() {
  const h = VIEW_H - HORIZON + 14;
  const { canvas, ctx } = surface(WORLD_W, h);
  const rnd = seeded(101);

  // Aerial perspective: grass is pale at the horizon and saturates toward the
  // camera, which is what sells the ground as receding rather than as a wall.
  for (let y = 0; y < h; y++) {
    const base = GRASS[Math.min(GRASS.length - 1, Math.floor((y / h) * 3))];
    rect(ctx, 0, y, WORLD_W, 1, y < 5 ? lighten(base, 16) : base);
  }
  for (let i = 0; i < 2600; i++) {
    rect(ctx, Math.floor(rnd() * WORLD_W), Math.floor(rnd() * h), 1, 1,
      rnd() > 0.5 ? lighten(GRASS[1], 8) : darken(GRASS[1], 7));
  }

  // Beaten path, widened in front of the stand so the interaction spot reads as
  // a destination rather than as an arbitrary patch of grass.
  const cy = h - PATH_UP;
  for (let x = 0; x < WORLD_W; x++) {
    const wobble = Math.sin(x * 0.024) * 2.5 + Math.sin(x * 0.07) * 1.2;
    const half = 8 + wobble + Math.max(0, 13 - Math.abs(x - WORLD_W / 2) * 0.11);
    for (let dy = -half; dy <= half; dy++) {
      const y = Math.round(cy + dy * 0.5);
      if (y < 0 || y >= h) continue;
      const edge = Math.abs(dy) / half;
      rect(ctx, x, y, 1, 1, edge > 0.85 ? darken(DIRT[2], 8) : DIRT[Math.floor(rnd() * DIRT.length)]);
    }
  }
  for (let i = 0; i < 200; i++) {
    rect(ctx, Math.floor(rnd() * WORLD_W), cy + Math.floor((rnd() - 0.5) * 12), 1 + Math.round(rnd()), 1,
      rnd() > 0.5 ? "#d8bd90" : "#9d7d50");
  }

  for (let i = 0; i < 190; i++) {
    const x = Math.floor(rnd() * WORLD_W);
    const y = Math.floor(rnd() * h);
    if (Math.abs(y - cy) < 9) continue;
    tuft(ctx, x, y, rnd);
  }
  return canvas;
}

function tuft(ctx: CanvasRenderingContext2D, x: number, y: number, rnd: () => number) {
  const c = rnd() > 0.5 ? "#5f9d3f" : "#8fd468";
  rect(ctx, x, y - 1, 1, 3, c);
  rect(ctx, x - 1, y, 1, 2, c);
  rect(ctx, x + 1, y, 1, 2, c);
  if (rnd() > 0.86) rect(ctx, x, y - 3, 1, 1, rnd() > 0.5 ? "#ffd95c" : "#f2f2f2");
}

/** Blades drawn over everything, so the camera feels down in the grass. */
export function buildFringe() {
  const { canvas, ctx } = surface(WORLD_W, 16);
  const rnd = seeded(313);
  for (let x = 0; x < WORLD_W; x += 2) {
    const hgt = 5 + Math.floor(rnd() * 10);
    rect(ctx, x, canvas.height - hgt, 1, hgt, rnd() > 0.5 ? "#3f7a34" : "#4d8f3d");
    if (rnd() > 0.9) rect(ctx, x, canvas.height - hgt - 2, 1, 2, "#e8f0c0");
  }
  return canvas;
}

// ── The lemonade stand ───────────────────────────────────────────────────────

const STAND_W = 84;
const STAND_H = 62;

export function buildStand() {
  const { canvas, ctx } = surface(STAND_W, STAND_H);
  const WOOD = "#c08a4e", WOOD_D = "#8f6335", WOOD_L = "#dcab72";

  // Posts.
  for (const px of [6, STAND_W - 10]) {
    rect(ctx, px, 14, 4, STAND_H - 16, WOOD_D);
    rect(ctx, px, 14, 1, STAND_H - 16, WOOD);
    rect(ctx, px - 1, 13, 6, 1, INK);
  }
  // Corner brackets, so the frame reads as built rather than floating.
  for (const [bx, dir] of [[10, 1], [STAND_W - 11, -1]] as const) {
    for (let i = 0; i < 5; i++) rect(ctx, bx + dir * i, 17 + i, 1, 1, WOOD_D);
  }

  // Roof board.
  rect(ctx, 2, 11, STAND_W - 4, 4, WOOD);
  rect(ctx, 2, 11, STAND_W - 4, 1, WOOD_L);
  rect(ctx, 2, 14, STAND_W - 4, 1, WOOD_D);
  rect(ctx, 1, 10, STAND_W - 2, 1, INK);

  // Striped awning with a scalloped hem.
  const stripes = 9;
  const sw = (STAND_W - 6) / stripes;
  for (let i = 0; i < stripes; i++) {
    const x = 3 + i * sw;
    const lit = i % 2 === 0;
    rect(ctx, x, 2, sw, 8, lit ? "#ffd95c" : "#fdfbf2");
    rect(ctx, x, 8, sw, 3, lit ? "#e0aa2e" : "#ddd6c4");
    rect(ctx, x + 1, 11, sw - 2, 1, lit ? "#e0aa2e" : "#ddd6c4");
  }
  rect(ctx, 2, 0, STAND_W - 4, 2, "#c94f4f");
  rect(ctx, 2, 0, STAND_W - 4, 1, "#e57373");

  // Counter: plank top, then the front panel with plank seams.
  const cy = 40;
  rect(ctx, 3, cy, STAND_W - 6, 3, WOOD_L);
  rect(ctx, 3, cy + 3, STAND_W - 6, 2, WOOD);
  rect(ctx, 2, cy - 1, STAND_W - 4, 1, INK);
  rect(ctx, 3, cy + 5, STAND_W - 6, 1, WOOD_D);

  rect(ctx, 7, cy + 6, STAND_W - 14, 16, WOOD);
  for (let i = 0; i < 3; i++) {
    rect(ctx, 7, cy + 9 + i * 5, STAND_W - 14, 1, WOOD_D);
    rect(ctx, 7, cy + 10 + i * 5, STAND_W - 14, 1, WOOD_L);
  }
  rect(ctx, 7, cy + 6, STAND_W - 14, 1, WOOD_L);
  rect(ctx, 7, cy + 21, STAND_W - 14, 1, WOOD_D);
  rect(ctx, 6, cy + 5, STAND_W - 12, 1, INK);

  // Chalkboard menu on the left post.
  rect(ctx, 8, cy - 15, 15, 15, "#5c3a1c");
  rect(ctx, 9, cy - 14, 13, 13, "#2f3a34");
  for (let i = 0; i < 3; i++) rect(ctx, 11, cy - 11 + i * 4, 9 - i * 2, 1, "#cfe8d0");
  rect(ctx, 11, cy - 11, 3, 1, "#ffd95c");

  // Jars of lemonade on the counter.
  jar(ctx, 32, cy - 8, "#ffe066");
  jar(ctx, 41, cy - 9, "#ffd0dc");
  jar(ctx, 50, cy - 8, "#ffe066");
  // Lemon crate at the counter's end.
  crate(ctx, STAND_W - 26, cy - 8);

  // Bunting: a sagging string with proper triangular flags. Drawn as loose
  // coloured pixels it just read as confetti stuck to the awning.
  const span = STAND_W - 24;
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    const bx = 12 + t * span;
    const by = 17 + Math.round(Math.sin(t * Math.PI) * 2.5);
    rect(ctx, bx - 3, by, 6, 1, INK);
    const c = ["#ffd95c", "#c94f4f", "#fdfbf2"][i % 3];
    rect(ctx, bx - 2, by + 1, 5, 1, c);
    rect(ctx, bx - 1, by + 2, 3, 1, c);
    rect(ctx, bx, by + 3, 1, 1, c);
  }

  return { canvas, width: STAND_W, height: STAND_H };
}

/** A jar is 5x7 at this density — a silhouette, a fill line and one highlight. */
function jar(ctx: CanvasRenderingContext2D, x: number, y: number, liquid: string) {
  rect(ctx, x - 1, y - 1, 7, 9, INK);
  rect(ctx, x, y, 5, 7, "#d8f0f6");
  rect(ctx, x, y + 2, 5, 5, liquid);
  rect(ctx, x, y + 2, 5, 1, "#fff3b0");
  rect(ctx, x, y, 1, 6, "#ffffff");
  rect(ctx, x - 1, y - 2, 7, 1, "#b9c9cf");
}

function crate(ctx: CanvasRenderingContext2D, x: number, y: number) {
  rect(ctx, x, y, 14, 8, "#a9793f");
  rect(ctx, x, y, 14, 1, "#c99a5c");
  rect(ctx, x, y + 3, 14, 1, "#7d5729");
  rect(ctx, x - 1, y - 1, 16, 1, INK);
  for (const [lx, ly] of [[2, -3], [6, -4], [10, -3], [4, -6]] as const) {
    rect(ctx, x + lx, y + ly, 3, 3, "#ffd95c");
    rect(ctx, x + lx, y + ly, 1, 1, "#fff3b0");
  }
}

// ── Props ────────────────────────────────────────────────────────────────────

/** A lemon tree — ~5m, so ~75px at this density. */
export function buildTree() {
  const { canvas, ctx } = surface(54, 76);
  const rnd = seeded(5);
  rect(ctx, 24, 38, 6, 38, "#5d4326");
  rect(ctx, 24, 38, 2, 38, "#75563a");
  rect(ctx, 29, 38, 1, 38, "#42301b");
  rect(ctx, 21, 73, 12, 3, "#4a3520");

  const clumps: [number, number, number, string][] = [
    [27, 28, 18, "#3f7c3b"], [15, 34, 13, "#3f7c3b"], [39, 34, 13, "#3f7c3b"],
    [21, 19, 13, "#4a8c44"], [34, 21, 12, "#4a8c44"], [27, 14, 11, "#579b4d"],
    [22, 11, 7, "#69ad57"],
  ];
  for (const [x, y, r, c] of clumps) {
    ctx.fillStyle = c;
    disc(ctx, x, y, r);
  }
  for (let i = 0; i < 120; i++) {
    const a = rnd() * Math.PI * 2, d = rnd() * 20;
    rect(ctx, Math.round(27 + Math.cos(a) * d), Math.round(23 + Math.sin(a) * d * 0.85), 1, 1,
      rnd() > 0.35 ? "#69ad57" : "#7cc45f");
  }
  for (let i = 0; i < 8; i++) {
    const a = rnd() * Math.PI * 2, d = 7 + rnd() * 15;
    const x = Math.round(27 + Math.cos(a) * d), y = Math.round(23 + Math.sin(a) * d * 0.85);
    rect(ctx, x, y, 3, 3, "#ffd95c");
    rect(ctx, x, y, 1, 1, "#fff3b0");
  }
  return canvas;
}

export function buildBush() {
  const { canvas, ctx } = surface(26, 17);
  const rnd = seeded(77);
  for (const [x, y, r] of [[8, 11, 7], [17, 11, 6], [12, 7, 7]] as const) {
    ctx.fillStyle = "#3f7c3b";
    disc(ctx, x, y, r);
  }
  for (let i = 0; i < 60; i++) {
    rect(ctx, Math.floor(rnd() * 24) + 1, Math.floor(rnd() * 13) + 2, 1, 1,
      rnd() > 0.4 ? "#4f9143" : "#63a851");
  }
  for (let i = 0; i < 5; i++) rect(ctx, Math.floor(rnd() * 20) + 3, Math.floor(rnd() * 9) + 4, 1, 1, "#e05c5c");
  rect(ctx, 4, 16, 18, 1, "#35682f");
  return canvas;
}

export function buildFence() {
  const { canvas, ctx } = surface(32, 20);
  const W = "#c9a06a", D = "#9a7444";
  for (const px of [2, 24]) {
    rect(ctx, px, 3, 5, 17, W);
    rect(ctx, px + 3, 3, 2, 17, D);
    rect(ctx, px, 2, 5, 1, D);
    rect(ctx, px - 1, 1, 7, 1, INK);
  }
  for (const ry of [7, 13]) {
    rect(ctx, 0, ry, 32, 3, W);
    rect(ctx, 0, ry + 2, 32, 1, D);
  }
  return canvas;
}

/** Roadside sign. The face is left blank — the shop name is drawn as game text
 *  on top of it, so it stays crisp instead of being baked into the sprite. */
export function buildSign() {
  const { canvas, ctx } = surface(58, 38);
  rect(ctx, 27, 20, 4, 18, "#7d5729");
  rect(ctx, 27, 20, 1, 18, "#9a7444");
  rect(ctx, 1, 1, 56, 22, "#5c3a1c");
  rect(ctx, 0, 0, 58, 1, INK);
  rect(ctx, 3, 3, 52, 18, "#f0e6d2");
  rect(ctx, 3, 3, 52, 1, "#fffaf0");
  rect(ctx, 3, 20, 52, 1, "#d5c6a8");
  // Lemon motif in each corner of the board.
  for (const lx of [5, 49]) {
    rect(ctx, lx, 5, 4, 3, "#ffd95c");
    rect(ctx, lx, 5, 1, 1, "#fff3b0");
  }
  return canvas;
}

export function buildBarrel() {
  const { canvas, ctx } = surface(13, 16);
  rect(ctx, 1, 2, 11, 14, "#a9793f");
  rect(ctx, 1, 2, 3, 14, "#c99a5c");
  rect(ctx, 10, 2, 2, 14, "#7d5729");
  for (const y of [4, 9, 14]) rect(ctx, 0, y, 13, 1, "#8a7a5e");
  rect(ctx, 2, 1, 9, 1, "#c99a5c");
  rect(ctx, 1, 0, 11, 1, INK);
  return canvas;
}

/** Soft elliptical contact shadow, drawn under everything that stands up. */
export function buildShadow() {
  const { canvas, ctx } = surface(22, 8);
  ctx.globalAlpha = 0.26;
  ctx.fillStyle = "#1d2a18";
  for (let y = 0; y < 8; y++) {
    const span = Math.floor(Math.sqrt(Math.max(0, 1 - ((y - 4) / 4) ** 2)) * 11);
    ctx.fillRect(11 - span, y, span * 2, 1);
  }
  return canvas;
}

/** Ring that pulses where the player tapped to move. */
export function buildTapMarker() {
  const { canvas, ctx } = surface(16, 9);
  ctx.fillStyle = "#fff3b0";
  for (let a = 0; a < 360; a += 14) {
    const r = (a * Math.PI) / 180;
    ctx.fillRect(Math.round(8 + Math.cos(r) * 7), Math.round(4 + Math.sin(r) * 3.5), 1, 1);
  }
  return canvas;
}

// ── Color helpers ────────────────────────────────────────────────────────────

function shift(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) =>
    Math.max(0, Math.min(255, v + amount)),
  );
  return `#${ch.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
const lighten = (hex: string, a: number) => shift(hex, a);
const darken = (hex: string, a: number) => shift(hex, -a);
