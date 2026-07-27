import type { KaboomCtx } from "kaboom";
import { FLAVORS } from "./types";

// Register the player sprite from a tiny canvas
export function registerPlayerSprite(k: KaboomCtx) {
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 32;
  const ctx = canvas.getContext("2d")!;

  // Body (blue shirt)
  ctx.fillStyle = "rgb(60, 120, 200)";
  ctx.fillRect(0, 12, 16, 20);

  // Head
  ctx.fillStyle = "rgb(255, 200, 150)";
  ctx.fillRect(2, 0, 12, 12);

  // Eyes
  ctx.fillStyle = "rgb(0, 0, 0)";
  ctx.fillRect(4, 4, 2, 2);
  ctx.fillRect(10, 4, 2, 2);

  // Hat
  ctx.fillStyle = "rgb(200, 50, 50)";
  ctx.fillRect(1, 0, 14, 3);

  k.loadSprite("player", canvas);
}

// Draw the gourmet lemonade stand
export function drawStand(k: KaboomCtx) {
  const cx = k.width() / 2;
  const baseY = k.height() - 75;

  const stand = k.add([
    k.pos(cx, baseY),
    k.anchor("center"),
    k.z(2),
  ]);

  // Counter top
  stand.add([
    k.rect(140, 14),
    k.pos(-70, 0),
    k.color(120, 70, 30),
  ]);

  // Counter front
  stand.add([
    k.rect(140, 40),
    k.pos(-70, 14),
    k.color(100, 60, 25),
  ]);

  // Awning
  stand.add([
    k.rect(160, 70),
    k.pos(-80, -70),
    k.color(255, 210, 80),
  ]);

  // Awning stripes
  for (let i = 0; i < 8; i++) {
    stand.add([
      k.rect(20, 70),
      k.pos(-80 + i * 20, -70),
      k.color(i % 2 === 0 ? [255, 220, 100] : [255, 255, 255]),
    ]);
  }

  // Poles
  stand.add([k.rect(6, 90), k.pos(-65, -20), k.color(90, 55, 25)]);
  stand.add([k.rect(6, 90), k.pos(59, -20), k.color(90, 55, 25)]);

  // Sign
  stand.add([
    k.text("GOURMET LEMONADE", { size: 12 }),
    k.pos(0, -50),
    k.anchor("center"),
    k.color(180, 100, 30),
  ]);

  // Flavor display cards on counter
  const flavorColors: [number, number, number][] = [
    [255, 240, 160], // Ice Cream - creamy yellow
    [255, 180, 200], // Runts - candy pink
  ];

  FLAVORS.forEach((flavor, i) => {
    const fx = -45 + i * 90;
    const card = stand.add([
      k.rect(75, 22),
      k.pos(fx, -30),
      k.color(...flavorColors[i]),
      k.opacity(0.95),
      k.anchor("center"),
    ]);

    card.add([
      k.text(flavor, { size: 7 }),
      k.pos(0, 0),
      k.anchor("center"),
      k.color(80, 50, 20),
    ]);
  });

  return stand;
}

// Decorative elements
export function drawTree(k: KaboomCtx, x: number) {
  const y = k.height() - 80;
  const tree = k.add([k.pos(x, y), k.z(0)]);

  // Trunk
  tree.add([k.rect(8, 30), k.pos(-4, -10), k.color(101, 67, 33)]);
  // Canopy
  tree.add([k.rect(40, 40), k.pos(-20, -40), k.color(34, 160, 34)]);
  tree.add([k.rect(34, 30), k.pos(-17, -55), k.color(50, 180, 50)]);

  return tree;
}

// Draw the ground
export function drawGround(k: KaboomCtx) {
  // Grass
  k.add([k.rect(k.width(), 20), k.pos(0, k.height() - 40), k.color(100, 180, 70)]);

  // Dirt path
  k.add([k.rect(60, 10), k.pos(k.width() / 2 - 30, k.height() - 35), k.color(160, 130, 90)]);

  // Bottom edge
  k.add([k.rect(k.width(), 80), k.pos(0, k.height() - 40), k.color(130, 100, 70), k.z(-1)]);
}

// Create celebration particles
export function celebrate(k: KaboomCtx) {
  const cx = k.width() / 2;
  const cy = k.height() / 2;
  const colors: [number, number, number][] = [
    [255, 220, 80],
    [255, 150, 200],
    [150, 255, 200],
    [255, 200, 100],
  ];

  for (let i = 0; i < 30; i++) {
    const angle = (Math.PI * 2 * i) / 30;
    k.add([
      k.rect(4, 4),
      k.pos(cx, cy),
      k.color(...colors[i % colors.length]),
      k.move(angle, k.rand(80, 200)),
      k.lifespan(1.5, { fade: 0.05 }),
      k.anchor("center"),
    ]);
  }
}
