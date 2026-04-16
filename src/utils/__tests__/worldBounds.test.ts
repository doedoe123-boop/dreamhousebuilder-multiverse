import { describe, it, expect } from "vitest";
import { getWorldBounds, frameWorld } from "../worldBounds";
import { emptyWorld, worldWithFoundation, worldWithStructure } from "./helpers";

describe("getWorldBounds", () => {
  it("returns minimal bounds for empty world", () => {
    const bounds = getWorldBounds(emptyWorld());
    expect(bounds.width).toBeGreaterThanOrEqual(1);
    expect(bounds.height).toBeGreaterThanOrEqual(1);
  });

  it("covers foundation area", () => {
    const bounds = getWorldBounds(worldWithFoundation());
    expect(bounds.minX).toBe(0);
    expect(bounds.minY).toBe(0);
    expect(bounds.maxX).toBe(1400);
    expect(bounds.maxY).toBe(1400);
    expect(bounds.width).toBe(1400);
    expect(bounds.height).toBe(1400);
    expect(bounds.centerX).toBe(700);
    expect(bounds.centerY).toBe(700);
  });

  it("expands to include walls beyond foundation", () => {
    const world = {
      ...worldWithFoundation(),
      walls: [
        {
          id: "w-far",
          x1: -100,
          y1: -100,
          x2: 1500,
          y2: 1500,
          thickness: 20,
        },
      ],
    };
    const bounds = getWorldBounds(world);
    expect(bounds.minX).toBeLessThan(0);
    expect(bounds.maxX).toBeGreaterThan(1400);
  });

  it("includes pillars in bounds", () => {
    const bounds = getWorldBounds(worldWithStructure());
    expect(bounds.minX).toBeLessThanOrEqual(0);
    expect(bounds.minY).toBeLessThanOrEqual(0);
    expect(bounds.maxX).toBeGreaterThanOrEqual(228); // 200 + size 28
    expect(bounds.maxY).toBeGreaterThanOrEqual(228);
  });

  it("includes furniture in bounds", () => {
    const world = {
      ...worldWithFoundation(),
      furniture: [
        {
          id: "f1",
          type: "bed" as const,
          x: 1500,
          y: 1500,
          width: 120,
          height: 80,
        },
      ],
    };
    const bounds = getWorldBounds(world);
    expect(bounds.maxX).toBeGreaterThanOrEqual(1620);
    expect(bounds.maxY).toBeGreaterThanOrEqual(1580);
  });
});

describe("frameWorld", () => {
  it("returns a valid transform", () => {
    const bounds = getWorldBounds(worldWithFoundation());
    const transform = frameWorld(bounds, { width: 800, height: 600 });
    expect(transform.scale).toBeGreaterThan(0);
    expect(typeof transform.x).toBe("number");
    expect(typeof transform.y).toBe("number");
  });

  it("clamps scale within reasonable range", () => {
    // Very tiny world — should clamp to max scale
    const bounds = getWorldBounds(emptyWorld());
    const transform = frameWorld(bounds, { width: 800, height: 600 });
    expect(transform.scale).toBeLessThanOrEqual(1.6);
    expect(transform.scale).toBeGreaterThanOrEqual(0.18);
  });

  it("handles very small canvas", () => {
    const bounds = getWorldBounds(worldWithFoundation());
    const transform = frameWorld(bounds, { width: 1, height: 1 });
    expect(transform.scale).toBeGreaterThanOrEqual(0.18);
  });

  it("handles zero-dimension canvas gracefully", () => {
    const bounds = getWorldBounds(worldWithFoundation());
    const transform = frameWorld(bounds, { width: 0, height: 0 });
    expect(Number.isFinite(transform.scale)).toBe(true);
    expect(Number.isFinite(transform.x)).toBe(true);
    expect(Number.isFinite(transform.y)).toBe(true);
  });
});
