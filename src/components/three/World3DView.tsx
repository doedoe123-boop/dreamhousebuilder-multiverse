import { useEffect, useRef } from "react";
import type {
  FurnitureType,
  SelectedObject,
  ToolMode,
  World,
} from "../../types/world";
import { createWorld3DRenderer } from "../../renderer3d/worldRenderer";

type World3DViewProps = {
  world: World;
  currentTool: ToolMode;
  currentFurnitureType?: FurnitureType;
  foremanDialogue?: string;
  onSelectionChange?: (selection: SelectedObject) => void;
  onPlaceFoundation?: (x: number, y: number) => void;
  onPlacePillar?: (x: number, y: number) => void;
  onPlaceWall?: (x1: number, y1: number, x2: number, y2: number) => void;
  onPlaceDoor?: (wallId: string, hitX: number, hitZ: number) => void;
  onPlaceWindow?: (wallId: string, hitX: number, hitZ: number) => void;
  onPlaceFurniture?: (type: FurnitureType, x: number, y: number) => void;
  onPlaceSteelBar?: (x1: number, y1: number, x2: number, y2: number) => void;
  onPlaceRoof?: (x: number, y: number, width: number, height: number) => void;
  onPaint?: (kind: "wall" | "foundation", id: string) => void;
  onViewModeChange?: (fp: boolean) => void;
};

export function World3DView({
  world,
  currentTool,
  currentFurnitureType,
  foremanDialogue,
  onSelectionChange,
  onPlaceFoundation,
  onPlacePillar,
  onPlaceWall,
  onPlaceDoor,
  onPlaceWindow,
  onPlaceFurniture,
  onPlaceSteelBar,
  onPlaceRoof,
  onPaint,
  onViewModeChange,
}: World3DViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<ReturnType<typeof createWorld3DRenderer> | null>(
    null,
  );

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const worldRenderer = createWorld3DRenderer(container);
    rendererRef.current = worldRenderer;

    return () => {
      worldRenderer.dispose();
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    rendererRef.current?.renderWorld3D(world);
  }, [world]);

  useEffect(() => {
    rendererRef.current?.syncInteraction({
      currentTool,
      currentFurnitureType,
      onSelectionChange,
      onPlaceFoundation,
      onPlacePillar,
      onPlaceWall,
      onPlaceDoor,
      onPlaceWindow,
      onPlaceFurniture,
      onPlaceSteelBar,
      onPlaceRoof,
      onPaint,
    });
  }, [
    currentTool,
    currentFurnitureType,
    onPlaceFoundation,
    onPlacePillar,
    onPlaceWall,
    onPlaceDoor,
    onPlaceWindow,
    onPlaceFurniture,
    onPlaceSteelBar,
    onPlaceRoof,
    onPaint,
    onSelectionChange,
  ]);

  useEffect(() => {
    if (foremanDialogue !== undefined) {
      rendererRef.current?.setForemanDialogue(foremanDialogue);
    }
  }, [foremanDialogue]);

  useEffect(() => {
    if (onViewModeChange) {
      rendererRef.current?.setOnViewModeChange(onViewModeChange);
    }
  }, [onViewModeChange]);

  return <div ref={containerRef} className="view3d-shell" />;
}
