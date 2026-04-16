import { useCallback, useMemo, useRef, useState } from "react";
import { INITIAL_WORLD, STORAGE_KEY } from "../constants/editor";
import { FURNITURE_STYLES } from "../constants/furniture";
import { PAINT_COLORS } from "../constants/paint";
import type {
  FurnitureType,
  SelectedObject,
  StructuralMaterial,
  ToolMode,
  World,
} from "../types/world";
import { type ForemanMemoryEvent } from "../utils/dialogue";
import { normalizeWorld } from "../utils/world";
import {
  addDoor,
  addFoundation,
  addFurniture,
  addPillar,
  addRoof,
  addSteelBar,
  addWall,
  addWindow,
  deleteSelectedObject,
  nudgeSelectedObject,
  paintWorldSurface,
} from "../utils/worldEditorMutations";

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
    "Use WASD to walk. Press V for first-person view. H to toggle UI.",
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
        "Foundation tool. Click the land to place a build base before adding the house structure.",
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
      updateWorld((w) => addFoundation(w, x, y));
      setForemanMemoryEvent("placed-foundation");
      setSelectedObject(null);
      setStatusMessage(
        "Foundation placed. You can start adding pillars, walls, and the rest of the house.",
      );
    },
    [updateWorld],
  );

  const placePillar = useCallback(
    (x: number, y: number) => {
      updateWorld((w) => addPillar(w, x, y, currentMaterial, currentFloor));
      setForemanMemoryEvent("placed-pillars");
      setSelectedObject(null);
      setStatusMessage(`Placed ${currentMaterial} pillar.`);
    },
    [currentFloor, currentMaterial, updateWorld],
  );

  const placeWall = useCallback(
    (x1: number, y1: number, x2: number, y2: number) => {
      updateWorld((w) =>
        addWall(w, x1, y1, x2, y2, currentMaterial, currentFloor),
      );
      setForemanMemoryEvent("placed-walls");
      setSelectedObject(null);
      setStatusMessage("Wall placed. Click to start another or switch tools.");
    },
    [currentFloor, currentMaterial, updateWorld],
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
      if (!world.foundation && tool !== "foundation" && tool !== "select") {
        setStatusMessage(
          "Place a foundation first, then continue with pillars, walls, and the rest of the house.",
        );
        return;
      }
      setStatusMessage(toolStatusMessages[tool]);
    },
    [toolStatusMessages, world.foundation],
  );

  const handlePaint = useCallback(
    (kind: "wall" | "foundation", id: string) => {
      updateWorld((w) => paintWorldSurface(w, kind, id, currentPaintColor));
      setStatusMessage(`Painted ${kind}.`);
    },
    [currentPaintColor, updateWorld],
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
  };
}
