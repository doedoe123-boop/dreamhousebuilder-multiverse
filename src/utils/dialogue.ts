import { STORAGE_KEY } from "../constants/editor";
import type { ToolMode, World } from "../types/world";

export type ForemanMemoryEvent =
  | "placed-foundation"
  | "placed-pillars"
  | "placed-walls"
  | "placed-openings"
  | "placed-roof"
  | "placed-furniture"
  | "saved-project"
  | "loaded-project"
  | "deleted-piece"
  | "undid-step"
  | "followed-advice";

type DialogueLine = {
  id: string;
  text: string | string[];
  check: (world: World, tool: ToolMode) => boolean;
};

function getDialogueSeed(world: World, tool: ToolMode) {
  return (
    world.pillars.length * 3 +
    world.walls.length * 5 +
    world.doors.length * 7 +
    world.windows.length * 11 +
    world.steelBars.length * 13 +
    world.roofs.length * 17 +
    world.furniture.length * 19 +
    (world.foundation ? 23 : 0) +
    tool.length
  );
}

function pickDialogueText(
  text: string | string[],
  world: World,
  tool: ToolMode,
): string {
  if (typeof text === "string") {
    return text;
  }

  return text[getDialogueSeed(world, tool) % text.length];
}

const DIALOGUE_LINES: DialogueLine[] = [
  {
    id: "complete",
    text: [
      "Now that's a house to be proud of. Save it before we call the whole crew over to admire it.",
      "Beautiful work, Builder. Your dream house is standing tall now, so let's save it and keep it safe.",
    ],
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
    text: [
      "Almost there. The house looks ready, so hit Save and we'll keep today's work locked in.",
      "That build is looking sharp. One last step: save the project so your progress is safe.",
    ],
    check: (w) =>
      w.pillars.length > 0 &&
      w.walls.length > 0 &&
      w.doors.length > 0 &&
      w.windows.length > 0 &&
      w.roofs.length > 0 &&
      w.furniture.length > 0,
  },
  {
    id: "foundation-active",
    text: [
      "This is your plot. Click inside the marked land and place the foundation to start the house properly.",
      "You've got a good plot to work with. Lay the foundation inside it and we'll build from there.",
    ],
    check: (_w, t) => t === "foundation",
  },
  {
    id: "foundation-hint",
    text: [
      "Before we raise anything, we need a base. Switch to the Foundation tool first.",
      "The land is ready, but the house needs a platform. Start by placing a foundation.",
    ],
    check: (w) => w.foundation === null,
  },
  {
    id: "furniture-active",
    text: [
      "Nice choice. Click inside the house to place that piece and start making the place feel lived in.",
      "Good pick. Drop the furniture where it feels right and we'll start turning the shell into a home.",
    ],
    check: (_w, t) => t === "furniture",
  },
  {
    id: "paint-active",
    text: [
      "Time to add character. Pick a color, then click a wall or the foundation to paint it.",
      "A little color goes a long way. Choose your paint, then click a surface to freshen it up.",
    ],
    check: (_w, t) => t === "paint",
  },
  {
    id: "furniture-hint",
    text: [
      "The structure is there, but it still feels empty. Switch to Furniture and make it feel like home.",
      "You've built the shell. Now let's make the place welcoming with a bit of furniture.",
    ],
    check: (w) => w.roofs.length > 0 && w.furniture.length === 0,
  },
  {
    id: "roof-active",
    text: [
      "Click one corner, then the opposite corner, and we'll cover this house properly.",
      "Let's keep the weather out. Mark the roof area with two corners.",
    ],
    check: (_w, t) => t === "roof",
  },
  {
    id: "roof-hint",
    text: [
      "Walls are up, so the next job is overhead. Switch to the Roof tool.",
      "We're close to having a real house now. Let's cap it off with a roof.",
    ],
    check: (w) => w.walls.length > 0 && w.roofs.length === 0,
  },
  {
    id: "steelbar-active",
    text: [
      "Set the start point, then the end point. Steel bars give the build some extra confidence.",
      "Click once to start, click again to finish. A little reinforcement never hurts.",
    ],
    check: (_w, t) => t === "steelbar",
  },
  {
    id: "steelbar-hint",
    text: [
      "If you want extra structure, add steel bars next. It's optional, but it gives the build more backbone.",
      "Steel bars are a nice reinforcement step if you want the frame to feel more complete.",
    ],
    check: (w) =>
      w.windows.length > 0 && w.steelBars.length === 0 && w.roofs.length === 0,
  },
  {
    id: "window-active",
    text: [
      "Click a wall to add a window. Let's get some light and air into the place.",
      "Pick a wall and drop in a window. A house starts feeling alive once the light comes in.",
    ],
    check: (_w, t) => t === "window",
  },
  {
    id: "window-hint",
    text: [
      "Nice entrance. Now let's open the place up with a few windows.",
      "Good door placement. The next easy win is adding windows for light and balance.",
    ],
    check: (w) => w.doors.length > 0 && w.windows.length === 0,
  },
  {
    id: "door-active",
    text: [
      "Click on a wall to place a door. People should be able to get in after all.",
      "Choose a wall and add an entrance. A house needs a welcoming way in.",
    ],
    check: (_w, t) => t === "door",
  },
  {
    id: "door-hint",
    text: [
      "The frame is taking shape. Now let's give the house a proper entrance.",
      "You've got walls up. Next, add a door so the place feels usable.",
    ],
    check: (w) => w.walls.length > 0 && w.doors.length === 0,
  },
  {
    id: "wall-active",
    text: [
      "Set your start point, then your end point. We'll frame the house one wall at a time.",
      "Click once to start, click again to finish. Try tying your structure together cleanly.",
    ],
    check: (_w, t) => t === "wall",
  },
  {
    id: "wall-hint",
    text: [
      "Nice pillar layout. Now connect the structure with walls and start shaping the rooms.",
      "Good support points. The next step is drawing walls to turn that layout into a house.",
    ],
    check: (w) => w.pillars.length > 0 && w.walls.length === 0,
  },
  {
    id: "pillar-active",
    text: [
      "Click on the foundation to place a pillar. Think of these as the bones of the build.",
      "Drop a few pillars on the foundation to mark out the structure. We'll connect them up next.",
    ],
    check: (_w, t) => t === "pillar",
  },
  {
    id: "pillar-hint",
    text: [
      "Good. That's your base. Let's build within this land and start the frame with pillars.",
      "Foundation looks good. Keep the structure inside your plot and start with a few pillars.",
    ],
    check: (w) => w.foundation !== null && w.pillars.length === 0,
  },
  {
    id: "inspect-has-stuff",
    text: [
      "Inspect mode is on. Click any object to select it, then use Delete or the arrow keys to fine-tune things.",
      "Take a look around. In Inspect mode you can select pieces, nudge them, or remove what doesn't feel right.",
      "No rush. Inspect mode is good for checking your work and making small fixes before the next step.",
    ],
    check: (_w, t) => t === "select",
  },
  {
    id: "greeting",
    text: [
      "Welcome to the site, Builder. This is your plot. You've got space to build something solid, and it all starts with the foundation.",
      "Good to have you here. The plot is ready, I'm ready, and your dream house starts when you place the foundation inside the land.",
      "Take a look around your land and get comfortable. When you're ready, place the foundation and we'll build this house together.",
    ],
    check: () => true,
  },
];

