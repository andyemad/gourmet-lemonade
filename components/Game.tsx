"use client";

import { useEffect, useRef } from "react";
import kaplay from "kaplay";
import type { KAPLAYCtx, GameObj } from "kaplay";
import { buildArt, HORIZON, VIEW_H, VIEW_W, WORLD_W } from "@/lib/art";

/** Ground line the player's feet walk between. */
const WALK_TOP = HORIZON + 26;
const WALK_BOTTOM = VIEW_H - 12;
const STAND_X = WORLD_W / 2;
const STAND_BASE_Y = 186;
/** Where the player ends up when they tap the stand. */
const COUNTER_SPOT = { x: STAND_X, y: 208 };
const SPEED = 78;

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const art = buildArt();
    // Scopes the canvas pointer listener so it dies with the component.
    const input = new AbortController();
    const k = kaplay({
      canvas,
      width: VIEW_W,
      height: VIEW_H,
      scale: 3,
      crisp: true,
      background: [122, 190, 216],
      global: false,
    });

    const WALK = { from: 0, to: 3, loop: true, speed: 9 };
    k.loadSprite("player-down", art.playerDown, { sliceX: 4, anims: { walk: WALK } });
    k.loadSprite("player-up", art.playerUp, { sliceX: 4, anims: { walk: WALK } });
    k.loadSprite("player-side", art.playerSide, { sliceX: 4, anims: { walk: WALK } });
    k.loadSprite("player-idle", art.playerIdleDown);
    art.npcs.forEach((sheet, i) =>
      k.loadSprite(`npc-${i}`, sheet, { sliceX: 4, anims: { walk: { ...WALK, speed: 6 + i } } }),
    );
    k.loadSprite("dog", art.dog, {
      sliceX: 2,
      anims: { wag: { from: 0, to: 1, loop: true, speed: 4 } },
    });
    k.loadSprite("sky", art.sky);
    k.loadSprite("clouds", art.clouds);
    k.loadSprite("hills", art.hills);
    k.loadSprite("treeline", art.treeline);
    k.loadSprite("ground", art.ground);
    k.loadSprite("fringe", art.fringe);
    k.loadSprite("stand", art.stand.canvas);
    k.loadSprite("tree", art.tree);
    k.loadSprite("bush", art.bush);
    k.loadSprite("fence", art.fence);
    k.loadSprite("sign", art.sign);
    k.loadSprite("barrel", art.barrel);
    k.loadSprite("shadow", art.shadow);
    k.loadSprite("tap-marker", art.tapMarker);

    k.scene("main", () => {
      // ── Parallax backdrop ──
      // Each layer is screen-fixed and repositioned every frame from the camera
      // offset. A factor of 0 pins a layer to the viewport, 1 locks it to the
      // world; everything between reads as distance.
      const parallax: Array<{ obj: GameObj; factor: number; drift: number }> = [];
      const layer = (sprite: string, y: number, z: number, factor: number, drift = 0) => {
        const obj = k.add([k.sprite(sprite), k.pos(0, y), k.z(z), k.fixed(), k.anchor("topleft")]);
        parallax.push({ obj, factor, drift });
        return obj;
      };

      // The ground sprite's top edge is the visible horizon; the hill and tree
      // layers are positioned so their bases land just behind it rather than
      // being swallowed by it.
      const GROUND_TOP = HORIZON - 14;
      layer("sky", 0, -1000, 0);
      layer("clouds", 10, -900, 0.12, 1.6);
      layer("hills", GROUND_TOP - 68, -800, 0.28);
      layer("treeline", GROUND_TOP - 66, -700, 0.55);

      // Ground is world-locked, so it needs no parallax bookkeeping.
      k.add([k.sprite("ground"), k.pos(0, GROUND_TOP), k.z(-600), k.anchor("topleft")]);

      // ── Scenery ──
      const shadowFor = (x: number, y: number, scale = 1) =>
        k.add([
          k.sprite("shadow"), k.pos(x, y), k.anchor("center"),
          k.scale(scale, scale), k.z(y - 1),
        ]);

      const prop = (sprite: string, x: number, y: number, shadowScale = 1) => {
        if (shadowScale > 0) shadowFor(x, y, shadowScale);
        return k.add([k.sprite(sprite), k.pos(x, y), k.anchor("bot"), k.z(y)]);
      };

      // Trees frame the scene and mark its edges; the sway is applied below.
      const trees = [
        prop("tree", 58, 178, 1.5),
        prop("tree", 232, 170, 1.4),
        prop("tree", 548, 172, 1.4),
        prop("tree", 712, 180, 1.5),
      ];
      const bushes = [
        prop("bush", 128, 190, 0.8), prop("bush", 300, 176, 0.8),
        prop("bush", 470, 182, 0.8), prop("bush", 636, 188, 0.8),
        prop("bush", 196, 226, 0.9), prop("bush", 592, 230, 0.9),
      ];
      for (let x = 14; x < WORLD_W; x += 32) {
        // Leave the middle open so the fence never crosses the stand.
        if (Math.abs(x - STAND_X) < 120) continue;
        k.add([k.sprite("fence"), k.pos(x, 172), k.anchor("bot"), k.z(171)]);
      }
      prop("barrel", 268, 214, 0.7);
      prop("barrel", 282, 218, 0.7);

      // ── The stand ──
      shadowFor(STAND_X, STAND_BASE_Y + 2, 3);
      k.add([k.sprite("stand"), k.pos(STAND_X, STAND_BASE_Y), k.anchor("bot"), k.z(STAND_BASE_Y)]);

      const signY = 206;
      prop("sign", STAND_X - 96, signY, 1.2);
      const signLabel = (text: string, dy: number) =>
        k.add([
          k.text(text, { size: 7, align: "center" }),
          k.pos(STAND_X - 96, signY - 38 + dy),
          k.anchor("center"), k.color(92, 58, 28), k.z(signY + 1),
        ]);
      signLabel("GOURMET", 8);
      signLabel("LEMONADE", 17);

      // ── Player ──
      const player = k.add([
        k.sprite("player-idle"), k.pos(STAND_X - 150, 212), k.anchor("bot"),
        k.z(212), k.scale(1, 1),
      ]);
      const playerShadow = k.add([
        k.sprite("shadow"), k.pos(0, 0), k.anchor("center"), k.scale(0.8, 0.7), k.z(0),
      ]);

      let facing: "down" | "up" | "side" = "down";
      let moving = false;
      let currentSprite = "";

      function setSprite(name: string, anim?: string) {
        if (name === currentSprite) return;
        currentSprite = name;
        player.use(anim ? k.sprite(name, { anim }) : k.sprite(name));
      }

      // ── Input ──
      const held = { left: false, right: false, up: false, down: false };
      const bind = (keys: string[], prop: keyof typeof held) => {
        keys.forEach((key) => {
          k.onKeyDown(key as never, () => { held[prop] = true; });
          k.onKeyRelease(key as never, () => { held[prop] = false; });
        });
      };
      bind(["left", "a"], "left");
      bind(["right", "d"], "right");
      bind(["up", "w"], "up");
      bind(["down", "s"], "down");

      // Tap-to-move replaces the old on-screen D-pad: tap anywhere to walk
      // there, tap the stand to walk over and open the order menu on arrival.
      let target: { x: number; y: number } | null = null;
      let openOnArrival = false;
      let marker: GameObj | null = null;

      function walkTo(x: number, y: number, thenOrder = false) {
        target = {
          x: k.clamp(x, 12, WORLD_W - 12),
          y: k.clamp(y, WALK_TOP, WALK_BOTTOM),
        };
        openOnArrival = thenOrder;
        marker?.destroy();
        marker = k.add([
          k.sprite("tap-marker"), k.pos(target.x, target.y), k.anchor("center"),
          k.z(target.y - 2), k.opacity(0.9), k.scale(1, 1),
        ]);
        const ring = marker;
        ring.onUpdate(() => {
          ring.scale.x = ring.scale.y = 1 + Math.sin(k.time() * 8) * 0.15;
        });
      }

      // KAPLAY derives pointer position as (clientX - rect.left) / scale, which
      // is only correct while the canvas is displayed at its backing-store
      // size. This one is responsive, so every tap landed short. Map it off the
      // element's real rect instead — correct at any display size, mouse or
      // touch.
      canvas.addEventListener("pointerdown", (e: PointerEvent) => {
        const rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const cam = k.getCamPos();
        const x = ((e.clientX - rect.left) / rect.width) * VIEW_W + cam.x - VIEW_W / 2;
        const y = ((e.clientY - rect.top) / rect.height) * VIEW_H + cam.y - VIEW_H / 2;

        // Bounded by the stand's own footprint. Letting it spill onto the path
        // meant tapping the ground in front of the counter force-opened the
        // menu when the player only meant to walk there.
        const onStand =
          Math.abs(x - STAND_X) < art.stand.width / 2 &&
          y > STAND_BASE_Y - art.stand.height &&
          y < STAND_BASE_Y + 4;
        if (onStand) walkTo(COUNTER_SPOT.x, COUNTER_SPOT.y, true);
        else walkTo(x, y);
      }, { signal: input.signal });

      // ── Interaction prompt ──
      const prompt = k.add([k.pos(STAND_X, STAND_BASE_Y - 74), k.z(900), k.opacity(0)]);
      const promptBg = prompt.add([
        k.rect(84, 15), k.pos(0, 0), k.anchor("center"),
        k.color(255, 252, 240), k.outline(2, k.rgb(58, 39, 24)), k.opacity(0),
      ]);
      const promptTip = prompt.add([
        k.rect(6, 6), k.pos(0, 7), k.anchor("center"), k.rotate(45),
        k.color(255, 252, 240), k.opacity(0),
      ]);
      const promptText = prompt.add([
        k.text("", { size: 7, align: "center" }), k.pos(0, 0),
        k.anchor("center"), k.color(58, 39, 24), k.opacity(0),
      ]);

      let canInteract = false;
      const openOrder = () => {
        target = null;
        marker?.destroy();
        marker = null;
        window.dispatchEvent(new CustomEvent("open-package-modal"));
      };
      k.onKeyPress("space", () => { if (canInteract) openOrder(); });
      k.onKeyPress("enter", () => { if (canInteract) openOrder(); });

      // ── Player update ──
      player.onUpdate(() => {
        let vx = 0, vy = 0;
        if (held.left) vx -= 1;
        if (held.right) vx += 1;
        if (held.up) vy -= 1;
        if (held.down) vy += 1;

        // Keyboard input cancels a pending tap destination.
        if (vx !== 0 || vy !== 0) {
          target = null;
          openOnArrival = false;
          marker?.destroy();
          marker = null;
        } else if (target) {
          const dx = target.x - player.pos.x;
          const dy = target.y - player.pos.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 2) {
            player.pos.x = target.x;
            player.pos.y = target.y;
            target = null;
            marker?.destroy();
            marker = null;
            if (openOnArrival) {
              openOnArrival = false;
              // Defer a frame so the arrival pose renders before the overlay.
              k.wait(0.05, () => { if (canInteract) openOrder(); });
            }
          } else {
            vx = dx / dist;
            vy = dy / dist;
          }
        }

        const len = Math.hypot(vx, vy);
        moving = len > 0;
        if (moving) {
          player.pos.x = k.clamp(player.pos.x + (vx / len) * SPEED * k.dt(), 12, WORLD_W - 12);
          player.pos.y = k.clamp(player.pos.y + (vy / len) * SPEED * k.dt(), WALK_TOP, WALK_BOTTOM);
          if (Math.abs(vx) > Math.abs(vy)) {
            facing = "side";
            player.scale.x = vx < 0 ? -1 : 1;
          } else {
            facing = vy < 0 ? "up" : "down";
            player.scale.x = 1;
          }
          setSprite(`player-${facing}`, "walk");
        } else if (facing === "down") {
          setSprite("player-idle");
        } else {
          setSprite(`player-${facing}`, "walk");
          // Freeze the cycle on the planted frame so idling isn't a moonwalk.
          (player as unknown as { frame: number }).frame = 0;
        }

        player.z = player.pos.y;
        playerShadow.pos.x = player.pos.x;
        playerShadow.pos.y = player.pos.y - 1;
        playerShadow.z = player.pos.y - 2;

        const near =
          Math.abs(player.pos.x - STAND_X) < 46 &&
          player.pos.y > STAND_BASE_Y - 4 &&
          player.pos.y < STAND_BASE_Y + 40;
        if (near !== canInteract) {
          canInteract = near;
          const label = k.isTouchscreen() ? "TAP THE STAND TO ORDER" : "PRESS SPACE TO ORDER";
          promptText.text = label;
          promptBg.width = label.length * 4.6 + 12;
        }
        const goal = canInteract ? 1 : 0;
        const o = k.lerp(promptBg.opacity, goal, k.dt() * 12);
        promptBg.opacity = promptTip.opacity = promptText.opacity = o;
        prompt.pos.y = STAND_BASE_Y - 74 + Math.sin(k.time() * 3) * 1.5;
      });

      // ── Camera ──
      k.onUpdate(() => {
        const camX = k.clamp(player.pos.x, VIEW_W / 2, WORLD_W - VIEW_W / 2);
        k.setCamPos(camX, VIEW_H / 2);
        const scroll = camX - VIEW_W / 2;
        for (const { obj, factor, drift } of parallax) {
          obj.pos.x = -scroll * factor - (drift ? (k.time() * drift) % 260 : 0);
        }
      });

      // ── Ambient life ──
      // NPCs patrol the path; one occasionally stops at the counter and leaves
      // with a lemon, which is the whole point — the world is the business.
      art.npcs.forEach((_, i) => {
        const y = 196 + i * 9;
        const npc = k.add([
          k.sprite(`npc-${i}`, { anim: "walk" }),
          k.pos(120 + i * 165, y), k.anchor("bot"), k.z(y), k.scale(1, 1),
        ]);
        const npcShadow = k.add([
          k.sprite("shadow"), k.pos(0, 0), k.anchor("center"),
          k.scale(0.75, 0.65), k.z(y - 2),
        ]);
        let dir = i % 2 === 0 ? 1 : -1;
        let pause = 0;
        const speed = 22 + i * 5;

        npc.onUpdate(() => {
          if (pause > 0) {
            pause -= k.dt();
            npc.frame = 0;
          } else {
            npc.pos.x += dir * speed * k.dt();
            npc.scale.x = dir < 0 ? -1 : 1;
            if (npc.pos.x < 24 || npc.pos.x > WORLD_W - 24) dir *= -1;
            // Linger at the counter and buy something.
            if (Math.abs(npc.pos.x - STAND_X) < 8 && Math.random() < 0.03) {
              pause = 1.6 + Math.random() * 1.5;
              popLemon(k, npc.pos.x, npc.pos.y - 30);
            }
          }
          npcShadow.pos.x = npc.pos.x;
          npcShadow.pos.y = npc.pos.y - 1;
        });
      });

      const dog = k.add([
        k.sprite("dog", { anim: "wag" }), k.pos(470, 222),
        k.anchor("bot"), k.z(222), k.scale(1, 1),
      ]);
      let dogDir = -1;
      let dogPause = 0;
      dog.onUpdate(() => {
        if (dogPause > 0) { dogPause -= k.dt(); return; }
        dog.pos.x += dogDir * 34 * k.dt();
        dog.scale.x = dogDir < 0 ? -1 : 1;
        if (dog.pos.x < 60 || dog.pos.x > WORLD_W - 60 || Math.random() < 0.004) {
          dogDir *= -1;
          dogPause = 0.6 + Math.random();
        }
      });

      // Trees and bushes breathe on a sine so the scene is never fully static.
      [...trees, ...bushes].forEach((obj, i) => {
        obj.use(k.scale(1, 1));
        obj.onUpdate(() => {
          (obj as unknown as { scale: { x: number } }).scale.x =
            1 + Math.sin(k.time() * 1.1 + i * 1.7) * 0.014;
        });
      });

      // Leaves drifting down through the scene.
      k.loop(1.1, () => {
        const x = k.rand(0, WORLD_W);
        const leaf = k.add([
          k.rect(2, 2), k.pos(x, HORIZON - 30),
          k.color(k.choose([k.rgb(122, 196, 85), k.rgb(255, 217, 92), k.rgb(196, 160, 92)])),
          k.rotate(0), k.opacity(0.85), k.z(880), k.lifespan(6, { fade: 1 }),
        ]);
        const sway = k.rand(0, 6);
        leaf.onUpdate(() => {
          leaf.pos.y += 12 * k.dt();
          leaf.pos.x += Math.sin(k.time() * 2 + sway) * 10 * k.dt();
          leaf.angle += 60 * k.dt();
        });
      });

      // Pollen catching the light.
      k.loop(0.35, () => {
        const mote = k.add([
          k.rect(1, 1), k.pos(k.rand(0, WORLD_W), k.rand(HORIZON, VIEW_H)),
          k.color(255, 250, 205), k.opacity(0.75), k.z(870), k.lifespan(2.4, { fade: 1 }),
        ]);
        mote.onUpdate(() => { mote.pos.y -= 7 * k.dt(); });
      });

      // Grass fringe over everything, so the camera sits down in the field.
      k.add([k.sprite("fringe"), k.pos(0, VIEW_H - 8), k.z(890), k.anchor("topleft")]);

      // ── Celebration ──
      (window as CelebrateWindow).__celebrateLemonade = () => {
        const cx = player.pos.x;
        const cy = player.pos.y - 40;
        const colors = [
          k.rgb(255, 217, 92), k.rgb(255, 208, 220), k.rgb(150, 235, 200),
          k.rgb(255, 255, 255), k.rgb(201, 79, 79),
        ];
        for (let i = 0; i < 46; i++) {
          const angle = (Math.PI * 2 * i) / 46;
          const speed = k.rand(50, 130);
          const bit = k.add([
            k.rect(k.rand(2, 4), k.rand(2, 4)), k.pos(cx, cy),
            k.color(colors[i % colors.length]), k.rotate(k.rand(0, 360)),
            k.anchor("center"), k.z(950), k.opacity(1), k.lifespan(1.8, { fade: 0.6 }),
          ]);
          let vy = Math.sin(angle) * speed - 40;
          bit.onUpdate(() => {
            bit.pos.x += Math.cos(angle) * speed * k.dt();
            bit.pos.y += vy * k.dt();
            vy += 190 * k.dt();
            bit.angle += 220 * k.dt();
          });
        }
        const banner = k.add([
          k.text("ORDER PLACED!", { size: 14, align: "center" }),
          k.pos(VIEW_W / 2, VIEW_H / 2 - 30), k.anchor("center"),
          k.color(255, 232, 140), k.outline(3, k.rgb(58, 39, 24)),
          k.fixed(), k.z(960), k.opacity(1), k.lifespan(2.2, { fade: 0.8 }),
        ]);
        banner.onUpdate(() => { banner.pos.y -= 14 * k.dt(); });
      };
    });

    k.go("main");

    return () => {
      input.abort();
      delete (window as CelebrateWindow).__celebrateLemonade;
      try { k.quit(); } catch { /* already torn down */ }
    };
  }, []);

  return (
    <div className="w-full max-w-[720px]">
      <div className="relative rounded-lg border-4 border-[#5c3a1c] bg-[#2f2119] p-1 shadow-[0_6px_0_0_#2a1a10,0_10px_24px_rgba(0,0,0,0.45)]">
        <canvas ref={canvasRef} className="game-canvas rounded-sm" />
      </div>
      <p className="mt-2 text-center text-[11px] text-stone-500">
        Tap anywhere to walk · tap the stand to order
        <span className="hidden sm:inline"> · or use WASD / arrows + SPACE</span>
      </p>
    </div>
  );
}

/** Small lemon that pops above an NPC when they buy at the counter. */
function popLemon(k: KAPLAYCtx, x: number, y: number) {
  const lemon = k.add([
    k.rect(5, 4), k.pos(x, y), k.color(255, 217, 92),
    k.outline(1, k.rgb(58, 39, 24)), k.anchor("center"),
    k.z(940), k.opacity(1), k.lifespan(1.2, { fade: 0.5 }),
  ]);
  lemon.onUpdate(() => { lemon.pos.y -= 16 * k.dt(); });
}

type CelebrateWindow = Window & { __celebrateLemonade?: () => void };
