"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import kaboom from "kaboom";
import {
  registerPlayerSprite,
  drawStand,
  drawTree,
  drawGround,
  celebrate,
} from "@/lib/sprites";

interface GameProps {
  accessCode: string;
}

export default function Game({ accessCode: _accessCode }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [kInstance, setKInstance] = useState<ReturnType<typeof kaboom> | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const k = kaboom({
      canvas: canvasRef.current,
      width: 480,
      height: 360,
      scale: 2,
      background: [140, 200, 100],
      crisp: true,
    });

    k.scene("main", () => {
      // Ground and scenery
      drawGround(k);
      drawTree(k, 40);
      drawTree(k, k.width() - 60);

      // Lemonade stand
      drawStand(k);

      // Register and spawn player
      registerPlayerSprite(k);
      const player = k.add([
        k.sprite("player"),
        k.pos(60, k.height() - 95),
        k.area(),
        k.body(),
        k.scale(),
        k.anchor("center"),
        k.z(3),
        "player",
      ]);

      // Interaction zone in front of counter
      const interactZone = k.add([
        k.rect(50, 30),
        k.pos(k.width() / 2 - 25, k.height() - 105),
        k.area(),
        k.opacity(0),
        "interact-zone",
      ]);

      // Prompt text
      const prompt = k.add([
        k.text("Press SPACE to order!", { size: 10 }),
        k.pos(k.width() / 2, k.height() - 88),
        k.anchor("center"),
        k.color(255, 255, 100),
        k.opacity(0),
        k.z(5),
      ]);

      let canInteract = false;

      player.onCollide("interact-zone", () => {
        canInteract = true;
        prompt.opacity = 1;
      });

      player.onCollideEnd("interact-zone", () => {
        canInteract = false;
        prompt.opacity = 0;
      });

      // Keyboard controls
      const SPEED = 120;
      k.onKeyDown("left", () => player.move(-SPEED, 0));
      k.onKeyDown("right", () => player.move(SPEED, 0));
      k.onKeyDown("up", () => player.move(0, -SPEED));
      k.onKeyDown("down", () => player.move(0, SPEED));
      k.onKeyRelease("left", () => player.move(0, 0));
      k.onKeyRelease("right", () => player.move(0, 0));
      k.onKeyRelease("up", () => player.move(0, 0));
      k.onKeyRelease("down", () => player.move(0, 0));

      k.onKeyPress("space", () => {
        if (canInteract) {
          k.burp();
          window.dispatchEvent(new CustomEvent("open-package-modal"));
        }
      });

      // Clamp to bounds
      player.onUpdate(() => {
        player.pos.x = Math.max(10, Math.min(k.width() - 10, player.pos.x));
        player.pos.y = Math.max(k.height() - 110, Math.min(k.height() - 15, player.pos.y));

        // Idle animation
        player.scale = k.vec2(1 + Math.sin(k.time() * 3) * 0.03);
      });

      // Mobile tap-to-interact alternative
      k.onClick("interact-zone", () => {
        if (canInteract) {
          window.dispatchEvent(new CustomEvent("open-package-modal"));
        }
      });
    });

    k.go("main");
    setKInstance(k);

    // Expose celebrate to window
    (window as any).__celebrateLemonade = () => celebrate(k);

    return () => {
      delete (window as any).__celebrateLemonade;
      // Kaboom v3000 cleanup — cast to any to bypass strict types
      try { (k as any).destroy(); } catch {}
    };
  }, []);

  // Mobile D-pad
  const sendKey = useCallback((key: string) => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key }));
  }, []);

  const releaseKey = useCallback(() => {
    ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].forEach((key) => {
      window.dispatchEvent(new KeyboardEvent("keyup", { key }));
    });
  }, []);

  const btnClass =
    "w-12 h-12 bg-stone-700/80 text-amber-400 text-lg rounded active:bg-amber-600 flex items-center justify-center select-none touch-none";

  return (
    <div className="flex flex-col items-center">
      <canvas
        ref={canvasRef}
        width={480}
        height={360}
        className="mx-auto border-4 border-stone-700 rounded-lg max-w-full h-auto"
      />
      {/* D-pad: visible only on touch devices */}
      <div className="grid grid-cols-3 gap-1 mt-3 sm:hidden">
        <div />
        <button
          className={btnClass}
          onTouchStart={() => sendKey("ArrowUp")}
          onTouchEnd={releaseKey}
        >
          ▲
        </button>
        <div />
        <button
          className={btnClass}
          onTouchStart={() => sendKey("ArrowLeft")}
          onTouchEnd={releaseKey}
        >
          ◀
        </button>
        <div className={btnClass} />
        <button
          className={btnClass}
          onTouchStart={() => sendKey("ArrowRight")}
          onTouchEnd={releaseKey}
        >
          ▶
        </button>
        <div />
        <button
          className={btnClass}
          onTouchStart={() => sendKey("ArrowDown")}
          onTouchEnd={releaseKey}
        >
          ▼
        </button>
        <div />
      </div>
    </div>
  );
}
