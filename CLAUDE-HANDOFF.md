# Gourmet Lemonade — Claude Handoff

**Live:** https://gourmet-lemonade.vercel.app
**Admin:** https://gourmet-lemonade.vercel.app/admin
**Repo:** https://github.com/andyemad/gourmet-lemonade

---

## What This Is

A gamified ordering system for a gourmet lemonade business. Instead of a form,
customers walk a pixel-art character up to a lemonade stand in a living scene,
pick flavors, and place real orders. The seller sees incoming orders at `/admin`.

There is no access gate — the site opens straight to the game, for anyone with
the URL. The one-time-code system was removed on 2026-07-27 (see Removed
Features); recover it from git history if the business ever wants it back.

---

## The Vision (Reference Tweet)

https://x.com/pricefoulger/status/2080851734730342514 — @pricefoulger on
building a roofing CRM as a tycoon game, where leveling up in the game mirrors
the real business.

The core idea: **the game IS the business interface, not a skin on a form.**

---

## Business Details

- **Product:** Gourmet small-batch lemonade
- **2 Flavors:** Ice Cream Lemonade, Runts Lemonade
- **4 Package Tiers:** Taster 3.5 glasses $25 · Weekender 7 $50 ·
  Half Case 14 $100 · Full Case 28 $200
- **Flow:** walk to stand → package → assign flavors → pickup ETA → confirm →
  seller sees it on the dashboard → session resets

---

## Tech Stack

- **Next.js 16.2** (App Router, Turbopack, TypeScript)
- **KAPLAY 3001** — migrated off the deprecated Kaboom.js
- **Tailwind CSS 4** for the menus and admin panel
- **Storage:** currently the in-memory Map fallback in `lib/kv.ts` — no real
  store is connected yet (see Known Issues)
- **No image files.** Every sprite is generated as real pixel art at runtime.

---

## File Structure

```
app/
  page.tsx              — Game page + order flow state machine
  layout.tsx            — Fonts (Geist + Press Start 2P) and metadata
  globals.css           — Tailwind theme, in-game panel chrome, canvas sizing
  admin/page.tsx        — Admin dashboard (view orders, advance status)
  api/                  — order, admin/orders

components/
  Game.tsx              — KAPLAY scene: parallax, y-sorting, tap-to-move, camera
  Modals.tsx            — Order flow panels (package → flavor → ETA → confirm → success)

lib/art/
  pixel.ts              — Painter: character-grid art → canvas; strip/mirror/stack/dither
  palette.ts            — The one shared palette + NPC look variants
  characters.ts         — Player, NPCs, dog: torso + leg art, walk-cycle assembly
  world.ts              — Sky, hills, treeline, ground, stand and props
  index.ts              — buildArt(): every canvas the game loads

lib/
  types.ts, orders.ts, kv.ts, sounds.ts
```

---

## How The Art Works

Read this before touching `lib/art/` — the system is small but has rules.

**Sprites are authored as rows of characters**, one char per pixel, mapped
through a palette in `palette.ts`. `paint()` pads rows to the widest row, so you
never have to count columns:

```ts
const HEAD = [
  "......OOOOOOOO......",
  ".....OhhhhhhhhO.....",
];
```

`.` and space are transparent. Any char without a palette entry is skipped.

**Walk cycles are assembled, not drawn frame by frame.** A character is a torso
block plus a separate 8-row leg block. `walkFrames()` pairs the torso with a
stand pose and a step pose, mirrors the step for the opposite foot, and drops
the torso 1px on passing frames so the walk has weight. That's why there are
only two authored leg poses per direction instead of eight.

**NPC variety is a palette swap plus a hairstyle**, not new bodies. Add a look to
`NPC_LOOKS` and it becomes a new NPC. `hairShade` is what draws the bun, so it
must be *lighter* than `hair`, not darker.

