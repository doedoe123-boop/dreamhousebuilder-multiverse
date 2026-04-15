import { useEffect, useMemo, useRef, useState } from "react";
import { STORAGE_KEY } from "../../constants/editor";
import type { ToolMode, World } from "../../types/world";
import { IconArrowRight, IconHardHat } from "../icons/ToolIcons";

/* ------------------------------------------------------------------ */
/*  Dialogue system                                                    */
/* ------------------------------------------------------------------ */

type DialogueLine = {
  id: string;
  text: string;
  check: (world: World, tool: ToolMode) => boolean;
};

/** Ordered top-to-bottom: first match wins. */
const DIALOGUE_LINES: DialogueLine[] = [
  /* ---- completion ---- */
  {
    id: "complete",
    text: "Wow, look at that! Your dream house is complete! Don't forget to hit Save so you never lose this masterpiece!",
    check: (w) =>
      w.pillars.length > 0 &&
      w.walls.length > 0 &&
      w.doors.length > 0 &&
      w.windows.length > 0 &&
      w.roofs.length > 0 &&
      w.furniture.length > 0 &&
      !!localStorage.getItem(STORAGE_KEY),
  },
  {
    id: "almost-done",
    text: "Almost there! You've placed everything — now hit Save to keep your masterpiece safe!",
    check: (w) =>
      w.pillars.length > 0 &&
      w.walls.length > 0 &&
      w.doors.length > 0 &&
      w.windows.length > 0 &&
      w.roofs.length > 0 &&
      w.furniture.length > 0,
  },

  /* ---- furniture ---- */
  {
    id: "furniture-active",
    text: "Nice pick! Click anywhere inside a room to drop your furniture. Beds, sofas, tables — make it cozy!",
    check: (_w, t) => t === "furniture",
  },
  {
    id: "furniture-hint",
    text: "The rooms look a bit empty… Let's add some furniture! Switch to the Furniture tool and make this place feel like home.",
    check: (w) => w.roofs.length > 0 && w.furniture.length === 0,
  },

  /* ---- roof ---- */
  {
    id: "roof-active",
    text: "Click one corner, then the opposite corner to define your roof area. I like the gable style!",
    check: (_w, t) => t === "roof",
  },
  {
    id: "roof-hint",
    text: "Every house needs a roof! Switch to the Roof tool — nobody wants rain inside, trust me.",
    check: (w) =>
      w.walls.length > 0 && w.roofs.length === 0 && w.steelBars.length >= 0,
  },

  /* ---- steel bars ---- */
  {
    id: "steelbar-active",
    text: "Click to set the start point, then click again to finish the bar. Steel bars add real strength!",
    check: (_w, t) => t === "steelbar",
  },
  {
    id: "steelbar-hint",
    text: "Want some extra reinforcement? The Steel Bar tool lets you add structural support between points. Optional but cool!",
    check: (w) =>
      w.windows.length > 0 && w.steelBars.length === 0 && w.roofs.length === 0,
  },

  /* ---- windows ---- */
  {
    id: "window-active",
    text: "Click on any wall to pop a window in. Let that sunshine through!",
    check: (_w, t) => t === "window",
  },
  {
    id: "window-hint",
    text: "Great door! Now let's add some windows to let the light in. Switch to the Window tool.",
    check: (w) => w.doors.length > 0 && w.windows.length === 0,
  },

  /* ---- doors ---- */
  {
    id: "door-active",
    text: "Click on any wall to place a door. Everyone needs a way in!",
    check: (_w, t) => t === "door",
  },
  {
    id: "door-hint",
    text: "Looking solid! Every house needs a way in though — switch to the Door tool and add an entrance!",
    check: (w) => w.walls.length > 0 && w.doors.length === 0,
  },

  /* ---- walls ---- */
  {
    id: "wall-active",
    text: "Click to set the start point, then click again to finish the wall. Try connecting your pillars!",
    check: (_w, t) => t === "wall",
  },
  {
    id: "wall-hint",
    text: "Nice pillars! Now let's connect them with walls. Switch to the Wall tool and start framing your rooms!",
    check: (w) => w.pillars.length > 0 && w.walls.length === 0,
  },

  /* ---- pillars ---- */
  {
    id: "pillar-active",
    text: "Click anywhere on the foundation to place a pillar. Drop a few to mark out where your rooms will be!",
    check: (_w, t) => t === "pillar",
  },
  {
    id: "pillar-hint",
    text: "First things first! Switch to the Pillar tool and place some pillars — they'll hold everything up!",
    check: (w) => w.pillars.length === 0,
  },

  /* ---- inspect / idle ---- */
  {
    id: "inspect-has-stuff",
    text: "Inspect mode — click any object to select it. Use Delete to remove or arrow keys to nudge. What shall we build next?",
    check: (_w, t) => t === "select",
  },

  /* ---- fallback greeting ---- */
  {
    id: "greeting",
    text: "Hey there, Builder! Welcome to Dream House Builder! Ready to create something amazing? Let's start with some pillars!",
    check: () => true,
  },
];

