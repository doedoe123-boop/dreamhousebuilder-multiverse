import type {
  FurnitureType,
  SelectedObject,
  ToolMode,
} from "../types/world";

export type World3DRendererOptions = {
  onSelectionChange?: (selection: SelectedObject) => void;
  currentTool?: ToolMode;
  currentFurnitureType?: FurnitureType;
  onPlaceFoundation?: (x: number, y: number) => void;
  onPlacePillar?: (x: number, y: number) => void;
  onPlaceWall?: (x1: number, y1: number, x2: number, y2: number) => void;
  onPlaceDoor?: (wallId: string, hitX: number, hitZ: number) => void;
  onPlaceWindow?: (wallId: string, hitX: number, hitZ: number) => void;
  onPlaceFurniture?: (type: FurnitureType, x: number, y: number) => void;
  onPlaceSteelBar?: (x1: number, y1: number, x2: number, y2: number) => void;
  onPlaceRoof?: (x: number, y: number, width: number, height: number) => void;
  onPaint?: (kind: "wall" | "foundation", id: string) => void;
  onPlacementBlocked?: (reason: string) => void;
  onForemanNearbyChange?: (nearby: boolean) => void;
};
