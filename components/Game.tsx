"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import kaboom from "kaboom";
import { generateAllSprites } from "@/lib/sprites";
import { FLAVORS } from "@/lib/types";

export default function Game({ accessCode: _accessCode }: { accessCode: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const sprites = generateAllSprites();

    const k = kaboom({
      canvas: canvasRef.current,
      width: 480,
      height: 360,
      scale: 2,
      crisp: true,
      background: [135, 206, 235],
    });

    // ── Load sprites ──
    k.loadSprite("player-idle", sprites.playerIdle);
    k.loadSprite("player-walk-down", sprites.playerWalkDown, { sliceX: 4 });
    k.loadSprite("player-walk-up", sprites.playerWalkUp, { sliceX: 4 });
    k.loadSprite("player-walk-left", sprites.playerWalkLeft, { sliceX: 4 });
    k.loadSprite("player-walk-right", sprites.playerWalkRight, { sliceX: 4 });
    sprites.npcs.forEach((sprite, i) => {
      k.loadSprite(`npc-${i}`, sprite, { sliceX: 4 });
    });
    k.loadSprite("dog", sprites.dog);

    // ── Main scene ──
    k.scene("main", () => {
      // Backdrop
      k.add([k.rect(480, 360), k.pos(0, 0), k.color(135, 206, 235), k.z(-10)]);

      // Grass
      k.add([k.rect(480, 180), k.pos(0, 180), k.color(124, 200, 80), k.z(-5)]);
      k.add([k.rect(480, 180), k.pos(0, 210), k.color(105, 175, 65), k.z(-5)]);

      // Dirt path
      k.add([k.rect(70, 30), k.pos(205, 295), k.color(190, 155, 115), k.z(-4)]);
      k.add([k.rect(70, 12), k.pos(205, 325), k.color(170, 135, 95), k.z(-4)]);

      // Clouds
      drawCloud(k, 70, 35);
      drawCloud(k, 210, 55);
      drawCloud(k, 380, 30);

      // Trees
      drawTree(k, 35, k.height() - 90);
      drawTree(k, k.width() - 55, k.height() - 85);

      // Flowers
      drawFlower(k, 85, k.height() - 25);
      drawFlower(k, 160, k.height() - 23);
      drawFlower(k, k.width() - 75, k.height() - 28);
      drawFlower(k, k.width() - 130, k.height() - 25);

      // Fence
      for (let x = 10; x < k.width() - 60; x += 30) {
        if (x > 160 && x < k.width() - 160) continue;
        drawFencePost(k, x, k.height() - 85);
      }

      // ── LEMONADE STAND ──
      const standX = k.width() / 2;
      const standY = k.height() - 110;

      // Counter surface
      k.add([k.rect(150, 12), k.pos(standX - 75, standY + 48), k.color(180, 120, 60), k.z(1)]);
      k.add([k.rect(150, 4), k.pos(standX - 75, standY + 45), k.color(200, 140, 70), k.z(1)]);
      // Counter front
      k.add([k.rect(150, 40), k.pos(standX - 75, standY + 60), k.color(140, 85, 40), k.z(1)]);
      // Wood grain
      for (let i = 0; i < 4; i++) {
        k.add([k.rect(140, 1), k.pos(standX - 70, standY + 65 + i * 8), k.color(120, 70, 30), k.z(1)]);
      }

      // Awning
      k.add([k.rect(170, 8), k.pos(standX - 85, standY - 5), k.color(220, 180, 60), k.z(1)]);
      for (let i = 0; i < 9; i++) {
        k.add([
          k.rect(19, 60),
          k.pos(standX - 85 + i * 19, standY - 55),
          k.color(i % 2 === 0 ? [255, 220, 100] as [number, number, number] : [255, 255, 255] as [number, number, number]),
          k.z(1),
        ]);
      }

      // Poles
      k.add([k.rect(8, 110), k.pos(standX - 78, standY - 5), k.color(100, 65, 30), k.z(0)]);
      k.add([k.rect(8, 110), k.pos(standX + 70, standY - 5), k.color(100, 65, 30), k.z(0)]);

      // Sign
      k.add([k.rect(130, 22), k.pos(standX - 65, standY - 50), k.color(100, 60, 20), k.z(2)]);
      k.add([k.rect(126, 18), k.pos(standX - 63, standY - 48), k.color(180, 140, 80), k.z(2)]);
      k.add([
        k.text("GOURMET LEMONADE", { size: 10 }),
        k.pos(standX, standY - 39),
        k.anchor("center"),
        k.color(80, 40, 10),
        k.z(2),
      ]);

      // String lights
      for (let i = 0; i < 7; i++) {
        const lx = standX - 60 + i * 20;
        k.add([k.rect(4, 4), k.pos(lx, standY - 50), k.color(255, 255, 150), k.z(3)]);
        k.add([k.circle(8), k.pos(lx - 2, standY - 54), k.color(255, 255, 150), k.opacity(0.25), k.z(2)]);
      }

      // Bottles on counter
      const bottleColors: [number, number, number][] = [[255, 240, 180], [255, 200, 210]];
      FLAVORS.forEach((_, i) => {
        const bx = standX - 35 + i * 70;
        const by = standY + 30;
        k.add([k.rect(8, 16), k.pos(bx, by), k.color(bottleColors[i]), k.z(2)]);
        k.add([k.rect(6, 4), k.pos(bx + 1, by - 4), k.color(150, 150, 150), k.z(2)]);
        k.add([k.rect(8, 3), k.pos(bx, by + 5), k.color(255, 255, 255), k.opacity(0.6), k.z(2)]);
      });

      // ── PLAYER ──
      const player = k.add([
        k.sprite("player-idle"),
        k.pos(60, k.height() - 115),
        k.area({ scale: 0.7 }),
        k.body(),
        k.scale(),
        k.anchor("center"),
        k.z(5),
        "player",
      ]);

      let currentAnim = "idle";
      let facing = "down";

      function setAnim(anim: string) {
        if (anim === currentAnim) return;
        currentAnim = anim;
        switch (anim) {
          case "idle": player.use(k.sprite("player-idle")); break;
          case "walk-down": player.use(k.sprite("player-walk-down", { anim: "walk", animSpeed: 8 })); break;
          case "walk-up": player.use(k.sprite("player-walk-up", { anim: "walk", animSpeed: 8 })); break;
          case "walk-left": player.use(k.sprite("player-walk-left", { anim: "walk", animSpeed: 8 })); break;
          case "walk-right": player.use(k.sprite("player-walk-right", { anim: "walk", animSpeed: 8 })); break;
        }
      }

      // ── INTERACTION ZONE ──
      const interactZone = k.add([
        k.rect(50, 25),
        k.pos(standX - 25, standY + 25),
        k.area(),
        k.opacity(0),
        "interact-zone",
      ]);

      // Speech bubble
      const bubble = k.add([k.pos(standX, standY - 80), k.anchor("center"), k.opacity(0), k.z(6)]);
      bubble.add([k.rect(140, 20), k.pos(-70, -10), k.color(255, 255, 255)]);
      bubble.add([k.rect(8, 8), k.pos(-4, 10), k.color(255, 255, 255), k.rotate(45)]);
      bubble.add([
        k.text("Press SPACE to order!", { size: 9 }),
        k.pos(0, -3),
        k.anchor("center"),
        k.color(40, 40, 40),
      ]);

      let canInteract = false;
      player.onCollide("interact-zone", () => { canInteract = true; bubble.opacity = 1; });
      player.onCollideEnd("interact-zone", () => { canInteract = false; bubble.opacity = 0; });

      // ── CONTROLS ──
      const SPEED = 100;
      const keys: Record<string, boolean> = { left: false, right: false, up: false, down: false };

      k.onKeyDown("left", () => { keys.left = true; });
      k.onKeyDown("right", () => { keys.right = true; });
      k.onKeyDown("up", () => { keys.up = true; });
      k.onKeyDown("down", () => { keys.down = true; });
      k.onKeyRelease("left", () => { keys.left = false; });
      k.onKeyRelease("right", () => { keys.right = false; });
      k.onKeyRelease("up", () => { keys.up = false; });
      k.onKeyRelease("down", () => { keys.down = false; });

      k.onKeyPress("space", () => {
        if (canInteract) window.dispatchEvent(new CustomEvent("open-package-modal"));
      });
      k.onClick("interact-zone", () => {
        if (canInteract) window.dispatchEvent(new CustomEvent("open-package-modal"));
      });

      // Player movement + animation
      player.onUpdate(() => {
        let vx = 0, vy = 0;
        if (keys.left) vx -= 1;
        if (keys.right) vx += 1;
        if (keys.up) vy -= 1;
        if (keys.down) vy += 1;

        if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }
        player.move(vx * SPEED, vy * SPEED);

        if (vx !== 0 || vy !== 0) {
          if (Math.abs(vy) > Math.abs(vx)) {
            facing = vy < 0 ? "up" : "down";
          } else {
            facing = vx < 0 ? "left" : "right";
          }
          setAnim(`walk-${facing}`);
        } else {
          setAnim("idle");
        }

        player.pos.x = Math.max(10, Math.min(k.width() - 10, player.pos.x));
        player.pos.y = Math.max(k.height() - 130, Math.min(k.height() - 15, player.pos.y));
      });

      // ── NPCS ──
      for (let i = 0; i < 3; i++) {
        const npc = k.add([
          k.sprite(`npc-${i}`, { anim: "walk", animSpeed: 6 }),
          k.pos(100 + i * 120, k.height() - 115),
          k.area({ scale: 0.6 }),
          k.body(),
          k.anchor("center"),
          k.z(4),
        ]);

        let dir = Math.random() > 0.5 ? 1 : -1;
        let timer = 0;
        const speed = [30, 45, 35][i];

        npc.onUpdate(() => {
          timer += k.dt();
          if (timer > 3 + Math.random() * 3) { dir *= -1; timer = 0; }
          npc.move(dir * speed, 0);
          npc.flipX = dir < 0;
          npc.pos.x = Math.max(15, Math.min(k.width() - 15, npc.pos.x));
          npc.pos.y = k.height() - 115 + Math.sin(k.time() * 2 + i) * 3;
        });
      }

      // ── DOG ──
      const dog = k.add([
        k.sprite("dog"),
        k.pos(380, k.height() - 100),
        k.area({ scale: 0.6 }),
        k.body(),
        k.anchor("center"),
        k.z(4),
      ]);

      let dogDir = -1;
      let dogTimer = 0;
      dog.onUpdate(() => {
        dogTimer += k.dt();
        if (dogTimer > 2 + Math.random() * 2) { dogDir *= -1; dogTimer = 0; }
        dog.move(dogDir * 25, 0);
        dog.flipX = dogDir < 0;
        dog.pos.x = Math.max(20, Math.min(k.width() - 20, dog.pos.x));
        dog.pos.y = k.height() - 100 + Math.sin(k.time() * 3) * 4;
      });

      // ── PARTICLES ──
      // Falling leaves
      for (let i = 0; i < 8; i++) {
        const leafColors: [number, number, number][] = [[200, 160, 120], [180, 140, 80], [160, 200, 100]];
        k.loop(0.5 + Math.random() * 2, () => {
          k.add([
            k.rect(3, 3),
            k.pos(k.rand(0, k.width()), -5),
            k.color(leafColors[Math.floor(Math.random() * 3)]),
            k.move(k.rand(70, 110), k.rand(30, 60)),
            k.lifespan(4 + Math.random() * 4, { fade: 0.5 }),
            k.rotate(k.rand(0, 360)),
            k.z(6),
            k.opacity(0.7),
          ]);
        });
      }

      // Sparkles near stand
      k.loop(1, () => {
        k.add([
          k.rect(2, 2),
          k.pos(standX + k.rand(-40, 40), standY + k.rand(-80, 30)),
          k.color(255, 255, 200),
          k.lifespan(1.5, { fade: 0.3 }),
          k.z(7),
          k.opacity(0.8),
        ]);
      });

      // ── CELEBRATE ON ORDER ──
      (window as any).__celebrateLemonade = () => {
        const cx = k.width() / 2;
        const cy = k.height() / 2;
        const colors: [number, number, number][] = [
          [255, 220, 80], [255, 150, 200], [150, 255, 200],
          [255, 200, 100], [200, 180, 255], [255, 255, 255],
        ];
        for (let i = 0; i < 40; i++) {
          const angle = (Math.PI * 2 * i) / 40;
          const c = colors[i % colors.length];
          k.add([
            k.rect(k.rand(3, 6), k.rand(3, 6)),
            k.pos(cx, cy),
            k.color(c[0], c[1], c[2]),
            k.move(angle, k.rand(80, 250)),
            k.lifespan(2, { fade: 0.1 }),
            k.anchor("center"),
            k.z(10),
            k.rotate(k.rand(0, 360)),
          ]);
        }
        const txt = k.add([
          k.text("ORDER PLACED!", { size: 20 }),
          k.pos(cx, cy - 40),
          k.anchor("center"),
          k.color(255, 220, 80),
          k.z(10),
          k.lifespan(2.5, { fade: 0.3 }),
        ]);
        txt.onUpdate(() => { txt.pos.y -= 0.5; });
      };
    });

    k.go("main");

    return () => {
      delete (window as any).__celebrateLemonade;
      try { (k as any).destroy(); } catch {}
    };
  }, []);

  // ── Mobile D-pad ──
  const sendKey = useCallback((key: string) => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
  }, []);
  const releaseKey = useCallback((key: string) => {
    window.dispatchEvent(new KeyboardEvent("keyup", { key, bubbles: true }));
  }, []);

  const btn = "w-12 h-12 bg-stone-800/90 text-amber-400 text-lg rounded active:bg-amber-600 flex items-center justify-center select-none touch-none border border-stone-600";

  return (
    <div className="flex flex-col items-center">
      <canvas
        ref={canvasRef}
        width={480}
        height={360}
        className="mx-auto border-4 border-stone-700 rounded-lg max-w-full h-auto"
        style={{ imageRendering: "pixelated" }}
      />
      <div className="grid grid-cols-3 gap-1.5 mt-3 sm:hidden">
        <div />
        <button className={btn} onTouchStart={() => sendKey("ArrowUp")} onTouchEnd={() => releaseKey("ArrowUp")}>▲</button>
        <div />
        <button className={btn} onTouchStart={() => sendKey("ArrowLeft")} onTouchEnd={() => releaseKey("ArrowLeft")}>◀</button>
        <div className={btn + " opacity-30"} />
        <button className={btn} onTouchStart={() => sendKey("ArrowRight")} onTouchEnd={() => releaseKey("ArrowRight")}>▶</button>
        <div />
        <button className={btn} onTouchStart={() => sendKey("ArrowDown")} onTouchEnd={() => releaseKey("ArrowDown")}>▼</button>
        <div />
      </div>
      <p className="text-stone-500 text-xs mt-2 sm:hidden">Use D-pad to walk, tap stand to order</p>
    </div>
  );
}

