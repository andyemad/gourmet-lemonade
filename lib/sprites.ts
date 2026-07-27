// Pixel art sprite generation — all sprites drawn on canvas, loaded into Kaboom
// Every sprite is hand-crafted pixel art, not generic rectangles

export interface SpriteSheet {
  player: {
    idle: string;      // standing still
    walkDown: string;  // 4-frame walk animation
    walkUp: string;
    walkLeft: string;
    walkRight: string;
  };
  npcs: string[];      // 3 different NPC sprites
  dog: string;         // a dog NPC
}

// Helper: draw a pixel on a 2D context at scale
function pset(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, scale = 1) {
  ctx.fillStyle = color;
  ctx.fillRect(x * scale, y * scale, scale, scale);
}

// Helper: draw a horizontal line of pixels
function hline(ctx: CanvasRenderingContext2D, x: number, y: number, len: number, color: string, scale = 1) {
  ctx.fillStyle = color;
  ctx.fillRect(x * scale, y * scale, len * scale, scale);
}

// ── Player character (16x20 pixels, scaled 2x to 32x40) ──
// Color palette
const SKIN = "#f4c882";
const SKIN_SHADOW = "#d4a862";
const HAIR = "#5c3a1e";
const SHIRT = "#4a90d9";
const SHIRT_DARK = "#3570b0";
const PANTS = "#3a3a4a";
const SHOES = "#2a2a2a";
const EYES = "#1a1a1a";
const MOUTH = "#c46a6a";

function drawPlayerFrame(ctx: CanvasRenderingContext2D, legOffset: number, armSwing: number, facing: "down" | "up" | "left" | "right") {
  const s = 2; // scale
  ctx.clearRect(0, 0, 16 * s, 20 * s);

  // ── HEAD (4x5 pixels at 2x = 8x10) ──
  // Hair (back)
  pset(ctx, 5, 0, HAIR, s); pset(ctx, 6, 0, HAIR, s); pset(ctx, 7, 0, HAIR, s); pset(ctx, 8, 0, HAIR, s);
  pset(ctx, 4, 1, HAIR, s); pset(ctx, 9, 1, HAIR, s);
  // Face
  for (let y = 1; y <= 4; y++)
    for (let x = 5; x <= 8; x++)
      pset(ctx, x, y, SKIN, s);
  // Hair top
  pset(ctx, 5, 0, HAIR, s); pset(ctx, 6, 0, HAIR, s); pset(ctx, 7, 0, HAIR, s); pset(ctx, 8, 0, HAIR, s);
  // Eyes
  pset(ctx, 5, 2, EYES, s); pset(ctx, 7, 2, EYES, s);
  // Mouth
  pset(ctx, 6, 4, MOUTH, s);

  // ── BODY (shirt, 6x4) ──
  for (let y = 5; y <= 8; y++)
    for (let x = 5; x <= 8; x++)
      pset(ctx, x, y, y <= 6 ? SHIRT : SHIRT_DARK, s);

  // ── ARMS ──
  const armX = facing === "left" ? 4 + armSwing : facing === "right" ? 9 + armSwing : 4 + armSwing;
  pset(ctx, 4, 5, SHIRT, s); pset(ctx, 4, 6, SHIRT, s);
  pset(ctx, 4, 7, SHIRT_DARK, s);
  pset(ctx, 9, 5, SHIRT, s); pset(ctx, 9, 6, SHIRT, s);
  pset(ctx, 9, 7, SHIRT_DARK, s);

  // ── LEGS ──
  const leftLeg = legOffset;
  const rightLeg = -legOffset;
  pset(ctx, 5 + leftLeg, 9, PANTS, s); pset(ctx, 6 + leftLeg, 9, PANTS, s);
  pset(ctx, 5 + leftLeg, 10, PANTS, s); pset(ctx, 6 + leftLeg, 10, PANTS, s);
  pset(ctx, 7 + rightLeg, 9, PANTS, s); pset(ctx, 8 + rightLeg, 9, PANTS, s);
  pset(ctx, 7 + rightLeg, 10, PANTS, s); pset(ctx, 8 + rightLeg, 10, PANTS, s);

  // ── SHOES ──
  pset(ctx, 5 + leftLeg, 11, SHOES, s); pset(ctx, 6 + leftLeg, 11, SHOES, s);
  pset(ctx, 7 + rightLeg, 11, SHOES, s); pset(ctx, 8 + rightLeg, 11, SHOES, s);

  // ── Facing direction details ──
  if (facing === "up") {
    // Hair covers more
    pset(ctx, 4, 0, HAIR, s); pset(ctx, 5, 0, HAIR, s); pset(ctx, 6, 0, HAIR, s);
    pset(ctx, 7, 0, HAIR, s); pset(ctx, 8, 0, HAIR, s); pset(ctx, 9, 0, HAIR, s);
  }
}

