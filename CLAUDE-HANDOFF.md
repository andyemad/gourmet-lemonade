# Gourmet Lemonade — Claude Handoff

**Live:** https://gourmet-lemonade.vercel.app
**Admin:** https://gourmet-lemonade.vercel.app/admin
**Repo:** https://github.com/andyemad/gourmet-lemonade

---

## What This Is

A gamified ordering system for a gourmet lemonade business. Instead of a boring order form, customers walk a pixel-art character up to a lemonade stand in a living game world, pick flavors, and place real orders. The seller sees incoming orders on an admin dashboard.

**The code gate has been disabled.** The site opens directly to the game. The admin panel (`/admin`) still has a code generation system if you want to gate access later.

---

## The Vision (Reference Tweet)

https://x.com/pricefoulger/status/2080851734730342514

Price Foulger (@pricefoulger) — 966K views:

> "Seriously considering building my roofing company's custom CRM as a tycoon game. Every project would be a real project I have. My agents would handle real customer communication in the game, as well as project req's like subcontract agreements and permits. Growth and leveling up in the game mirrors my real life business. This would make me want to play (work) all day"

The core idea: **the game IS the business interface, not a skin on top of a form.** The current build is functional but the graphics are basic programmatic rectangles — the user wants this to feel like a real pixel-art game, not placeholder shapes.

---

## Business Details

- **Product:** Gourmet small-batch lemonade
- **2 Flavors:** Ice Cream Lemonade, Runts Lemonade
- **4 Package Tiers:**
  - Taster — 3.5 glasses — $25
  - Weekender — 7 glasses — $50
  - Half Case — 14 glasses — $100
  - Full Case — 28 glasses — $200
- **Flow:** Customer walks character to stand → picks package → assigns flavors to each glass → sets pickup ETA → confirms → seller sees order on dashboard

---

## Tech Stack

- **Next.js 16.2** (App Router, Turbopack, TypeScript)
- **Kaboom.js 3000** (deprecated — successor is KAPLAY. Consider migrating)
- **Vercel KV** for storage (currently falling back to in-memory because no KV store is connected — orders reset on cold start)
- **Tailwind CSS** for UI modals and admin panel
- **No external image assets** — all sprites are drawn programmatically on canvas

---

## File Structure

```
app/
  page.tsx              — Main game page (no code gate, goes straight to game)
  layout.tsx            — Root layout with metadata
  globals.css           — Tailwind + mobile fixes
  admin/
    page.tsx            — Admin dashboard (generate codes, view orders)
  api/
    validate-code/route.ts  — POST: validate one-time access code
    order/route.ts          — POST: submit order
    admin/codes/route.ts    — GET stats, POST generate codes
    admin/orders/route.ts   — GET list, PATCH update status

components/
  Game.tsx              — Kaboom canvas, all game logic, player, NPCs, particles
  Modals.tsx            — All modals: Package, Flavor, ETA, Confirm, Success
  CodeGate.tsx          — Code entry screen (currently unused, kept for future)

lib/
  types.ts              — Shared types: packages, flavors, orders, codes
  sprites.ts            — Pixel art sprite generation (canvas-based, all programmatic)
  orders.ts             — Order CRUD via KV
  codes.ts              — Access code generation/validation via KV
  kv.ts                 — KV wrapper (Vercel KV in prod, in-memory Map in dev)
  pixel-styles.ts       — Tailwind classes for pixel-art themed UI
  sounds.ts             — Web Audio API sound effects (no audio files)
```

---

## What's Built (Current State)

### Game World
- Animated player character with 4-direction walk cycles
- 3 roaming NPCs with different colors
- A dog wandering the scene
- Lemonade stand with striped awning, wood counter, string lights, bottles
- Environment: clouds, layered trees, flowers, fence posts, dirt path
- Ambient particles: falling leaves, sparkles near the stand
- Speech bubble when approaching the counter
- Celebration particle burst on order confirmation

### Order Flow
- Walk to stand → "Press SPACE to order!" → package selection modal → flavor assignment with progress bar → ETA selection → confirmation → success with celebration
- Full session reset after order (game unmounts, storage cleared)

### Sound
- Confirm chime, success fanfare, error buzz — all Web Audio API, no files

### Admin Panel
- Generate 10 access codes at a time (copy to clipboard)
- Live order feed with auto-refresh
- Sound alert on new orders
- Mark orders: new → prepping → ready → picked up
- Code stats: remaining / total

