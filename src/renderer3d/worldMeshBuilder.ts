import * as THREE from "three";
import { STRUCTURAL_MATERIAL_COLORS } from "../constants/structure";
import { GRID_SIZE } from "../constants/editor";
import {
  DEFAULT_FURNITURE_HEIGHT_PX,
  DEFAULT_ROOF_THICKNESS_PX,
  DEFAULT_STEELBAR_HEIGHT_PX,
  DEFAULT_WALL_HEIGHT_PX,
  FLOOR_HEIGHT_PX,
} from "../constants/scene3d";
import type { World } from "../types/world";
import { snap } from "../utils/editor";
import { exportWorldTo3D } from "../utils/scene3d";
import {
  resizePillarHeight,
  resizeWallHeight,
  resizeWallLength,
} from "../utils/structureResize";
import { toSceneUnits, type SelectableUserData } from "./rendererHelpers";

type FoundationBounds = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

const DEFAULT_OPEN_WORLD_BOUNDS: FoundationBounds = {
  minX: -120,
  maxX: 120,
  minZ: -120,
  maxZ: 120,
};

export function buildWorldMeshes(
  worldRoot: THREE.Group,
  world: World,
): FoundationBounds {
  const scene3d = exportWorldTo3D(world);
  const floorY = (floor: number) =>
    toSceneUnits((floor || 0) * FLOOR_HEIGHT_PX);

  const foundationBounds: FoundationBounds = world.foundation
    ? {
        minX: toSceneUnits(world.foundation.x),
        maxX: toSceneUnits(world.foundation.x + world.foundation.width),
        minZ: toSceneUnits(world.foundation.y),
        maxZ: toSceneUnits(world.foundation.y + world.foundation.height),
      }
    : DEFAULT_OPEN_WORLD_BOUNDS;

  // ── Foundation ──
  if (scene3d.foundation && world.foundation) {
    const foundationGeometry = new THREE.BoxGeometry(
      scene3d.foundation.width,
      scene3d.foundation.thickness,
      scene3d.foundation.depth,
    );
    const foundationMaterial = new THREE.MeshStandardMaterial({
      color: world.foundation.color || "#bea888",
      roughness: 0.9,
    });
    const foundationMesh = new THREE.Mesh(
      foundationGeometry,
      foundationMaterial,
    );
    foundationMesh.position.set(
      scene3d.foundation.position.x,
      scene3d.foundation.position.y - scene3d.foundation.thickness / 2,
      scene3d.foundation.position.z,
    );
    foundationMesh.userData = {
      foundation: true,
      selectable: true,
      kind: "foundation",
      id: "foundation",
    } satisfies SelectableUserData & { foundation: true };
    worldRoot.add(foundationMesh);

    const foundationBorder = new THREE.Mesh(
      new THREE.BoxGeometry(
        scene3d.foundation.width + 0.18,
        scene3d.foundation.thickness + 0.02,
        scene3d.foundation.depth + 0.18,
      ),
      new THREE.MeshStandardMaterial({
        color: "#8d7a63",
        roughness: 0.95,
        metalness: 0.02,
      }),
    );
    foundationBorder.position.copy(foundationMesh.position);
    foundationBorder.position.y -= 0.02;
    worldRoot.add(foundationBorder);
  }

  // ── Upper floor slabs ──
  const usedFloors = new Set<number>();
  world.walls.forEach((w) => w.floor && usedFloors.add(w.floor));
  world.pillars.forEach((p) => p.floor && usedFloors.add(p.floor));
  world.furniture.forEach((f) => f.floor && usedFloors.add(f.floor));
  (world.doors ?? []).forEach((d) => d.floor && usedFloors.add(d.floor));
  (world.windows ?? []).forEach((w) => w.floor && usedFloors.add(w.floor));
  (world.steelBars ?? []).forEach((s) => s.floor && usedFloors.add(s.floor));
  (world.roofs ?? []).forEach((r) => r.floor && usedFloors.add(r.floor));

  usedFloors.forEach((floor) => {
    if (!scene3d.foundation) return;
    if (floor <= 0) return;
    const slabGeo = new THREE.BoxGeometry(
      scene3d.foundation.width,
      scene3d.foundation.thickness,
      scene3d.foundation.depth,
    );
    const slabMat = new THREE.MeshStandardMaterial({
      color: "#d6c8b4",
      roughness: 0.92,
    });
    const slab = new THREE.Mesh(slabGeo, slabMat);
    const fy = floorY(floor);
    slab.position.set(
      scene3d.foundation.position.x,
      fy - scene3d.foundation.thickness / 2,
      scene3d.foundation.position.z,
    );
    worldRoot.add(slab);
  });

  // ── Grid ──
  if (world.foundation) {
    buildGrid(worldRoot, foundationBounds, world);
  }

  // ── Walls ──
  scene3d.walls.forEach((wall, index) => {
    const geometry = new THREE.BoxGeometry(
      wall.dimensions.width,
      wall.dimensions.height,
      wall.dimensions.depth,
    );
    const wallColor =
      world.walls[index]?.color ||
      STRUCTURAL_MATERIAL_COLORS[world.walls[index]?.material ?? "wood"];
    const material = new THREE.MeshStandardMaterial({
      color: wallColor,
    });
    const mesh = new THREE.Mesh(geometry, material);
    const fy = floorY(world.walls[index]?.floor ?? 0);
    mesh.userData = {
      selectable: true,
      kind: "wall",
      id: wall.id,
      baseY: fy,
    } satisfies SelectableUserData;
    mesh.position.set(wall.position.x, wall.position.y + fy, wall.position.z);
    mesh.rotation.y = wall.rotation ?? 0;
    resizeWallLength(mesh, wall.lengthScale ?? 1);
    resizeWallHeight(mesh, wall.heightScale ?? 1);
    worldRoot.add(mesh);
  });

  // ── Pillars ──
  world.pillars.forEach((pillar) => {
    const size = toSceneUnits(pillar.size);
    const pillarHeight = toSceneUnits(DEFAULT_WALL_HEIGHT_PX);
    const geometry = new THREE.CylinderGeometry(
      size / 2,
      size / 2,
      pillarHeight,
      18,
    );
    const material = new THREE.MeshStandardMaterial({
      color: STRUCTURAL_MATERIAL_COLORS[pillar.material ?? "wood"],
    });
    const mesh = new THREE.Mesh(geometry, material);
    const hitbox = new THREE.Mesh(
      new THREE.CylinderGeometry(
        size * 0.72,
        size * 0.72,
        pillarHeight * 1.05,
        18,
      ),
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    const fy = floorY(pillar.floor ?? 0);
    mesh.userData = {
      selectable: true,
      kind: "pillar",
      id: pillar.id,
      baseY: fy,
    } satisfies SelectableUserData;
    hitbox.userData = {
      selectable: true,
      kind: "pillar",
      id: pillar.id,
      highlightMesh: mesh,
    } satisfies SelectableUserData;
    mesh.position.set(
      toSceneUnits(pillar.x + pillar.size / 2),
      pillarHeight / 2 + fy,
      toSceneUnits(pillar.y + pillar.size / 2),
    );
    resizePillarHeight(mesh, pillar.heightScale ?? 1);
    hitbox.position.copy(mesh.position);
    hitbox.scale.y = mesh.scale.y;
    worldRoot.add(mesh);
    worldRoot.add(hitbox);
  });

  // ── Furniture ──
  scene3d.objects.forEach((object) => {
    const geometry = new THREE.BoxGeometry(
      object.dimensions.width,
      object.dimensions.height,
      object.dimensions.depth,
    );
    const material = new THREE.MeshStandardMaterial({
      color:
        object.type === "bed"
          ? "#9d6b53"
          : object.type === "sofa"
            ? "#6f9acb"
            : "#7eb77f",
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData = {
      selectable: true,
      kind: "furniture",
      id: object.id,
    } satisfies SelectableUserData;
    const fy = floorY(object.floor ?? 0);
    mesh.position.set(
      object.position.x,
      Math.max(
        object.position.y,
        toSceneUnits(DEFAULT_FURNITURE_HEIGHT_PX) / 2,
      ) + fy,
      object.position.z,
    );
    mesh.rotation.y = object.rotation ?? 0;
    worldRoot.add(mesh);
  });

  // ── Doors ──
  buildDoors(worldRoot, scene3d.doors);

  // ── Windows ──
  buildWindows(worldRoot, scene3d.windows);

  // ── Steel Bars ──
  scene3d.steelBars.forEach((bar) => {
    const sx = bar.start.x;
    const sy = bar.start.z;
    const ex = bar.end.x;
    const ey = bar.end.z;
    const dx = ex - sx;
    const dz = ey - sy;
    const horizontalLen = Math.sqrt(dx * dx + dz * dz);
    const barHeight = toSceneUnits(DEFAULT_STEELBAR_HEIGHT_PX);
    const fullLen = Math.sqrt(
      horizontalLen * horizontalLen + barHeight * barHeight,
    );
    const radius = bar.diameter / 2;

    const geometry = new THREE.CylinderGeometry(radius, radius, fullLen, 8);
    const material = new THREE.MeshStandardMaterial({
      color: "#707070",
      metalness: 0.6,
      roughness: 0.3,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData = {
      selectable: true,
      kind: "steelbar",
      id: bar.id,
    } satisfies SelectableUserData;
    const fy = floorY(bar.floor ?? 0);
    mesh.position.set((sx + ex) / 2, barHeight / 2 + fy, (sy + ey) / 2);
    mesh.rotation.y = -Math.atan2(dz, dx);
    if (horizontalLen > 0.01) {
      mesh.rotation.z = Math.atan2(barHeight, horizontalLen) - Math.PI / 2;
    }
    worldRoot.add(mesh);
  });

  // ── Roofs ──
  buildRoofs(worldRoot, scene3d.roofs);

  return foundationBounds;
}

/* ------------------------------------------------------------------ */
/*  Grid + alignment guides                                            */
/* ------------------------------------------------------------------ */

function buildGrid(
  worldRoot: THREE.Group,
  bounds: FoundationBounds,
  world: World,
) {
  const gridGroup = new THREE.Group();
  gridGroup.userData = { grid: true };

  const gridStep = toSceneUnits(GRID_SIZE);
  const { minX: fMinX, maxX: fMaxX, minZ: fMinZ, maxZ: fMaxZ } = bounds;
  const gridY = 0.005;

  const gridMaterial = new THREE.LineBasicMaterial({
    color: "#f4efe5",
    transparent: true,
    opacity: 0.24,
  });

  for (let x = fMinX; x <= fMaxX + 0.001; x += gridStep) {
    const pts = [
      new THREE.Vector3(x, gridY, fMinZ),
      new THREE.Vector3(x, gridY, fMaxZ),
    ];
    gridGroup.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        gridMaterial,
      ),
    );
  }
  for (let z = fMinZ; z <= fMaxZ + 0.001; z += gridStep) {
    const pts = [
      new THREE.Vector3(fMinX, gridY, z),
      new THREE.Vector3(fMaxX, gridY, z),
    ];
    gridGroup.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        gridMaterial,
      ),
    );
  }

  // Major grid lines every 5 cells
  const majorStep = gridStep * 5;
  const majorMaterial = new THREE.LineBasicMaterial({
    color: "#dccdb3",
    transparent: true,
    opacity: 0.55,
  });

  for (let x = fMinX; x <= fMaxX + 0.001; x += majorStep) {
    const pts = [
      new THREE.Vector3(x, gridY + 0.001, fMinZ),
      new THREE.Vector3(x, gridY + 0.001, fMaxZ),
    ];
    gridGroup.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        majorMaterial,
      ),
    );
  }
  for (let z = fMinZ; z <= fMaxZ + 0.001; z += majorStep) {
    const pts = [
      new THREE.Vector3(fMinX, gridY + 0.001, z),
      new THREE.Vector3(fMaxX, gridY + 0.001, z),
    ];
    gridGroup.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        majorMaterial,
      ),
    );
  }

  // Alignment guides through pillar and wall positions
  const alignMaterial = new THREE.LineBasicMaterial({
    color: "#c6842a",
    transparent: true,
    opacity: 0.26,
  });
  const alignY = gridY + 0.003;

  const alignXSet = new Set<number>();
  const alignZSet = new Set<number>();

  world.pillars.forEach((p) => {
    alignXSet.add(toSceneUnits(snap(p.x + p.size / 2, GRID_SIZE)));
    alignZSet.add(toSceneUnits(snap(p.y + p.size / 2, GRID_SIZE)));
  });
  world.walls.forEach((w) => {
    alignXSet.add(toSceneUnits(snap(w.x1, GRID_SIZE)));
    alignXSet.add(toSceneUnits(snap(w.x2, GRID_SIZE)));
    alignZSet.add(toSceneUnits(snap(w.y1, GRID_SIZE)));
    alignZSet.add(toSceneUnits(snap(w.y2, GRID_SIZE)));
  });

  alignXSet.forEach((x) => {
    const pts = [
      new THREE.Vector3(x, alignY, fMinZ),
      new THREE.Vector3(x, alignY, fMaxZ),
    ];
    gridGroup.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        alignMaterial,
      ),
    );
  });
  alignZSet.forEach((z) => {
    const pts = [
      new THREE.Vector3(fMinX, alignY, z),
      new THREE.Vector3(fMaxX, alignY, z),
    ];
    gridGroup.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        alignMaterial,
      ),
    );
  });

  worldRoot.add(gridGroup);
}

