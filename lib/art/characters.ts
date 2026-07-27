// Character art. Everything is authored on a 20px-wide grid at native
// resolution: a torso block plus a separate 8-row leg block. Walk cycles are
// built by pairing the torso with leg poses, mirroring the step pose for the
// opposite foot, and dropping the torso 1px on passing frames so the walk has
// weight instead of sliding.

import { ART, NPC_LOOKS, npcPalette, type NpcLook } from "./palette";
import { mirror, stack, strip, paint } from "./pixel";

// ── Player torsos ────────────────────────────────────────────────────────────

const HEAD_TOP = [
  "......OOOOOOOO......",
  ".....OhhhhhhhhO.....",
  ".....OhhhhhhhhO.....",
  ".....OhhhhhhhhO.....",
];

// Shoulders slope out of the neck instead of starting as one flat outline row —
// a straight 14px bar was reading as a plank laid across everyone's chest.
const SHOULDERS = "....OOOOTTTTOOOO....";

const TORSO_DOWN = [
  ...HEAD_TOP,
  ".....OhssssssHO.....",
  ".....OhsEssEsHO.....",
  ".....OhsEssEsHO.....",
  ".....OhskssksHO.....",
  ".....OsssmmssSO.....",
  "......OSSSSSSO......",
  ".......OSSSSO.......",
  SHOULDERS,
  "....OaaTTTTTTttO....",
  "....OaaTYYYYTttO....",
  "....OaaTyyyyTttO....",
  "....OaayyyyyyttO....",
  "....OssyyyyyySSO....",
  "......OYyyyyYO......",
];

const TORSO_UP = [
  ...HEAD_TOP,
  ".....OhhhhhhhHO.....",
  ".....OhhhhhhhHO.....",
  ".....OhhhhhhhHO.....",
  ".....OhhhhhhhHO.....",
  ".....OShhhhhhSO.....",
  "......OSSSSSSO......",
  ".......OSSSSO.......",
  SHOULDERS,
  "....OaaTTTTTTttO....",
  "....OaaTTTTTTttO....",
  "....OaaTTYYYYttO....",
  "....OaaTTTTTTttO....",
  "....OssTTTTTTSSO....",
  "......OTTTTTTO......",
];

/** Right-facing. The left-facing sprite is this one flipped at runtime. */
const TORSO_SIDE = [
  ...HEAD_TOP,
  ".....OhhhhssssO.....",
  ".....OhhhhsEssO.....",
  ".....OhhhhsEssO.....",
  ".....OhhhhssksO.....",
  ".....OShhhssmsO.....",
  "......OSSSSSSO......",
  ".......OSSSSO.......",
  SHOULDERS,
  "....OTTTTTTTTaaO....",
  "....OTYYYYYYTaaO....",
  "....OTyyyyyyTaaO....",
  "....OTyyyyyyTaaO....",
  "....OTyyyyyyTssO....",
  ".....OyyyyyyO.......",
];

// ── Legs ─────────────────────────────────────────────────────────────────────

// Legs are 8px across at the waistband to sit under the tapered torso; a
// 10px waistband made the hips wider than the shoulders.
const LEGS_FRONT_STAND = [
  ".....OppppppppO.....",
  ".....OpppOOpppO.....",
  ".....OpppOOpppO.....",
  ".....OpppOOpppO.....",
  ".....OPPPOOPPPO.....",
  ".....ObbbOObbbO.....",
  "....OObbbOObbbOO....",
  "....OOOOO..OOOOO....",
];

const LEGS_FRONT_STEP = [
  ".....OppppppppO.....",
  ".....OpppOOpppO.....",
  ".....OpppOOpppO.....",
  ".....OpppOOPPPO.....",
  ".....OPPPOObbbO.....",
  ".....ObbbOOOOOO.....",
  "....OObbbOO.........",
  "....OOOOO...........",
];

const LEGS_SIDE_STAND = [
  ".....OppppppppO.....",
  ".....OpppOOpppO.....",
  ".....OpppOOpppO.....",
  ".....OpppOOpppO.....",
  ".....OPPPOOPPPO.....",
  "....ObbbbOObbbbO....",
  "...OObbbbOObbbbOO...",
  "...OOOOOO..OOOOOO...",
];

