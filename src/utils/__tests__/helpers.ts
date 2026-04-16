import { INITIAL_WORLD } from "../../constants/editor";
import type { World } from "../../types/world";

/** Returns a fresh copy of the empty initial world. */
export function emptyWorld(): World {
  return structuredClone(INITIAL_WORLD);
}

/** Returns a world with foundation placed. */
export function worldWithFoundation(): World {
  return {
    ...emptyWorld(),
    foundation: { x: 0, y: 0, width: 1400, height: 1400, type: "floor" },
  };
}

/** Returns a world with foundation + pillars + walls. */
export function worldWithStructure(): World {
  return {
    ...worldWithFoundation(),
    pillars: [
      { id: "p1", x: 0, y: 0, size: 28 },
      { id: "p2", x: 200, y: 0, size: 28 },
      { id: "p3", x: 200, y: 200, size: 28 },
      { id: "p4", x: 0, y: 200, size: 28 },
    ],
    walls: [
      { id: "w1", x1: 0, y1: 0, x2: 200, y2: 0, thickness: 20 },
      { id: "w2", x1: 200, y1: 0, x2: 200, y2: 200, thickness: 20 },
      { id: "w3", x1: 200, y1: 200, x2: 0, y2: 200, thickness: 20 },
      { id: "w4", x1: 0, y1: 200, x2: 0, y2: 0, thickness: 20 },
    ],
  };
}

/** Returns a mostly-complete world for late-stage dialogue tests. */
export function worldAlmostComplete(): World {
  return {
    ...worldWithStructure(),
    doors: [{ id: "d1", wallId: "w1", t: 0.5, width: 60 }],
    windows: [{ id: "win1", wallId: "w2", t: 0.5, width: 80, height: 60 }],
    roofs: [
      {
        id: "r1",
        x: 0,
        y: 0,
        width: 200,
        height: 200,
        style: "gable",
        overhang: 40,
        pitch: 30,
      },
    ],
    furniture: [
      { id: "f1", type: "bed", x: 40, y: 40, width: 120, height: 80 },
    ],
  };
}
