export type FurnitureType = "bed" | "sofa" | "table";
export type StructuralMaterial = "wood" | "steel";

export type ToolMode =
  | "select"
  | "wall"
  | "pillar"
  | "furniture"
  | "door"
  | "window"
  | "steelbar"
  | "roof"
  | "paint";

export type Foundation = {
  x: number;
  y: number;
  width: number;
  height: number;
  type: "floor";
  color?: string;
};

export type Wall = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thickness: number;
  material?: StructuralMaterial;
  color?: string;
  floor?: number;
};

export type Pillar = {
  id: string;
  x: number;
  y: number;
  size: number;
  material?: StructuralMaterial;
  floor?: number;
};

export type Furniture = {
  id: string;
  type: FurnitureType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  floor?: number;
};

export type Door = {
  id: string;
  wallId: string;
  t: number;
  width: number;
  floor?: number;
};

export type Window = {
  id: string;
  wallId: string;
  t: number;
  width: number;
  height: number;
  floor?: number;
};

export type SteelBar = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  diameter: number;
  floor?: number;
};

export type RoofStyle = "flat" | "gable" | "hip";

export type Roof = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  style: RoofStyle;
  overhang: number;
  pitch: number; // angle in degrees for gable/hip
  floor?: number;
};

export type World = {
  foundation: Foundation;
  walls: Wall[];
  pillars: Pillar[];
  furniture: Furniture[];
  doors: Door[];
  windows: Window[];
  steelBars: SteelBar[];
  roofs: Roof[];
};

export type SelectedObject =
  | { kind: "wall"; id: string }
  | { kind: "pillar"; id: string }
  | { kind: "furniture"; id: string }
  | { kind: "door"; id: string }
  | { kind: "window"; id: string }
  | { kind: "steelbar"; id: string }
  | { kind: "roof"; id: string }
  | { kind: "foundation"; id: string }
  | null;

export type CanvasSize = {
  width: number;
  height: number;
};

export type WorldBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
};

export type ViewportTransform = {
  x: number;
  y: number;
  scale: number;
};