export function getActiveDialogue(world: World, tool: ToolMode): string {
  for (const line of DIALOGUE_LINES) {
    if (line.check(world, tool)) {
      return pickDialogueText(line.text, world, tool);
    }
  }
  return pickDialogueText(
    DIALOGUE_LINES[DIALOGUE_LINES.length - 1].text,
    world,
    tool,
  );
}

export function getForemanSmallTalk(world: World, tool: ToolMode): string {
  const lines = [
    "Take your time. Good houses are built with steady hands, not rushed ones.",
    "I've seen plenty of builds start rough and end beautifully. Keep going.",
    "If something feels off, that's normal. We can always adjust and build it better.",
    "A strong house is really just a series of sensible small steps.",
    "You're doing fine. Most people underestimate how much thought goes into even a simple home.",
  ];

  return lines[getDialogueSeed(world, tool) % lines.length];
}

export function getForemanSuggestedStep(world: World): string {
  if (!world.foundation) {
    return "Start by placing a foundation so the house has a proper base.";
  }
  if (world.pillars.length === 0) {
    return "Place a few pillars next so the structure has clear support points.";
  }
  if (world.walls.length === 0) {
    return "Draw walls to connect the structure and shape the rooms.";
  }
  if (world.doors.length === 0) {
    return "Add at least one door so the house has a proper entrance.";
  }
  if (world.windows.length === 0) {
    return "Place some windows to bring in light and make the house feel open.";
  }
  if (world.roofs.length === 0) {
    return "Add a roof to finish the shell and protect the space below.";
  }
  if (world.furniture.length === 0) {
    return "Start furnishing the inside so the place feels like a home.";
  }
  if (!localStorage.getItem(STORAGE_KEY)) {
    return "You're in great shape. Save the project so today's work is locked in.";
  }
  return "The main build is in place now. Walk around, inspect details, and refine what you want.";
}

