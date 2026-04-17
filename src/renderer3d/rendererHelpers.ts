import * as THREE from "three";
import type { SelectedObject } from "../types/world";
import { SCENE3D_SCALE } from "../constants/scene3d";

export type SelectableKind = NonNullable<SelectedObject>["kind"];

export type SelectableUserData = {
  selectable?: true;
  kind?: SelectableKind;
  id?: string;
  highlightMesh?: THREE.Mesh;
  baseY?: number;
};

export function toSceneUnits(value: number) {
  return value / SCENE3D_SCALE;
}

export function disposeMaterial(material: THREE.Material | THREE.Material[]) {
  if (Array.isArray(material)) {
    material.forEach((item) => item.dispose());
    return;
  }
  material.dispose();
}

export function disposeGroup(group: THREE.Group) {
  group.traverse((child: THREE.Object3D) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.geometry.dispose();
    disposeMaterial(child.material);
  });
  group.clear();
}

export function disposeMesh(mesh: THREE.Mesh) {
  mesh.geometry.dispose();
  disposeMaterial(mesh.material);
  mesh.removeFromParent();
}

export function applySelectionStyle(
  mesh: THREE.Mesh | null,
  state: "default" | "hovered" | "selected",
) {
  if (!mesh || !(mesh.material instanceof THREE.MeshStandardMaterial)) return;

  if (state === "selected") {
    mesh.material.emissive.set("#d97706");
    mesh.material.emissiveIntensity = 0.42;
    return;
  }
  if (state === "hovered") {
    mesh.material.emissive.set("#f59e0b");
    mesh.material.emissiveIntensity = 0.18;
    return;
  }
  mesh.material.emissive.set("#000000");
  mesh.material.emissiveIntensity = 0;
}

export function resolveHighlightMesh(mesh: THREE.Mesh | null) {
  if (!mesh) return null;
  const data = mesh.userData as SelectableUserData;
  return data.highlightMesh ?? mesh;
}

export function getSelectionFromMesh(mesh: THREE.Mesh | null): SelectedObject {
  if (!mesh) return null;
  const data = mesh.userData as SelectableUserData;
  if (!data.selectable || !data.kind || !data.id) return null;
  return { kind: data.kind, id: data.id };
}

export function isSameSelection(a: SelectedObject, b: SelectedObject) {
  return a?.kind === b?.kind && a?.id === b?.id;
}
