import * as THREE from "three";
import {
  DEFAULT_FOUNDATION_HEIGHT,
  DEFAULT_FOUNDATION_WIDTH,
  DEFAULT_PILLAR_SIZE,
} from "../constants/editor";
import { SCENE3D_SCALE } from "../constants/scene3d";
import { GRID_SIZE } from "../constants/editor";
import type { FurnitureType, SelectedObject, ToolMode, World } from "../types/world";
import { snap } from "../utils/editor";
import {
  getFoundationPlacementValidation,
  getWallPlacementPreview,
  getWallPlacementValidation,
  getWallStartAnchor,
  snapFoundationPlacement,
  type PlacementPoint,
} from "../utils/foundationWallPlacement";
import {
  applySelectionStyle,
  getSelectionFromMesh,
  isSameSelection,
  resolveHighlightMesh,
  type SelectableUserData,
} from "./rendererHelpers";
import type { World3DRendererOptions } from "./worldRenderer.types";

type PlacementPreviewManager = {
  updateWallPreview: (
    sx: number,
    sy: number,
    ex: number,
    ey: number,
    valid?: boolean,
  ) => void;
  clearWallPreview: () => void;
  updateSteelBarPreview: (
    sx: number,
    sy: number,
    ex: number,
    ey: number,
  ) => void;
  clearSteelBarPreview: () => void;
  updateRoofPreview: (sx: number, sy: number, ex: number, ey: number) => void;
  clearRoofPreview: () => void;
  updatePlacementGhost: (x: number, y: number) => void;
  clearPlacementGhost: () => void;
};

type InteractionControllerArgs = {
  camera: THREE.PerspectiveCamera;
  domElement: HTMLCanvasElement;
  worldRoot: THREE.Group;
  previews: PlacementPreviewManager;
  options: World3DRendererOptions;
};

