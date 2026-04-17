import {
  DEFAULT_DOOR_WIDTH,
  DEFAULT_FOUNDATION_HEIGHT,
  DEFAULT_FOUNDATION_WIDTH,
  DEFAULT_WALL_THICKNESS,
  MAX_STRUCTURE_SCALE,
  MIN_STRUCTURE_SCALE,
  DEFAULT_PILLAR_SIZE,
  DEFAULT_ROOF_OVERHANG,
  DEFAULT_ROOF_PITCH,
  DEFAULT_STEELBAR_DIAMETER,
  DEFAULT_WINDOW_HEIGHT,
  DEFAULT_WINDOW_WIDTH,
} from "../constants/editor";
import { FURNITURE_STYLES } from "../constants/furniture";
import { SCENE3D_SCALE } from "../constants/scene3d";
import type {
  FurnitureType,
  SelectedObject,
  StructuralMaterial,
  World,
} from "../types/world";
import { createId, snap } from "./editor";
import { clampScale } from "./structureResize";

export function addFoundation(world: World, x: number, y: number): World {
  return {
    ...world,
    foundation: {
      x,
      y,
      width: DEFAULT_FOUNDATION_WIDTH,
      height: DEFAULT_FOUNDATION_HEIGHT,
      type: "floor",
      color: world.foundation?.color,
    },
  };
}

export function addPillar(
  world: World,
  x: number,
  y: number,
  material: StructuralMaterial,
  floor: number,
): World {
  return {
    ...world,
    pillars: [
      ...world.pillars,
      {
        id: createId("pillar"),
        x,
        y,
        size: DEFAULT_PILLAR_SIZE,
        heightScale: 1,
        material,
        floor,
      },
    ],
  };
}

export function addWall(
  world: World,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  material: StructuralMaterial,
  floor: number,
): World {
  return {
    ...world,
    walls: [
      ...world.walls,
      {
        id: createId("wall"),
        x1,
        y1,
        x2,
        y2,
        thickness: DEFAULT_WALL_THICKNESS,
        lengthScale: 1,
        heightScale: 1,
        material,
        floor,
      },
    ],
  };
}

export function addDoor(
  world: World,
  wallId: string,
  hitX: number,
  hitZ: number,
  floor: number,
): World {
  const wall = world.walls.find((item) => item.id === wallId);
  if (!wall) return world;

  const worldHitX = hitX * SCENE3D_SCALE;
  const worldHitZ = hitZ * SCENE3D_SCALE;
  const dx = wall.x2 - wall.x1;
  const dy = wall.y2 - wall.y1;
  const wallLength = Math.sqrt(dx * dx + dy * dy);
  if (wallLength < 1) return world;

  const t = Math.max(
    0.1,
    Math.min(
      0.9,
      ((worldHitX - wall.x1) * dx + (worldHitZ - wall.y1) * dy) /
        (wallLength * wallLength),
    ),
  );

  return {
    ...world,
    doors: [
      ...world.doors,
      {
        id: createId("door"),
        wallId,
        t,
        width: DEFAULT_DOOR_WIDTH,
        floor,
      },
    ],
  };
}

export function addWindow(
  world: World,
  wallId: string,
  hitX: number,
  hitZ: number,
  floor: number,
): World {
  const wall = world.walls.find((item) => item.id === wallId);
  if (!wall) return world;

  const worldHitX = hitX * SCENE3D_SCALE;
  const worldHitZ = hitZ * SCENE3D_SCALE;
  const dx = wall.x2 - wall.x1;
  const dy = wall.y2 - wall.y1;
  const wallLength = Math.sqrt(dx * dx + dy * dy);
  if (wallLength < 1) return world;

  const t = Math.max(
    0.1,
    Math.min(
      0.9,
      ((worldHitX - wall.x1) * dx + (worldHitZ - wall.y1) * dy) /
        (wallLength * wallLength),
    ),
  );

  return {
    ...world,
    windows: [
      ...world.windows,
      {
        id: createId("window"),
        wallId,
        t,
        width: DEFAULT_WINDOW_WIDTH,
        height: DEFAULT_WINDOW_HEIGHT,
        floor,
      },
    ],
  };
}

