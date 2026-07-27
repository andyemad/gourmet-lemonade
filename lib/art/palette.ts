// One warm late-afternoon palette shared by every sprite in the game, so the
// scene reads as a single illustration. Light comes from the upper left, which
// is why every "shade" tone lands on a sprite's right side.

export const INK = "#2b1f2e";
export const INK_SOFT = "#4a3550";

/** Sprite palette. Keys are the characters used in the art rows. */
export const ART: Record<string, string> = {
  O: INK,
  o: INK_SOFT,

  // skin
  s: "#f7d3a8",
  S: "#d9a97c",
  E: "#3a2a36",
  m: "#b56a5c",
  k: "#e8a98d", // blush

  // hair
  h: "#7a4a28",
  H: "#5c341a",

  // clothes — player
  T: "#5aa9e6",
  t: "#3d82be",
  a: "#4a94d1",
  y: "#ffd95c",
  Y: "#e0aa2e",
  p: "#4a5878",
  P: "#353f5c",
  b: "#4b3526",

  // wood / stand
  w: "#c08a4e",
  W: "#9a6835",
  d: "#7a4e26",
  D: "#5c3a1c",
  l: "#e0b478", // light plank

  // lemonade & glass
  L: "#ffe066",
  i: "#fff3b0",
  g: "#cfeff5",
  G: "#9dd8e8",

  // greenery
  n: "#5aa84a",
  N: "#3f8433",
  v: "#79c455",
  V: "#2f6b2c",

  // misc
  r: "#e05c5c",
  R: "#b03e42",
  c: "#ffffff",
  C: "#d8d2c4",
  q: "#f0e6d2", // parchment / sign face
  z: "#2f3a52",
};

/** NPC variants: a palette swap plus a hairstyle is enough visual variety. */
export interface NpcLook {
  skin: string;
  skinShade: string;
  hair: string;
  hairShade: string;
  shirt: string;
  shirtShade: string;
  sleeve: string;
  pants: string;
  pantsShade: string;
  shoes: string;
  /** Which authored hairstyle block to wear. */
  style: "short" | "bun" | "long" | "cap";
}

export const NPC_LOOKS: NpcLook[] = [
  {
    skin: "#c98d5f", skinShade: "#a06f45",
    hair: "#2e1d16", hairShade: "#1d120d",
    shirt: "#e06b5c", shirtShade: "#b54c43", sleeve: "#cc5c50",
    pants: "#3b4763", pantsShade: "#2a3348", shoes: "#3a2a1e",
    style: "short",
  },
  {
    skin: "#8d5a3a", skinShade: "#6e4429",
    // Lighter than the hair, not darker — `hairShade` is what draws the bun,
    // and a near-black bun on near-black hair is invisible.
    hair: "#2c1f18", hairShade: "#57402e",
    shirt: "#6cc4a1", shirtShade: "#489a7b", sleeve: "#5db593",
    pants: "#6b5b47", pantsShade: "#4e4132", shoes: "#2f2419",
    style: "bun",
  },
  {
    skin: "#f2cfa6", skinShade: "#d3a97c",
    hair: "#c9903c", hairShade: "#a06f26",
    shirt: "#a882d8", shirtShade: "#8560b0", sleeve: "#9a74c9",
    pants: "#4a5878", pantsShade: "#353f5c", shoes: "#3a2a1e",
    style: "long",
  },
  {
    skin: "#e0ac7c", skinShade: "#bd8a5c",
    hair: "#4a3020", hairShade: "#332013",
    shirt: "#f0a84c", shirtShade: "#c4813a", sleeve: "#dd9944",
    pants: "#3f4a3a", pantsShade: "#2c352a", shoes: "#4b3526",
    style: "cap",
  },
];

/** Turn an NPC look into the char→color map the shared art rows expect. */
export function npcPalette(look: NpcLook): Record<string, string> {
  return {
    ...ART,
    s: look.skin,
    S: look.skinShade,
    h: look.hair,
    H: look.hairShade,
    T: look.shirt,
    t: look.shirtShade,
    a: look.sleeve,
    p: look.pants,
    P: look.pantsShade,
    b: look.shoes,
    // NPCs wear no apron; fold those keys back into the shirt.
    y: look.shirt,
    Y: look.shirtShade,
  };
}
