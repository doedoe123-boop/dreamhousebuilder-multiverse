import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { FloatingToolbar } from "./components/layout/FloatingToolbar";
import { World3DView } from "./components/three/World3DView";
import {
  DEFAULT_DOOR_WIDTH,
  DEFAULT_PILLAR_SIZE,
  DEFAULT_ROOF_OVERHANG,
  DEFAULT_ROOF_PITCH,
  DEFAULT_STEELBAR_DIAMETER,
  DEFAULT_WALL_THICKNESS,
  DEFAULT_WINDOW_HEIGHT,
  DEFAULT_WINDOW_WIDTH,
  GRID_SIZE,
  INITIAL_WORLD,
  STORAGE_KEY,
} from "./constants/editor";
import { FURNITURE_STYLES } from "./constants/furniture";
import { SCENE3D_SCALE } from "./constants/scene3d";
import type {
  FurnitureType,
  SelectedObject,
  StructuralMaterial,
  ToolMode,
  World,
} from "./types/world";
import { createId, snap } from "./utils/editor";
import { normalizeWorld } from "./utils/world";
import { getActiveDialogue } from "./utils/dialogue";
import { PAINT_COLORS } from "./constants/paint";

const MAX_UNDO_HISTORY = 50;

function App() {
  const [world, setWorld] = useState<World>(INITIAL_WORLD);
  const worldHistoryRef = useRef<World[]>([]);
  const [canUndo, setCanUndo] = useState(false);

  /** Wrap setWorld to push previous state onto undo stack */
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
  const [selectedObject, setSelectedObject] = useState<SelectedObject>(null);
  const [currentTool, setCurrentTool] = useState<ToolMode>("select");
  const [currentMaterial, setCurrentMaterial] =
    useState<StructuralMaterial>("wood");
  const [currentFurnitureType, setCurrentFurnitureType] =
    useState<FurnitureType>("bed");
  const [uiVisible, setUiVisible] = useState(true);
  const [isFirstPerson, setIsFirstPerson] = useState(false);
  const [currentPaintColor, setCurrentPaintColor] = useState(
    PAINT_COLORS[0].value,
  );
  const [currentFloor, setCurrentFloor] = useState(0);
  const [statusMessage, setStatusMessage] = useState(
    "Use WASD to walk. Press V for first-person view. H to toggle UI.",
  );

  const toolStatusMessages = useMemo<Record<ToolMode, string>>(
    () => ({
      select:
        "Inspect mode. Click any object to select it. Press Delete to remove.",
      pillar: `Pillar tool. Click the foundation to place a ${currentMaterial} pillar.`,
      wall: `Wall tool. Click to set start point, click again to finish the wall.`,
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

  const saveWorld = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(world));
    setStatusMessage("Project saved locally.");
  };

  const loadWorld = () => {
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
      setStatusMessage("Project loaded.");
    } catch {
      setStatusMessage("Saved project could not be read.");
    }
  };

  // --- Tool handlers ---

  const placePillar = useCallback(
    (x: number, y: number) => {
      const pillarId = createId("pillar");
      updateWorld((w) => ({
        ...w,
        pillars: [
          ...w.pillars,
          {
            id: pillarId,
            x,
            y,
            size: DEFAULT_PILLAR_SIZE,
            material: currentMaterial,
            floor: currentFloor,
          },
        ],
      }));
      setSelectedObject(null);
      setStatusMessage(`Placed ${currentMaterial} pillar.`);
    },
    [currentMaterial, currentFloor, updateWorld],
  );

  const placeWall = useCallback(
    (x1: number, y1: number, x2: number, y2: number) => {
      const wallId = createId("wall");
      updateWorld((w) => ({
        ...w,
        walls: [
          ...w.walls,
          {
            id: wallId,
            x1,
            y1,
            x2,
            y2,
            thickness: DEFAULT_WALL_THICKNESS,
            material: currentMaterial,
            floor: currentFloor,
          },
        ],
      }));
      setSelectedObject(null);
      setStatusMessage(`Wall placed. Click to start another or switch tools.`);
    },
    [currentMaterial, currentFloor, updateWorld],
  );

  const placeDoor = useCallback(
    (wallId: string, hitX: number, hitZ: number) => {
      // Find the wall and compute t from the 3D hit point
      updateWorld((w) => {
        const wall = w.walls.find((w) => w.id === wallId);
        if (!wall) return w;

        const worldHitX = hitX * SCENE3D_SCALE;
        const worldHitZ = hitZ * SCENE3D_SCALE;

        const dx = wall.x2 - wall.x1;
        const dy = wall.y2 - wall.y1;
        const wallLength = Math.sqrt(dx * dx + dy * dy);
        if (wallLength < 1) return w;

        // Project hit point onto wall line
        const t = Math.max(
          0.1,
          Math.min(
            0.9,
            ((worldHitX - wall.x1) * dx + (worldHitZ - wall.y1) * dy) /
              (wallLength * wallLength),
          ),
        );

        const doorId = createId("door");
        return {
          ...w,
          doors: [
            ...w.doors,
            {
              id: doorId,
              wallId,
              t,
              width: DEFAULT_DOOR_WIDTH,
              floor: currentFloor,
            },
          ],
        };
      });
      setStatusMessage("Door placed on wall.");
    },
    [currentFloor, updateWorld],
  );

  const placeWindow = useCallback(
    (wallId: string, hitX: number, hitZ: number) => {
      updateWorld((w) => {
        const wall = w.walls.find((w) => w.id === wallId);
        if (!wall) return w;

        const worldHitX = hitX * SCENE3D_SCALE;
        const worldHitZ = hitZ * SCENE3D_SCALE;

        const dx = wall.x2 - wall.x1;
        const dy = wall.y2 - wall.y1;
        const wallLength = Math.sqrt(dx * dx + dy * dy);
        if (wallLength < 1) return w;

        const t = Math.max(
          0.1,
          Math.min(
            0.9,
            ((worldHitX - wall.x1) * dx + (worldHitZ - wall.y1) * dy) /
              (wallLength * wallLength),
          ),
        );

        const windowId = createId("window");
        return {
          ...w,
          windows: [
            ...w.windows,
            {
              id: windowId,
              wallId,
              t,
              width: DEFAULT_WINDOW_WIDTH,
              height: DEFAULT_WINDOW_HEIGHT,
              floor: currentFloor,
            },
          ],
        };
      });
      setStatusMessage("Window placed on wall.");
    },
    [currentFloor, updateWorld],
  );

  const placeFurniture = useCallback(
    (type: FurnitureType, x: number, y: number) => {
      const catalog = FURNITURE_STYLES[type];
      const furnitureId = createId(type);
      updateWorld((w) => ({
        ...w,
        furniture: [
          ...w.furniture,
          {
            id: furnitureId,
            type,
            x: snap(x - catalog.defaultWidth / 2),
            y: snap(y - catalog.defaultHeight / 2),
            width: catalog.defaultWidth,
            height: catalog.defaultHeight,
            floor: currentFloor,
          },
        ],
      }));
      setSelectedObject(null);
      setStatusMessage(`Placed ${catalog.label}.`);
    },
    [currentFloor, updateWorld],
  );

  const placeSteelBar = useCallback(
    (x1: number, y1: number, x2: number, y2: number) => {
      const barId = createId("steelbar");
      updateWorld((w) => ({
        ...w,
        steelBars: [
          ...w.steelBars,
          {
            id: barId,
            x1,
            y1,
            x2,
            y2,
            diameter: DEFAULT_STEELBAR_DIAMETER,
            floor: currentFloor,
          },
        ],
      }));
      setSelectedObject(null);
      setStatusMessage("Steel bar placed. Click to start another.");
    },
    [currentFloor, updateWorld],
  );

  const placeRoof = useCallback(
    (x: number, y: number, width: number, height: number) => {
      const roofId = createId("roof");
      updateWorld((w) => ({
        ...w,
        roofs: [
          ...w.roofs,
          {
            id: roofId,
            x,
            y,
            width,
            height,
            style: "gable",
            overhang: DEFAULT_ROOF_OVERHANG,
            pitch: DEFAULT_ROOF_PITCH,
            floor: currentFloor,
          },
        ],
      }));
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

    const { kind, id } = selectedObject;

    updateWorld((w) => {
      if (kind === "wall") {
        // Also remove doors/windows on this wall
        return {
          ...w,
          walls: w.walls.filter((item) => item.id !== id),
          doors: w.doors.filter((item) => item.wallId !== id),
          windows: w.windows.filter((item) => item.wallId !== id),
        };
      }
      if (kind === "pillar")
        return { ...w, pillars: w.pillars.filter((item) => item.id !== id) };
      if (kind === "furniture")
        return {
          ...w,
          furniture: w.furniture.filter((item) => item.id !== id),
        };
      if (kind === "door")
        return { ...w, doors: w.doors.filter((item) => item.id !== id) };
      if (kind === "window")
        return { ...w, windows: w.windows.filter((item) => item.id !== id) };
      if (kind === "steelbar")
        return {
          ...w,
          steelBars: w.steelBars.filter((item) => item.id !== id),
        };
      if (kind === "roof")
        return { ...w, roofs: w.roofs.filter((item) => item.id !== id) };
      return w;
    });

    setStatusMessage(`Deleted ${kind}.`);
    setSelectedObject(null);
  }, [selectedObject, updateWorld]);

  // Nudge selected object by arrow keys
  const nudgeSelected = useCallback(
    (dx: number, dy: number) => {
      if (!selectedObject) return;
      const { kind, id } = selectedObject;
      updateWorld((w) => {
        if (kind === "pillar") {
          return {
            ...w,
            pillars: w.pillars.map((p) =>
              p.id === id ? { ...p, x: p.x + dx, y: p.y + dy } : p,
            ),
          };
        }
        if (kind === "wall") {
          return {
            ...w,
            walls: w.walls.map((wall) =>
              wall.id === id
                ? {
                    ...wall,
                    x1: wall.x1 + dx,
                    y1: wall.y1 + dy,
                    x2: wall.x2 + dx,
                    y2: wall.y2 + dy,
                  }
                : wall,
            ),
          };
        }
        if (kind === "furniture") {
          return {
            ...w,
            furniture: w.furniture.map((f) =>
              f.id === id ? { ...f, x: f.x + dx, y: f.y + dy } : f,
            ),
          };
        }
        if (kind === "door") {
          const door = w.doors.find((d) => d.id === id);
          if (!door) return w;
          const wall = w.walls.find((wall) => wall.id === door.wallId);
          if (!wall) return w;
          const wallDx = wall.x2 - wall.x1;
          const wallDy = wall.y2 - wall.y1;
          const wallLen = Math.sqrt(wallDx * wallDx + wallDy * wallDy);
          if (wallLen < 1) return w;
          // Project the nudge vector onto the wall direction
          const proj = (dx * wallDx + dy * wallDy) / (wallLen * wallLen);
          const newT = Math.max(0.1, Math.min(0.9, door.t + proj));
          return {
            ...w,
            doors: w.doors.map((d) => (d.id === id ? { ...d, t: newT } : d)),
          };
        }
        if (kind === "window") {
          const win = w.windows.find((win) => win.id === id);
          if (!win) return w;
          const wall = w.walls.find((wall) => wall.id === win.wallId);
          if (!wall) return w;
          const wallDx = wall.x2 - wall.x1;
          const wallDy = wall.y2 - wall.y1;
          const wallLen = Math.sqrt(wallDx * wallDx + wallDy * wallDy);
          if (wallLen < 1) return w;
          const proj = (dx * wallDx + dy * wallDy) / (wallLen * wallLen);
          const newT = Math.max(0.1, Math.min(0.9, win.t + proj));
          return {
            ...w,
            windows: w.windows.map((win) =>
              win.id === id ? { ...win, t: newT } : win,
            ),
          };
        }
        if (kind === "steelbar") {
          return {
            ...w,
            steelBars: w.steelBars.map((bar) =>
              bar.id === id
                ? {
                    ...bar,
                    x1: bar.x1 + dx,
                    y1: bar.y1 + dy,
                    x2: bar.x2 + dx,
                    y2: bar.y2 + dy,
                  }
                : bar,
            ),
          };
        }
        if (kind === "roof") {
          return {
            ...w,
            roofs: w.roofs.map((r) =>
              r.id === id ? { ...r, x: r.x + dx, y: r.y + dy } : r,
            ),
          };
        }
        return w;
      });
    },
    [selectedObject, updateWorld],
  );

  // Keyboard shortcut for delete, undo, and nudge
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't handle if focus is on an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      )
        return;

      // Ctrl+Z / Cmd+Z for undo
      if ((event.ctrlKey || event.metaKey) && event.key === "z") {
        event.preventDefault();
        if (undo()) {
          setSelectedObject(null);
          setStatusMessage("Undo.");
        }
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        deleteSelected();
        return;
      }

      // Escape to deselect / cancel wall
      if (event.key === "Escape") {
        setSelectedObject(null);
        setCurrentTool("select");
        setStatusMessage(toolStatusMessages.select);
        return;
      }

      // H to toggle UI panels
      if (event.key.toLowerCase() === "h" && !event.ctrlKey && !event.metaKey) {
        setUiVisible((v) => !v);
        return;
      }

      // Number keys 1-9 to switch tools
      const toolKeys: Record<string, ToolMode> = {
        "1": "select",
        "2": "pillar",
        "3": "wall",
        "4": "door",
        "5": "window",
        "6": "steelbar",
        "7": "roof",
        "8": "furniture",
        "9": "paint",
      };
      if (toolKeys[event.key]) {
        const tool = toolKeys[event.key];
        setCurrentTool(tool);
        setSelectedObject(null);
        setStatusMessage(toolStatusMessages[tool]);
        return;
      }

      // Arrow keys to nudge selected object
      if (
        selectedObject &&
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)
      ) {
        event.preventDefault();
        const step = GRID_SIZE;
        switch (event.key) {
          case "ArrowUp":
            nudgeSelected(0, -step);
            break;
          case "ArrowDown":
            nudgeSelected(0, step);
            break;
          case "ArrowLeft":
            nudgeSelected(-step, 0);
            break;
          case "ArrowRight":
            nudgeSelected(step, 0);
            break;
        }
        return;
      }

      // PageUp/PageDown to switch floors
      if (event.key === "PageUp") {
        event.preventDefault();
        setCurrentFloor((f) => Math.min(f + 1, 9));
        return;
      }
      if (event.key === "PageDown") {
        event.preventDefault();
        setCurrentFloor((f) => Math.max(f - 1, 0));
        return;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteSelected, toolStatusMessages, undo, selectedObject, nudgeSelected]);

  const handleSelectionChange = useCallback(
    (selection: SelectedObject) => {
      setSelectedObject(selection);
      setStatusMessage(
        selection
          ? `Selected ${selection.kind}. Press Delete to remove.`
          : toolStatusMessages[currentTool],
      );
    },
    [toolStatusMessages, currentTool],
  );

  const handleSetTool = (tool: ToolMode) => {
    setCurrentTool(tool);
    setSelectedObject(null);
    setStatusMessage(toolStatusMessages[tool]);
  };

  const handlePaint = useCallback(
    (kind: "wall" | "foundation", id: string) => {
      updateWorld((w) => {
        if (kind === "wall") {
          return {
            ...w,
            walls: w.walls.map((wall) =>
              wall.id === id ? { ...wall, color: currentPaintColor } : wall,
            ),
          };
        }
        if (kind === "foundation") {
          return {
            ...w,
            foundation: { ...w.foundation, color: currentPaintColor },
          };
        }
        return w;
      });
      setStatusMessage(`Painted ${kind}.`);
    },
    [currentPaintColor, updateWorld],
  );

  const foremanDialogue = useMemo(
    () => getActiveDialogue(world, currentTool),
    [world, currentTool],
  );

  return (
    <main className="app-shell">
      <section className="editor-panel">
        <div
          className={"stage-shell" + (isFirstPerson ? " is-firstperson" : "")}
        >
          {isFirstPerson && (
            <div className="fp-key-guide">
              <div className="fp-key-guide__title">Controls</div>
              <div className="fp-key-guide__row">
                <kbd>W A S D</kbd> Move
              </div>
              <div className="fp-key-guide__row">
                <kbd>Mouse</kbd> Look
              </div>
              <div className="fp-key-guide__row">
                <kbd>Click</kbd> Place / Select
              </div>
              <div className="fp-key-guide__row">
                <kbd>Delete</kbd> Remove
              </div>
              <div className="fp-key-guide__row">
                <kbd>Esc</kbd> Exit FP
              </div>
              <div className="fp-key-guide__divider" />
              <div className="fp-key-guide__title">Floor</div>
              <div className="fp-key-guide__row is-active">
                <kbd>PgUp/Dn</kbd>{" "}
                {currentFloor === 0 ? "Ground" : `Floor ${currentFloor}`}
              </div>
              <div className="fp-key-guide__divider" />
              <div className="fp-key-guide__title">Tools</div>
              <div
                className={
                  "fp-key-guide__row" +
                  (currentTool === "select" ? " is-active" : "")
                }
              >
                <kbd>1</kbd> Inspect
              </div>
              <div
                className={
                  "fp-key-guide__row" +
                  (currentTool === "pillar" ? " is-active" : "")
                }
              >
                <kbd>2</kbd> Pillar
              </div>
              <div
                className={
                  "fp-key-guide__row" +
                  (currentTool === "wall" ? " is-active" : "")
                }
              >
                <kbd>3</kbd> Wall
              </div>
              <div
                className={
                  "fp-key-guide__row" +
                  (currentTool === "door" ? " is-active" : "")
                }
              >
                <kbd>4</kbd> Door
              </div>
              <div
                className={
                  "fp-key-guide__row" +
                  (currentTool === "window" ? " is-active" : "")
                }
              >
                <kbd>5</kbd> Window
              </div>
              <div
                className={
                  "fp-key-guide__row" +
                  (currentTool === "steelbar" ? " is-active" : "")
                }
              >
                <kbd>6</kbd> Steel Bar
              </div>
              <div
                className={
                  "fp-key-guide__row" +
                  (currentTool === "roof" ? " is-active" : "")
                }
              >
                <kbd>7</kbd> Roof
              </div>
              <div
                className={
                  "fp-key-guide__row" +
                  (currentTool === "furniture" ? " is-active" : "")
                }
              >
                <kbd>8</kbd> Furniture
              </div>
              <div
                className={
                  "fp-key-guide__row" +
                  (currentTool === "paint" ? " is-active" : "")
                }
              >
                <kbd>9</kbd> Paint
              </div>
            </div>
          )}
          {!isFirstPerson && uiVisible && (
            <>
              <FloatingToolbar
                world={world}
                currentTool={currentTool}
                currentMaterial={currentMaterial}
                currentFurnitureType={currentFurnitureType}
                selectedObject={selectedObject}
                statusMessage={statusMessage}
                canUndo={canUndo}
                onSetTool={handleSetTool}
                onSetMaterial={(material) => {
                  setCurrentMaterial(material);
                  setStatusMessage(
                    `Material: ${material}. Now place objects with this material.`,
                  );
                }}
                onSetFurnitureType={(type) => {
                  setCurrentFurnitureType(type);
                  setStatusMessage(
                    `Furniture: ${FURNITURE_STYLES[type].label}. Click the ground to place.`,
                  );
                }}
                onSaveWorld={saveWorld}
                onLoadWorld={loadWorld}
                onDeleteSelected={deleteSelected}
                onUndo={() => {
                  if (undo()) {
                    setSelectedObject(null);
                    setStatusMessage("Undo.");
                  }
                }}
                currentPaintColor={currentPaintColor}
                onSetPaintColor={(color) => {
                  setCurrentPaintColor(color);
                  setStatusMessage(
                    `Paint color: ${color}. Click walls or floor to paint.`,
                  );
                }}
                currentFloor={currentFloor}
                onSetFloor={setCurrentFloor}
              />
            </>
          )}
          {!isFirstPerson && !uiVisible && (
            <div className="floating-hint">
              Press <kbd>H</kbd> to show UI
            </div>
          )}
          <World3DView
            world={world}
            currentTool={currentTool}
            currentFurnitureType={currentFurnitureType}
            foremanDialogue={foremanDialogue}
            onPlacePillar={placePillar}
            onPlaceWall={placeWall}
            onPlaceDoor={placeDoor}
            onPlaceWindow={placeWindow}
            onPlaceFurniture={placeFurniture}
            onPlaceSteelBar={placeSteelBar}
            onPlaceRoof={placeRoof}
            onPaint={handlePaint}
            onSelectionChange={handleSelectionChange}
            onViewModeChange={setIsFirstPerson}
          />
        </div>
      </section>
    </main>
  );
}

export default App;