export function addFurniture(
  world: World,
  type: FurnitureType,
  x: number,
  y: number,
  floor: number,
): World {
  const catalog = FURNITURE_STYLES[type];
  return {
    ...world,
    furniture: [
      ...world.furniture,
      {
        id: createId(type),
        type,
        x: snap(x - catalog.defaultWidth / 2),
        y: snap(y - catalog.defaultHeight / 2),
        width: catalog.defaultWidth,
        height: catalog.defaultHeight,
        floor,
      },
    ],
  };
}

export function addSteelBar(
  world: World,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  floor: number,
): World {
  return {
    ...world,
    steelBars: [
      ...world.steelBars,
      {
        id: createId("steelbar"),
        x1,
        y1,
        x2,
        y2,
        diameter: DEFAULT_STEELBAR_DIAMETER,
        floor,
      },
    ],
  };
}

export function addRoof(
  world: World,
  x: number,
  y: number,
  width: number,
  height: number,
  floor: number,
): World {
  return {
    ...world,
    roofs: [
      ...world.roofs,
      {
        id: createId("roof"),
        x,
        y,
        width,
        height,
        style: "gable",
        overhang: DEFAULT_ROOF_OVERHANG,
        pitch: DEFAULT_ROOF_PITCH,
        floor,
      },
    ],
  };
}

export function deleteSelectedObject(
  world: World,
  selection: NonNullable<SelectedObject>,
): World {
  const { kind, id } = selection;

  if (kind === "wall") {
    return {
      ...world,
      walls: world.walls.filter((item) => item.id !== id),
      doors: world.doors.filter((item) => item.wallId !== id),
      windows: world.windows.filter((item) => item.wallId !== id),
    };
  }
  if (kind === "pillar") {
    return { ...world, pillars: world.pillars.filter((item) => item.id !== id) };
  }
  if (kind === "furniture") {
    return {
      ...world,
      furniture: world.furniture.filter((item) => item.id !== id),
    };
  }
  if (kind === "door") {
    return { ...world, doors: world.doors.filter((item) => item.id !== id) };
  }
  if (kind === "window") {
    return { ...world, windows: world.windows.filter((item) => item.id !== id) };
  }
  if (kind === "steelbar") {
    return {
      ...world,
      steelBars: world.steelBars.filter((item) => item.id !== id),
    };
  }
  if (kind === "roof") {
    return { ...world, roofs: world.roofs.filter((item) => item.id !== id) };
  }
  if (kind === "foundation") {
    return {
      ...world,
      foundation: null,
      walls: [],
      pillars: [],
      furniture: [],
      doors: [],
      windows: [],
      steelBars: [],
      roofs: [],
    };
  }
  return world;
}

export function resizeSelectedObjectPrimary(
  world: World,
  selection: NonNullable<SelectedObject>,
  delta: number,
): World {
  if (selection.kind === "pillar") {
    return {
      ...world,
      pillars: world.pillars.map((pillar) =>
        pillar.id === selection.id
          ? {
              ...pillar,
              heightScale: clampScale(
                (pillar.heightScale ?? 1) + delta,
                MIN_STRUCTURE_SCALE,
                MAX_STRUCTURE_SCALE,
              ),
            }
          : pillar,
      ),
    };
  }

  if (selection.kind === "wall") {
    return {
      ...world,
      walls: world.walls.map((wall) =>
        wall.id === selection.id
          ? {
              ...wall,
              lengthScale: clampScale(
                (wall.lengthScale ?? 1) + delta,
                MIN_STRUCTURE_SCALE,
                MAX_STRUCTURE_SCALE,
              ),
            }
          : wall,
      ),
    };
  }

  return world;
}

