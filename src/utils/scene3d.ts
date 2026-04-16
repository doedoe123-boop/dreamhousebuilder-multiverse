import {
  DEFAULT_FURNITURE_HEIGHT_PX,
  DEFAULT_FLOOR_THICKNESS_PX,
  DEFAULT_WALL_HEIGHT_PX,
  DEFAULT_DOOR_HEIGHT_PX,
  DEFAULT_WINDOW_HEIGHT_PX,
  DEFAULT_WINDOW_ELEVATION_PX,
  DEFAULT_STEELBAR_HEIGHT_PX,
  SCENE3D_SCALE,
  SCENE3D_VERSION,
} from "../constants/scene3d";
import type {
  Dimensions3D,
  Door3D,
  Floor3D,
  Object3D,
  Roof3D,
  Scene3D,
  SteelBar3D,
  Vector3,
  Wall3D,
  Window3D,
} from "../types/scene3d";
import type {
  Door,
  Furniture,
  Roof,
  SteelBar,
  Wall,
  Window as WindowObj,
  World,
} from "../types/world";

function toSceneUnits(value: number) {
  return value / SCENE3D_SCALE;
}

function createPosition(x: number, y: number, z: number): Vector3 {
  return {
    x: toSceneUnits(x),
    y: toSceneUnits(y),
    z: toSceneUnits(z),
  };
}

function createDimensions(
  width: number,
  height: number,
  depth: number,
): Dimensions3D {
  return {
    width: toSceneUnits(width),
    height: toSceneUnits(height),
    depth: toSceneUnits(depth),
  };
}

function createFoundationFloor(world: World): Floor3D {
  if (!world.foundation) {
    throw new Error("Foundation is required to create a foundation floor");
  }

  return {
    position: createPosition(
      world.foundation.x + world.foundation.width / 2,
      0,
      world.foundation.y + world.foundation.height / 2,
    ),
    width: toSceneUnits(world.foundation.width),
    depth: toSceneUnits(world.foundation.height),
    thickness: toSceneUnits(DEFAULT_FLOOR_THICKNESS_PX),
  };
}

function createWallObject(wall: Wall): Wall3D {
  const deltaX = wall.x2 - wall.x1;
  const deltaY = wall.y2 - wall.y1;
  const isHorizontal = Math.abs(deltaX) >= Math.abs(deltaY);
  const width = isHorizontal
    ? Math.abs(deltaX) || wall.thickness
    : wall.thickness;
  const depth = isHorizontal
    ? wall.thickness
    : Math.abs(deltaY) || wall.thickness;

  return {
    id: wall.id,
    position: createPosition(
      (wall.x1 + wall.x2) / 2,
      DEFAULT_WALL_HEIGHT_PX / 2,
      (wall.y1 + wall.y2) / 2,
    ),
    dimensions: createDimensions(width, DEFAULT_WALL_HEIGHT_PX, depth),
  };
}

function createFurnitureObject(item: Furniture): Object3D {
  const objectHeight = DEFAULT_FURNITURE_HEIGHT_PX;

  return {
    id: item.id,
    type: item.type,
    position: createPosition(
      item.x + item.width / 2,
      objectHeight / 2,
      item.y + item.height / 2,
    ),
    dimensions: createDimensions(item.width, objectHeight, item.height),
    rotation: item.rotation ?? 0,
    floor: item.floor,
  };
}

function createDoorObject(door: Door, wall: Wall): Door3D {
  const cx = wall.x1 + door.t * (wall.x2 - wall.x1);
  const cy = wall.y1 + door.t * (wall.y2 - wall.y1);
  const deltaX = wall.x2 - wall.x1;
  const deltaY = wall.y2 - wall.y1;
  const isHorizontal = Math.abs(deltaX) >= Math.abs(deltaY);
  const doorDepth = isHorizontal ? wall.thickness + 4 : door.width;
  const doorWidth = isHorizontal ? door.width : wall.thickness + 4;

  return {
    id: door.id,
    wallId: door.wallId,
    position: createPosition(cx, DEFAULT_DOOR_HEIGHT_PX / 2, cy),
    dimensions: createDimensions(doorWidth, DEFAULT_DOOR_HEIGHT_PX, doorDepth),
    floor: door.floor,
  };
}

function createWindowObject(win: WindowObj, wall: Wall): Window3D {
  const cx = wall.x1 + win.t * (wall.x2 - wall.x1);
  const cy = wall.y1 + win.t * (wall.y2 - wall.y1);
  const deltaX = wall.x2 - wall.x1;
  const deltaY = wall.y2 - wall.y1;
  const isHorizontal = Math.abs(deltaX) >= Math.abs(deltaY);
  const winDepth = isHorizontal ? wall.thickness + 2 : win.width;
  const winWidth = isHorizontal ? win.width : wall.thickness + 2;

  return {
    id: win.id,
    wallId: win.wallId,
    position: createPosition(
      cx,
      DEFAULT_WINDOW_ELEVATION_PX + DEFAULT_WINDOW_HEIGHT_PX / 2,
      cy,
    ),
    dimensions: createDimensions(winWidth, win.height, winDepth),
    floor: win.floor,
  };
}

function createSteelBarObject(bar: SteelBar): SteelBar3D {
  return {
    id: bar.id,
    start: createPosition(bar.x1, 0, bar.y1),
    end: createPosition(bar.x2, DEFAULT_STEELBAR_HEIGHT_PX, bar.y2),
    diameter: toSceneUnits(bar.diameter),
    floor: bar.floor,
  };
}

function createRoofObject(roof: Roof): Roof3D {
  return {
    id: roof.id,
    position: createPosition(
      roof.x + roof.width / 2,
      DEFAULT_WALL_HEIGHT_PX,
      roof.y + roof.height / 2,
    ),
    width: toSceneUnits(roof.width + roof.overhang * 2),
    depth: toSceneUnits(roof.height + roof.overhang * 2),
    style: roof.style,
    overhang: toSceneUnits(roof.overhang),
    pitch: roof.pitch,
    floor: roof.floor,
  };
}

export function exportWorldTo3D(world: World): Scene3D {
  const foundation = world.foundation ? createFoundationFloor(world) : null;
  const walls = world.walls.map((wall) => createWallObject(wall));
  const objects = world.furniture.map((item) => createFurnitureObject(item));

  const wallMap = new Map(world.walls.map((w) => [w.id, w]));
  const doors = (world.doors ?? []).reduce<Door3D[]>((acc, door) => {
    const wall = wallMap.get(door.wallId);
    if (wall) acc.push(createDoorObject(door, wall));
    return acc;
  }, []);
  const windows = (world.windows ?? []).reduce<Window3D[]>((acc, win) => {
    const wall = wallMap.get(win.wallId);
    if (wall) acc.push(createWindowObject(win, wall));
    return acc;
  }, []);

  const steelBars = (world.steelBars ?? []).map((bar) =>
    createSteelBarObject(bar),
  );
  const roofs = (world.roofs ?? []).map((roof) => createRoofObject(roof));

  return {
    scale: SCENE3D_SCALE,
    foundation,
    walls,
    objects,
    doors,
    windows,
    steelBars,
    roofs,
    metadata: {
      version: SCENE3D_VERSION,
      createdAt: Date.now(),
    },
  };
}