---

## What Needs to Be Better (Graphics Priority)

The current sprites are programmatic rectangles drawn on tiny canvases. They work but look basic. Here's what needs dramatic improvement:

### 1. Real Pixel Art Sprites
- Replace all programmatic sprites with actual pixel art
- Consider using a sprite sheet from a free asset pack (itch.io has many) or generating proper pixel art with a tool
- Player needs: idle animation (breathing/blinking), 4-frame walk in 4 directions, maybe a wave/interact animation
- NPCs need personality — different body types, accessories
- The stand should look like a real pixel art building with depth and detail

### 2. Scene Composition
- The background is flat green rectangles. Needs: parallax layers, varied terrain, maybe a town/city backdrop
- Day/night cycle or at least richer ambient lighting
- More environmental detail: cobblestone path texture, grass tufts, bushes with berries
- The fence is just posts — needs horizontal rails

### 3. Kaboom → KAPLAY Migration
- Kaboom is deprecated and no longer maintained
- KAPLAY (https://kaplayjs.com) is the successor with better sprite support, more components, active development
- Worth migrating for better graphics capabilities and long-term support

### 4. UI/Modals
- The modals have pixel-themed CSS (chunky borders, hard shadows) but could be much more game-like
- Consider rendering the order UI inside the game canvas instead of as HTML overlays
- Or make the modals look like in-game menus (think Stardew Valley shop interface)

### 5. Mobile Experience
- The D-pad works but is ugly
- Could use a virtual joystick or tap-to-move
- Canvas scaling for different screen sizes

---

## Known Issues

1. **KV Storage:** Vercel KV is deprecated. The app falls back to in-memory Map. On Vercel serverless, different instances don't share state — so codes/orders may not persist across requests. Fix: connect a Vercel KV store (still works despite deprecation) or migrate to Upstash Redis. The env vars to set: `KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN`.

2. **Kaboom Deprecation:** Using kaboom@3000.1.17. Consider migrating to KAPLAY.

3. **Sprite Animation Gotcha:** When loading sliced sprites with `loadSprite(name, canvas, { sliceX: 4 })`, you MUST define `anims` explicitly — sliceX alone doesn't create named animations. Example in `components/Game.tsx` lines 27-47.

4. **SSR Guard:** The `sessionId()` function in `app/page.tsx` needs the `typeof window === "undefined"` guard because Next.js tries to prerender the page.

---

## Prompt for Claude

> I have a gamified lemonade ordering site at https://github.com/andyemad/gourmet-lemonade — deployed at https://gourmet-lemonade.vercel.app. The concept is inspired by this tweet from @pricefoulger: "building my roofing company's custom CRM as a tycoon game... growth and leveling up in the game mirrors my real life business." The game IS the ordering interface — customers walk a pixel character up to a stand and place real orders.
>
> The current build is functional but the graphics are basic programmatic rectangles. I need you to dramatically improve the visual quality. Specifically:
>
> 1. Replace all programmatic sprites with real pixel art. Use high-quality sprite sheets — either from free asset packs (itch.io, OpenGameArt) or generate proper pixel art. The player needs idle + 4-direction walk animations. NPCs need variety. The lemonade stand should look like a real pixel art building.
>
> 2. Make the scene feel rich — parallax backgrounds, better terrain, ambient details. Think Stardew Valley or a pixel-art tycoon game.
>
> 3. Consider migrating from Kaboom.js (deprecated) to KAPLAY (kaplayjs.com) for better sprite support and active development.
>
> 4. The modals are HTML overlays with pixel-themed CSS. If possible, render the ordering UI inside the game canvas for a more cohesive feel — like an in-game shop menu.
>
> 5. The mobile D-pad is functional but ugly. Improve it or replace with tap-to-move / virtual joystick.
>
> Keep the existing order flow intact (package selection → flavor assignment → ETA → confirm → reset). The admin panel at /admin should continue working. The site is deployed on Vercel. There's no KV store connected yet — orders use in-memory storage.
>
> Make this feel like a game someone would actually want to play, not a form with pixel art slapped on it. The tweet's philosophy should guide the design: the game IS the business.

---

## Business Owner Notes

- This is for real customer orders — the game needs to be fun but the ordering must be clear and functional
- Seller checks `/admin` for incoming orders
- Each customer session resets completely after order confirmation
- The code gate system is built but disabled — can re-enable from admin panel later
- No user accounts, no login, no persistence for customers