// Generate a sprite sheet for a walking animation (4 frames)
function generateWalkFrames(facing: "down" | "up" | "left" | "right"): HTMLCanvasElement {
  // Create a sprite sheet: 4 frames wide, 1 frame tall
  const frameW = 16;
  const frameH = 20;
  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = frameW * 4 * scale;
  canvas.height = frameH * scale;
  const ctx = canvas.getContext("2d")!;

  const legOffsets = [0, 1, 0, -1]; // walk cycle

  for (let f = 0; f < 4; f++) {
    ctx.save();
    ctx.translate(f * frameW * scale, 0);
    drawPlayerFrame(ctx, legOffsets[f], 0, facing);
    ctx.restore();
  }

  return canvas;
}

// Generate idle frame
function generateIdleFrame(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 16 * 2;
  canvas.height = 20 * 2;
  const ctx = canvas.getContext("2d")!;
  drawPlayerFrame(ctx, 0, 0, "down");
  return canvas;
}

// ── NPC (other customers - simpler, different colors) ──
const NPC_COLORS = [
  { skin: "#e8c09a", hair: "#2a1a0a", shirt: "#c44a4a", pants: "#2a3a5a" },
  { skin: "#d4a574", hair: "#c8a050", shirt: "#4ac44a", pants: "#3a3a4a" },
  { skin: "#c4946a", hair: "#1a1a1a", shirt: "#c4a04a", pants: "#4a4a5a" },
];

function drawNPCFrame(ctx: CanvasRenderingContext2D, legOffset: number, colors: typeof NPC_COLORS[0]) {
  const s = 2;
  ctx.clearRect(0, 0, 16 * s, 20 * s);

  // Head
  for (let y = 1; y <= 4; y++)
    for (let x = 5; x <= 8; x++)
      pset(ctx, x, y, colors.skin, s);
  // Hair
  pset(ctx, 5, 0, colors.hair, s); pset(ctx, 6, 0, colors.hair, s);
  pset(ctx, 7, 0, colors.hair, s); pset(ctx, 8, 0, colors.hair, s);
  pset(ctx, 4, 1, colors.hair, s); pset(ctx, 9, 1, colors.hair, s);
  // Eyes
  pset(ctx, 5, 2, "#1a1a1a", s); pset(ctx, 7, 2, "#1a1a1a", s);

  // Body
  for (let y = 5; y <= 8; y++)
    for (let x = 5; x <= 8; x++)
      pset(ctx, x, y, colors.shirt, s);

  // Legs
  const ll = legOffset, rl = -legOffset;
  pset(ctx, 5 + ll, 9, colors.pants, s); pset(ctx, 6 + ll, 9, colors.pants, s);
  pset(ctx, 5 + ll, 10, colors.pants, s); pset(ctx, 6 + ll, 10, colors.pants, s);
  pset(ctx, 7 + rl, 9, colors.pants, s); pset(ctx, 8 + rl, 9, colors.pants, s);
  pset(ctx, 7 + rl, 10, colors.pants, s); pset(ctx, 8 + rl, 10, colors.pants, s);

  // Shoes
  pset(ctx, 5 + ll, 11, "#2a2a2a", s); pset(ctx, 6 + ll, 11, "#2a2a2a", s);
  pset(ctx, 7 + rl, 11, "#2a2a2a", s); pset(ctx, 8 + rl, 11, "#2a2a2a", s);
}