/* ------------------------------------------------------------------ */
/*  Doors — realistic with frame and swinging panel                    */
/* ------------------------------------------------------------------ */

import type { Door3D } from "../types/scene3d";

function buildDoors(worldRoot: THREE.Group, doors: Door3D[]) {
  const floorYOffset = (floor: number) =>
    toSceneUnits((floor || 0) * FLOOR_HEIGHT_PX);
  doors.forEach((door) => {
    const doorGroup = new THREE.Group();
    doorGroup.userData = {
      selectable: true,
      kind: "door",
      id: door.id,
    } satisfies SelectableUserData;

    const frameThickness = 0.04;
    const frameMat = new THREE.MeshStandardMaterial({ color: "#5c3a1e" });
    const dw = door.dimensions.width;
    const dh = door.dimensions.height;
    const dd = door.dimensions.depth;

    // Left post
    const leftPost = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, dh, dd),
      frameMat,
    );
    leftPost.position.set(-dw / 2 + frameThickness / 2, 0, 0);
    doorGroup.add(leftPost);

    // Right post
    const rightPost = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, dh, dd),
      frameMat.clone(),
    );
    rightPost.position.set(dw / 2 - frameThickness / 2, 0, 0);
    doorGroup.add(rightPost);

    // Top beam
    const topBeam = new THREE.Mesh(
      new THREE.BoxGeometry(dw, frameThickness, dd),
      frameMat.clone(),
    );
    topBeam.position.set(0, dh / 2 - frameThickness / 2, 0);
    doorGroup.add(topBeam);

    // Door panel (slightly ajar)
    const panelWidth = dw - frameThickness * 2;
    const panelMat = new THREE.MeshStandardMaterial({
      color: "#8B5E3C",
      side: THREE.DoubleSide,
    });
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(panelWidth, dh - frameThickness, 0.03),
      panelMat,
    );
    const pivotGroup = new THREE.Group();
    pivotGroup.position.set(-panelWidth / 2, 0, 0);
    panel.position.set(panelWidth / 2, -frameThickness / 2, 0);
    pivotGroup.rotation.y = -0.26;
    pivotGroup.add(panel);
    doorGroup.add(pivotGroup);

    // Tag all children selectable
    const tagData = {
      selectable: true,
      kind: "door",
      id: door.id,
      highlightMesh: leftPost,
    } satisfies SelectableUserData;
    doorGroup.children.forEach((child) => {
      if (child instanceof THREE.Mesh) child.userData = tagData;
    });
    pivotGroup.children.forEach((child) => {
      if (child instanceof THREE.Mesh) child.userData = tagData;
    });

    const fy = floorYOffset(door.floor ?? 0);
    doorGroup.position.set(
      door.position.x,
      door.position.y + fy,
      door.position.z,
    );
    worldRoot.add(doorGroup);
  });
}

