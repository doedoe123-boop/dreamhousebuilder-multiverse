import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getActiveDialogue,
  getForemanSuggestedStep,
  getForemanSmallTalk,
  getForemanWhyThisMatters,
  getForemanWhatComesAfter,
  getForemanStuckAdvice,
  getForemanSimpleExplanation,
  getForemanIdeas,
  getForemanStageLabel,
  getForemanTone,
  getForemanMemoryReflection,
} from "../dialogue";
import {
  emptyWorld,
  worldWithFoundation,
  worldWithStructure,
  worldAlmostComplete,
} from "./helpers";

// localStorage stub for dialogue checks that use STORAGE_KEY
const storageMock: Record<string, string> = {};
beforeEach(() => {
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => storageMock[key] ?? null,
    setItem: (key: string, value: string) => {
      storageMock[key] = value;
    },
    removeItem: (key: string) => {
      delete storageMock[key];
    },
  });
  // clear between tests
  Object.keys(storageMock).forEach((k) => delete storageMock[k]);
});

describe("getActiveDialogue", () => {
  it("returns a greeting for an empty world", () => {
    const text = getActiveDialogue(emptyWorld(), "select");
    expect(text).toBeTruthy();
    expect(typeof text).toBe("string");
  });

  it("returns foundation hint when no foundation and tool is not foundation", () => {
    const text = getActiveDialogue(emptyWorld(), "select");
    expect(text.toLowerCase()).toMatch(/foundation|base/);
  });

  it("returns foundation-active dialogue when tool is foundation", () => {
    const text = getActiveDialogue(emptyWorld(), "foundation");
    expect(text.toLowerCase()).toMatch(/foundation|base|click/);
  });

  it("returns pillar hint after foundation placed", () => {
    const text = getActiveDialogue(worldWithFoundation(), "select");
    expect(text.toLowerCase()).toMatch(/pillar|support/);
  });

  it("returns wall hint after pillars placed", () => {
    const world = {
      ...worldWithFoundation(),
      pillars: [{ id: "p1", x: 0, y: 0, size: 28 }],
    };
    const text = getActiveDialogue(world, "select");
    expect(text.toLowerCase()).toMatch(/wall|connect/);
  });

  it("returns roof hint when walls exist but no roof", () => {
    const text = getActiveDialogue(worldWithStructure(), "select");
    expect(text.toLowerCase()).toMatch(/roof|overhead|cap/);
  });

  it("returns furniture hint when structure is complete with roof", () => {
    const world = {
      ...worldWithStructure(),
      doors: [{ id: "d1", wallId: "w1", t: 0.5, width: 60 }],
      windows: [{ id: "win1", wallId: "w2", t: 0.5, width: 80, height: 60 }],
      roofs: [
        {
          id: "r1",
          x: 0,
          y: 0,
          width: 200,
          height: 200,
          style: "gable" as const,
          overhang: 40,
          pitch: 30,
        },
      ],
    };
    const text = getActiveDialogue(world, "select");
    expect(text.toLowerCase()).toMatch(/furniture|home|empty/);
  });
});

describe("getForemanSuggestedStep", () => {
  it("suggests foundation first for empty world", () => {
    expect(getForemanSuggestedStep(emptyWorld()).toLowerCase()).toMatch(
      /foundation/,
    );
  });

  it("suggests pillars after foundation", () => {
    expect(
      getForemanSuggestedStep(worldWithFoundation()).toLowerCase(),
    ).toMatch(/pillar/);
  });

  it("suggests walls after pillars", () => {
    const world = {
      ...worldWithFoundation(),
      pillars: [{ id: "p1", x: 0, y: 0, size: 28 }],
    };
    expect(getForemanSuggestedStep(world).toLowerCase()).toMatch(/wall/);
  });

  it("progresses through all stages", () => {
    const steps = [
      getForemanSuggestedStep(emptyWorld()),
      getForemanSuggestedStep(worldWithFoundation()),
      getForemanSuggestedStep(worldWithStructure()),
    ];
    // Each step should be a non-empty string
    steps.forEach((s) => expect(s.length).toBeGreaterThan(0));
    // Steps should be different from each other
    expect(new Set(steps).size).toBe(steps.length);
  });
});

describe("getForemanSmallTalk", () => {
  it("returns a string", () => {
    const result = getForemanSmallTalk(emptyWorld(), "select");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("getForemanWhyThisMatters", () => {
  it("mentions foundation for empty world", () => {
    expect(getForemanWhyThisMatters(emptyWorld()).toLowerCase()).toMatch(
      /foundation/,
    );
  });
});

describe("getForemanWhatComesAfter", () => {
  it("mentions pillars for empty world", () => {
    expect(getForemanWhatComesAfter(emptyWorld()).toLowerCase()).toMatch(
      /pillar/,
    );
  });
});

describe("getForemanStuckAdvice", () => {
  it("returns advice for each stage", () => {
    expect(getForemanStuckAdvice(emptyWorld()).length).toBeGreaterThan(0);
    expect(getForemanStuckAdvice(worldWithFoundation()).length).toBeGreaterThan(
      0,
    );
    expect(getForemanStuckAdvice(worldWithStructure()).length).toBeGreaterThan(
      0,
    );
  });
});

describe("getForemanSimpleExplanation", () => {
  it("starts with 'Simple version:' for every stage", () => {
    expect(getForemanSimpleExplanation(emptyWorld())).toMatch(
      /^Simple version:/,
    );
    expect(getForemanSimpleExplanation(worldWithFoundation())).toMatch(
      /^Simple version:/,
    );
    expect(getForemanSimpleExplanation(worldAlmostComplete())).toMatch(
      /^Simple version:/,
    );
  });
});

describe("getForemanIdeas", () => {
  it("returns non-empty string", () => {
    expect(getForemanIdeas(emptyWorld()).length).toBeGreaterThan(0);
  });
});

describe("getForemanStageLabel", () => {
  it("returns 'Site setup' for empty world", () => {
    expect(getForemanStageLabel(emptyWorld())).toBe("Site setup");
  });

  it("returns 'Structural framing' after foundation", () => {
    expect(getForemanStageLabel(worldWithFoundation())).toBe(
      "Structural framing",
    );
  });

  it("returns 'Openings and flow' after walls", () => {
    expect(getForemanStageLabel(worldWithStructure())).toBe(
      "Openings and flow",
    );
  });
});

describe("getForemanTone", () => {
  it("returns appropriate tone string", () => {
    const tone = getForemanTone(emptyWorld());
    expect(tone.toLowerCase()).toMatch(/calm|welcoming/);
  });
});

describe("getForemanMemoryReflection", () => {
  it("returns null for null event", () => {
    expect(getForemanMemoryReflection(null, emptyWorld())).toBeNull();
  });

  it("returns string for placed-foundation", () => {
    const result = getForemanMemoryReflection(
      "placed-foundation",
      worldWithFoundation(),
    );
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
  });

  it("returns string for saved-project", () => {
    const result = getForemanMemoryReflection("saved-project", emptyWorld());
    expect(result).toMatch(/sav/i);
  });

  it("returns string for deleted-piece", () => {
    expect(
      getForemanMemoryReflection("deleted-piece", emptyWorld()),
    ).toBeTruthy();
  });

  it("returns string for undid-step", () => {
    expect(getForemanMemoryReflection("undid-step", emptyWorld())).toBeTruthy();
  });
});
