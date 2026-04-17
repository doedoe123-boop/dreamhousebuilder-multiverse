import { useCallback, useMemo, useRef, useState } from "react";
import {
  INITIAL_WORLD,
  STORAGE_KEY,
  STRUCTURE_SCALE_STEP,
} from "../constants/editor";
import { FURNITURE_STYLES } from "../constants/furniture";
import { PAINT_COLORS } from "../constants/paint";
import type {
  FurnitureType,
  SelectedObject,
  StructuralMaterial,
  ToolMode,
  World,
} from "../types/world";
import {
  getForemanFirstWallPlacedGuidance,
  getForemanFoundationPlacedGuidance,
  getForemanStartBuildGuidance,
  type ForemanMemoryEvent,
} from "../utils/dialogue";
import { getBuildingState } from "../utils/buildableLand";
import { normalizeWorld } from "../utils/world";
import { clampScale } from "../utils/structureResize";
import {
  addDoor,
  addFurniture,
  addRoof,
  addSteelBar,
  addWindow,
  deleteSelectedObject,
  nudgeSelectedObject,
  paintWorldSurface,
  resizeSelectedObjectHeight,
  resizeSelectedObjectPrimary,
} from "../utils/worldEditorMutations";
import { validateAndPlace } from "../utils/validateAndPlace";

const MAX_UNDO_HISTORY = 50;

