import type { Foundation, World } from "../types/world";

export const STORAGE_KEY = "dream-house-builder:mvp-layout";
export const GRID_SIZE = 20;
export const DEFAULT_WALL_THICKNESS = 20;
export const DEFAULT_PILLAR_SIZE = 28;
export const DEFAULT_FOUNDATION_WIDTH = 1400;
export const DEFAULT_FOUNDATION_HEIGHT = 1400;
export const DEFAULT_DOOR_WIDTH = 60;
export const DEFAULT_WINDOW_WIDTH = 80;
export const DEFAULT_WINDOW_HEIGHT = 60;
export const DEFAULT_STEELBAR_DIAMETER = 8;
export const DEFAULT_ROOF_OVERHANG = 40;
export const DEFAULT_ROOF_PITCH = 30;
export const MIN_STRUCTURE_SCALE = 0.5;
export const MAX_STRUCTURE_SCALE = 10;
export const STRUCTURE_SCALE_STEP = 0.5;
export const BUILDABLE_LAND_SIZE = 1800;

export const DEFAULT_FOUNDATION: Foundation = {
  x: 0,
  y: 0,
  width: DEFAULT_FOUNDATION_WIDTH,
  height: DEFAULT_FOUNDATION_HEIGHT,
  type: "floor",
};

export const INITIAL_WORLD: World = {
  foundation: null,
  walls: [],
  pillars: [],
  furniture: [],
  doors: [],
  windows: [],
  steelBars: [],
  roofs: [],
};
