import {
  DEFAULT_FOUNDATION,
  DEFAULT_PILLAR_SIZE,
  DEFAULT_STEELBAR_DIAMETER,
  DEFAULT_WALL_THICKNESS,
} from "../constants/editor";
import { FURNITURE_STYLES } from "../constants/furniture";
import type {
  Door,
  Furniture,
  Foundation,
  Pillar,
  Roof,
  RoofStyle,
  SteelBar,
  StructuralMaterial,
  Wall,
  Window as WindowObj,
  World,
} from "../types/world";
import { createId, snap } from "./editor";

type LegacyRoom = {
  id?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

export function normalizeFoundation(
  item: Partial<Foundation> | null | undefined,
) {
  const normalized: Foundation = {
    x: typeof item?.x === "number" ? item.x : DEFAULT_FOUNDATION.x,
    y: typeof item?.y === "number" ? item.y : DEFAULT_FOUNDATION.y,
    width:
      typeof item?.width === "number" ? item.width : DEFAULT_FOUNDATION.width,
    height:
      typeof item?.height === "number"
        ? item.height
        : DEFAULT_FOUNDATION.height,
    type: item?.type === "floor" ? item.type : "floor",
  };

  return normalized;
}

function normalizeStructuralMaterial(
  value: unknown,
): StructuralMaterial | undefined {
  return value === "wood" || value === "steel" ? value : undefined;
}

export function normalizeWallItem(item: Partial<Wall>) {
  const normalized: Wall = {
    id: typeof item.id === "string" ? item.id : createId("wall"),
    x1: typeof item.x1 === "number" ? item.x1 : 0,
    y1: typeof item.y1 === "number" ? item.y1 : 0,
    x2: typeof item.x2 === "number" ? item.x2 : DEFAULT_WALL_THICKNESS * 4,
    y2: typeof item.y2 === "number" ? item.y2 : 0,
    thickness:
      typeof item.thickness === "number"
        ? item.thickness
        : DEFAULT_WALL_THICKNESS,
    material: normalizeStructuralMaterial(item.material) ?? "wood",
  };

  return normalized;
}

export function normalizePillarItem(item: Partial<Pillar>) {
  const normalized: Pillar = {
    id: typeof item.id === "string" ? item.id : createId("pillar"),
    x: typeof item.x === "number" ? item.x : 0,
    y: typeof item.y === "number" ? item.y : 0,
    size: typeof item.size === "number" ? item.size : DEFAULT_PILLAR_SIZE,
    material: normalizeStructuralMaterial(item.material) ?? "wood",
  };

  return normalized;
}

export function normalizeFurnitureItem(item: Partial<Furniture>) {
  if (item.type !== "bed" && item.type !== "sofa" && item.type !== "table") {
    return null;
  }

  const catalogItem = FURNITURE_STYLES[item.type];

  const normalized: Furniture = {
    id: typeof item.id === "string" ? item.id : createId(item.type),
    type: item.type,
    x: typeof item.x === "number" ? item.x : 48,
    y: typeof item.y === "number" ? item.y : 48,
    width:
      typeof item.width === "number" ? item.width : catalogItem.defaultWidth,
    height:
      typeof item.height === "number" ? item.height : catalogItem.defaultHeight,
    rotation: typeof item.rotation === "number" ? item.rotation : undefined,
  };

  return normalized;
}
export function normalizeDoorItem(item: Partial<Door>): Door | null {
  if (typeof item.wallId !== "string") return null;
  return {
    id: typeof item.id === "string" ? item.id : createId("door"),
    wallId: item.wallId,
    t: typeof item.t === "number" ? Math.max(0, Math.min(1, item.t)) : 0.5,
    width: typeof item.width === "number" ? item.width : 60,
  };
}

export function normalizeWindowItem(
  item: Partial<WindowObj>,
): WindowObj | null {
  if (typeof item.wallId !== "string") return null;
  return {
    id: typeof item.id === "string" ? item.id : createId("window"),
    wallId: item.wallId,
    t: typeof item.t === "number" ? Math.max(0, Math.min(1, item.t)) : 0.5,
    width: typeof item.width === "number" ? item.width : 80,
    height: typeof item.height === "number" ? item.height : 60,
  };
}

export function normalizeSteelBarItem(item: Partial<SteelBar>): SteelBar {
  return {
    id: typeof item.id === "string" ? item.id : createId("steelbar"),
    x1: typeof item.x1 === "number" ? item.x1 : 0,
    y1: typeof item.y1 === "number" ? item.y1 : 0,
    x2: typeof item.x2 === "number" ? item.x2 : 0,
    y2: typeof item.y2 === "number" ? item.y2 : 0,
    diameter:
      typeof item.diameter === "number"
        ? item.diameter
        : DEFAULT_STEELBAR_DIAMETER,
  };
}

function normalizeRoofStyle(value: unknown): RoofStyle {
  if (value === "flat" || value === "gable" || value === "hip") return value;
  return "gable";
}

export function normalizeRoofItem(item: Partial<Roof>): Roof {
  return {
    id: typeof item.id === "string" ? item.id : createId("roof"),
    x: typeof item.x === "number" ? item.x : 0,
    y: typeof item.y === "number" ? item.y : 0,
    width: typeof item.width === "number" ? item.width : 400,
    height: typeof item.height === "number" ? item.height : 300,
    style: normalizeRoofStyle(item.style),
    overhang: typeof item.overhang === "number" ? item.overhang : 40,
    pitch: typeof item.pitch === "number" ? item.pitch : 30,
  };
}
function convertLegacyRoomToWalls(room: LegacyRoom): Wall[] {
  const id = typeof room.id === "string" ? room.id : createId("room");
  const x = typeof room.x === "number" ? room.x : 0;
  const y = typeof room.y === "number" ? room.y : 0;
  const width = typeof room.width === "number" ? room.width : 220;
  const height = typeof room.height === "number" ? room.height : 150;

  return [
    {
      id: `${id}-top`,
      x1: x,
      y1: y,
      x2: x + width,
      y2: y,
      thickness: DEFAULT_WALL_THICKNESS,
    },
    {
      id: `${id}-bottom`,
      x1: x,
      y1: y + height,
      x2: x + width,
      y2: y + height,
      thickness: DEFAULT_WALL_THICKNESS,
    },
    {
      id: `${id}-left`,
      x1: x,
      y1: y,
      x2: x,
      y2: y + height,
      thickness: DEFAULT_WALL_THICKNESS,
    },
    {
      id: `${id}-right`,
      x1: x + width,
      y1: y,
      x2: x + width,
      y2: y + height,
      thickness: DEFAULT_WALL_THICKNESS,
    },
  ];
}

export function normalizeWorld(raw: Partial<World> | null | undefined): World {
  const normalizedWalls = Array.isArray(raw?.walls)
    ? raw.walls.map((item) => normalizeWallItem(item as Partial<Wall>))
    : [];

  const migratedWalls =
    normalizedWalls.length === 0 &&
    Array.isArray((raw as { rooms?: LegacyRoom[] } | undefined)?.rooms)
      ? ((raw as { rooms?: LegacyRoom[] }).rooms ?? []).flatMap((room) =>
          convertLegacyRoomToWalls(room),
        )
      : normalizedWalls;

  return {
    foundation: normalizeFoundation(raw?.foundation),
    walls: migratedWalls.map((wall) => ({
      ...wall,
      x1: snap(wall.x1),
      y1: snap(wall.y1),
      x2: snap(wall.x2),
      y2: snap(wall.y2),
    })),
    pillars: Array.isArray(raw?.pillars)
      ? raw.pillars.map((item) => normalizePillarItem(item as Partial<Pillar>))
      : [],
    furniture: Array.isArray(raw?.furniture)
      ? raw.furniture
          .map((item) => normalizeFurnitureItem(item as Partial<Furniture>))
          .filter((item): item is Furniture => item !== null)
      : [],
    doors: Array.isArray(raw?.doors)
      ? raw.doors
          .map((item) => normalizeDoorItem(item as Partial<Door>))
          .filter((item): item is Door => item !== null)
      : [],
    windows: Array.isArray(raw?.windows)
      ? raw.windows
          .map((item) => normalizeWindowItem(item as Partial<WindowObj>))
          .filter((item): item is WindowObj => item !== null)
      : [],
    steelBars: Array.isArray(raw?.steelBars)
      ? raw.steelBars.map((item) =>
          normalizeSteelBarItem(item as Partial<SteelBar>),
        )
      : [],
    roofs: Array.isArray(raw?.roofs)
      ? raw.roofs.map((item) => normalizeRoofItem(item as Partial<Roof>))
      : [],
  };
}
