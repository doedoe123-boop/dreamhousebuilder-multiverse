import * as THREE from "three";
import {
  MAX_STRUCTURE_SCALE,
  MIN_STRUCTURE_SCALE,
} from "../constants/editor";

type ResizableMesh = THREE.Mesh & {
  userData: THREE.Object3D["userData"] & {
    baseY?: number;
  };
};

function getGeometryDimension(
  mesh: THREE.Mesh,
  key: "width" | "height" | "depth",
): number {
  const parameters = (
    mesh.geometry as THREE.BufferGeometry & {
      parameters?: Record<string, unknown>;
    }
  ).parameters;

  const value = parameters?.[key];
  return typeof value === "number" ? value : 1;
}

export function clampScale(
  value: number,
  min = MIN_STRUCTURE_SCALE,
  max = MAX_STRUCTURE_SCALE,
) {
  return Math.min(max, Math.max(min, value));
}

export function resizePillarHeight(mesh: ResizableMesh, value: number) {
  const scaleY = clampScale(value);
  const baseY = mesh.userData.baseY ?? 0;
  const baseHeight = getGeometryDimension(mesh, "height");

  mesh.scale.y = scaleY;
  // Keep the base planted on the floor while height grows upward.
  mesh.position.y = baseY + (baseHeight * scaleY) / 2;

  return `Height: ${scaleY.toFixed(1)}`;
}

export function resizeWallLength(mesh: ResizableMesh, value: number) {
  const scaleX = clampScale(value);
  mesh.scale.x = scaleX;
  return `Length: ${scaleX.toFixed(1)}`;
}

export function resizeWallHeight(mesh: ResizableMesh, value: number) {
  const scaleY = clampScale(value);
  const baseY = mesh.userData.baseY ?? 0;
  const baseHeight = getGeometryDimension(mesh, "height");

  mesh.scale.y = scaleY;
  // Walls also rise from the slab instead of shrinking into it.
  mesh.position.y = baseY + (baseHeight * scaleY) / 2;

  return `Height: ${scaleY.toFixed(1)}`;
}