export function useWorldEditor() {
  const [world, setWorld] = useState<World>(INITIAL_WORLD);
  const worldHistoryRef = useRef<World[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [selectedObject, setSelectedObject] = useState<SelectedObject>(null);
  const [currentTool, setCurrentTool] = useState<ToolMode>("select");
  const [currentMaterial, setCurrentMaterial] =
    useState<StructuralMaterial>("wood");
  const [currentFurnitureType, setCurrentFurnitureType] =
    useState<FurnitureType>("bed");
  const [currentPaintColor, setCurrentPaintColor] = useState(
    PAINT_COLORS[0].value,
  );
  const [currentFloor, setCurrentFloor] = useState(0);
  const [foremanMemoryEvent, setForemanMemoryEvent] =
    useState<ForemanMemoryEvent | null>(null);
  const [statusMessage, setStatusMessage] = useState(
    getForemanStartBuildGuidance(),
  );

  const updateWorld = useCallback(
    (updater: World | ((prev: World) => World)) => {
      setWorld((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        if (next !== prev) {
          worldHistoryRef.current = [
            ...worldHistoryRef.current.slice(-(MAX_UNDO_HISTORY - 1)),
            prev,
          ];
          setCanUndo(true);
        }
        return next;
      });
    },
    [],
  );

  const undo = useCallback(() => {
    const history = worldHistoryRef.current;
    if (history.length === 0) return false;
    const previous = history[history.length - 1];
    worldHistoryRef.current = history.slice(0, -1);
    setCanUndo(history.length > 1);
    setWorld(previous);
    return true;
  }, []);

  const toolStatusMessages = useMemo<Record<ToolMode, string>>(
    () => ({
      select:
        "Inspect mode. Click any object to select it. Press Delete to remove.",
      foundation:
        "Foundation tool. Place your base inside the marked plot of land.",
      pillar: `Pillar tool. Click the foundation to place a ${currentMaterial} pillar.`,
      wall: "Wall tool. Click to set start point, click again to finish the wall.",
      door: "Door tool. Click on any wall to place a door.",
      window: "Window tool. Click on any wall to place a window.",
      furniture: `Furniture tool. Click the ground to place a ${currentFurnitureType}.`,
      steelbar:
        "Steel Bar tool. Click to set start, click again to finish the bar.",
      roof: "Roof tool. Click to set first corner, click again for opposite corner.",
      paint: "Paint tool. Click a wall or floor to paint it.",
    }),
    [currentMaterial, currentFurnitureType],
  );

  const saveWorld = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(world));
    setForemanMemoryEvent("saved-project");
    setStatusMessage("Project saved locally.");
  }, [world]);

  const loadWorld = useCallback(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      setStatusMessage("No saved project found.");
      return;
    }
    try {
      const parsed = JSON.parse(saved) as Partial<World>;
      const nextWorld = normalizeWorld(parsed);
      setWorld(nextWorld);
      worldHistoryRef.current = [];
      setCanUndo(false);
      setSelectedObject(null);
      setForemanMemoryEvent("loaded-project");
      setStatusMessage("Project loaded.");
    } catch {
      setStatusMessage("Saved project could not be read.");
    }
  }, []);

  const placeFoundation = useCallback(
    (x: number, y: number) => {
      const result = validateAndPlace("foundation", { type: "foundation", x, y }, world);
      if (!result.success) {
        setStatusMessage(result.reason);
        return;
      }
      updateWorld(result.updatedWorld);
      setForemanMemoryEvent("placed-foundation");
      setSelectedObject(null);
      setStatusMessage(getForemanFoundationPlacedGuidance());
    },
    [updateWorld, world],
  );

  const placePillar = useCallback(
    (x: number, y: number) => {
      const result = validateAndPlace(
        "pillar",
        {
          type: "pillar",
          x,
          y,
          material: currentMaterial,
          floor: currentFloor,
        },
        world,
      );
      if (!result.success) {
        setStatusMessage(result.reason);
        return;
      }
      updateWorld(result.updatedWorld);
      setForemanMemoryEvent("placed-pillars");
      setSelectedObject(null);
      setStatusMessage(`Placed ${currentMaterial} pillar.`);
    },
    [currentFloor, currentMaterial, updateWorld, world],
  );

  const placeWall = useCallback(
    (x1: number, y1: number, x2: number, y2: number) => {
      const isFirstWall = world.walls.length === 0;
      const result = validateAndPlace(
        "wall",
        {
          type: "wall",
          x1,
          y1,
          x2,
          y2,
          material: currentMaterial,
          floor: currentFloor,
        },
        world,
      );
      if (!result.success) {
        setStatusMessage(result.reason);
        return;
      }
      updateWorld(result.updatedWorld);
      setForemanMemoryEvent("placed-walls");
      setSelectedObject(null);
      setStatusMessage(
        isFirstWall
          ? getForemanFirstWallPlacedGuidance()
          : "Wall placed. Keep connecting from wall ends or foundation edges.",
      );
    },
    [currentFloor, currentMaterial, updateWorld, world],
  );

  const placeDoor = useCallback(
    (wallId: string, hitX: number, hitZ: number) => {
      updateWorld((w) => addDoor(w, wallId, hitX, hitZ, currentFloor));
      setForemanMemoryEvent("placed-openings");
      setStatusMessage("Door placed on wall.");
    },
    [currentFloor, updateWorld],
  );

  const placeWindow = useCallback(
    (wallId: string, hitX: number, hitZ: number) => {
      updateWorld((w) => addWindow(w, wallId, hitX, hitZ, currentFloor));
      setForemanMemoryEvent("placed-openings");
      setStatusMessage("Window placed on wall.");
    },
    [currentFloor, updateWorld],
  );

  const placeFurniture = useCallback(
    (type: FurnitureType, x: number, y: number) => {
      const label = FURNITURE_STYLES[type].label;
      updateWorld((w) => addFurniture(w, type, x, y, currentFloor));
      setForemanMemoryEvent("placed-furniture");
      setSelectedObject(null);
      setStatusMessage(`Placed ${label}.`);
    },
    [currentFloor, updateWorld],
  );

  const placeSteelBar = useCallback(
    (x1: number, y1: number, x2: number, y2: number) => {
      updateWorld((w) => addSteelBar(w, x1, y1, x2, y2, currentFloor));
      setSelectedObject(null);
      setStatusMessage("Steel bar placed. Click to start another.");
    },
    [currentFloor, updateWorld],
  );

  const placeRoof = useCallback(
    (x: number, y: number, width: number, height: number) => {
      updateWorld((w) => addRoof(w, x, y, width, height, currentFloor));
      setForemanMemoryEvent("placed-roof");
      setSelectedObject(null);
      setStatusMessage("Roof placed.");
    },
    [currentFloor, updateWorld],
  );

  const deleteSelected = useCallback(() => {
    if (!selectedObject) {
      setStatusMessage("Nothing selected to delete.");
      return;
    }
    updateWorld((w) => deleteSelectedObject(w, selectedObject));
    setStatusMessage(`Deleted ${selectedObject.kind}.`);
    setForemanMemoryEvent("deleted-piece");
    setSelectedObject(null);
  }, [selectedObject, updateWorld]);

  const nudgeSelected = useCallback(
    (dx: number, dy: number) => {
      if (!selectedObject) return;
      updateWorld((w) => nudgeSelectedObject(w, selectedObject, dx, dy));
    },
    [selectedObject, updateWorld],
  );

  const handleSelectionChange = useCallback(
    (selection: SelectedObject) => {
      setSelectedObject(selection);
      setStatusMessage(
        selection
          ? `Selected ${selection.kind}. Press Delete to remove.`
          : toolStatusMessages[currentTool],
      );
    },
    [currentTool, toolStatusMessages],
  );

  const handleSetTool = useCallback(
    (tool: ToolMode) => {
      setCurrentTool(tool);
      setSelectedObject(null);
      const buildingState = getBuildingState(world);
      if (buildingState === "empty-land" && tool !== "foundation" && tool !== "select") {
        setStatusMessage(
          "This is your plot. Start with the foundation, then build from that base.",
        );
        return;
      }
      setStatusMessage(toolStatusMessages[tool]);
    },
    [toolStatusMessages, world],
  );

  const handlePaint = useCallback(
    (kind: "wall" | "foundation", id: string) => {
      updateWorld((w) => paintWorldSurface(w, kind, id, currentPaintColor));
      setStatusMessage(`Painted ${kind}.`);
    },
    [currentPaintColor, updateWorld],
  );

  const selectedResizeInfo = useMemo(() => {
    if (!selectedObject) return null;

    if (selectedObject.kind === "pillar") {
      const pillar = world.pillars.find((item) => item.id === selectedObject.id);
      if (!pillar) return null;
      return {
        primaryLabel: "Height",
        primaryValue: pillar.heightScale ?? 1,
        secondaryLabel: null,
        secondaryValue: null,
      };
    }

    if (selectedObject.kind === "wall") {
      const wall = world.walls.find((item) => item.id === selectedObject.id);
      if (!wall) return null;
      return {
        primaryLabel: "Length",
        primaryValue: wall.lengthScale ?? 1,
        secondaryLabel: "Height",
        secondaryValue: wall.heightScale ?? 1,
      };
    }

    return null;
  }, [selectedObject, world.pillars, world.walls]);

  const resizeSelectedPrimary = useCallback(
    (direction: -1 | 1) => {
      if (!selectedObject) return;
      if (selectedObject.kind !== "pillar" && selectedObject.kind !== "wall") return;

      updateWorld((w) =>
        resizeSelectedObjectPrimary(
          w,
          selectedObject,
          direction * STRUCTURE_SCALE_STEP,
        ),
      );

      const currentValue =
        selectedObject.kind === "pillar"
          ? world.pillars.find((item) => item.id === selectedObject.id)
              ?.heightScale ?? 1
          : world.walls.find((item) => item.id === selectedObject.id)
              ?.lengthScale ?? 1;
      const nextValue = currentValue + direction * STRUCTURE_SCALE_STEP;
      setStatusMessage(
        `${selectedObject.kind === "pillar" ? "Height" : "Length"}: ${clampScale(nextValue).toFixed(1)}`,
      );
    },
    [selectedObject, setStatusMessage, updateWorld, world.pillars, world.walls],
  );

  const resizeSelectedHeight = useCallback(
    (direction: -1 | 1) => {
      if (!selectedObject) return;
      if (selectedObject.kind !== "pillar" && selectedObject.kind !== "wall") return;

      updateWorld((w) =>
        resizeSelectedObjectHeight(
          w,
          selectedObject,
          direction * STRUCTURE_SCALE_STEP,
        ),
      );

      const currentValue =
        selectedObject.kind === "pillar"
          ? world.pillars.find((item) => item.id === selectedObject.id)
              ?.heightScale ?? 1
          : world.walls.find((item) => item.id === selectedObject.id)
              ?.heightScale ?? 1;
      const nextValue = currentValue + direction * STRUCTURE_SCALE_STEP;
      setStatusMessage(`Height: ${clampScale(nextValue).toFixed(1)}`);
    },
    [selectedObject, setStatusMessage, updateWorld, world.pillars, world.walls],
  );

  return {
    world,
    canUndo,
    selectedObject,
    currentTool,
    currentMaterial,
    currentFurnitureType,
    currentPaintColor,
    currentFloor,
    statusMessage,
    toolStatusMessages,
    foremanMemoryEvent,
    setCurrentTool,
    setCurrentMaterial,
    setCurrentFurnitureType,
    setCurrentPaintColor,
    setCurrentFloor,
    setStatusMessage,
    setSelectedObject,
    setForemanMemoryEvent,
    undo,
    saveWorld,
    loadWorld,
    placeFoundation,
    placePillar,
    placeWall,
    placeDoor,
    placeWindow,
    placeFurniture,
    placeSteelBar,
    placeRoof,
    deleteSelected,
    nudgeSelected,
    handleSelectionChange,
    handleSetTool,
    handlePaint,
    resizeSelectedPrimary,
    resizeSelectedHeight,
    selectedResizeInfo,
  };
}
