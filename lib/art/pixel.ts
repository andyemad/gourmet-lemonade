// Pixel art painter — sprites are authored as rows of characters, one char per
// pixel, mapped through a palette. Rows are padded to the widest row, so art can
// be written without counting columns.

export type Palette = Record<string, string>;

/** Chars that always mean "leave transparent". */
const EMPTY = new Set([".", " "]);

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  return canvas;
}

function ctxOf(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  return ctx;
}

/** Paint one frame of character-art onto a context at (ox, oy). */
export function stamp(
  ctx: CanvasRenderingContext2D,
  rows: string[],
  palette: Palette,
  ox = 0,
  oy = 0,
) {
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (EMPTY.has(ch)) continue;
      const color = palette[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(ox + x, oy + y, 1, 1);
    }
  });
}

export function frameSize(rows: string[]): { w: number; h: number } {
  return { w: Math.max(...rows.map((r) => r.length)), h: rows.length };
}

/** Render a single frame to its own canvas. */
export function paint(rows: string[], palette: Palette): HTMLCanvasElement {
  const { w, h } = frameSize(rows);
  const canvas = makeCanvas(w, h);
  stamp(ctxOf(canvas), rows, palette, 0, 0);
  return canvas;
}

/**
 * Render frames side by side into one horizontal strip, which is what
 * KAPLAY's `loadSprite(..., { sliceX })` expects. Frames are bottom-aligned
 * and centered so characters of differing heights don't bob between frames.
 */
export function strip(frames: string[][], palette: Palette): HTMLCanvasElement {
  const sizes = frames.map(frameSize);
  const fw = Math.max(...sizes.map((s) => s.w));
  const fh = Math.max(...sizes.map((s) => s.h));
  const canvas = makeCanvas(fw * frames.length, fh);
  const ctx = ctxOf(canvas);
  frames.forEach((rows, i) => {
    const { w, h } = sizes[i];
    stamp(ctx, rows, palette, i * fw + Math.floor((fw - w) / 2), fh - h);
  });
  return canvas;
}

/** Flip art horizontally. Lets one authored step pose serve both legs. */
export function mirror(rows: string[]): string[] {
  const w = Math.max(...rows.map((r) => r.length));
  return rows.map((r) => r.padEnd(w, ".").split("").reverse().join(""));
}

/**
 * Stack art blocks into one frame, with an optional per-block vertical nudge.
 * A 1px lift on the torso during the passing pose is what makes a walk cycle
 * read as weight rather than as sliding feet.
 */
export function stack(...blocks: Array<{ rows: string[]; dy?: number }>): string[] {
  const w = Math.max(...blocks.flatMap((b) => b.rows.map((r) => r.length)));
  const out: string[] = [];
  let y = 0;
  for (const { rows, dy = 0 } of blocks) {
    y += dy;
    rows.forEach((row, i) => {
      const target = y + i;
      while (out.length <= target) out.push(".".repeat(w));
      const padded = row.padEnd(w, ".");
      out[target] = out[target]
        .split("")
        .map((ch, x) => (EMPTY.has(padded[x]) ? ch : padded[x]))
        .join("");
    });
    y += rows.length;
  }
  return out;
}

/** Blank canvas to composite scenery onto. */
export function surface(w: number, h: number) {
  const canvas = makeCanvas(w, h);
  return { canvas, ctx: ctxOf(canvas) };
}

/** Deterministic RNG so scattered scenery looks the same on every load. */
export function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

/**
 * Ordered 2x2 dither between two colors. `mix` of 0 is all `a`, 1 is all `b`;
 * the intermediate steps give banded gradients their pixel-art texture.
 */
export function dither(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  a: string,
  b: string,
  mix: number,
) {
  const threshold = [[0, 2], [3, 1]];
  const level = Math.round(mix * 4);
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const t = threshold[(y + dy) % 2][(x + dx) % 2];
      ctx.fillStyle = t < level ? b : a;
      ctx.fillRect(x + dx, y + dy, 1, 1);
    }
  }
}
