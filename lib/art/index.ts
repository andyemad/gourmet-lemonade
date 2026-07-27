import { buildCharacters } from "./characters";
import {
  buildBarrel, buildBush, buildClouds, buildFence, buildFringe, buildGround,
  buildHills, buildShadow, buildSign, buildSky, buildStand, buildTapMarker,
  buildTree, buildTreeline,
} from "./world";

export * from "./world";

/** Every canvas the game loads, drawn once at startup. */
export function buildArt() {
  return {
    ...buildCharacters(),
    sky: buildSky(),
    clouds: buildClouds(),
    hills: buildHills(),
    treeline: buildTreeline(),
    ground: buildGround(),
    fringe: buildFringe(),
    stand: buildStand(),
    tree: buildTree(),
    bush: buildBush(),
    fence: buildFence(),
    sign: buildSign(),
    barrel: buildBarrel(),
    shadow: buildShadow(),
    tapMarker: buildTapMarker(),
  };
}

export type Art = ReturnType<typeof buildArt>;