/* ------------------------------------------------------------------ */
/*  Windows — glass pane with frame                                    */
/* ------------------------------------------------------------------ */

import type { Window3D } from "../types/scene3d";

function buildWindows(worldRoot: THREE.Group, windows: Window3D[]) {
  const floorYOffset = (floor: number) =>
    toSceneUnits((floor || 0) * FLOOR_HEIGHT_PX);
  windows.forEach((win) => {
    const winGroup = new THREE.Group();
    winGroup.userData = {
      selectable: true,
      kind: "window",
      id: win.id,
    } satisfies SelectableUserData;

    const ww = win.dimensions.width;
    const wh = win.dimensions.height;
    const wd = win.dimensions.depth;
    const ft = 0.03;
    const frameMat = new THREE.MeshStandardMaterial({ color: "#f0f0f0" });

    const wLeft = new THREE.Mesh(new THREE.BoxGeometry(ft, wh, wd), frameMat);
    wLeft.position.set(-ww / 2 + ft / 2, 0, 0);
    winGroup.add(wLeft);

    const wRight = new THREE.Mesh(
      new THREE.BoxGeometry(ft, wh, wd),
      frameMat.clone(),
    );
    wRight.position.set(ww / 2 - ft / 2, 0, 0);
    winGroup.add(wRight);

    const wTop = new THREE.Mesh(
      new THREE.BoxGeometry(ww, ft, wd),
      frameMat.clone(),
    );
    wTop.position.set(0, wh / 2 - ft / 2, 0);
    winGroup.add(wTop);

    const wBottom = new THREE.Mesh(
      new THREE.BoxGeometry(ww, ft, wd),
      frameMat.clone(),
    );
    wBottom.position.set(0, -wh / 2 + ft / 2, 0);
    winGroup.add(wBottom);

    const wCross = new THREE.Mesh(
      new THREE.BoxGeometry(ft * 0.7, wh - ft * 2, wd * 0.5),
      frameMat.clone(),
    );
    winGroup.add(wCross);

    const glassMat = new THREE.MeshStandardMaterial({
      color: "#87CEEB",
      transparent: true,
      opacity: 0.35,
    });
    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(ww - ft * 2, wh - ft * 2, wd * 0.3),
      glassMat,
    );
    winGroup.add(glass);

    const tagData = {
      selectable: true,
      kind: "window",
      id: win.id,
      highlightMesh: wLeft,
    } satisfies SelectableUserData;
    winGroup.children.forEach((child) => {
      if (child instanceof THREE.Mesh) child.userData = tagData;
    });

    const fy = floorYOffset(win.floor ?? 0);
    winGroup.position.set(win.position.x, win.position.y + fy, win.position.z);
    worldRoot.add(winGroup);
  });
}

