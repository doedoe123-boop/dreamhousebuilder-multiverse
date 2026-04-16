import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  DEFAULT_FOUNDATION_HEIGHT,
  DEFAULT_FOUNDATION_WIDTH,
  DEFAULT_PILLAR_SIZE,
  GRID_SIZE,
} from "../constants/editor";
import {
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
  disposeGroup,
  applySelectionStyle,
  resolveHighlightMesh,
  getSelectionFromMesh,
  isSameSelection,
  type SelectableUserData,
} from "./rendererHelpers";
import { createPlacementPreviewManager } from "./placementPreviews";
import {
  createPlayerCharacter,
  createForemanCabin,
  createForemanNPC,
} from "./playerCharacter";
import { setupWorldEnvironment } from "./worldEnvironment";
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
  onForemanNearbyChange?: (nearby: boolean) => void;
};

export function createWorld3DRenderer(
  container: HTMLDivElement,
  options: World3DRendererOptions = {},
) {
  // ── Scene setup ──
  const scene = new THREE.Scene();

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

  const foremanCabin = createForemanCabin();
  scene.add(foremanCabin);

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
  const { skyDome } = setupWorldEnvironment(scene);

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
  let onForemanNearbyChange = options.onForemanNearbyChange;
  let foremanNearby = false;

  let foundationBounds = { minX: 0, maxX: 0, minZ: 0, maxZ: 0 };
  let hasFoundation = false;
  let pointerDownPosition: { x: number; y: number } | null = null;
  let didPointerDrag = false;

  // ── Preview state ──
  let wallStartPoint: { x: number; y: number } | null = null;
  let steelBarStartPoint: { x: number; y: number } | null = null;
  let roofStartPoint: { x: number; y: number } | null = null;
  const previews = createPlacementPreviewManager(scene, () => currentTool);

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
    const nextForemanNearby =
      player.group.position.distanceTo(foreman.group.position) < 14;
    if (nextForemanNearby !== foremanNearby) {
      foremanNearby = nextForemanNearby;
      onForemanNearbyChange?.(foremanNearby);
    }

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
        previews.updateWallPreview(
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
        previews.updateSteelBarPreview(
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
        previews.updateRoofPreview(
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
      if (placement) previews.updatePlacementGhost(placement.x, placement.y);
      else previews.clearPlacementGhost();
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
      previews.clearWallPreview();
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
      previews.clearPlacementGhost();
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
      const sx = steelBarStartPoint.x,
        sy = steelBarStartPoint.y;
      const ex = ground.x,
        ey = ground.y;
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
      const sx = roofStartPoint.x,
        sy = roofStartPoint.y;
      const ex = ground.x,
        ey = ground.y;
      roofStartPoint = null;
      previews.clearRoofPreview();
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
      onForemanNearbyChange = nextOptions.onForemanNearbyChange;
      const nextTool = nextOptions.currentTool ?? currentTool;
      currentFurnitureType =
        nextOptions.currentFurnitureType ?? currentFurnitureType;

      if (nextTool !== currentTool) {
        updateSelectedMesh(null);
        selectedObject = null;
        onSelectionChange?.(null);
        wallStartPoint = null;
        previews.clearWallPreview();
        steelBarStartPoint = null;
        previews.clearSteelBarPreview();
        roofStartPoint = null;
        previews.clearRoofPreview();
        previews.clearPlacementGhost();
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
      onForemanNearbyChange?.(false);
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
      previews.clearAllPreviews();
      controls.dispose();
      disposeGroup(worldRoot);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    },
  };
}