export function createWorldInteractionController({
  camera,
  domElement,
  worldRoot,
  previews,
  options,
}: InteractionControllerArgs) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const groundIntersection = new THREE.Vector3();

  let hoveredMesh: THREE.Mesh | null = null;
  let selectedMesh: THREE.Mesh | null = null;
  let selectedObject: SelectedObject = null;
  let currentTool: ToolMode = options.currentTool ?? "select";
  let currentFurnitureType: FurnitureType =
    options.currentFurnitureType ?? "bed";
  let onSelectionChange = options.onSelectionChange;
  let onPlaceFoundation = options.onPlaceFoundation;
  let onPlacePillar = options.onPlacePillar;
  let onPlaceWall = options.onPlaceWall;
  let onPlaceDoor = options.onPlaceDoor;
  let onPlaceWindow = options.onPlaceWindow;
  let onPlaceFurniture = options.onPlaceFurniture;
  let onPlaceSteelBar = options.onPlaceSteelBar;
  let onPlaceRoof = options.onPlaceRoof;
  let onPaint = options.onPaint;
  let onPlacementBlocked = options.onPlacementBlocked;
  let currentWorld: World = {
    foundation: null,
    walls: [],
    pillars: [],
    furniture: [],
    doors: [],
    windows: [],
    steelBars: [],
    roofs: [],
  };

  let foundationBounds = { minX: 0, maxX: 0, minZ: 0, maxZ: 0 };
  let hasFoundation = false;
  let pointerDownPosition: { x: number; y: number } | null = null;
  let didPointerDrag = false;
  let wallStartPoint: PlacementPoint | null = null;
  let steelBarStartPoint: { x: number; y: number } | null = null;
  let roofStartPoint: { x: number; y: number } | null = null;

  const updateHoveredMesh = (nextMesh: THREE.Mesh | null) => {
    const nextHighlight = resolveHighlightMesh(nextMesh);
    if (hoveredMesh === nextHighlight) return;
    if (hoveredMesh && hoveredMesh !== selectedMesh) {
      applySelectionStyle(hoveredMesh, "default");
    }
    hoveredMesh = nextHighlight;
    if (hoveredMesh && hoveredMesh !== selectedMesh) {
      applySelectionStyle(hoveredMesh, "hovered");
    }
  };

  const updateSelectedMesh = (nextMesh: THREE.Mesh | null) => {
    const nextHighlight = resolveHighlightMesh(nextMesh);
    if (selectedMesh === nextHighlight) return;
    if (selectedMesh) {
      applySelectionStyle(
        selectedMesh,
        selectedMesh === hoveredMesh ? "hovered" : "default",
      );
    }
    selectedMesh = nextHighlight;
    if (selectedMesh) applySelectionStyle(selectedMesh, "selected");
  };

  const updatePointerRay = (event: PointerEvent) => {
    const rect = domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
  };

  const getIntersectedSelectableMesh = (event: PointerEvent) => {
    updatePointerRay(event);
    const hits = raycaster.intersectObjects(worldRoot.children, true);
    const mesh = hits.find(
      (entry) =>
        entry.object instanceof THREE.Mesh &&
        (entry.object.userData as SelectableUserData).selectable,
    )?.object;
    return mesh instanceof THREE.Mesh ? mesh : null;
  };

  const getIntersectedWallMesh = (
    event: PointerEvent,
  ): { mesh: THREE.Mesh; point: THREE.Vector3 } | null => {
    updatePointerRay(event);
    const hits = raycaster.intersectObjects(worldRoot.children, true);
    const hit = hits.find(
      (entry) =>
        entry.object instanceof THREE.Mesh &&
        (entry.object.userData as SelectableUserData).selectable &&
        (entry.object.userData as SelectableUserData).kind === "wall",
    );
    if (!hit || !(hit.object instanceof THREE.Mesh)) return null;
    return { mesh: hit.object, point: hit.point };
  };

  const getGroundPoint = (
    event: PointerEvent,
  ): { x: number; y: number } | null => {
    updatePointerRay(event);
    const point = raycaster.ray.intersectPlane(groundPlane, groundIntersection);
    if (!point) return null;

    if (currentTool !== "foundation") {
      if (!hasFoundation) return null;
      if (
        point.x < foundationBounds.minX ||
        point.x > foundationBounds.maxX ||
        point.z < foundationBounds.minZ ||
        point.z > foundationBounds.maxZ
      ) {
        return null;
      }
    }

    return {
      x: snap(point.x * SCENE3D_SCALE, GRID_SIZE),
      y: snap(point.z * SCENE3D_SCALE, GRID_SIZE),
    };
  };

  const getGroundPlacement = (event: PointerEvent) => {
    const point = getGroundPoint(event);
    if (!point) return null;
    const halfSize = DEFAULT_PILLAR_SIZE / 2;
    return {
      x: snap(point.x - halfSize, GRID_SIZE),
      y: snap(point.y - halfSize, GRID_SIZE),
    };
  };

  const isPlacementTool = () =>
    currentTool === "foundation" ||
    currentTool === "pillar" ||
    currentTool === "wall" ||
    currentTool === "furniture" ||
    currentTool === "steelbar" ||
    currentTool === "roof";

  const isDoorWindowTool = () =>
    currentTool === "door" || currentTool === "window";

  const clearDraftState = () => {
    wallStartPoint = null;
    previews.clearWallPreview();
    steelBarStartPoint = null;
    previews.clearSteelBarPreview();
    roofStartPoint = null;
    previews.clearRoofPreview();
    previews.clearPlacementGhost();
  };

  const clearSelection = () => {
    updateSelectedMesh(null);
    selectedObject = null;
    onSelectionChange?.(null);
  };

  const getCursorForTool = (tool: ToolMode) => {
    if (
      tool === "foundation" ||
      tool === "pillar" ||
      tool === "wall" ||
      tool === "furniture" ||
      tool === "steelbar" ||
      tool === "roof" ||
      tool === "door" ||
      tool === "window"
    ) {
      return "cell";
    }
    if (tool === "paint") return "crosshair";
    return "grab";
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (pointerDownPosition) {
      const dx = event.clientX - pointerDownPosition.x;
      const dy = event.clientY - pointerDownPosition.y;
      if (dx * dx + dy * dy > 25) didPointerDrag = true;
    }

    if (currentTool === "wall") {
      const ground = getGroundPoint(event);
      if (wallStartPoint && ground) {
        const preview = getWallPlacementPreview(currentWorld, wallStartPoint, ground);
        if (preview.end) {
          previews.updateWallPreview(
            preview.start!.x,
            preview.start!.y,
            preview.end.x,
            preview.end.y,
            preview.valid,
          );
        } else {
          previews.clearWallPreview();
        }
      }
      updateHoveredMesh(null);
      domElement.style.cursor = ground
        ? wallStartPoint
          ? "crosshair"
          : "cell"
        : "not-allowed";
      return;
    }

    if (currentTool === "steelbar") {
      const ground = getGroundPoint(event);
      if (steelBarStartPoint && ground) {
        previews.updateSteelBarPreview(
          steelBarStartPoint.x,
          steelBarStartPoint.y,
          ground.x,
          ground.y,
        );
      }
      updateHoveredMesh(null);
      domElement.style.cursor = ground
        ? steelBarStartPoint
          ? "crosshair"
          : "cell"
        : "not-allowed";
      return;
    }

    if (currentTool === "roof") {
      const ground = getGroundPoint(event);
      if (roofStartPoint && ground) {
        previews.updateRoofPreview(
          roofStartPoint.x,
          roofStartPoint.y,
          ground.x,
          ground.y,
        );
      }
      updateHoveredMesh(null);
      domElement.style.cursor = ground
        ? roofStartPoint
          ? "crosshair"
          : "cell"
        : "not-allowed";
      return;
    }

    if (
      currentTool === "foundation" ||
      currentTool === "pillar" ||
      currentTool === "furniture"
    ) {
      const placement =
        currentTool === "pillar"
          ? getGroundPlacement(event)
          : getGroundPoint(event);
      updateHoveredMesh(null);
      if (placement) previews.updatePlacementGhost(placement.x, placement.y);
      else previews.clearPlacementGhost();
      domElement.style.cursor = placement ? "copy" : "not-allowed";
      return;
    }

    if (isDoorWindowTool()) {
      const wallHit = getIntersectedWallMesh(event);
      updateHoveredMesh(wallHit ? wallHit.mesh : null);
      domElement.style.cursor = wallHit ? "cell" : "not-allowed";
      return;
    }

    const mesh = getIntersectedSelectableMesh(event);
    updateHoveredMesh(mesh);
    domElement.style.cursor = mesh ? "pointer" : "grab";
  };

  const handlePointerLeave = () => {
    pointerDownPosition = null;
    didPointerDrag = false;
    updateHoveredMesh(null);
    domElement.style.cursor =
      isPlacementTool() || isDoorWindowTool() ? "cell" : "grab";
  };

  const handlePointerDown = (event: PointerEvent) => {
    pointerDownPosition = { x: event.clientX, y: event.clientY };
    didPointerDrag = false;
  };

  const handlePointerUp = () => {
    pointerDownPosition = null;
  };

  const handleClick = (event: PointerEvent) => {
    if (didPointerDrag) {
      didPointerDrag = false;
      return;
    }

    if (currentTool === "wall") {
      const ground = getGroundPoint(event);
      if (!ground) {
        onPlacementBlocked?.("Wall requires foundation support.");
        return;
      }
      if (!wallStartPoint) {
        const startAnchor = getWallStartAnchor(currentWorld, ground);
        if (!startAnchor.point) {
          onPlacementBlocked?.(startAnchor.reason ?? "Wall start is invalid.");
          return;
        }
        wallStartPoint = startAnchor.point;
        return;
      }
      const preview = getWallPlacementPreview(currentWorld, wallStartPoint, ground);
      wallStartPoint = null;
      previews.clearWallPreview();
      const validation = getWallPlacementValidation(
        currentWorld,
        preview.start,
        preview.end,
      );
      if (!validation.valid || !preview.start || !preview.end) {
        onPlacementBlocked?.(validation.reason ?? preview.reason ?? "Wall placement is invalid.");
        return;
      }
      onPlaceWall?.(preview.start.x, preview.start.y, preview.end.x, preview.end.y);
      return;
    }

    if (currentTool === "pillar") {
      const placement = getGroundPlacement(event);
      if (!placement) return;
      clearSelection();
      onPlacePillar?.(placement.x, placement.y);
      return;
    }

    if (currentTool === "foundation") {
      const ground = getGroundPoint(event);
      if (!ground) {
        onPlacementBlocked?.("Foundation needs a valid point on the land.");
        return;
      }
      const validation = getFoundationPlacementValidation(currentWorld);
      if (!validation.valid) {
        onPlacementBlocked?.(validation.reason ?? "Foundation placement is invalid.");
        return;
      }
      clearSelection();
      previews.clearPlacementGhost();
      const snappedOrigin = snapFoundationPlacement(
        ground.x - DEFAULT_FOUNDATION_WIDTH / 2,
        ground.y - DEFAULT_FOUNDATION_HEIGHT / 2,
      );
      onPlaceFoundation?.(
        snappedOrigin.x,
        snappedOrigin.y,
      );
      return;
    }

    if (currentTool === "furniture") {
      const ground = getGroundPoint(event);
      if (!ground) return;
      clearSelection();
      previews.clearPlacementGhost();
      onPlaceFurniture?.(currentFurnitureType, ground.x, ground.y);
      return;
    }

    if (currentTool === "steelbar") {
      const ground = getGroundPoint(event);
      if (!ground) return;
      if (!steelBarStartPoint) {
        steelBarStartPoint = ground;
        return;
      }
      const sx = steelBarStartPoint.x;
      const sy = steelBarStartPoint.y;
      const ex = ground.x;
      const ey = ground.y;
      steelBarStartPoint = null;
      previews.clearSteelBarPreview();
      if (Math.sqrt((ex - sx) ** 2 + (ey - sy) ** 2) < GRID_SIZE) return;
      onPlaceSteelBar?.(sx, sy, ex, ey);
      return;
    }

    if (currentTool === "roof") {
      const ground = getGroundPoint(event);
      if (!ground) return;
      if (!roofStartPoint) {
        roofStartPoint = ground;
        return;
      }
      const sx = roofStartPoint.x;
      const sy = roofStartPoint.y;
      const ex = ground.x;
      const ey = ground.y;
      roofStartPoint = null;
      previews.clearRoofPreview();
      const width = Math.abs(ex - sx);
      const height = Math.abs(ey - sy);
      if (width < GRID_SIZE || height < GRID_SIZE) return;
      onPlaceRoof?.(Math.min(sx, ex), Math.min(sy, ey), width, height);
      return;
    }

    if (isDoorWindowTool()) {
      const wallHit = getIntersectedWallMesh(event);
      if (!wallHit) return;
      const data = wallHit.mesh.userData as SelectableUserData;
      if (!data.id) return;
      if (currentTool === "door") {
        onPlaceDoor?.(data.id, wallHit.point.x, wallHit.point.z);
      } else {
        onPlaceWindow?.(data.id, wallHit.point.x, wallHit.point.z);
      }
      return;
    }

    if (currentTool === "paint") {
      const mesh = getIntersectedSelectableMesh(event);
      if (!mesh) return;
      const data = mesh.userData as SelectableUserData;
      if (data.kind === "wall" && data.id) {
        onPaint?.("wall", data.id);
      } else if (data.kind === "foundation" && data.id) {
        onPaint?.("foundation", data.id);
      }
      return;
    }

    const mesh = getIntersectedSelectableMesh(event);
    const nextSelection = getSelectionFromMesh(mesh);
    if (isSameSelection(selectedObject, nextSelection)) return;
    selectedObject = nextSelection;
    updateSelectedMesh(mesh);
    onSelectionChange?.(nextSelection);
  };

  domElement.addEventListener("pointermove", handlePointerMove);
  domElement.addEventListener("pointerleave", handlePointerLeave);
  domElement.addEventListener("pointerdown", handlePointerDown);
  domElement.addEventListener("pointerup", handlePointerUp);
  domElement.addEventListener("click", handleClick);
  domElement.style.cursor = "grab";

  return {
    resetAfterRender() {
      hoveredMesh = null;
      selectedMesh = null;
      selectedObject = null;
      onSelectionChange?.(null);
    },
    syncInteraction(nextOptions: World3DRendererOptions) {
      onSelectionChange = nextOptions.onSelectionChange;
      onPlaceFoundation = nextOptions.onPlaceFoundation;
      onPlacePillar = nextOptions.onPlacePillar;
      onPlaceWall = nextOptions.onPlaceWall;
      onPlaceDoor = nextOptions.onPlaceDoor;
      onPlaceWindow = nextOptions.onPlaceWindow;
      onPlaceFurniture = nextOptions.onPlaceFurniture;
      onPlaceSteelBar = nextOptions.onPlaceSteelBar;
      onPlaceRoof = nextOptions.onPlaceRoof;
      onPaint = nextOptions.onPaint;
      onPlacementBlocked = nextOptions.onPlacementBlocked;

      const nextTool = nextOptions.currentTool ?? currentTool;
      currentFurnitureType =
        nextOptions.currentFurnitureType ?? currentFurnitureType;

      if (nextTool !== currentTool) {
        clearSelection();
        clearDraftState();
      }

      currentTool = nextTool;
      updateHoveredMesh(null);
      domElement.style.cursor = getCursorForTool(currentTool);
    },
    setWorldState(world: World, nextBounds: typeof foundationBounds, nextHasFoundation: boolean) {
      currentWorld = world;
      foundationBounds = nextBounds;
      hasFoundation = nextHasFoundation;
    },
    dispose() {
      domElement.removeEventListener("pointermove", handlePointerMove);
      domElement.removeEventListener("pointerleave", handlePointerLeave);
      domElement.removeEventListener("pointerdown", handlePointerDown);
      domElement.removeEventListener("pointerup", handlePointerUp);
      domElement.removeEventListener("click", handleClick);
      clearDraftState();
    },
  };
}
