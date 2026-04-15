import { STORAGE_KEY } from "../constants/editor";
import type { ToolMode, World } from "../types/world";

type DialogueLine = {
  id: string;
  text: string;
  check: (world: World, tool: ToolMode) => boolean;
};

const DIALOGUE_LINES: DialogueLine[] = [
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
  {
    id: "furniture-active",
    text: "Nice pick! Click anywhere inside a room to drop your furniture.",
    check: (_w, t) => t === "furniture",
  },
  {
    id: "furniture-hint",
    text: "The rooms look empty… Switch to Furniture and make this place feel like home!",
    check: (w) => w.roofs.length > 0 && w.furniture.length === 0,
  },
  {
    id: "roof-active",
    text: "Click one corner, then the opposite corner to define your roof area.",
    check: (_w, t) => t === "roof",
  },
  {
    id: "roof-hint",
    text: "Every house needs a roof! Switch to the Roof tool.",
    check: (w) => w.walls.length > 0 && w.roofs.length === 0,
  },
  {
    id: "steelbar-active",
    text: "Click to set the start point, click again to finish the bar.",
    check: (_w, t) => t === "steelbar",
  },
  {
    id: "steelbar-hint",
    text: "Want reinforcement? The Steel Bar tool adds structural support. Optional but cool!",
    check: (w) =>
      w.windows.length > 0 && w.steelBars.length === 0 && w.roofs.length === 0,
  },
  {
    id: "window-active",
    text: "Click on any wall to pop a window in!",
    check: (_w, t) => t === "window",
  },
  {
    id: "window-hint",
    text: "Great door! Now add some windows. Switch to the Window tool.",
    check: (w) => w.doors.length > 0 && w.windows.length === 0,
  },
  {
    id: "door-active",
    text: "Click on any wall to place a door.",
    check: (_w, t) => t === "door",
  },
  {
    id: "door-hint",
    text: "Every house needs a way in — switch to the Door tool!",
    check: (w) => w.walls.length > 0 && w.doors.length === 0,
  },
  {
    id: "wall-active",
    text: "Click to set the start point, click again to finish the wall.",
    check: (_w, t) => t === "wall",
  },
  {
    id: "wall-hint",
    text: "Nice pillars! Now connect them with walls. Switch to the Wall tool!",
    check: (w) => w.pillars.length > 0 && w.walls.length === 0,
  },
  {
    id: "pillar-active",
    text: "Click anywhere on the foundation to place a pillar!",
    check: (_w, t) => t === "pillar",
  },
  {
    id: "pillar-hint",
    text: "First things first! Switch to the Pillar tool and place some pillars.",
    check: (w) => w.pillars.length === 0,
  },
  {
    id: "inspect-has-stuff",
    text: "Inspect mode — click any object to select it. Press Delete to remove or arrow keys to nudge.",
    check: (_w, t) => t === "select",
  },
  {
    id: "greeting",
    text: "Hey Builder! Welcome to Dream House Builder! Let's start with some pillars!",
    check: () => true,
  },
];

export function getActiveDialogue(world: World, tool: ToolMode): string {
  for (const line of DIALOGUE_LINES) {
    if (line.check(world, tool)) return line.text;
  }
  return DIALOGUE_LINES[DIALOGUE_LINES.length - 1].text;
}
