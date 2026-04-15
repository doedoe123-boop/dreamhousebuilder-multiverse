import type { FurnitureType, RoofStyle } from "./world";

export type Vector3 = {
  x: number;
  y: number;
  z: number;
};

export type Dimensions3D = {
  width: number;
  height: number;
  depth: number;
};

export type Wall3D = {
  id: string;
  position: Vector3;
  dimensions: Dimensions3D;
};

export type Floor3D = {
  position: Vector3;
  width: number;
  depth: number;
  thickness: number;
};

export type Object3D = {
  id: string;
  type: FurnitureType;
  position: Vector3;
  dimensions: Dimensions3D;
  rotation?: number;
};

export type Door3D = {
  id: string;
  wallId: string;
  position: Vector3;
  dimensions: Dimensions3D;
};

export type Window3D = {
  id: string;
  wallId: string;
  position: Vector3;
  dimensions: Dimensions3D;
};

export type SteelBar3D = {
  id: string;
  start: Vector3;
  end: Vector3;
  diameter: number;
};

export type Roof3D = {
  id: string;
  position: Vector3;
  width: number;
  depth: number;
  style: RoofStyle;
  overhang: number;
  pitch: number;
};

export type Scene3D = {
  scale: number;
  foundation: Floor3D;
  walls: Wall3D[];
  objects: Object3D[];
  doors: Door3D[];
  windows: Window3D[];
  steelBars: SteelBar3D[];
  roofs: Roof3D[];
  metadata: {
    version: string;
    createdAt: number;
  };
};