/* Small helper: figure out what step we're "suggesting next" */
function getSuggestedTool(world: World): ToolMode | null {
  if (world.pillars.length === 0) return "pillar";
  if (world.walls.length === 0) return "wall";
  if (world.doors.length === 0) return "door";
  if (world.windows.length === 0) return "window";
  if (world.roofs.length === 0) return "roof";
  if (world.furniture.length === 0) return "furniture";
  return null;
}

/* Progress as 0-1 */
function getProgress(world: World): number {
  let done = 0;
  const total = 7;
  if (world.pillars.length > 0) done++;
  if (world.walls.length > 0) done++;
  if (world.doors.length > 0) done++;
  if (world.windows.length > 0) done++;
  if (world.roofs.length > 0) done++;
  if (world.furniture.length > 0) done++;
  if (localStorage.getItem(STORAGE_KEY)) done++;
  return done / total;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

type BuilderCharacterProps = {
  world: World;
  currentTool: ToolMode;
  onSetTool: (tool: ToolMode) => void;
};

export function BuilderCharacter({
  world,
  currentTool,
  onSetTool,
}: BuilderCharacterProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [displayText, setDisplayText] = useState("");
  const prevLineIdRef = useRef<string>("");

  /* Pick the first matching dialogue line */
  const activeLine = useMemo(() => {
    for (const line of DIALOGUE_LINES) {
      if (line.check(world, currentTool)) return line;
    }
    return DIALOGUE_LINES[DIALOGUE_LINES.length - 1];
  }, [world, currentTool]);

  /** Typewriter effect when dialogue changes */
  useEffect(() => {
    if (activeLine.id === prevLineIdRef.current) return;
    prevLineIdRef.current = activeLine.id;

    let idx = 0;
    setDisplayText("");
    const timer = setInterval(() => {
      idx++;
      setDisplayText(activeLine.text.slice(0, idx));
      if (idx >= activeLine.text.length) clearInterval(timer);
    }, 18);
    return () => clearInterval(timer);
  }, [activeLine]);

  const progress = getProgress(world);
  const suggestedTool = getSuggestedTool(world);

  if (collapsed) {
    return (
      <button
        type="button"
        className="builder-char__toggle floating-tool floating-tool--toggle"
        onClick={() => setCollapsed(false)}
      >
        <span className="builder-char__mini-avatar">
          <IconHardHat size={20} />
        </span>
        Builder
      </button>
    );
  }

  return (
    <div className="builder-char">
      {/* Character avatar */}
      <div className="builder-char__top">
        <div className="builder-char__avatar">
          <IconHardHat size={28} />
        </div>
        <div className="builder-char__name">
          Bob the Builder
          <button
            type="button"
            className="floating-tool floating-tool--icon builder-char__hide"
            onClick={() => setCollapsed(true)}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Speech bubble */}
      <div className="builder-char__bubble">
        <p className="builder-char__text">
          {displayText}
          <span className="builder-char__cursor">|</span>
        </p>
      </div>

      {/* Progress bar */}
      <div className="builder-char__progress">
        <div className="guide-progress">
          <div
            className="guide-progress__bar"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <span className="builder-char__progress-label">
          {Math.round(progress * 100)}% complete
        </span>
      </div>

      {/* Suggested next action */}
      {suggestedTool && suggestedTool !== currentTool && (
        <button
          type="button"
          className="floating-tool builder-char__suggest"
          onClick={() => onSetTool(suggestedTool)}
        >
          <IconArrowRight size={14} /> Switch to{" "}
          {suggestedTool.charAt(0).toUpperCase() + suggestedTool.slice(1)} tool
        </button>
      )}
    </div>
  );
}
