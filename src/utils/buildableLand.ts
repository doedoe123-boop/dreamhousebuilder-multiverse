import {
  BUILDABLE_LAND_SIZE,
} from "../constants/editor";
import type { World } from "../types/world";

export type BuildingState = "empty-land" | "building-active";

export type LandBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  size: number;
};

export function getBuildableLandBounds(): LandBounds {
  const half = BUILDABLE_LAND_SIZE / 2;
  return {
    minX: -half,
    maxX: half,
    minY: -half,
    maxY: half,
    size: BUILDABLE_LAND_SIZE,
  };
}

export function getBuildingState(world: World): BuildingState {
  return world.foundation ? "building-active" : "empty-land";
}

export function isPointInsideBuildableLand(x: number, y: number) {
  const bounds = getBuildableLandBounds();
  return x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY;
}

export function isRectInsideBuildableLand(
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const bounds = getBuildableLandBounds();
  return (
    x >= bounds.minX &&
    y >= bounds.minY &&
    x + width <= bounds.maxX &&
    y + height <= bounds.maxY
  );
}
