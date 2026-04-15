import { useState } from "react";
import { STORAGE_KEY } from "../../constants/editor";
import type { ToolMode, World } from "../../types/world";

type BuildStep = {
  id: string;
  label: string;
  tip: string;
  tool: ToolMode | null;
  check: (world: World) => boolean;
};

const BUILD_STEPS: BuildStep[] = [
  {
    id: "pillars",
    label: "1. Place pillars",
    tip: "Pillars provide structural support. Place a few on the foundation.",
    tool: "pillar",
    check: (w) => w.pillars.length > 0,
  },
  {
    id: "walls",
    label: "2. Draw walls",
    tip: "Click once to start a wall, click again to finish. Walls form your rooms.",
    tool: "wall",
    check: (w) => w.walls.length > 0,
  },
  {
    id: "doors",
    label: "3. Add doors",
    tip: "Click on any wall to place a door opening.",
    tool: "door",
    check: (w) => w.doors.length > 0,
  },
  {
    id: "windows",
    label: "4. Add windows",
    tip: "Click on any wall to place a window.",
    tool: "window",
    check: (w) => w.windows.length > 0,
  },
  {
    id: "steelbars",
    label: "5. Add steel bars",
    tip: "Click two points to place a steel reinforcement bar.",
    tool: "steelbar",
    check: (w) => w.steelBars.length > 0,
  },
  {
    id: "roof",
    label: "6. Add roof",
    tip: "Click two corners to define the roof area. Gable style is used by default.",
    tool: "roof",
    check: (w) => w.roofs.length > 0,
  },
  {
    id: "furniture",
    label: "7. Place furniture",
    tip: "Add beds, sofas, and tables to furnish your rooms.",
    tool: "furniture",
    check: (w) => w.furniture.length > 0,
  },
  {
    id: "save",
    label: "8. Save project",
    tip: "Save your progress so you can continue later.",
    tool: null,
    check: () => !!localStorage.getItem(STORAGE_KEY),
  },
];

type BuilderGuideProps = {
  world: World;
  currentTool: ToolMode;
  onSetTool: (tool: ToolMode) => void;
};

export function BuilderGuide({
  world,
  currentTool,
  onSetTool,
}: BuilderGuideProps) {
  const [collapsed, setCollapsed] = useState(false);

  const completedCount = BUILD_STEPS.filter((step) => step.check(world)).length;

  // Find the first incomplete step
  const currentStepIndex = BUILD_STEPS.findIndex((step) => !step.check(world));

  if (collapsed) {
    return (
      <button
        type="button"
        className="floating-tool floating-tool--toggle guide-toggle"
        onClick={() => setCollapsed(false)}
      >
        Guide ({completedCount}/{BUILD_STEPS.length})
      </button>
    );
  }

  return (
    <div className="builder-guide">
      <div className="floating-toolbar__header">
        <div className="floating-badge">Builder Guide</div>
        <button
          type="button"
          className="floating-tool floating-tool--icon"
          onClick={() => setCollapsed(true)}
        >
          Hide
        </button>
      </div>

      <div className="guide-progress">
        <div
          className="guide-progress__bar"
          style={{ width: `${(completedCount / BUILD_STEPS.length) * 100}%` }}
        />
      </div>

      <div className="guide-steps">
        {BUILD_STEPS.map((step, index) => {
          const isDone = step.check(world);
          const isCurrent = index === currentStepIndex;
          const isActive = step.tool === currentTool;

          return (
            <div
              key={step.id}
              className={`guide-step ${isDone ? "guide-step--done" : ""} ${isCurrent ? "guide-step--current" : ""} ${isActive ? "guide-step--active" : ""}`}
            >
              <div className="guide-step__header">
                <span className="guide-step__check">
                  {isDone ? "✓" : isCurrent ? "→" : "○"}
                </span>
                <span className="guide-step__label">{step.label}</span>
                {step.tool && !isDone && (
                  <button
                    type="button"
                    className="guide-step__action"
                    onClick={() => onSetTool(step.tool!)}
                  >
                    {isActive ? "Active" : "Start"}
                  </button>
                )}
              </div>
              {isCurrent && <div className="guide-step__tip">{step.tip}</div>}
            </div>
          );
        })}
      </div>

      {completedCount === BUILD_STEPS.length && (
        <div className="guide-complete">Your dream house is ready! 🏠</div>
      )}
    </div>
  );
}