export function resizeSelectedObjectHeight(
  world: World,
  selection: NonNullable<SelectedObject>,
  delta: number,
): World {
  if (selection.kind === "pillar") {
    return resizeSelectedObjectPrimary(world, selection, delta);
  }

  if (selection.kind === "wall") {
    return {
      ...world,
      walls: world.walls.map((wall) =>
        wall.id === selection.id
          ? {
              ...wall,
              heightScale: clampScale(
                (wall.heightScale ?? 1) + delta,
                MIN_STRUCTURE_SCALE,
                MAX_STRUCTURE_SCALE,
              ),
            }
          : wall,
      ),
    };
  }

  return world;
}

export function nudgeSelectedObject(
  world: World,
  selection: NonNullable<SelectedObject>,
  dx: number,
  dy: number,
): World {
  const { kind, id } = selection;

  if (kind === "pillar") {
    return {
      ...world,
      pillars: world.pillars.map((item) =>
        item.id === id ? { ...item, x: item.x + dx, y: item.y + dy } : item,
      ),
    };
  }
  if (kind === "wall") {
    return {
      ...world,
      walls: world.walls.map((item) =>
        item.id === id
          ? {
              ...item,
              x1: item.x1 + dx,
              y1: item.y1 + dy,
              x2: item.x2 + dx,
              y2: item.y2 + dy,
            }
          : item,
      ),
    };
  }
  if (kind === "furniture") {
    return {
      ...world,
      furniture: world.furniture.map((item) =>
        item.id === id ? { ...item, x: item.x + dx, y: item.y + dy } : item,
      ),
    };
  }
  if (kind === "door") {
    const door = world.doors.find((item) => item.id === id);
    if (!door) return world;
    const wall = world.walls.find((item) => item.id === door.wallId);
    if (!wall) return world;
    const wallDx = wall.x2 - wall.x1;
    const wallDy = wall.y2 - wall.y1;
    const wallLen = Math.sqrt(wallDx * wallDx + wallDy * wallDy);
    if (wallLen < 1) return world;
    const proj = (dx * wallDx + dy * wallDy) / (wallLen * wallLen);
    const newT = Math.max(0.1, Math.min(0.9, door.t + proj));
    return {
      ...world,
      doors: world.doors.map((item) =>
        item.id === id ? { ...item, t: newT } : item,
      ),
    };
  }
  if (kind === "window") {
    const windowItem = world.windows.find((item) => item.id === id);
    if (!windowItem) return world;
    const wall = world.walls.find((item) => item.id === windowItem.wallId);
    if (!wall) return world;
    const wallDx = wall.x2 - wall.x1;
    const wallDy = wall.y2 - wall.y1;
    const wallLen = Math.sqrt(wallDx * wallDx + wallDy * wallDy);
    if (wallLen < 1) return world;
    const proj = (dx * wallDx + dy * wallDy) / (wallLen * wallLen);
    const newT = Math.max(0.1, Math.min(0.9, windowItem.t + proj));
    return {
      ...world,
      windows: world.windows.map((item) =>
        item.id === id ? { ...item, t: newT } : item,
      ),
    };
  }
  if (kind === "steelbar") {
    return {
      ...world,
      steelBars: world.steelBars.map((item) =>
        item.id === id
          ? {
              ...item,
              x1: item.x1 + dx,
              y1: item.y1 + dy,
              x2: item.x2 + dx,
              y2: item.y2 + dy,
            }
          : item,
      ),
    };
  }
  if (kind === "roof") {
    return {
      ...world,
      roofs: world.roofs.map((item) =>
        item.id === id ? { ...item, x: item.x + dx, y: item.y + dy } : item,
      ),
    };
  }
  if (kind === "foundation" && world.foundation) {
    return {
      ...world,
      foundation: {
        ...world.foundation,
        x: world.foundation.x + dx,
        y: world.foundation.y + dy,
      },
    };
  }
  return world;
}

export function paintWorldSurface(
  world: World,
  kind: "wall" | "foundation",
  id: string,
  color: string,
): World {
  if (kind === "wall") {
    return {
      ...world,
      walls: world.walls.map((wall) =>
        wall.id === id ? { ...wall, color } : wall,
      ),
    };
  }
  if (kind === "foundation" && world.foundation) {
    return {
      ...world,
      foundation: { ...world.foundation, color },
    };
  }
  return world;
}
