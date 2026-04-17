import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { World } from "../types/world";
import { disposeGroup } from "./rendererHelpers";
import { createPlacementPreviewManager } from "./placementPreviews";
import {
  createPlayerCharacter,
  createForemanCabin,
  createForemanNPC,
} from "./playerCharacter";
import { setupWorldEnvironment } from "./worldEnvironment";
import { createWorldInteractionController } from "./worldInteractionController";
import type { World3DRendererOptions } from "./worldRenderer.types";
import { buildWorldMeshes } from "./worldMeshBuilder";

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

  // When true, pointer lock is temporarily released (e.g. foreman chat)
  let pointerLockPaused = false;

  // Exit FP when pointer lock is lost (e.g. pressing Escape)
  const handlePointerLockChange = () => {
    if (firstPerson && document.pointerLockElement !== renderer.domElement) {
      if (!pointerLockPaused) {
        exitFirstPerson();
      }
    }
  };
  document.addEventListener("pointerlockchange", handlePointerLockChange);
  const { skyDome } = setupWorldEnvironment(scene);

  // ── World root & interactions ──
  const worldRoot = new THREE.Group();
  scene.add(worldRoot);
  let currentTool = options.currentTool ?? "select";
  let onForemanNearbyChange = options.onForemanNearbyChange;
  let foremanNearby = false;
  const previews = createPlacementPreviewManager(scene, () => currentTool);
  const interactions = createWorldInteractionController({
    camera,
    domElement: renderer.domElement,
    worldRoot,
    previews,
    options,
  });

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

  // ── Render world ──

  let isFirstRender = true;

  const renderWorld3D = (world: World) => {
    disposeGroup(worldRoot);
    interactions.resetAfterRender();

    const foundationBounds = buildWorldMeshes(worldRoot, world);
    interactions.setWorldState(world, foundationBounds, !!world.foundation);

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

  // ── Public API ──

  return {
    syncInteraction(nextOptions: World3DRendererOptions) {
      onForemanNearbyChange = nextOptions.onForemanNearbyChange;
      currentTool = nextOptions.currentTool ?? currentTool;
      interactions.syncInteraction(nextOptions);
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
    setForemanTalking(talking: boolean) {
      foreman.setTalking(talking);
      if (firstPerson) {
        if (talking) {
          pointerLockPaused = true;
          if (document.pointerLockElement === renderer.domElement) {
            document.exitPointerLock();
          }
        } else {
          pointerLockPaused = false;
          renderer.domElement.requestPointerLock();
        }
      }
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
      interactions.dispose();
      previews.clearAllPreviews();
      controls.dispose();
      disposeGroup(worldRoot);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    },
  };
}
