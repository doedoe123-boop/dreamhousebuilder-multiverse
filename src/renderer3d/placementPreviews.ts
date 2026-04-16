import * as THREE from "three";
import {
  DEFAULT_FOUNDATION_HEIGHT,
  DEFAULT_FOUNDATION_WIDTH,
  DEFAULT_PILLAR_SIZE,
  DEFAULT_STEELBAR_DIAMETER,
  DEFAULT_WALL_THICKNESS,
  GRID_SIZE,
} from "../constants/editor";
import {
  DEFAULT_FURNITURE_HEIGHT_PX,
  DEFAULT_ROOF_THICKNESS_PX,
  DEFAULT_STEELBAR_HEIGHT_PX,
  DEFAULT_WALL_HEIGHT_PX,
} from "../constants/scene3d";
import type { ToolMode } from "../types/world";
import { toSceneUnits, disposeGroup, disposeMesh } from "./rendererHelpers";

export function createPlacementPreviewManager(
  scene: THREE.Scene,
  getCurrentTool: () => ToolMode,
) {
  let wallPreviewMesh: THREE.Mesh | null = null;
  let steelBarPreviewMesh: THREE.Mesh | null = null;
  let roofPreviewMesh: THREE.Mesh | null = null;
  let placementGhost: THREE.Object3D | null = null;

  const clearWallPreview = () => {
    if (wallPreviewMesh) {
      disposeMesh(wallPreviewMesh);
      wallPreviewMesh = null;
    }
  };

  const updateWallPreview = (sx: number, sy: number, ex: number, ey: number) => {
    clearWallPreview();
    const s = { x: toSceneUnits(sx), z: toSceneUnits(sy) };
    const e = { x: toSceneUnits(ex), z: toSceneUnits(ey) };
    const dx = e.x - s.x;
    const dz = e.z - s.z;
    const length = Math.sqrt(dx * dx + dz * dz);
    if (length < 0.01) return;
    const wallH = toSceneUnits(DEFAULT_WALL_HEIGHT_PX);
    const wallT = toSceneUnits(DEFAULT_WALL_THICKNESS);
    const geo = new THREE.BoxGeometry(length, wallH, wallT);
    const mat = new THREE.MeshStandardMaterial({
      color: "#c6842a",
      transparent: true,
      opacity: 0.5,
    });
    wallPreviewMesh = new THREE.Mesh(geo, mat);
    wallPreviewMesh.position.set((s.x + e.x) / 2, wallH / 2, (s.z + e.z) / 2);
    wallPreviewMesh.rotation.y = -Math.atan2(dz, dx);
    scene.add(wallPreviewMesh);
  };

  const clearSteelBarPreview = () => {
    if (steelBarPreviewMesh) {
      disposeMesh(steelBarPreviewMesh);
      steelBarPreviewMesh = null;
    }
  };

  const updateSteelBarPreview = (
    sx: number,
    sy: number,
    ex: number,
    ey: number,
  ) => {
    clearSteelBarPreview();
    const s = { x: toSceneUnits(sx), z: toSceneUnits(sy) };
    const e = { x: toSceneUnits(ex), z: toSceneUnits(ey) };
    const dx = e.x - s.x;
    const dz = e.z - s.z;
    const length = Math.sqrt(dx * dx + dz * dz);
    if (length < 0.01) return;
    const radius = toSceneUnits(DEFAULT_STEELBAR_DIAMETER) / 2;
    const geo = new THREE.CylinderGeometry(radius, radius, length, 8);
    geo.rotateZ(Math.PI / 2);
    const mat = new THREE.MeshStandardMaterial({
      color: "#606060",
      transparent: true,
      opacity: 0.5,
    });
    steelBarPreviewMesh = new THREE.Mesh(geo, mat);
    const barH = toSceneUnits(DEFAULT_STEELBAR_HEIGHT_PX);
    steelBarPreviewMesh.position.set(
      (s.x + e.x) / 2,
      barH / 2,
      (s.z + e.z) / 2,
    );
    steelBarPreviewMesh.rotation.y = -Math.atan2(dz, dx);
    scene.add(steelBarPreviewMesh);
  };

  const clearRoofPreview = () => {
    if (roofPreviewMesh) {
      disposeMesh(roofPreviewMesh);
      roofPreviewMesh = null;
    }
  };

  const updateRoofPreview = (sx: number, sy: number, ex: number, ey: number) => {
    clearRoofPreview();
    const x1 = Math.min(sx, ex);
    const y1 = Math.min(sy, ey);
    const w = Math.abs(ex - sx);
    const h = Math.abs(ey - sy);
    if (w < GRID_SIZE || h < GRID_SIZE) return;
    const sw = toSceneUnits(w);
    const sd = toSceneUnits(h);
    const roofT = toSceneUnits(DEFAULT_ROOF_THICKNESS_PX);
    const geo = new THREE.BoxGeometry(sw, roofT, sd);
    const mat = new THREE.MeshStandardMaterial({
      color: "#a0522d",
      transparent: true,
      opacity: 0.45,
    });
    roofPreviewMesh = new THREE.Mesh(geo, mat);
    const wallH = toSceneUnits(DEFAULT_WALL_HEIGHT_PX);
    roofPreviewMesh.position.set(
      toSceneUnits(x1 + w / 2),
      wallH + roofT / 2,
      toSceneUnits(y1 + h / 2),
    );
    scene.add(roofPreviewMesh);
  };

  const clearPlacementGhost = () => {
    if (placementGhost) {
      if (placementGhost instanceof THREE.Mesh) disposeMesh(placementGhost);
      else if (placementGhost instanceof THREE.Group) {
        disposeGroup(placementGhost);
        placementGhost.removeFromParent();
      }
      placementGhost = null;
    }
  };

  const updatePlacementGhost = (x: number, y: number) => {
    clearPlacementGhost();
    const ghostMat = new THREE.MeshStandardMaterial({
      color: "#c6842a",
      transparent: true,
      opacity: 0.4,
    });
    const currentTool = getCurrentTool();
    if (currentTool === "foundation") {
      const geo = new THREE.BoxGeometry(
        toSceneUnits(DEFAULT_FOUNDATION_WIDTH),
        toSceneUnits(10),
        toSceneUnits(DEFAULT_FOUNDATION_HEIGHT),
      );
      placementGhost = new THREE.Mesh(geo, ghostMat);
      placementGhost.position.set(
        toSceneUnits(x + DEFAULT_FOUNDATION_WIDTH / 2),
        toSceneUnits(5),
        toSceneUnits(y + DEFAULT_FOUNDATION_HEIGHT / 2),
      );
    } else if (currentTool === "pillar") {
      const size = toSceneUnits(DEFAULT_PILLAR_SIZE);
      const pillarHeight = toSceneUnits(DEFAULT_WALL_HEIGHT_PX);
      const geo = new THREE.CylinderGeometry(size / 2, size / 2, pillarHeight, 18);
      placementGhost = new THREE.Mesh(geo, ghostMat);
      placementGhost.position.set(
        toSceneUnits(x + DEFAULT_PILLAR_SIZE / 2),
        pillarHeight / 2,
        toSceneUnits(y + DEFAULT_PILLAR_SIZE / 2),
      );
    } else if (currentTool === "furniture") {
      const fw = toSceneUnits(60);
      const fh = toSceneUnits(DEFAULT_FURNITURE_HEIGHT_PX);
      const fd = toSceneUnits(60);
      const geo = new THREE.BoxGeometry(fw, fh, fd);
      placementGhost = new THREE.Mesh(geo, ghostMat);
      placementGhost.position.set(toSceneUnits(x), fh / 2, toSceneUnits(y));
    }
    if (placementGhost) scene.add(placementGhost);
  };

  const clearAllPreviews = () => {
    clearWallPreview();
    clearSteelBarPreview();
    clearRoofPreview();
    clearPlacementGhost();
  };

  return {
    updateWallPreview,
    clearWallPreview,
    updateSteelBarPreview,
    clearSteelBarPreview,
    updateRoofPreview,
    clearRoofPreview,
    updatePlacementGhost,
    clearPlacementGhost,
    clearAllPreviews,
  };
}