// ── Scene drawing helpers ──

function drawCloud(k: ReturnType<typeof kaboom>, x: number, y: number) {
  const c = k.add([k.pos(x, y), k.z(-3), k.opacity(0.9)]);
  c.add([k.rect(24, 10), k.pos(4, 4), k.color(255, 255, 255)]);
  c.add([k.rect(16, 8), k.pos(0, 6), k.color(255, 255, 255)]);
  c.add([k.rect(20, 6), k.pos(10, 2), k.color(255, 255, 255)]);
}

function drawTree(k: ReturnType<typeof kaboom>, x: number, y: number) {
  const t = k.add([k.pos(x, y), k.anchor("bot"), k.z(-2)]);
  t.add([k.rect(10, 35), k.pos(-5, -35), k.color(139, 105, 20)]);
  t.add([k.circle(18), k.pos(0, -55), k.color(58, 140, 42)]);
  t.add([k.circle(14), k.pos(-6, -68), k.color(74, 160, 50)]);
  t.add([k.circle(12), k.pos(4, -72), k.color(86, 180, 56)]);
  t.add([k.circle(8), k.pos(-2, -78), k.color(100, 200, 70), k.opacity(0.7)]);
}

function drawFlower(k: ReturnType<typeof kaboom>, x: number, y: number) {
  const colorSets: [number, number, number][] = [[255, 107, 138], [255, 182, 193], [255, 215, 0], [255, 140, 105]];
  const c = colorSets[Math.floor(Math.random() * 4)];
  k.add([k.rect(2, 7), k.pos(x - 1, y - 5), k.color(74, 140, 42), k.z(-1)]);
  k.add([k.rect(6, 6), k.pos(x - 3, y - 11), k.color(c), k.z(-1)]);
  k.add([k.rect(3, 3), k.pos(x - 1.5, y - 9.5), k.color(255, 215, 0), k.z(-1)]);
}

function drawFencePost(k: ReturnType<typeof kaboom>, x: number, y: number) {
  k.add([k.rect(5, 22), k.pos(x - 2.5, y - 22), k.color(196, 148, 106), k.z(-1)]);
  k.add([k.rect(7, 3), k.pos(x - 3.5, y - 25), k.color(168, 120, 74), k.z(-1)]);
}