export function getForemanWhyThisMatters(world: World): string {
  if (!world.foundation) {
    return "The foundation gives every other part of the house a clean, reliable base to sit on.";
  }
  if (world.pillars.length === 0) {
    return "Pillars establish support points so the structure feels intentional instead of floating.";
  }
  if (world.walls.length === 0) {
    return "Walls define the shape of the home and turn a frame into real spaces people can use.";
  }
  if (world.doors.length === 0) {
    return "A door makes the house functional. Once you have an entrance, the build starts feeling livable.";
  }
  if (world.windows.length === 0) {
    return "Windows bring in light and rhythm, which helps the house feel open instead of sealed up.";
  }
  if (world.roofs.length === 0) {
    return "A roof completes the shelter. Without it, the structure still feels unfinished.";
  }
  if (world.furniture.length === 0) {
    return "Furniture is what turns a finished shell into a home that feels personal and lived in.";
  }
  if (!localStorage.getItem(STORAGE_KEY)) {
    return "Saving matters because it locks in your progress and protects all the work you've already done.";
  }
  return "At this point, refinement matters most. Small adjustments are what make a house feel truly yours.";
}

export function getForemanWhatComesAfter(world: World): string {
  if (!world.foundation) {
    return "After the foundation, you'll want a few pillars to establish the structure.";
  }
  if (world.pillars.length === 0) {
    return "After pillars, connect them with walls so the layout starts reading like rooms.";
  }
  if (world.walls.length === 0) {
    return "After walls, add a door so the house has a proper entrance.";
  }
  if (world.doors.length === 0) {
    return "After the door, windows are the next easy upgrade to make the house feel open and balanced.";
  }
  if (world.windows.length === 0) {
    return "After windows, you'll usually want a roof so the structure feels complete.";
  }
  if (world.roofs.length === 0) {
    return "After the roof, start furnishing the inside and shaping the feel of the home.";
  }
  if (world.furniture.length === 0) {
    return "After furniture, save your progress and then inspect the house for small improvements.";
  }
  if (!localStorage.getItem(STORAGE_KEY)) {
    return "After saving, the next step is usually to inspect the whole build and polish details.";
  }
  return "After this, I'd walk the site, inspect proportions, and keep refining whatever still feels off.";
}

export function getForemanStuckAdvice(world: World): string {
  if (!world.foundation) {
    return "If you're stuck already, keep it very simple: place the foundation near the center of the land, then we'll build from there.";
  }
  if (world.pillars.length === 0) {
    return "Try placing just four pillars first, one near each corner of the shape you have in mind. That usually gets people moving again.";
  }
  if (world.walls.length === 0) {
    return "Don't try to design the whole house at once. Just connect two or three pillars with walls and let the layout grow naturally.";
  }
  if (world.doors.length === 0) {
    return "Pick the wall that feels most like the front of the house and put one door there. A clear entrance makes the plan easier to read.";
  }
  if (world.windows.length === 0) {
    return "Add one or two windows to the walls that feel too blank. Small openings can make the whole build feel more believable.";
  }
  if (world.roofs.length === 0) {
    return "If the roof feels intimidating, just cover the main footprint first. You can always refine the shape later.";
  }
  if (world.furniture.length === 0) {
    return "Start with one furniture piece in the area you imagine most clearly. A single bed, sofa, or table can help define the room.";
  }
  return "When you're stuck this late, switch to inspect mode and fix one awkward thing at a time. Small cleanups create momentum.";
}

export function getForemanSimpleExplanation(world: World): string {
  if (!world.foundation) {
    return "Simple version: the foundation is the floor slab. It is the base everything else sits on.";
  }
  if (world.pillars.length === 0) {
    return "Simple version: pillars are support posts. They help you mark where the structure stands.";
  }
  if (world.walls.length === 0) {
    return "Simple version: walls connect the structure and divide the home into usable spaces.";
  }
  if (world.doors.length === 0) {
    return "Simple version: doors create entrances so the house feels functional.";
  }
  if (world.windows.length === 0) {
    return "Simple version: windows add light, openness, and balance to the walls.";
  }
  if (world.roofs.length === 0) {
    return "Simple version: the roof finishes the shelter and makes the house feel complete.";
  }
  if (world.furniture.length === 0) {
    return "Simple version: furniture gives each room a purpose and makes the build feel lived in.";
  }
  return "Simple version: the structure is done, and now you're refining comfort, look, and proportions.";
}