/* ------------------------------------------------------------------ */
/*  Roofs — flat / gable / hip                                         */
/* ------------------------------------------------------------------ */

import type { Roof3D } from "../types/scene3d";

function buildRoofs(worldRoot: THREE.Group, roofs: Roof3D[]) {
  const roofThick = toSceneUnits(DEFAULT_ROOF_THICKNESS_PX);
  const wallH = toSceneUnits(DEFAULT_WALL_HEIGHT_PX);
  const floorYOffset = (floor: number) =>
    toSceneUnits((floor || 0) * FLOOR_HEIGHT_PX);

  roofs.forEach((roof) => {
    const roofGroup = new THREE.Group();
    const fy = floorYOffset(roof.floor ?? 0);

    if (roof.style === "flat") {
      const geo = new THREE.BoxGeometry(roof.width, roofThick, roof.depth);
      const mat = new THREE.MeshStandardMaterial({ color: "#8B7355" });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = wallH + roofThick / 2;
      mesh.userData = {
        selectable: true,
        kind: "roof",
        id: roof.id,
        highlightMesh: mesh,
      } satisfies SelectableUserData;
      roofGroup.add(mesh);
    } else if (roof.style === "gable") {
      buildGableRoof(roofGroup, roof, roofThick, wallH);
    } else {
      buildHipRoof(roofGroup, roof, wallH);
    }

    roofGroup.position.set(roof.position.x, fy, roof.position.z);
    worldRoot.add(roofGroup);
  });
}

