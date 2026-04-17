import {
  DEFAULT_FOUNDATION_HEIGHT,
  DEFAULT_FOUNDATION_WIDTH,
  DEFAULT_PILLAR_SIZE,
  DEFAULT_WALL_THICKNESS,
} from "../constants/editor";
import type { StructuralMaterial, World } from "../types/world";
import { createId } from "./editor";
import {
  isPointInsideBuildableLand,
  isRectInsideBuildableLand,
} from "./buildableLand";
import {
  getFoundationPlacementValidation,
  getWallPlacementValidation,
} from "./foundationWallPlacement";

export type PlacementResult =
  | {
      success: true;
      updatedWorld: World;
      placedId: string;
    }
  | {
      success: false;
      reason: string;
    };

type FoundationPlacementPayload = {
  type: "foundation";
  x: number;
  y: number;
};

type PillarPlacementPayload = {
  type: "pillar";
  x: number;
  y: number;
  material: StructuralMaterial;
  floor: number;
};

type WallPlacementPayload = {
  type: "wall";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  material: StructuralMaterial;
  floor: number;
};

export type PlacementPayload =
  | FoundationPlacementPayload
  | PillarPlacementPayload
  | WallPlacementPayload;

function fail(reason: string): PlacementResult {
  return { success: false, reason };
}

function placeFoundation(
  world: World,
  payload: FoundationPlacementPayload,
): PlacementResult {
  const validation = getFoundationPlacementValidation(
    world,
    payload.x,
    payload.y,
    DEFAULT_FOUNDATION_WIDTH,
    DEFAULT_FOUNDATION_HEIGHT,
  );
  if (!validation.valid) {
    return fail(validation.reason ?? "Foundation placement is invalid.");
  }

  const placedId = "foundation";
  return {
    success: true,
    placedId,
    updatedWorld: {
      ...world,
      foundation: {
        x: payload.x,
        y: payload.y,
        width: DEFAULT_FOUNDATION_WIDTH,
        height: DEFAULT_FOUNDATION_HEIGHT,
        type: "floor",
        color: world.foundation?.color,
      },
    },
  };
}

function placePillar(world: World, payload: PillarPlacementPayload): PlacementResult {
  if (!world.foundation) {
    return fail("Pillar requires foundation support.");
  }

  if (
    !isRectInsideBuildableLand(
      payload.x,
      payload.y,
      DEFAULT_PILLAR_SIZE,
      DEFAULT_PILLAR_SIZE,
    )
  ) {
    return fail("Outside buildable land");
  }

  const foundation = world.foundation;
  if (
    payload.x < foundation.x ||
    payload.y < foundation.y ||
    payload.x + DEFAULT_PILLAR_SIZE > foundation.x + foundation.width ||
    payload.y + DEFAULT_PILLAR_SIZE > foundation.y + foundation.height
  ) {
    return fail("Pillar requires foundation support.");
  }

  const placedId = createId("pillar");
  return {
    success: true,
    placedId,
    updatedWorld: {
      ...world,
      pillars: [
        ...world.pillars,
        {
          id: placedId,
          x: payload.x,
          y: payload.y,
          size: DEFAULT_PILLAR_SIZE,
          heightScale: 1,
          material: payload.material,
          floor: payload.floor,
        },
      ],
    },
  };
}

function placeWall(world: World, payload: WallPlacementPayload): PlacementResult {
  if (
    !isPointInsideBuildableLand(payload.x1, payload.y1) ||
    !isPointInsideBuildableLand(payload.x2, payload.y2)
  ) {
    return fail("Outside buildable land");
  }

  const validation = getWallPlacementValidation(
    world,
    { x: payload.x1, y: payload.y1 },
    { x: payload.x2, y: payload.y2 },
  );
  if (!validation.valid) {
    return fail(validation.reason ?? "Wall placement is invalid.");
  }

  const placedId = createId("wall");
  return {
    success: true,
    placedId,
    updatedWorld: {
      ...world,
      walls: [
        ...world.walls,
        {
          id: placedId,
          x1: payload.x1,
          y1: payload.y1,
          x2: payload.x2,
          y2: payload.y2,
          thickness: DEFAULT_WALL_THICKNESS,
          lengthScale: 1,
          heightScale: 1,
          material: payload.material,
          floor: payload.floor,
        },
      ],
    },
  };
}

export function validateAndPlace(
  type: PlacementPayload["type"],
  payload: PlacementPayload,
  world: World,
): PlacementResult {
  if (type !== payload.type) {
    return fail("Placement payload does not match requested action.");
  }

  switch (payload.type) {
    case "foundation":
      return placeFoundation(world, payload);
    case "pillar":
      return placePillar(world, payload);
    case "wall":
      return placeWall(world, payload);
    default:
      return fail("Unsupported placement action.");
  }
}
