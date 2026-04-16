import { describe, it, expect } from "vitest";
import {
  normalizeFoundation,
  normalizeWallItem,
  normalizePillarItem,
  normalizeFurnitureItem,
  normalizeDoorItem,
  normalizeWindowItem,
  normalizeSteelBarItem,
  normalizeRoofItem,
  normalizeWorld,
} from "../world";
import {
  DEFAULT_WALL_THICKNESS,
  DEFAULT_PILLAR_SIZE,
  DEFAULT_STEELBAR_DIAMETER,
} from "../../constants/editor";

describe("normalizeFoundation", () => {
  it("returns null for null/undefined input", () => {
    expect(normalizeFoundation(null)).toBeNull();
    expect(normalizeFoundation(undefined)).toBeNull();
  });

  it("fills defaults for empty partial", () => {
    const result = normalizeFoundation({});
    expect(result).toEqual({
      x: 0,
      y: 0,
      width: 1400,
      height: 1400,
      type: "floor",
    });
  });

  it("preserves valid values", () => {
    const result = normalizeFoundation({
      x: 10,
      y: 20,
      width: 500,
      height: 300,
      type: "floor",
    });
    expect(result).toEqual({
      x: 10,
      y: 20,
      width: 500,
      height: 300,
      type: "floor",
    });
  });
});

describe("normalizeWallItem", () => {
  it("generates id when missing", () => {
    const result = normalizeWallItem({ x1: 0, y1: 0, x2: 100, y2: 0 });
    expect(result.id).toMatch(/^wall-/);
  });

  it("preserves provided id", () => {
    const result = normalizeWallItem({ id: "my-wall" });
    expect(result.id).toBe("my-wall");
  });

  it("defaults thickness and material", () => {
    const result = normalizeWallItem({});
    expect(result.thickness).toBe(DEFAULT_WALL_THICKNESS);
    expect(result.material).toBe("wood");
  });

  it("accepts steel material", () => {
    const result = normalizeWallItem({ material: "steel" });
    expect(result.material).toBe("steel");
  });

  it("falls back to wood for invalid material", () => {
    const result = normalizeWallItem({
      material: "glass" as unknown as "wood",
    });
    expect(result.material).toBe("wood");
  });
});

describe("normalizePillarItem", () => {
  it("generates id and sets defaults", () => {
    const result = normalizePillarItem({});
    expect(result.id).toMatch(/^pillar-/);
    expect(result.size).toBe(DEFAULT_PILLAR_SIZE);
    expect(result.material).toBe("wood");
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });

  it("preserves coordinates", () => {
    const result = normalizePillarItem({ x: 100, y: 200 });
    expect(result.x).toBe(100);
    expect(result.y).toBe(200);
  });
});

describe("normalizeFurnitureItem", () => {
  it("returns null for invalid type", () => {
    expect(normalizeFurnitureItem({ type: "chair" as "bed" })).toBeNull();
  });

  it("normalizes a bed with defaults", () => {
    const result = normalizeFurnitureItem({ type: "bed" });
    expect(result).not.toBeNull();
    expect(result!.type).toBe("bed");
    expect(result!.id).toMatch(/^bed-/);
    expect(result!.width).toBeGreaterThan(0);
    expect(result!.height).toBeGreaterThan(0);
  });

  it("normalizes a sofa", () => {
    const result = normalizeFurnitureItem({ type: "sofa", x: 10, y: 20 });
    expect(result).not.toBeNull();
    expect(result!.type).toBe("sofa");
    expect(result!.x).toBe(10);
    expect(result!.y).toBe(20);
  });

  it("normalizes a table", () => {
    const result = normalizeFurnitureItem({ type: "table" });
    expect(result).not.toBeNull();
    expect(result!.type).toBe("table");
  });
});

describe("normalizeDoorItem", () => {
  it("returns null when wallId is missing", () => {
    expect(normalizeDoorItem({})).toBeNull();
  });

  it("creates a valid door with defaults", () => {
    const result = normalizeDoorItem({ wallId: "w1" });
    expect(result).not.toBeNull();
    expect(result!.wallId).toBe("w1");
    expect(result!.t).toBe(0.5);
    expect(result!.width).toBe(60);
  });

  it("clamps t to [0, 1]", () => {
    const result = normalizeDoorItem({ wallId: "w1", t: 1.5 });
    expect(result!.t).toBe(1);

    const result2 = normalizeDoorItem({ wallId: "w1", t: -0.5 });
    expect(result2!.t).toBe(0);
  });
});

