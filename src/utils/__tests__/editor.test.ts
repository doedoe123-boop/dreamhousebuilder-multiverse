import { describe, it, expect } from "vitest";
import { createId, clampSize, snap } from "../editor";
import { GRID_SIZE } from "../../constants/editor";

describe("createId", () => {
  it("starts with the given prefix", () => {
    expect(createId("wall")).toMatch(/^wall-/);
    expect(createId("pillar")).toMatch(/^pillar-/);
    expect(createId("test")).toMatch(/^test-/);
  });

  it("generates unique ids", () => {
    const ids = new Set(Array.from({ length: 50 }, () => createId("item")));
    expect(ids.size).toBe(50);
  });
});

describe("clampSize", () => {
  it("returns the value when above minimum", () => {
    expect(clampSize(100, 10)).toBe(100);
  });

  it("returns minimum when value is below", () => {
    expect(clampSize(5, 10)).toBe(10);
  });

  it("returns minimum when value equals minimum", () => {
    expect(clampSize(10, 10)).toBe(10);
  });

  it("handles zero minimum", () => {
    expect(clampSize(-5, 0)).toBe(0);
  });
});

describe("snap", () => {
  it("snaps to default grid size", () => {
    expect(snap(0)).toBe(0);
    expect(snap(GRID_SIZE)).toBe(GRID_SIZE);
    expect(snap(GRID_SIZE / 2)).toBe(GRID_SIZE);
    expect(snap(GRID_SIZE / 2 - 1)).toBe(0);
  });

  it("snaps to custom grid size", () => {
    expect(snap(7, 10)).toBe(10);
    expect(snap(4, 10)).toBe(0);
    expect(snap(15, 10)).toBe(20);
  });

  it("handles negative values", () => {
    expect(snap(-3)).toBe(-0);
    expect(snap(-GRID_SIZE)).toBe(-GRID_SIZE);
    expect(snap(-GRID_SIZE - 1)).toBe(-GRID_SIZE);
  });
});