function buildGableRoof(
  roofGroup: THREE.Group,
  roof: Roof3D,
  roofThick: number,
  wallH: number,
) {
  const pitchRad = (roof.pitch * Math.PI) / 180;
  const halfWidth = roof.width / 2;
  const ridgeHeight = halfWidth * Math.tan(pitchRad);
  const slopeLen = halfWidth / Math.cos(pitchRad);

  const mat = new THREE.MeshStandardMaterial({
    color: "#a0522d",
    side: THREE.DoubleSide,
  });

  const leftMesh = new THREE.Mesh(
    new THREE.BoxGeometry(slopeLen, roofThick, roof.depth),
    mat,
  );
  leftMesh.position.set(-halfWidth / 2, wallH + ridgeHeight / 2, 0);
  leftMesh.rotation.z = pitchRad;
  leftMesh.userData = {
    selectable: true,
    kind: "roof",
    id: roof.id,
  } satisfies SelectableUserData;
  roofGroup.add(leftMesh);

  const rightMesh = new THREE.Mesh(
    new THREE.BoxGeometry(slopeLen, roofThick, roof.depth),
    mat.clone(),
  );
  rightMesh.position.set(halfWidth / 2, wallH + ridgeHeight / 2, 0);
  rightMesh.rotation.z = -pitchRad;
  rightMesh.userData = {
    selectable: true,
    kind: "roof",
    id: roof.id,
    highlightMesh: leftMesh,
  } satisfies SelectableUserData;
  roofGroup.add(rightMesh);

  // Gable triangles
  const triangleShape = new THREE.Shape();
  triangleShape.moveTo(-halfWidth, 0);
  triangleShape.lineTo(0, ridgeHeight);
  triangleShape.lineTo(halfWidth, 0);
  triangleShape.lineTo(-halfWidth, 0);

  const triGeo = new THREE.ShapeGeometry(triangleShape);
  const triMat = new THREE.MeshStandardMaterial({
    color: "#b08050",
    side: THREE.DoubleSide,
  });

  const frontTri = new THREE.Mesh(triGeo, triMat);
  frontTri.position.set(0, wallH, -roof.depth / 2);
  frontTri.userData = {
    selectable: true,
    kind: "roof",
    id: roof.id,
    highlightMesh: leftMesh,
  } satisfies SelectableUserData;
  roofGroup.add(frontTri);

  const backTri = new THREE.Mesh(triGeo.clone(), triMat.clone());
  backTri.position.set(0, wallH, roof.depth / 2);
  backTri.userData = {
    selectable: true,
    kind: "roof",
    id: roof.id,
    highlightMesh: leftMesh,
  } satisfies SelectableUserData;
  roofGroup.add(backTri);
}

function buildHipRoof(roofGroup: THREE.Group, roof: Roof3D, wallH: number) {
  const pitchRad = (roof.pitch * Math.PI) / 180;
  const halfW = roof.width / 2;
  const halfD = roof.depth / 2;
  const ridgeH = Math.min(halfW, halfD) * Math.tan(pitchRad);
  const ridgeLen = Math.max(0, roof.depth - roof.width) / 2;

  const mat = new THREE.MeshStandardMaterial({
    color: "#a0522d",
    side: THREE.DoubleSide,
  });

  const vertices = new Float32Array([
    -halfW,
    0,
    -halfD,
    halfW,
    0,
    -halfD,
    halfW,
    0,
    halfD,
    -halfW,
    0,
    halfD,
    -ridgeLen,
    ridgeH,
    0,
    ridgeLen,
    ridgeH,
    0,
  ]);

  const indices = [0, 4, 1, 1, 4, 5, 2, 5, 3, 3, 5, 4, 0, 3, 4, 1, 5, 2];

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = wallH;
  mesh.userData = {
    selectable: true,
    kind: "roof",
    id: roof.id,
    highlightMesh: mesh,
  } satisfies SelectableUserData;
  roofGroup.add(mesh);
}