function generateNPCWalk(colors: typeof NPC_COLORS[0]): HTMLCanvasElement {
  const frameW = 16, frameH = 20, scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = frameW * 4 * scale;
  canvas.height = frameH * scale;
  const ctx = canvas.getContext("2d")!;
  const legOffsets = [0, 1, 0, -1];

  for (let f = 0; f < 4; f++) {
    ctx.save();
    ctx.translate(f * frameW * scale, 0);
    drawNPCFrame(ctx, legOffsets[f], colors);
    ctx.restore();
  }
  return canvas;
}

// ── Dog NPC ──
function generateDogSprite(): HTMLCanvasElement {
  const s = 2;
  const canvas = document.createElement("canvas");
  canvas.width = 16 * s;
  canvas.height = 14 * s;
  const ctx = canvas.getContext("2d")!;

  const BODY = "#c8944a";
  const BODY_DARK = "#a0743a";
  const BELLY = "#e8d4b0";
  const NOSE = "#1a1a1a";
  const EAR = "#8a5a2a";

  // Body
  for (let y = 5; y <= 10; y++)
    for (let x = 3; x <= 13; x++)
      pset(ctx, x, y, y >= 8 ? BELLY : BODY, s);

  // Head
  for (let y = 1; y <= 5; y++)
    for (let x = 1; x <= 6; x++)
      pset(ctx, x, y, BODY, s);

  // Ear
  pset(ctx, 1, 0, EAR, s); pset(ctx, 2, 0, EAR, s);
  pset(ctx, 1, 1, BODY_DARK, s);

  // Eyes
  pset(ctx, 2, 2, "#ffffff", s); pset(ctx, 4, 2, "#ffffff", s);
  pset(ctx, 2, 2, NOSE, s);

  // Nose
  pset(ctx, 0, 3, NOSE, s);

  // Tail
  pset(ctx, 14, 5, BODY, s); pset(ctx, 14, 4, BODY, s); pset(ctx, 15, 4, BODY, s);

  // Legs
  pset(ctx, 4, 11, BODY_DARK, s); pset(ctx, 5, 11, BODY_DARK, s);
  pset(ctx, 10, 11, BODY_DARK, s); pset(ctx, 11, 11, BODY_DARK, s);

  return canvas;
}

// ── Main export: generate all sprites ──
export function generateAllSprites() {
  return {
    playerIdle: generateIdleFrame(),
    playerWalkDown: generateWalkFrames("down"),
    playerWalkUp: generateWalkFrames("up"),
    playerWalkLeft: generateWalkFrames("left"),
    playerWalkRight: generateWalkFrames("right"),
    npcs: NPC_COLORS.map(generateNPCWalk),
    dog: generateDogSprite(),
  };
}

// ── Scene drawing functions ──

export function drawSceneBackground(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;
  const W = canvas.width, H = canvas.height;
  const s = 1; // pixel scale

  // Sky gradient (top half)
  const skyColors = ["#87CEEB", "#98D8E8", "#A8E0F0", "#B8E8F8"];
  for (let y = 0; y < H * 0.55; y++) {
    const ci = Math.floor((y / (H * 0.55)) * skyColors.length);
    hline(ctx, 0, y, W, skyColors[Math.min(ci, skyColors.length - 1)], s);
  }

  // Grass (bottom half)
  const grassColors = ["#7CC850", "#6DB840", "#5EA830"];
  for (let y = Math.floor(H * 0.55); y < H; y++) {
    const ci = Math.floor(((y - H * 0.55) / (H * 0.45)) * grassColors.length);
    hline(ctx, 0, y, W, grassColors[Math.min(ci, grassColors.length - 1)], s);
  }

  // Dirt path
  const pathY = H - 50;
  const pathColors = ["#C4A86A", "#B89860", "#AC8858"];
  for (let y = pathY; y < pathY + 25; y++) {
    hline(ctx, W / 2 - 30, y, 60, pathColors[(y - pathY) % pathColors.length], s);
  }

  // Clouds
  drawCloud(ctx, 60, 30, s);
  drawCloud(ctx, 200, 50, s);
  drawCloud(ctx, 380, 25, s);

  // Trees
  drawDetailedTree(ctx, 30, H - 65, s);
  drawDetailedTree(ctx, W - 50, H - 65, s);

  // Flowers
  drawFlower(ctx, 80, H - 30, s);
  drawFlower(ctx, 150, H - 28, s);
  drawFlower(ctx, W - 70, H - 32, s);
  drawFlower(ctx, W - 120, H - 30, s);

  // Fence
  for (let x = 5; x < W - 40; x += 25) {
    drawFencePost(ctx, x, H - 70, s);
  }
}

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  const C = "#ffffff";
  // Cloud shape using pixel clusters
  const shape = [
    "  ##  ",
    " #### ",
    "######",
    " #### ",
  ];
  shape.forEach((row, dy) => {
    row.split("").forEach((ch, dx) => {
      if (ch === "#") pset(ctx, x + dx, y + dy, C, s);
    });
  });
}

