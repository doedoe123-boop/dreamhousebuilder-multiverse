import type { Foundation, World } from "../types/world";

export const STORAGE_KEY = "dream-house-builder:mvp-layout";
export const GRID_SIZE = 20;
export const DEFAULT_WALL_THICKNESS = 20;
export const DEFAULT_PILLAR_SIZE = 28;
export const DEFAULT_DOOR_WIDTH = 60;
export const DEFAULT_WINDOW_WIDTH = 80;
export const DEFAULT_WINDOW_HEIGHT = 60;
export const DEFAULT_STEELBAR_DIAMETER = 8;
export const DEFAULT_ROOF_OVERHANG = 40;
export const DEFAULT_ROOF_PITCH = 30;

export const DEFAULT_FOUNDATION: Foundation = {
  x: 0,
  y: 0,
  width: 2000,
  height: 2000,
  type: "floor",
};

export const INITIAL_WORLD: World = {
  foundation: DEFAULT_FOUNDATION,
  walls: [],
  pillars: [],
  furniture: [],
  doors: [],
  windows: [],
  steelBars: [],
  roofs: [],
};