**Everything is one pixel density.** The player is 26px tall, so 1px ≈ 6.7cm, and
every prop is sized off that (the stand is 62px ≈ 2.4m, trees ~76px ≈ 5m). This
is the easiest thing to get wrong — an earlier version had a stand 4.5× the
player's height and the whole scene read as toys. If you add a prop, size it
against the 26px player before anything else.

**Backgrounds are baked once** into wide canvases (`buildGround`, `buildHills`,
…) using a seeded RNG, so scattered detail is identical on every load.

To inspect sprites, render `buildArt()`'s canvases into a scratch page at 6×
zoom — far faster than squinting at the game.

---

## How The Scene Works

- **Viewport is 320×240 at scale 3.** The world is 760px wide; the camera follows
  the player horizontally and clamps at the edges.
- **Parallax** layers are screen-`fixed()` objects repositioned each frame from
  the camera offset (factor 0 = pinned to viewport, 1 = locked to world).
- **Depth** is `z = pos.y`, so walking behind the stand puts you behind it.
- **Tap-to-move** replaced the mobile D-pad: tap anywhere to walk there, tap the
  stand to walk over and open the menu on arrival. Keyboard (WASD/arrows +
  SPACE) still works.

---

## Menus

The order flow stays in **HTML, styled as in-game wooden panels** (`.panel`,
`.pixel-btn`, `.pixel-card` in `globals.css`) rather than being drawn on the
canvas. Canvas text at 320×240 is unreadable on a phone and unselectable by
screen readers, and this is a real ordering interface — clarity wins. Cohesion
comes from sharing the scene's palette, the pixel font, and the chunky
ink-outlined chrome.

---

## Known Issues / Gotchas

1. **Storage is in-memory in production.** `lib/kv.ts` only uses a real store
   when `KV_URL` / `KV_REST_API_URL` is set — and as of 2026-07-27 the Vercel
   project has **no env vars at all** (`vercel env ls` is empty). So it always
   takes the in-memory Map branch, and on serverless each instance has its own.
   Orders can vanish between requests. Worse, it degrades *silently* — a
   `console.warn` and nothing else, so the site looks healthy.

   Do **not** follow the old advice to set the four `KV_*` vars: Vercel KV has
   been retired and the marketplace provisions `UPSTASH_REDIS_REST_*` instead.
   See Open Thread #1 for the current path.

2. **KAPLAY's pointer mapping ignores CSS scaling.** It computes
   `(clientX - rect.left) / scale`, which is only right when the canvas is
   displayed at its backing-store size. This canvas is responsive, so
   `Game.tsx` maps pointer coords off the element's real
   `getBoundingClientRect()` instead. Don't switch back to `k.mousePos()` for
   world-space hit testing.

3. **KAPLAY overwrites `canvas.style.cssText`**, wiping every inline style React
   sets — including sizing. That's why `.game-canvas` uses `!important`. Styling
   the canvas via a React `style` prop will silently do nothing.

4. **Sliced sprites need explicit `anims`.** `loadSprite(name, canvas, { sliceX: 4 })`
   alone does not create named animations.

5. **SSR guard.** `sessionId()` in `app/page.tsx` needs the
   `typeof window === "undefined"` check because the page is prerendered.

6. **Pre-existing lint errors** in `app/admin/page.tsx` (setState in an effect)
   and `lib/kv.ts` (`any` types). Untouched — they predate the art work.

---

## Fixed In This Pass

- **Taster was unorderable.** It's 3.5 glasses but the flavor stepper moved in
  whole glasses, so `remaining` never reached 0 and Continue stayed disabled
  forever. The stepper now uses a 0.5 step for fractional packages.
- **Conditional hooks.** `FlavorModal` and `ETAModal` returned `null` before
  calling `useState`, so opening them changed the hook count mid-render. Modals
  are now mounted only while open.
- **Tap coordinates** and **canvas overflow on mobile** (items 2 and 3 above).

---

## Open Threads / Next Steps

Nothing here is blocking — the site is live and takes orders — but in priority
order:

1. **Connect real storage.** This is the only thing standing between the site
   and reliably taking real orders. Orders currently live in an in-memory Map,
   and on Vercel each serverless instance has its own, so an order can be
   written by one instance and be invisible to the admin panel served by
   another.

   **The original instructions here were wrong and cost nothing to correct:**
   Vercel KV has been retired as a product, so "create a KV store and set the
   four `KV_*` env vars" no longer describes anything real. The path today is
   **Upstash Redis via the Vercel Marketplace** (`vercel integration add
   upstash`, or the dashboard), which provisions `UPSTASH_REDIS_REST_URL` /
   `UPSTASH_REDIS_REST_TOKEN` — *not* `KV_*`. That means `lib/kv.ts` also needs
   its `@vercel/kv` import swapped for `@upstash/redis` and its env check
   updated, or it will silently keep using the in-memory Map. Only `orders.ts`
   consumes `kv` now, so the blast radius is one file.

   While changing it, make production **fail loudly** instead of falling back:
   the silent `console.warn` at `lib/kv.ts` is why the site looks healthy while
   dropping orders. Needs Emad to create the store — it bills to his account.
2. ~~**Decide on the code gate.**~~ Done 2026-07-27 — removed. See Removed
   Features below.
3. **Pre-existing lint errors** in `app/admin/page.tsx` (setState inside an
   effect) and `lib/kv.ts` (`any` types). Deliberately untouched — they predate
   the art work and are unrelated to it.
4. **`Order.code` is misnamed.** It carries the `GUEST-xxxxx` session id from
   `page.tsx`, not an access code — a leftover from the gate. Renaming it to
   `sessionId` would touch `types.ts`, `orders.ts`, `page.tsx` and the order
   route. Left alone deliberately; cheapest to do before real storage exists.
5. **The admin panel never got the game treatment.** It's still the original
   Tailwind styling while the customer side is now pixel art. Fine as-is (it's
   an internal tool), but it's the obvious next visual step if Emad wants it.
6. **Possible depth work**, only if asked: a day/night tint, more NPC bodies
   (currently one silhouette with palette swaps), or the tycoon-progression
   angle from the source tweet — none of it requested yet.

---

## Removed Features

### One-time access codes (removed 2026-07-27)

Customers used to need a 6-character code to reach the ordering flow. Commit
`f573432` unwired it from the customer side; the rest was deleted on
2026-07-27. Gone: `components/CodeGate.tsx`, `lib/codes.ts`,
`app/api/validate-code/`, `app/api/admin/codes/`, the `AccessCode` type, the
admin panel's generate/stats UI, and the now-orphaned set operations
(`sadd`/`smembers`) in `lib/kv.ts`.

**Why deleting beat wiring it back up** — worth knowing before anyone restores
it:

- **It could not have worked.** `lib/codes.ts` stored codes through the same
  `kv` wrapper as orders, which in production is the per-instance in-memory
  Map. The seller generates codes on one instance; the customer's
  `/api/validate-code` request lands on another with an empty Map and gets
  "Invalid code". A wired gate would have blocked paying customers outright —
  strictly worse than the orders bug, which at least fails quietly. **Any
  revival is blocked on Open Thread #1.**
- **The component had no salvage value.** `CodeGate.tsx` was in the pre-art
  Tailwind style (stone/amber, `rounded-xl`, 🍋 emoji) while the customer side
  is now authored pixel art in wooden panels. It would have been rewritten, not
  reused.
- **The admin panel was advertising a dead feature** — "Generate codes and share
  the game URL with your customers" — so the seller could hand out codes that
  did nothing.

Recover the whole system from git history if the business ever wants a gate.

---

## Business Owner Notes

- Real customer orders — fun matters, but the ordering must stay clear.
- Seller checks `/admin` for incoming orders.
- Each customer session resets completely after confirmation.
- No accounts, no login, no customer-side persistence.