export function getForemanIdeas(world: World): string {
  if (!world.foundation) {
    return "You could start with a cozy small cabin, a square modern starter home, or a wide family house with room to grow.";
  }
  if (world.walls.length === 0) {
    return "A good early idea is an L-shaped house, a simple rectangular bungalow, or a small front porch layout.";
  }
  if (world.doors.length === 0 || world.windows.length === 0) {
    return "Think about where sunlight would feel nice. Front-facing windows and a clear main door usually make the house feel welcoming.";
  }
  if (world.roofs.length === 0) {
    return "You could keep the roof compact over the main footprint or extend it a bit for a more generous, sheltered feel.";
  }
  if (world.furniture.length === 0) {
    return "Try giving the home a theme: cozy cottage, clean modern family house, or a practical builder's starter home.";
  }
  return "At this stage, you could add a reading corner, a bigger social space, or shape the home around a favorite room idea.";
}

export function getForemanStageLabel(world: World): string {
  if (!world.foundation) {
    return "Site setup";
  }
  if (world.pillars.length === 0 || world.walls.length === 0) {
    return "Structural framing";
  }
  if (world.doors.length === 0 || world.windows.length === 0) {
    return "Openings and flow";
  }
  if (world.roofs.length === 0) {
    return "Shell completion";
  }
  if (world.furniture.length === 0) {
    return "Making it livable";
  }
  if (!localStorage.getItem(STORAGE_KEY)) {
    return "Final handoff";
  }
  return "Polish and refinement";
}

export function getForemanTone(world: World): string {
  if (!world.foundation) {
    return "Calm and welcoming. Elias is focused on helping you take the very first step without pressure.";
  }
  if (world.pillars.length === 0 || world.walls.length === 0) {
    return "Practical and encouraging. He is helping you turn open land into a believable structure.";
  }
  if (world.doors.length === 0 || world.windows.length === 0) {
    return "Confident and explanatory. The house is taking shape, so his advice becomes more architectural.";
  }
  if (world.roofs.length === 0) {
    return "Protective and goal-focused. He wants to help you turn the frame into a complete shelter.";
  }
  if (world.furniture.length === 0) {
    return "Warmer and more imaginative. The build is stable now, so he starts thinking about comfort and home life.";
  }
  if (!localStorage.getItem(STORAGE_KEY)) {
    return "Proud but careful. He sees the project coming together and reminds you to secure your progress.";
  }
  return "Relaxed and detail-oriented. Elias now sounds more like a mentor reviewing good work than a foreman solving problems.";
}

export function getForemanMemoryReflection(
  event: ForemanMemoryEvent | null,
  world: World,
): string | null {
  if (!event) return null;

  switch (event) {
    case "placed-foundation":
      return "I saw you lay the foundation. That was the moment this stopped being just land and started becoming your house.";
    case "placed-pillars":
      return world.pillars.length > 0
        ? "Those pillars helped the site read like a real structure. Good call getting the support points in early."
        : "You were experimenting with support points earlier. We can always place them again if you want a clearer frame.";
    case "placed-walls":
      return world.walls.length > 0
        ? "Once the walls went up, the whole place started feeling intentional. That's usually when the home takes shape in your mind."
        : "You had walls going earlier. If the layout didn't feel right, rebuilding them cleaner is part of the process.";
    case "placed-openings":
      return "Adding doors and windows was a smart move. Openings are what make a structure start feeling livable.";
    case "placed-roof":
      return world.roofs.length > 0
        ? "That roof changed the whole mood of the build. Shelter makes a frame feel like a house."
        : "You tried roofing already, which is good progress. We can always refine the top shape if it still feels off.";
    case "placed-furniture":
      return world.furniture.length > 0
        ? "I noticed you started furnishing the place. That's where the build begins to feel personal."
        : "You had started furnishing earlier. We can rework the interior until it feels right.";
    case "saved-project":
      return "Good habit saving your work. Builders sleep better when the day's progress is secure.";
    case "loaded-project":
      return "Welcome back. I can tell you're picking up from earlier work, which is exactly how good projects grow.";
    case "deleted-piece":
      return "Removing a piece isn't failure. It's just part of shaping the house into something cleaner.";
    case "undid-step":
      return "Undoing a step is fine. Good builders revise as often as they need to.";
    case "followed-advice":
      return "You actually followed through on the guidance, and that tells me you're building with intention, not just clicking around.";
    default:
      return null;
  }
}

export function getForemanStartBuildGuidance(): string {
  return "This is your plot. You've got space to build something solid.";
}

export function getForemanFoundationPlacedGuidance(): string {
  return "Good. That's your base. Let's build within this land.";
}

export function getForemanFirstWallPlacedGuidance(): string {
  return "That's the first wall in. Keep connecting from corners or wall ends so the frame grows like a real structure.";
}