const LEGS_SIDE_STEP = [
  ".....OppppppppO.....",
  ".....OpppOOpppO.....",
  ".....OpppOOpppO.....",
  "....OPPP..PPPPO.....",
  "...OPPP.....PPPO....",
  "...Obbbb...bbbbO....",
  "..OObbbb...bbbbOO...",
  "..OOOOOO...OOOOOO...",
];

/**
 * Four-frame cycle: stand, step, stand, opposite step. The two step frames
 * lift the torso 1px (dy -1 overlaps torso and legs by a row).
 */
function walkFrames(torso: string[], stand: string[], step: string[]): string[][] {
  const planted = stack({ rows: torso }, { rows: stand });
  const lifted = (legs: string[]) => stack({ rows: torso }, { rows: legs, dy: -1 });
  return [planted, lifted(step), planted, lifted(mirror(step))];
}

// ── NPC hairstyles ───────────────────────────────────────────────────────────

// Each style replaces the top of the side-view torso. `long` runs past the
// hairline because the hair has to fall over the shoulders to read at all.
const STYLES: Record<NpcLook["style"], string[]> = {
  short: HEAD_TOP,
  bun: [
    "......OOOOOOOO......",
    "....OOhhhhhhhhO.....",
    "...OHHhhhhhhhhO.....",
    "...OHHhhhhhhhhO.....",
  ],
  long: [
    "......OOOOOOOO......",
    ".....OhhhhhhhhO.....",
    "....OhhhhhhhhhO.....",
    "....OhhhhhhhhhO.....",
    "....OhhhhhssssO.....",
    "....OhhhhhsEssO.....",
    "....OhhhhhsEssO.....",
    "....OhhhhhssksO.....",
    "....OHhhhSssmsO.....",
  ],
  cap: [
    "......OOOOOOOO......",
    ".....OrrrrrrrrO.....",
    ".....OrrrrrrrrO.....",
    ".....ORRRRRRRROOO...",
  ],
};

/** NPCs are only ever seen from the side, so they need one torso each. */
function npcTorso(look: NpcLook): string[] {
  const head = STYLES[look.style];
  return [...head, ...TORSO_SIDE.slice(head.length)];
}

// ── Dog ──────────────────────────────────────────────────────────────────────

const DOG_PAL: Record<string, string> = {
  ...ART,
  w: "#d9a05b",
  W: "#b07c3c",
  l: "#f2ddb8",
  n: "#2b1f14",
};

/** Facing right, tail on the left. The body's top edge is a continuous
 *  outline — an earlier version broke it and the dog read as a flat blob. */
const DOG_BODY = [
  ".OwwwwwwwwwwwwwwnO",
  ".OwwwwwwwwwwwwwwO.",
  ".OwwlllllllwwwwO..",
  ".OWlllllllllwwWO..",
  "..OWWWWWWWWWWWO...",
  "..OWO..OWO.OWO....",
  "..OOO..OOO.OOO....",
];

const DOG_BASE = [
  ".............OOO..",
  "...OO.......OwwwO.",
  "..OwwO.....OwwwwwO",
  "..OwwOOOOOOwEwwwwO",
  ...DOG_BODY,
];

const DOG_WAG = [
  "..OO.........OOO..",
  "..OwwO......OwwwO.",
  "...OwwO....OwwwwwO",
  "....OwOOOOOwEwwwwO",
  ...DOG_BODY,
];

// ── Build ────────────────────────────────────────────────────────────────────

export function buildCharacters() {
  const npcs = NPC_LOOKS.map((look) => {
    const pal = npcPalette(look);
    return strip(walkFrames(npcTorso(look), LEGS_SIDE_STAND, LEGS_SIDE_STEP), pal);
  });

  return {
    playerIdleDown: paint(stack({ rows: TORSO_DOWN }, { rows: LEGS_FRONT_STAND }), ART),
    playerDown: strip(walkFrames(TORSO_DOWN, LEGS_FRONT_STAND, LEGS_FRONT_STEP), ART),
    playerUp: strip(walkFrames(TORSO_UP, LEGS_FRONT_STAND, LEGS_FRONT_STEP), ART),
    playerSide: strip(walkFrames(TORSO_SIDE, LEGS_SIDE_STAND, LEGS_SIDE_STEP), ART),
    npcs,
    dog: strip([DOG_BASE, DOG_WAG], DOG_PAL),
  };
}
