import { GRID_SIZE } from "../constants/editor";
import type { Foundation, Wall, World } from "../types/world";
import {
  isRectInsideBuildableLand,
} from "./buildableLand";
import { snap } from "./editor";

const WALL_ANCHOR_SNAP_DISTANCE = GRID_SIZE * 1.5;

export type PlacementPoint = {
  x: number;
  y: number;
};

export type PlacementValidation = {
  valid: boolean;
  reason: string | null;
};

export type WallAxis = "horizontal" | "vertical";

type WallAnchorSource = "foundation-edge" | "wall-endpoint";

type WallAnchor = {
  point: PlacementPoint;
  source: WallAnchorSource;
};

type FoundationBounds2D = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

export type WallPlacementPreview = {
  start: PlacementPoint | null;
  end: PlacementPoint | null;
  valid: boolean;
  reason: string | null;
  axis: WallAxis | null;
};

function getFoundationBounds(foundation: Foundation): FoundationBounds2D {
  return {
    minX: foundation.x,
    maxX: foundation.x + foundation.width,
    minY: foundation.y,
    maxY: foundation.y + foundation.height,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getDistance(a: PlacementPoint, b: PlacementPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function getNearestWallEndpoint(
  walls: Wall[],
  rawPoint: PlacementPoint,
  axis?: WallAxis,
  start?: PlacementPoint,
): WallAnchor | null {
  // Existing wall endpoints take priority so new walls naturally chain together.
  let best: WallAnchor | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const wall of walls) {
    const endpoints: PlacementPoint[] = [
      { x: wall.x1, y: wall.y1 },
      { x: wall.x2, y: wall.y2 },
    ];

    for (const endpoint of endpoints) {
      if (axis === "horizontal" && start && Math.abs(endpoint.y - start.y) > GRID_SIZE) {
        continue;
      }
      if (axis === "vertical" && start && Math.abs(endpoint.x - start.x) > GRID_SIZE) {
        continue;
      }

      const distance = getDistance(rawPoint, endpoint);
      if (distance <= WALL_ANCHOR_SNAP_DISTANCE && distance < bestDistance) {
        best = {
          point: endpoint,
          source: "wall-endpoint",
        };
        bestDistance = distance;
      }
    }
  }

  return best;
}

function getNearestFoundationEdgePoint(
  foundation: Foundation,
  rawPoint: PlacementPoint,
  axis?: WallAxis,
  start?: PlacementPoint,
): WallAnchor | null {
  const bounds = getFoundationBounds(foundation);
  const candidates: PlacementPoint[] = [];

  if (!axis) {
    // First click can attach to any edge of the foundation.
    candidates.push(
      {
        x: bounds.minX,
        y: snap(clamp(rawPoint.y, bounds.minY, bounds.maxY)),
      },
      {
        x: bounds.maxX,
        y: snap(clamp(rawPoint.y, bounds.minY, bounds.maxY)),
      },
      {
        x: snap(clamp(rawPoint.x, bounds.minX, bounds.maxX)),
        y: bounds.minY,
      },
      {
        x: snap(clamp(rawPoint.x, bounds.minX, bounds.maxX)),
        y: bounds.maxY,
      },
    );
  } else if (axis === "horizontal" && start) {
    // Horizontal walls should stay on the top or bottom edge they started from.
    const edgeY =
      Math.abs(start.y - bounds.minY) <= Math.abs(start.y - bounds.maxY)
        ? bounds.minY
        : bounds.maxY;
    if (Math.abs(start.y - edgeY) <= WALL_ANCHOR_SNAP_DISTANCE) {
      candidates.push({
        x: snap(clamp(rawPoint.x, bounds.minX, bounds.maxX)),
        y: edgeY,
      });
    }
  } else if (axis === "vertical" && start) {
    // Vertical walls should stay on the left or right edge they started from.
    const edgeX =
      Math.abs(start.x - bounds.minX) <= Math.abs(start.x - bounds.maxX)
        ? bounds.minX
        : bounds.maxX;
    if (Math.abs(start.x - edgeX) <= WALL_ANCHOR_SNAP_DISTANCE) {
      candidates.push({
        x: edgeX,
        y: snap(clamp(rawPoint.y, bounds.minY, bounds.maxY)),
      });
    }
  }

  let bestPoint: PlacementPoint | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const candidate of candidates) {
    const distance = getDistance(rawPoint, candidate);
    if (distance <= WALL_ANCHOR_SNAP_DISTANCE && distance < bestDistance) {
      bestPoint = candidate;
      bestDistance = distance;
    }
  }

  return bestPoint
    ? {
        point: bestPoint,
        source: "foundation-edge",
      }
    : null;
}

function getWallAnchor(
  world: World,
  rawPoint: PlacementPoint,
  axis?: WallAxis,
  start?: PlacementPoint,
): WallAnchor | null {
  const wallEndpoint = getNearestWallEndpoint(world.walls, rawPoint, axis, start);
  if (wallEndpoint) return wallEndpoint;
  if (!world.foundation) return null;
  return getNearestFoundationEdgePoint(world.foundation, rawPoint, axis, start);
}

export function snapFoundationPlacement(x: number, y: number): PlacementPoint {
  return {
    x: snap(x),
    y: snap(y),
  };
}

export function getFoundationPlacementValidation(
  world: World,
  x: number,
  y: number,
  width: number,
  height: number,
): PlacementValidation {
  if (world.foundation) {
    return {
      valid: false,
      reason: "Foundation already exists. Move into wall building from this base.",
    };
  }

  if (!isRectInsideBuildableLand(x, y, width, height)) {
    return {
      valid: false,
      reason: "Outside buildable land",
    };
  }

  return { valid: true, reason: null };
}

export function getWallStartAnchor(
  world: World,
  rawPoint: PlacementPoint,
): { point: PlacementPoint | null; reason: string | null } {
  if (!world.foundation) {
    return {
      point: null,
      reason: "Wall requires foundation support.",
    };
  }

  const anchor = getWallAnchor(world, rawPoint);
  if (!anchor) {
    return {
      point: null,
      reason: "Start the wall from a foundation edge or another wall end.",
    };
  }

  return {
    point: anchor.point,
    reason: null,
  };
}

export function getWallPlacementPreview(
  world: World,
  start: PlacementPoint,
  rawPoint: PlacementPoint,
): WallPlacementPreview {
  if (!world.foundation) {
    return {
      start,
      end: null,
      valid: false,
      reason: "Wall requires foundation support.",
      axis: null,
    };
  }

  const dx = rawPoint.x - start.x;
  const dy = rawPoint.y - start.y;

  if (Math.abs(dx) < GRID_SIZE / 2 && Math.abs(dy) < GRID_SIZE / 2) {
    return {
      start,
      end: start,
      valid: false,
      reason: "Stretch the wall out from the start point.",
      axis: null,
    };
  }

  const axis: WallAxis =
    Math.abs(dx) >= Math.abs(dy) ? "horizontal" : "vertical";

  // Lock the preview to one axis so walls stay clean and believable.
  const axisLockedPoint =
    axis === "horizontal"
      ? { x: rawPoint.x, y: start.y }
      : { x: start.x, y: rawPoint.y };

  const anchor = getWallAnchor(world, axisLockedPoint, axis, start);
  if (!anchor) {
    return {
      start,
      end:
        axis === "horizontal"
          ? { x: snap(axisLockedPoint.x), y: start.y }
          : { x: start.x, y: snap(axisLockedPoint.y) },
      valid: false,
      reason: "Finish the wall on a foundation edge or another wall end.",
      axis,
    };
  }

  const end = anchor.point;
  if (Math.abs(end.x - start.x) < GRID_SIZE && Math.abs(end.y - start.y) < GRID_SIZE) {
    return {
      start,
      end,
      valid: false,
      reason: "Wall segment is too short to place.",
      axis,
    };
  }

  return {
    start,
    end,
    valid: true,
    reason: null,
    axis,
  };
}

export function getWallPlacementValidation(
  world: World,
  start: PlacementPoint | null,
  end: PlacementPoint | null,
): PlacementValidation {
  if (!world.foundation) {
    return {
      valid: false,
      reason: "Wall requires foundation support.",
    };
  }

  if (!start || !end) {
    return {
      valid: false,
      reason: "Wall must start and end on the foundation or another wall end.",
    };
  }

  if (start.x !== end.x && start.y !== end.y) {
    return {
      valid: false,
      reason: "Walls must align horizontally or vertically.",
    };
  }

  if (Math.abs(end.x - start.x) < GRID_SIZE && Math.abs(end.y - start.y) < GRID_SIZE) {
    return {
      valid: false,
      reason: "Wall segment is too short to place.",
    };
  }

  const hasSupport =
    !!getWallAnchor(world, start) &&
    !!getWallAnchor(world, end, start.x === end.x ? "vertical" : "horizontal", start);

  if (!hasSupport) {
    return {
      valid: false,
      reason: "Wall must connect to the foundation or an existing wall end.",
    };
  }

  return {
    valid: true,
    reason: null,
  };
}
