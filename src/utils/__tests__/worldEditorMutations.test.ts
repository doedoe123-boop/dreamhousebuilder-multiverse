import { describe, it, expect } from "vitest";
import {
  addFoundation,
  addPillar,
  addWall,
  addDoor,
  addWindow,
  addFurniture,
  addSteelBar,
  addRoof,
  deleteSelectedObject,
  nudgeSelectedObject,
  paintWorldSurface,
} from "../worldEditorMutations";
import { emptyWorld, worldWithFoundation, worldWithStructure } from "./helpers";

describe("addFoundation", () => {
  it("adds a foundation to an empty world", () => {
    const result = addFoundation(emptyWorld(), 10, 20);
    expect(result.foundation).not.toBeNull();
    expect(result.foundation!.x).toBe(10);
    expect(result.foundation!.y).toBe(20);
    expect(result.foundation!.width).toBe(1400);
    expect(result.foundation!.height).toBe(1400);
  });

  it("replaces existing foundation", () => {
    const result = addFoundation(worldWithFoundation(), 50, 50);
    expect(result.foundation!.x).toBe(50);
    expect(result.foundation!.y).toBe(50);
  });

  it("does not mutate original world", () => {
    const original = emptyWorld();
    addFoundation(original, 10, 20);
    expect(original.foundation).toBeNull();
  });
});

describe("addPillar", () => {
  it("adds a pillar to the world", () => {
    const result = addPillar(worldWithFoundation(), 100, 100, "wood", 0);
    expect(result.pillars).toHaveLength(1);
    expect(result.pillars[0].x).toBe(100);
    expect(result.pillars[0].y).toBe(100);
    expect(result.pillars[0].material).toBe("wood");
  });

  it("appends without removing existing pillars", () => {
    let world = addPillar(worldWithFoundation(), 0, 0, "wood", 0);
    world = addPillar(world, 100, 0, "steel", 0);
    expect(world.pillars).toHaveLength(2);
    expect(world.pillars[1].material).toBe("steel");
  });
});

describe("addWall", () => {
  it("adds a wall between two points", () => {
    const result = addWall(worldWithFoundation(), 0, 0, 200, 0, "wood", 0);
    expect(result.walls).toHaveLength(1);
    expect(result.walls[0].x1).toBe(0);
    expect(result.walls[0].x2).toBe(200);
    expect(result.walls[0].thickness).toBe(20);
  });
});

describe("addDoor", () => {
  it("adds a door to an existing wall", () => {
    const result = addDoor(worldWithStructure(), "w1", 5, 0, 0);
    expect(result.doors).toHaveLength(1);
    expect(result.doors[0].wallId).toBe("w1");
    expect(result.doors[0].t).toBeGreaterThanOrEqual(0.1);
    expect(result.doors[0].t).toBeLessThanOrEqual(0.9);
  });

  it("returns unchanged world for non-existent wall", () => {
    const original = worldWithStructure();
    const result = addDoor(original, "nonexistent", 5, 0, 0);
    expect(result.doors).toHaveLength(0);
  });
});

describe("addWindow", () => {
  it("adds a window to an existing wall", () => {
    const result = addWindow(worldWithStructure(), "w2", 10, 5, 0);
    expect(result.windows).toHaveLength(1);
    expect(result.windows[0].wallId).toBe("w2");
  });

  it("returns unchanged world for non-existent wall", () => {
    const result = addWindow(worldWithStructure(), "fake", 5, 0, 0);
    expect(result.windows).toHaveLength(0);
  });
});

describe("addFurniture", () => {
  it("adds a bed", () => {
    const result = addFurniture(worldWithFoundation(), "bed", 100, 100, 0);
    expect(result.furniture).toHaveLength(1);
    expect(result.furniture[0].type).toBe("bed");
  });

  it("adds a sofa", () => {
    const result = addFurniture(worldWithFoundation(), "sofa", 50, 50, 0);
    expect(result.furniture).toHaveLength(1);
    expect(result.furniture[0].type).toBe("sofa");
  });

  it("adds a table", () => {
    const result = addFurniture(worldWithFoundation(), "table", 80, 80, 0);
    expect(result.furniture).toHaveLength(1);
    expect(result.furniture[0].type).toBe("table");
  });
});

describe("addSteelBar", () => {
  it("adds a steel bar", () => {
    const result = addSteelBar(emptyWorld(), 0, 0, 100, 0, 0);
    expect(result.steelBars).toHaveLength(1);
    expect(result.steelBars[0].x1).toBe(0);
    expect(result.steelBars[0].x2).toBe(100);
    expect(result.steelBars[0].diameter).toBe(8);
  });
});