describe("normalizeWindowItem", () => {
  it("returns null when wallId is missing", () => {
    expect(normalizeWindowItem({})).toBeNull();
  });

  it("creates a valid window with defaults", () => {
    const result = normalizeWindowItem({ wallId: "w2" });
    expect(result).not.toBeNull();
    expect(result!.wallId).toBe("w2");
    expect(result!.t).toBe(0.5);
    expect(result!.width).toBe(80);
    expect(result!.height).toBe(60);
  });
});

describe("normalizeSteelBarItem", () => {
  it("sets defaults for all fields", () => {
    const result = normalizeSteelBarItem({});
    expect(result.id).toMatch(/^steelbar-/);
    expect(result.diameter).toBe(DEFAULT_STEELBAR_DIAMETER);
    expect(result.x1).toBe(0);
    expect(result.y1).toBe(0);
    expect(result.x2).toBe(0);
    expect(result.y2).toBe(0);
  });
});

describe("normalizeRoofItem", () => {
  it("sets defaults for all fields", () => {
    const result = normalizeRoofItem({});
    expect(result.id).toMatch(/^roof-/);
    expect(result.style).toBe("gable");
    expect(result.overhang).toBe(40);
    expect(result.pitch).toBe(30);
    expect(result.width).toBe(400);
    expect(result.height).toBe(300);
  });

  it("accepts valid styles", () => {
    expect(normalizeRoofItem({ style: "flat" }).style).toBe("flat");
    expect(normalizeRoofItem({ style: "hip" }).style).toBe("hip");
    expect(normalizeRoofItem({ style: "gable" }).style).toBe("gable");
  });

  it("defaults invalid style to gable", () => {
    expect(normalizeRoofItem({ style: "dome" as "gable" }).style).toBe("gable");
  });
});

describe("normalizeWorld", () => {
  it("handles null/undefined input", () => {
    const result = normalizeWorld(null);
    expect(result.foundation).toBeNull();
    expect(result.walls).toEqual([]);
    expect(result.pillars).toEqual([]);
    expect(result.furniture).toEqual([]);
    expect(result.doors).toEqual([]);
    expect(result.windows).toEqual([]);
    expect(result.steelBars).toEqual([]);
    expect(result.roofs).toEqual([]);
  });

  it("normalizes a full world with mixed valid/invalid items", () => {
    const result = normalizeWorld({
      foundation: { x: 0, y: 0, width: 500, height: 500, type: "floor" },
      walls: [{ id: "w1", x1: 0, y1: 0, x2: 100, y2: 0, thickness: 20 }],
      pillars: [{ id: "p1", x: 50, y: 50, size: 28 }],
      furniture: [
        { type: "bed", id: "f1", x: 10, y: 10, width: 120, height: 80 },
        { type: "invalid" as "bed", id: "f2", x: 0, y: 0, width: 0, height: 0 },
      ],
      doors: [
        { id: "d1", wallId: "w1", t: 0.5, width: 60 },
        {} as { id: string; wallId: string; t: number; width: number },
      ],
      windows: [{ id: "win1", wallId: "w1", t: 0.3, width: 80, height: 60 }],
      steelBars: [],
      roofs: [],
    });

    expect(result.foundation).not.toBeNull();
    expect(result.walls).toHaveLength(1);
    expect(result.pillars).toHaveLength(1);
    expect(result.furniture).toHaveLength(1); // invalid type filtered out
    expect(result.doors).toHaveLength(1); // missing wallId filtered out
    expect(result.windows).toHaveLength(1);
  });

  it("snaps wall coordinates to grid", () => {
    const result = normalizeWorld({
      walls: [{ id: "w1", x1: 13, y1: 7, x2: 108, y2: 3, thickness: 20 }],
    });
    const wall = result.walls[0];
    expect(wall.x1 % 20).toBe(0);
    expect(wall.y1 % 20).toBe(0);
    expect(wall.x2 % 20).toBe(0);
    expect(wall.y2 % 20).toBe(0);
  });
});
