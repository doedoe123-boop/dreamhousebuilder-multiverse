import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import { ForemanPanel } from "./components/layout/ForemanPanel";
import { FloatingToolbar } from "./components/layout/FloatingToolbar";
import { World3DView } from "./components/three/World3DView";
import { GRID_SIZE } from "./constants/editor";
import { FURNITURE_STYLES } from "./constants/furniture";
import type { ToolMode } from "./types/world";
import {
  getActiveDialogue,
  getForemanIdeas,
  getForemanMemoryReflection,
  getForemanSmallTalk,
  getForemanSimpleExplanation,
  getForemanStageLabel,
  getForemanStuckAdvice,
  getForemanSuggestedStep,
  getForemanTone,
  getForemanWhatComesAfter,
  getForemanWhyThisMatters,
} from "./utils/dialogue";
import { useWorldEditor } from "./hooks/useWorldEditor";

function App() {
  const {
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
  } = useWorldEditor();
  const [uiVisible, setUiVisible] = useState(true);
  const [isFirstPerson, setIsFirstPerson] = useState(false);
  const [isNearForeman, setIsNearForeman] = useState(false);
  const [isTalkingToForeman, setIsTalkingToForeman] = useState(false);
  const [foremanTopic, setForemanTopic] = useState<
    "stuck" | "simple" | "ideas" | null
  >(null);
  const handleForemanNearbyChange = useCallback((nearby: boolean) => {
    setIsNearForeman(nearby);
    if (!nearby) {
      setIsTalkingToForeman(false);
      setForemanTopic(null);
    }
  }, []);

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
          setForemanMemoryEvent("undid-step");
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
        if (isTalkingToForeman) {
          setIsTalkingToForeman(false);
          setForemanTopic(null);
          return;
        }
        setSelectedObject(null);
        setCurrentTool("select");
        setStatusMessage(toolStatusMessages.select);
        return;
      }

      if (
        event.key.toLowerCase() === "e" &&
        !event.ctrlKey &&
        !event.metaKey &&
        isNearForeman
      ) {
        event.preventDefault();
        setIsTalkingToForeman((open) => {
          const next = !open;
          if (!next) {
            setForemanTopic(null);
          }
          return next;
        });
        return;
      }

      // H to toggle UI panels
      if (event.key.toLowerCase() === "h" && !event.ctrlKey && !event.metaKey) {
        setUiVisible((v) => !v);
        return;
      }

      // Number keys 1-9 to switch tools
      const toolKeys: Record<string, ToolMode> = {
        "1": "foundation",
        "2": "select",
        "3": "pillar",
        "4": "wall",
        "5": "door",
        "6": "window",
        "7": "steelbar",
        "8": "roof",
        "9": "furniture",
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
  }, [
    deleteSelected,
    isNearForeman,
    isTalkingToForeman,
    nudgeSelected,
    selectedObject,
    setCurrentFloor,
    setCurrentTool,
    setForemanMemoryEvent,
    setSelectedObject,
    setStatusMessage,
    toolStatusMessages,
    undo,
  ]);

  const foremanDialogue = useMemo(
    () => getActiveDialogue(world, currentTool),
    [world, currentTool],
  );
  const foremanSmallTalk = useMemo(
    () => getForemanSmallTalk(world, currentTool),
    [world, currentTool],
  );
  const foremanSuggestedStep = useMemo(
    () => getForemanSuggestedStep(world),
    [world],
  );
  const foremanStageLabel = useMemo(() => getForemanStageLabel(world), [world]);
  const foremanTone = useMemo(() => getForemanTone(world), [world]);
  const foremanMemoryReflection = useMemo(
    () => getForemanMemoryReflection(foremanMemoryEvent, world),
    [foremanMemoryEvent, world],
  );
  const foremanStuckAdvice = useMemo(
    () => getForemanStuckAdvice(world),
    [world],
  );
  const foremanSimpleExplanation = useMemo(
    () => getForemanSimpleExplanation(world),
    [world],
  );
  const foremanIdeas = useMemo(() => getForemanIdeas(world), [world]);
  const foremanWhyThisMatters = useMemo(
    () => getForemanWhyThisMatters(world),
    [world],
  );
  const foremanWhatComesAfter = useMemo(
    () => getForemanWhatComesAfter(world),
    [world],
  );
  const foremanSuggestedTool = useMemo<ToolMode | null>(() => {
    if (!world.foundation) return "foundation";
    if (world.pillars.length === 0) return "pillar";
    if (world.walls.length === 0) return "wall";
    if (world.doors.length === 0) return "door";
    if (world.windows.length === 0) return "window";
    if (world.roofs.length === 0) return "roof";
    if (world.furniture.length === 0) return "furniture";
    return null;
  }, [world]);

  // The active text shown in the foreman's 3D speech bubble
  const foremanBubbleText = useMemo(() => {
    if (!isTalkingToForeman) return foremanDialogue;
    if (foremanTopic === "stuck") return foremanStuckAdvice;
    if (foremanTopic === "simple") return foremanSimpleExplanation;
    if (foremanTopic === "ideas") return foremanIdeas;
    return foremanDialogue;
  }, [
    isTalkingToForeman,
    foremanTopic,
    foremanDialogue,
    foremanStuckAdvice,
    foremanSimpleExplanation,
    foremanIdeas,
  ]);

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
                  (currentTool === "foundation" ? " is-active" : "")
                }
              >
                <kbd>1</kbd> Foundation
              </div>
              <div
                className={
                  "fp-key-guide__row" +
                  (currentTool === "select" ? " is-active" : "")
                }
              >
                <kbd>2</kbd> Inspect
              </div>
              <div
                className={
                  "fp-key-guide__row" +
                  (currentTool === "pillar" ? " is-active" : "")
                }
              >
                <kbd>3</kbd> Pillar
              </div>
              <div
                className={
                  "fp-key-guide__row" +
                  (currentTool === "wall" ? " is-active" : "")
                }
              >
                <kbd>4</kbd> Wall
              </div>
              <div
                className={
                  "fp-key-guide__row" +
                  (currentTool === "door" ? " is-active" : "")
                }
              >
                <kbd>5</kbd> Door
              </div>
              <div
                className={
                  "fp-key-guide__row" +
                  (currentTool === "window" ? " is-active" : "")
                }
              >
                <kbd>6</kbd> Window
              </div>
              <div
                className={
                  "fp-key-guide__row" +
                  (currentTool === "steelbar" ? " is-active" : "")
                }
              >
                <kbd>7</kbd> Steel Bar
              </div>
              <div
                className={
                  "fp-key-guide__row" +
                  (currentTool === "roof" ? " is-active" : "")
                }
              >
                <kbd>8</kbd> Roof
              </div>
              <div
                className={
                  "fp-key-guide__row" +
                  (currentTool === "furniture" ? " is-active" : "")
                }
              >
                <kbd>9</kbd> Furniture
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
          <ForemanPanel
            isNearForeman={isNearForeman}
            isTalkingToForeman={isTalkingToForeman}
            foremanTopic={foremanTopic}
            foremanStageLabel={foremanStageLabel}
            foremanSuggestedTool={foremanSuggestedTool}
            onSetTopic={setForemanTopic}
            onShowSuggestedTool={() => {
              if (!foremanSuggestedTool) return;
              handleSetTool(foremanSuggestedTool);
              setForemanMemoryEvent("followed-advice");
              setForemanTopic(null);
              setStatusMessage(
                `Foreman Elias switched you to the ${foremanSuggestedTool} tool.`,
              );
            }}
            onInspectMode={() => {
              setCurrentTool("select");
              setSelectedObject(null);
              setForemanMemoryEvent("followed-advice");
              setForemanTopic(null);
              setStatusMessage(
                "Foreman Elias switched you back to inspect mode.",
              );
            }}
          />
          {!isFirstPerson && !uiVisible && (
            <div className="floating-hint">
              Press <kbd>H</kbd> to show UI
            </div>
          )}
          <World3DView
            world={world}
            currentTool={currentTool}
            currentFurnitureType={currentFurnitureType}
            foremanDialogue={foremanBubbleText}
            isTalkingToForeman={isTalkingToForeman}
            onPlacePillar={placePillar}
            onPlaceFoundation={placeFoundation}
            onPlaceWall={placeWall}
            onPlaceDoor={placeDoor}
            onPlaceWindow={placeWindow}
            onPlaceFurniture={placeFurniture}
            onPlaceSteelBar={placeSteelBar}
            onPlaceRoof={placeRoof}
            onPaint={handlePaint}
            onSelectionChange={handleSelectionChange}
            onViewModeChange={setIsFirstPerson}
            onForemanNearbyChange={handleForemanNearbyChange}
          />
        </div>
      </section>
    </main>
  );
}

export default App;