describe("addRoof", () => {
  it("adds a gable roof", () => {
    const result = addRoof(worldWithStructure(), 0, 0, 200, 200, 0);
    expect(result.roofs).toHaveLength(1);
    expect(result.roofs[0].style).toBe("gable");
    expect(result.roofs[0].overhang).toBe(40);
    expect(result.roofs[0].pitch).toBe(30);
  });
});

describe("deleteSelectedObject", () => {
  it("deletes a wall and its associated doors/windows", () => {
    const world = {
      ...worldWithStructure(),
      doors: [{ id: "d1", wallId: "w1", t: 0.5, width: 60 }],
      windows: [{ id: "win1", wallId: "w1", t: 0.3, width: 80, height: 60 }],
    };
    const result = deleteSelectedObject(world, { kind: "wall", id: "w1" });
    expect(result.walls).toHaveLength(3); // 4 - 1
    expect(result.doors).toHaveLength(0); // door was on w1
    expect(result.windows).toHaveLength(0); // window was on w1
  });

  it("deletes a pillar", () => {
    const result = deleteSelectedObject(worldWithStructure(), {
      kind: "pillar",
      id: "p1",
    });
    expect(result.pillars).toHaveLength(3);
  });

  it("deletes a furniture item", () => {
    const world = {
      ...worldWithFoundation(),
      furniture: [
        { id: "f1", type: "bed" as const, x: 0, y: 0, width: 120, height: 80 },
      ],
    };
    const result = deleteSelectedObject(world, {
      kind: "furniture",
      id: "f1",
    });
    expect(result.furniture).toHaveLength(0);
  });

  it("clears everything when foundation is deleted", () => {
    const world = {
      ...worldWithStructure(),
      doors: [{ id: "d1", wallId: "w1", t: 0.5, width: 60 }],
      furniture: [
        { id: "f1", type: "bed" as const, x: 0, y: 0, width: 120, height: 80 },
      ],
    };
    const result = deleteSelectedObject(world, {
      kind: "foundation",
      id: "foundation",
    });
    expect(result.foundation).toBeNull();
    expect(result.walls).toHaveLength(0);
    expect(result.pillars).toHaveLength(0);
    expect(result.doors).toHaveLength(0);
    expect(result.furniture).toHaveLength(0);
  });

  it("returns world unchanged for unknown kind", () => {
    const world = worldWithStructure();
    const result = deleteSelectedObject(world, {
      kind: "unknown" as "wall",
      id: "x",
    });
    expect(result).toBe(world);
  });
});

describe("nudgeSelectedObject", () => {
  it("nudges a pillar", () => {
    const result = nudgeSelectedObject(
      worldWithStructure(),
      { kind: "pillar", id: "p1" },
      10,
      20,
    );
    expect(result.pillars[0].x).toBe(10);
    expect(result.pillars[0].y).toBe(20);
  });

  it("nudges a wall (both endpoints)", () => {
    const result = nudgeSelectedObject(
      worldWithStructure(),
      { kind: "wall", id: "w1" },
      5,
      10,
    );
    expect(result.walls[0].x1).toBe(5);
    expect(result.walls[0].y1).toBe(10);
    expect(result.walls[0].x2).toBe(205);
    expect(result.walls[0].y2).toBe(10);
  });

  it("nudges a door along its wall (t changes)", () => {
    const world = {
      ...worldWithStructure(),
      doors: [{ id: "d1", wallId: "w1", t: 0.5, width: 60 }],
    };
    // w1 goes from (0,0) to (200,0), so nudging dx=20 should move t
    const result = nudgeSelectedObject(
      world,
      { kind: "door", id: "d1" },
      20,
      0,
    );
    expect(result.doors[0].t).not.toBe(0.5);
    expect(result.doors[0].t).toBeGreaterThan(0.1);
    expect(result.doors[0].t).toBeLessThan(0.9);
  });

  it("returns unchanged world for non-existent id", () => {
    const world = worldWithStructure();
    const result = nudgeSelectedObject(
      world,
      { kind: "pillar", id: "nonexistent" },
      10,
      10,
    );
    // pillars should be unchanged
    expect(result.pillars).toEqual(world.pillars);
  });
});

describe("paintWorldSurface", () => {
  it("paints a wall", () => {
    const result = paintWorldSurface(
      worldWithStructure(),
      "wall",
      "w1",
      "#ff0000",
    );
    expect(result.walls[0].color).toBe("#ff0000");
    expect(result.walls[1].color).toBeUndefined(); // other walls unchanged
  });

  it("paints a foundation", () => {
    const result = paintWorldSurface(
      worldWithFoundation(),
      "foundation",
      "foundation",
      "#00ff00",
    );
    expect(result.foundation!.color).toBe("#00ff00");
  });

  it("returns unchanged world when painting foundation on null foundation", () => {
    const world = emptyWorld();
    const result = paintWorldSurface(world, "foundation", "f", "#fff");
    expect(result).toBe(world);
  });
});