function drawDetailedTree(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  // Trunk
  const TRUNK = "#8B6914";
  const TRUNK_D = "#6B4E10";
  for (let dy = 0; dy < 30; dy++) {
    pset(ctx, x - 3, y - dy, dy < 5 ? TRUNK_D : TRUNK, s);
    pset(ctx, x - 2, y - dy, TRUNK, s);
    pset(ctx, x - 1, y - dy, TRUNK, s);
    pset(ctx, x + 1, y - dy, TRUNK, s);
    pset(ctx, x + 2, y - dy, TRUNK, s);
    pset(ctx, x + 3, y - dy, dy < 5 ? TRUNK_D : TRUNK, s);
  }

  // Canopy (layered circles of green)
  const LEAF = ["#3A8C2A", "#4AA040", "#2E7820", "#56B448"];
  for (let layer = 0; layer < 4; layer++) {
    const cx = x + (layer % 2 === 0 ? -4 : 4);
    const cy = y - 35 - layer * 6;
    const r = 8 - layer;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy <= r * r + 2) {
          pset(ctx, cx + dx, cy + dy, LEAF[layer], s);
        }
      }
    }
  }
}

function drawFlower(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  const STEM = "#4A8C2A";
  const PETAL = ["#FF6B8A", "#FFB6C1", "#FFD700", "#FF8C69"];
  const CENTER = "#FFD700";

  pset(ctx, x, y, STEM, s);
  pset(ctx, x, y - 1, STEM, s);
  pset(ctx, x, y - 2, STEM, s);

  const color = PETAL[Math.floor(Math.random() * PETAL.length)];
  pset(ctx, x - 1, y - 3, color, s); pset(ctx, x + 1, y - 3, color, s);
  pset(ctx, x, y - 4, color, s); pset(ctx, x, y - 2, color, s);
  pset(ctx, x, y - 3, CENTER, s);
}

function drawFencePost(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  const WOOD = "#C4946A";
  const WOOD_D = "#A8784A";
  pset(ctx, x, y, WOOD_D, s); pset(ctx, x + 1, y, WOOD, s);
  pset(ctx, x, y + 1, WOOD, s); pset(ctx, x + 1, y + 1, WOOD, s);
  pset(ctx, x, y - 5, WOOD, s); pset(ctx, x + 1, y - 5, WOOD, s);
  pset(ctx, x, y - 6, WOOD_D, s); pset(ctx, x + 1, y - 6, WOOD_D, s);
  // Post top
  pset(ctx, x - 1, y - 7, WOOD, s); pset(ctx, x, y - 7, WOOD, s);
  pset(ctx, x + 1, y - 7, WOOD, s); pset(ctx, x + 2, y - 7, WOOD, s);
}

// ── Lemonade Stand ──
export function drawLemonadeStandSprite(): HTMLCanvasElement {
  const s = 2;
  const canvas = document.createElement("canvas");
  canvas.width = 160 * 1; // compact
  canvas.height = 120 * 1;
  const ctx = canvas.getContext("2d")!;

  // We'll draw this directly in the game scene instead
  // This is just a placeholder — the real stand is drawn in the game
  return canvas;
}

// ── Particle sprite (tiny colored square) ──
export function generateParticle(color: string): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 4;
  canvas.height = 4;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 4, 4);
  return canvas;
}
