import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
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
  SCENE3D_SCALE,
} from "../constants/scene3d";
import type {
  FurnitureType,
  SelectedObject,
  ToolMode,
  World,
} from "../types/world";
import { snap } from "../utils/editor";
import {
  toSceneUnits,
  disposeGroup,
  disposeMesh,
  applySelectionStyle,
  resolveHighlightMesh,
  getSelectionFromMesh,
  isSameSelection,
  type SelectableUserData,
} from "./rendererHelpers";
import { createPlayerCharacter, createForemanNPC } from "./playerCharacter";
import { buildWorldMeshes } from "./worldMeshBuilder";

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
};

export function createWorld3DRenderer(
  container: HTMLDivElement,
  options: World3DRendererOptions = {},
) {
  // ── Scene setup ──
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2("#d7e3ea", 0.0038);

  const camera = new THREE.PerspectiveCamera(
    55,
    container.clientWidth / container.clientHeight,
    0.1,
    1500,
  );
  camera.position.set(16, 18, 20);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(6, 0, 6);
  controls.minPolarAngle = 0.22;
  controls.maxPolarAngle = Math.PI / 2.12;
  controls.maxDistance = 180;
  controls.minDistance = 4;

  // ── Characters ──
  const player = createPlayerCharacter();
  scene.add(player.group);

  const foreman = createForemanNPC();
  scene.add(foreman.group);

  // WASD input state
  const keysDown = new Set<string>();
  let playerEnabled = true;

  const handleKeyDownPlayer = (e: KeyboardEvent) => {
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement
    )
      return;
    const k = e.key.toLowerCase();
    if (k === "w" || k === "a" || k === "s" || k === "d") keysDown.add(k);
    // V to toggle first-person / third-person
    if (k === "v" && !e.ctrlKey && !e.metaKey) {
      if (firstPerson) exitFirstPerson();
      else enterFirstPerson();
    }
  };
  const handleKeyUpPlayer = (e: KeyboardEvent) => {
    keysDown.delete(e.key.toLowerCase());
  };
  window.addEventListener("keydown", handleKeyDownPlayer);
  window.addEventListener("keyup", handleKeyUpPlayer);

  // Camera follow config
  const cameraOffset = new THREE.Vector3(0, 10, 12);
  let followCamera = true;
  let playerIsMoving = false;

  // First-person mode
  let firstPerson = false;
  let fpYaw = 0;
  let fpPitch = 0;
  const FP_EYE_HEIGHT = 1.4;
  const FP_SENSITIVITY = 0.002;
  let onViewModeChange: ((fp: boolean) => void) | undefined;

  controls.addEventListener("start", () => {
    if (!firstPerson) followCamera = false;
  });

  // Mouse look handler for first-person
  const handleMouseMove = (e: MouseEvent) => {
    if (!firstPerson || document.pointerLockElement !== renderer.domElement)
      return;
    fpYaw -= e.movementX * FP_SENSITIVITY;
    fpPitch -= e.movementY * FP_SENSITIVITY;
    fpPitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, fpPitch));
  };
  document.addEventListener("mousemove", handleMouseMove);

  const enterFirstPerson = () => {
    firstPerson = true;
    controls.enabled = false;
    player.setVisible(false);
    // Set yaw from current player facing direction
    fpYaw = player.group.rotation.y;
    fpPitch = 0;
    renderer.domElement.requestPointerLock();
    onViewModeChange?.(true);
  };

  const exitFirstPerson = () => {
    firstPerson = false;
    controls.enabled = true;
    player.setVisible(true);
    followCamera = true;
    if (document.pointerLockElement === renderer.domElement) {
      document.exitPointerLock();
    }
    // Reset camera behind player
    const pos = player.group.position.clone().add(cameraOffset);
    camera.position.copy(pos);
    controls.target.copy(player.group.position.clone().setY(0.8));
    onViewModeChange?.(false);
  };

  // Exit FP when pointer lock is lost (e.g. pressing Escape)
  const handlePointerLockChange = () => {
    if (firstPerson && document.pointerLockElement !== renderer.domElement) {
      exitFirstPerson();
    }
  };
  document.addEventListener("pointerlockchange", handlePointerLockChange);

  // ── Lighting ──
  const ambientLight = new THREE.AmbientLight("#f8efe1", 0.9);
  scene.add(ambientLight);

  const hemiLight = new THREE.HemisphereLight("#c7ecff", "#6c7d51", 1.35);
  hemiLight.position.set(0, 40, 0);
  scene.add(hemiLight);

  const directionalLight = new THREE.DirectionalLight("#fff4df", 1.7);
  directionalLight.position.set(26, 34, 18);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.set(2048, 2048);
  scene.add(directionalLight);

  const rimLight = new THREE.DirectionalLight("#d4e3ff", 0.42);
  rimLight.position.set(-30, 18, -12);
  scene.add(rimLight);

  // ── Sky gradient (large sphere with vertex colors) ──
  const skyGeo = new THREE.SphereGeometry(400, 32, 16);
  const skyColors = new Float32Array(skyGeo.attributes.position.count * 3);
  const topColor = new THREE.Color("#7fb2dc");
  const horizonColor = new THREE.Color("#f7dcc0");
  const bottomColor = new THREE.Color("#8da97d");
  const tempColor = new THREE.Color();
  for (let i = 0; i < skyGeo.attributes.position.count; i++) {
    const y = skyGeo.attributes.position.getY(i);
    const normalizedY = y / 400; // -1 to 1
    if (normalizedY >= 0) {
      tempColor.copy(horizonColor).lerp(topColor, normalizedY);
    } else {
      tempColor.copy(horizonColor).lerp(bottomColor, -normalizedY);
    }
    skyColors[i * 3] = tempColor.r;
    skyColors[i * 3 + 1] = tempColor.g;
    skyColors[i * 3 + 2] = tempColor.b;
  }
  skyGeo.setAttribute("color", new THREE.BufferAttribute(skyColors, 3));
  const skyMat = new THREE.MeshBasicMaterial({
    vertexColors: true,
    side: THREE.BackSide,
    depthWrite: false,
  });
  const skyDome = new THREE.Mesh(skyGeo, skyMat);
  scene.add(skyDome);

  // ── Terrain ground ──
  const terrainSize = 900;
  const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, 64, 64);
  terrainGeo.rotateX(-Math.PI / 2);
  // Gentle rolling hills
  const posAttr = terrainGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    // Keep foundation area flat, hills outside
    const distFromCenter = Math.sqrt(x * x + z * z);
    const flatRadius = 78;
    const hillFactor = Math.max(0, (distFromCenter - flatRadius) / 110);
    const height =
      hillFactor *
      (Math.sin(x * 0.018) * 1.6 +
        Math.cos(z * 0.028) * 1.2 +
        Math.sin((x + z) * 0.014) * 1.8);
    posAttr.setY(i, Math.min(height, 9) - 0.22);
  }
  terrainGeo.computeVertexNormals();
  // Vertex-colored terrain: grassier further out
  const terrainColors = new Float32Array(posAttr.count * 3);
  const grassColor = new THREE.Color("#5d8d52");
  const dirtColor = new THREE.Color("#8d785f");
  const centerColor = new THREE.Color("#bba789");
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    const dist = Math.sqrt(x * x + z * z);
    const t = Math.min(1, Math.max(0, (dist - 45) / 150));
    tempColor.copy(centerColor).lerp(dirtColor, Math.min(t, 0.5) * 2);
    if (t > 0.5) tempColor.lerp(grassColor, (t - 0.5) * 2);
    terrainColors[i * 3] = tempColor.r;
    terrainColors[i * 3 + 1] = tempColor.g;
    terrainColors[i * 3 + 2] = tempColor.b;
  }
  terrainGeo.setAttribute("color", new THREE.BufferAttribute(terrainColors, 3));
  const terrainMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.97,
    metalness: 0,
  });
  const terrain = new THREE.Mesh(terrainGeo, terrainMat);
  terrain.receiveShadow = true;
  scene.add(terrain);

  const grassBladeGeometry = new THREE.PlaneGeometry(0.22, 0.7);
  grassBladeGeometry.translate(0, 0.35, 0);
  const grassBladeMaterial = new THREE.MeshStandardMaterial({
    color: "#6f9d52",
    side: THREE.DoubleSide,
    roughness: 1,
  });
  const grassCount = 1400;
  const grass = new THREE.InstancedMesh(
    grassBladeGeometry,
    grassBladeMaterial,
    grassCount,
  );
  const grassDummy = new THREE.Object3D();
  let grassIndex = 0;
  for (let i = 0; i < grassCount * 2 && grassIndex < grassCount; i++) {
    const x = (Math.random() - 0.5) * 320;
    const z = (Math.random() - 0.5) * 320;
    if (Math.sqrt(x * x + z * z) < 78) continue;
    const baseHeight =
      Math.max(0, (Math.sqrt(x * x + z * z) - 78) / 110) *
        (Math.sin(x * 0.018) * 1.6 +
          Math.cos(z * 0.028) * 1.2 +
          Math.sin((x + z) * 0.014) * 1.8) -
      0.18;
    grassDummy.position.set(x, Math.min(baseHeight, 9), z);
    grassDummy.rotation.y = Math.random() * Math.PI;
    const grassScale = 0.85 + Math.random() * 0.8;
    grassDummy.scale.setScalar(grassScale);
    grassDummy.updateMatrix();
    grass.setMatrixAt(grassIndex, grassDummy.matrix);
    grassIndex += 1;
  }
  grass.instanceMatrix.needsUpdate = true;
  scene.add(grass);

  const constructionRing = new THREE.Mesh(
    new THREE.RingGeometry(62, 96, 48),
    new THREE.MeshStandardMaterial({
      color: "#7d7a70",
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      roughness: 1,
    }),
  );
  constructionRing.rotation.x = -Math.PI / 2;
  constructionRing.position.y = -0.02;
  scene.add(constructionRing);

  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(8, 18, 18),
    new THREE.MeshBasicMaterial({
      color: "#ffe7b5",
      transparent: true,
      opacity: 0.7,
    }),
  );
  sun.position.set(110, 115, -140);
  scene.add(sun);

  const distantHillMaterial = new THREE.MeshStandardMaterial({
    color: "#6f8d68",
    roughness: 1,
  });
  [
    { scale: [90, 20, 70], pos: [-120, 6, -180] },
    { scale: [120, 24, 85], pos: [170, 10, -190] },
    { scale: [75, 18, 60], pos: [210, 8, 120] },
    { scale: [110, 22, 80], pos: [-200, 9, 150] },
  ].forEach(({ scale, pos }) => {
    const hill = new THREE.Mesh(
      new THREE.SphereGeometry(1, 20, 16),
      distantHillMaterial.clone(),
    );
    hill.scale.set(scale[0], scale[1], scale[2]);
    hill.position.set(pos[0], pos[1], pos[2]);
    scene.add(hill);
  });

  scene.background = null;

  // ── World root & interaction state ──
  const worldRoot = new THREE.Group();
  scene.add(worldRoot);
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

  let foundationBounds = { minX: 0, maxX: 0, minZ: 0, maxZ: 0 };
  let hasFoundation = false;
  let pointerDownPosition: { x: number; y: number } | null = null;
  let didPointerDrag = false;

  // ── Preview state ──
  let wallStartPoint: { x: number; y: number } | null = null;
  let wallPreviewMesh: THREE.Mesh | null = null;
  let steelBarStartPoint: { x: number; y: number } | null = null;
  let steelBarPreviewMesh: THREE.Mesh | null = null;
  let roofStartPoint: { x: number; y: number } | null = null;
  let roofPreviewMesh: THREE.Mesh | null = null;
  let placementGhost: THREE.Object3D | null = null;

  // ── Preview helpers ──

  const clearWallPreview = () => {
    if (wallPreviewMesh) {
      disposeMesh(wallPreviewMesh);
      wallPreviewMesh = null;
    }
  };

  const updateWallPreview = (
    sx: number,
    sy: number,
    ex: number,
    ey: number,
  ) => {
    clearWallPreview();
    const s = { x: toSceneUnits(sx), z: toSceneUnits(sy) };
    const e = { x: toSceneUnits(ex), z: toSceneUnits(ey) };
    const dx = e.x - s.x,
      dz = e.z - s.z;
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
    const dx = e.x - s.x,
      dz = e.z - s.z;
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

  const updateRoofPreview = (
    sx: number,
    sy: number,
    ex: number,
    ey: number,
  ) => {
    clearRoofPreview();
    const x1 = Math.min(sx, ex),
      y1 = Math.min(sy, ey);
    const w = Math.abs(ex - sx),
      h = Math.abs(ey - sy);
    if (w < GRID_SIZE || h < GRID_SIZE) return;
    const sw = toSceneUnits(w),
      sd = toSceneUnits(h);
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
      const geo = new THREE.CylinderGeometry(
        size / 2,
        size / 2,
        pillarHeight,
        18,
      );
      placementGhost = new THREE.Mesh(geo, ghostMat);
      placementGhost.position.set(
        toSceneUnits(x + DEFAULT_PILLAR_SIZE / 2),
        pillarHeight / 2,
        toSceneUnits(y + DEFAULT_PILLAR_SIZE / 2),
      );
    } else if (currentTool === "furniture") {
      const fw = toSceneUnits(60),
        fh = toSceneUnits(DEFAULT_FURNITURE_HEIGHT_PX),
        fd = toSceneUnits(60);
      const geo = new THREE.BoxGeometry(fw, fh, fd);
      placementGhost = new THREE.Mesh(geo, ghostMat);
      placementGhost.position.set(toSceneUnits(x), fh / 2, toSceneUnits(y));
    }
    if (placementGhost) scene.add(placementGhost);
  };

  // ── Resize ──
  const resizeObserver = new ResizeObserver(() => {
    const w = Math.max(container.clientWidth, 320);
    const h = Math.max(container.clientHeight, 320);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
  resizeObserver.observe(container);

  // ── Animation loop ──
  let animationFrameId = 0;
  let lastTime = performance.now();

  const enforceAboveGroundCamera = () => {
    controls.target.y = Math.max(0.4, controls.target.y);
    camera.position.y = Math.max(1.2, camera.position.y);
  };

  const animate = () => {
    animationFrameId = window.requestAnimationFrame(animate);
    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    if (firstPerson) {
      // ── First-person mode ──
      // Move player based on yaw direction (not camera, since camera IS the player)
      if (playerEnabled && keysDown.size > 0) {
        const forward = new THREE.Vector3(
          -Math.sin(fpYaw),
          0,
          -Math.cos(fpYaw),
        ).normalize();
        const right = new THREE.Vector3(
          -Math.cos(fpYaw),
          0,
          Math.cos(fpYaw + Math.PI / 2),
        );
        // Use proper cross product for right vector
        right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

        const moveDir = new THREE.Vector3();
        if (keysDown.has("w")) moveDir.add(forward);
        if (keysDown.has("s")) moveDir.sub(forward);
        if (keysDown.has("d")) moveDir.add(right);
        if (keysDown.has("a")) moveDir.sub(right);
        if (moveDir.lengthSq() > 0) {
          moveDir.normalize();
          player.group.position.addScaledVector(moveDir, 8 * dt);
          player.group.rotation.y = fpYaw;
        }
      }

      // Position camera at player's eye level
      camera.position.set(
        player.group.position.x,
        player.group.position.y + FP_EYE_HEIGHT,
        player.group.position.z,
      );

      // Apply yaw + pitch from mouse look
      const lookDir = new THREE.Vector3(
        -Math.sin(fpYaw) * Math.cos(fpPitch),
        Math.sin(fpPitch),
        -Math.cos(fpYaw) * Math.cos(fpPitch),
      );
      camera.lookAt(camera.position.clone().add(lookDir));
    } else {
      // ── Third-person mode ──
      playerIsMoving = false;
      if (playerEnabled && keysDown.size > 0) {
        playerIsMoving = player.update(dt, keysDown, camera);
        if (playerIsMoving) followCamera = true;
      }

      if (followCamera && playerIsMoving) {
        const targetPos = player.group.position.clone().add(cameraOffset);
        camera.position.lerp(targetPos, 3 * dt);
        controls.target.lerp(player.group.position.clone().setY(0.8), 3 * dt);
      }

      enforceAboveGroundCamera();
      controls.update();
      enforceAboveGroundCamera();
    }

    // Foreman follows the player
    foreman.update(player.group.position, dt);

    // Keep sky dome centered on camera
    skyDome.position.copy(camera.position);

    renderer.render(scene, camera);
  };
  animate();

  // ── Mesh state helpers ──

  const updateHoveredMesh = (nextMesh: THREE.Mesh | null) => {
    const nextHL = resolveHighlightMesh(nextMesh);
    if (hoveredMesh === nextHL) return;
    if (hoveredMesh && hoveredMesh !== selectedMesh)
      applySelectionStyle(hoveredMesh, "default");
    hoveredMesh = nextHL;
    if (hoveredMesh && hoveredMesh !== selectedMesh)
      applySelectionStyle(hoveredMesh, "hovered");
  };

  const updateSelectedMesh = (nextMesh: THREE.Mesh | null) => {
    const nextHL = resolveHighlightMesh(nextMesh);
    if (selectedMesh === nextHL) return;
    if (selectedMesh) {
      applySelectionStyle(
        selectedMesh,
        selectedMesh === hoveredMesh ? "hovered" : "default",
      );
    }
    selectedMesh = nextHL;
    if (selectedMesh) applySelectionStyle(selectedMesh, "selected");
  };

  // ── Raycasting helpers ──

  const updatePointerRay = (event: PointerEvent) => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
  };

  const getIntersectedSelectableMesh = (event: PointerEvent) => {
    updatePointerRay(event);
    const hits = raycaster.intersectObjects(worldRoot.children, true);
    const mesh = hits.find(
      (e) =>
        e.object instanceof THREE.Mesh &&
        (e.object.userData as SelectableUserData).selectable,
    )?.object;
    return mesh instanceof THREE.Mesh ? mesh : null;
  };

  const getIntersectedWallMesh = (
    event: PointerEvent,
  ): { mesh: THREE.Mesh; point: THREE.Vector3 } | null => {
    updatePointerRay(event);
    const hits = raycaster.intersectObjects(worldRoot.children, true);
    const hit = hits.find(
      (e) =>
        e.object instanceof THREE.Mesh &&
        (e.object.userData as SelectableUserData).selectable &&
        (e.object.userData as SelectableUserData).kind === "wall",
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
      )
        return null;
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

  // ── Pointer events ──

  const handlePointerMove = (event: PointerEvent) => {
    if (pointerDownPosition) {
      const dx = event.clientX - pointerDownPosition.x;
      const dy = event.clientY - pointerDownPosition.y;
      if (dx * dx + dy * dy > 25) didPointerDrag = true;
    }

    if (currentTool === "wall") {
      const ground = getGroundPoint(event);
      if (wallStartPoint && ground)
        updateWallPreview(
          wallStartPoint.x,
          wallStartPoint.y,
          ground.x,
          ground.y,
        );
      updateHoveredMesh(null);
      renderer.domElement.style.cursor = ground
        ? wallStartPoint
          ? "crosshair"
          : "cell"
        : "not-allowed";
      return;
    }
    if (currentTool === "steelbar") {
      const ground = getGroundPoint(event);
      if (steelBarStartPoint && ground)
        updateSteelBarPreview(
          steelBarStartPoint.x,
          steelBarStartPoint.y,
          ground.x,
          ground.y,
        );
      updateHoveredMesh(null);
      renderer.domElement.style.cursor = ground
        ? steelBarStartPoint
          ? "crosshair"
          : "cell"
        : "not-allowed";
      return;
    }
    if (currentTool === "roof") {
      const ground = getGroundPoint(event);
      if (roofStartPoint && ground)
        updateRoofPreview(
          roofStartPoint.x,
          roofStartPoint.y,
          ground.x,
          ground.y,
        );
      updateHoveredMesh(null);
      renderer.domElement.style.cursor = ground
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
      if (placement) updatePlacementGhost(placement.x, placement.y);
      else clearPlacementGhost();
      renderer.domElement.style.cursor = placement ? "copy" : "not-allowed";
      return;
    }
    if (isDoorWindowTool()) {
      const wallHit = getIntersectedWallMesh(event);
      updateHoveredMesh(wallHit ? wallHit.mesh : null);
      renderer.domElement.style.cursor = wallHit ? "cell" : "not-allowed";
      return;
    }

    const mesh = getIntersectedSelectableMesh(event);
    updateHoveredMesh(mesh);
    renderer.domElement.style.cursor = mesh ? "pointer" : "grab";
  };

  const handlePointerLeave = () => {
    pointerDownPosition = null;
    didPointerDrag = false;
    updateHoveredMesh(null);
    renderer.domElement.style.cursor =
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
      if (!ground) return;
      if (!wallStartPoint) {
        wallStartPoint = ground;
        return;
      }
      const sx = wallStartPoint.x,
        sy = wallStartPoint.y;
      let ex = ground.x,
        ey = ground.y;
      const dx = Math.abs(ex - sx),
        dy = Math.abs(ey - sy);
      if (dy < 30 && dx > 30) ey = sy;
      else if (dx < 30 && dy > 30) ex = sx;
      wallStartPoint = null;
      clearWallPreview();
      if (Math.sqrt((ex - sx) ** 2 + (ey - sy) ** 2) < GRID_SIZE) return;
      onPlaceWall?.(sx, sy, ex, ey);
      return;
    }
    if (currentTool === "pillar") {
      const placement = getGroundPlacement(event);
      if (!placement) return;
      updateSelectedMesh(null);
      selectedObject = null;
      onSelectionChange?.(null);
      onPlacePillar?.(placement.x, placement.y);
      return;
    }
    if (currentTool === "foundation") {
      const ground = getGroundPoint(event);
      if (!ground) return;
      updateSelectedMesh(null);
      selectedObject = null;
      onSelectionChange?.(null);
      clearPlacementGhost();
      onPlaceFoundation?.(
        snap(ground.x - DEFAULT_FOUNDATION_WIDTH / 2, GRID_SIZE),
        snap(ground.y - DEFAULT_FOUNDATION_HEIGHT / 2, GRID_SIZE),
      );
      return;
    }
    if (currentTool === "furniture") {
      const ground = getGroundPoint(event);
      if (!ground) return;
      updateSelectedMesh(null);
      selectedObject = null;
      onSelectionChange?.(null);
      clearPlacementGhost();
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
      const sx = steelBarStartPoint.x,
        sy = steelBarStartPoint.y;
      const ex = ground.x,
        ey = ground.y;
      steelBarStartPoint = null;
      clearSteelBarPreview();
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
      const sx = roofStartPoint.x,
        sy = roofStartPoint.y;
      const ex = ground.x,
        ey = ground.y;
      roofStartPoint = null;
      clearRoofPreview();
      const w = Math.abs(ex - sx),
        h = Math.abs(ey - sy);
      if (w < GRID_SIZE || h < GRID_SIZE) return;
      onPlaceRoof?.(Math.min(sx, ex), Math.min(sy, ey), w, h);
      return;
    }
    if (isDoorWindowTool()) {
      const wallHit = getIntersectedWallMesh(event);
      if (!wallHit) return;
      const data = wallHit.mesh.userData as SelectableUserData;
      if (!data.id) return;
      if (currentTool === "door")
        onPlaceDoor?.(data.id, wallHit.point.x, wallHit.point.z);
      else onPlaceWindow?.(data.id, wallHit.point.x, wallHit.point.z);
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

    // Select tool
    const mesh = getIntersectedSelectableMesh(event);
    const nextSelection = getSelectionFromMesh(mesh);
    if (isSameSelection(selectedObject, nextSelection)) return;
    selectedObject = nextSelection;
    updateSelectedMesh(mesh);
    onSelectionChange?.(nextSelection);
  };

  renderer.domElement.addEventListener("pointermove", handlePointerMove);
  renderer.domElement.addEventListener("pointerleave", handlePointerLeave);
  renderer.domElement.addEventListener("pointerdown", handlePointerDown);
  renderer.domElement.addEventListener("pointerup", handlePointerUp);
  renderer.domElement.addEventListener("click", handleClick);
  renderer.domElement.style.cursor = "grab";

  // ── Render world ──

  let isFirstRender = true;

  const renderWorld3D = (world: World) => {
    disposeGroup(worldRoot);
    hoveredMesh = null;
    selectedMesh = null;
    selectedObject = null;
    onSelectionChange?.(null);

    foundationBounds = buildWorldMeshes(worldRoot, world);
    hasFoundation = !!world.foundation;

    // Only center the camera on the first render (initial load).
    // Subsequent renders (placing objects) should not move the camera.
    if (isFirstRender) {
      isFirstRender = false;
      const box = new THREE.Box3().setFromObject(worldRoot);
      if (!box.isEmpty()) {
        const center = box.getCenter(new THREE.Vector3());
        controls.target.copy(center.setY(0));
      }
    }
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
    )
      return "cell";
    if (tool === "paint") return "crosshair";
    return "grab";
  };

  // ── Public API ──

  return {
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
      const nextTool = nextOptions.currentTool ?? currentTool;
      currentFurnitureType =
        nextOptions.currentFurnitureType ?? currentFurnitureType;

      if (nextTool !== currentTool) {
        updateSelectedMesh(null);
        selectedObject = null;
        onSelectionChange?.(null);
        wallStartPoint = null;
        clearWallPreview();
        steelBarStartPoint = null;
        clearSteelBarPreview();
        roofStartPoint = null;
        clearRoofPreview();
        clearPlacementGhost();
      }

      currentTool = nextTool;
      updateHoveredMesh(null);
      renderer.domElement.style.cursor = getCursorForTool(currentTool);
    },
    renderWorld3D,
    setFollowCamera(enabled: boolean) {
      followCamera = enabled;
    },
    setPlayerEnabled(enabled: boolean) {
      playerEnabled = enabled;
      keysDown.clear();
    },
    setForemanDialogue(text: string) {
      foreman.setDialogue(text);
    },
    setOnViewModeChange(cb: (fp: boolean) => void) {
      onViewModeChange = cb;
    },
    isFirstPerson() {
      return firstPerson;
    },
    dispose: () => {
      window.cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      window.removeEventListener("keydown", handleKeyDownPlayer);
      window.removeEventListener("keyup", handleKeyUpPlayer);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener(
        "pointerlockchange",
        handlePointerLockChange,
      );
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener(
        "pointerleave",
        handlePointerLeave,
      );
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      renderer.domElement.removeEventListener("click", handleClick);
      clearWallPreview();
      clearSteelBarPreview();
      clearRoofPreview();
      clearPlacementGhost();
      controls.dispose();
      disposeGroup(worldRoot);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    },
  };
}
