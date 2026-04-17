import * as THREE from "three";
import { BUILDABLE_LAND_SIZE } from "../constants/editor";
import { SCENE3D_SCALE } from "../constants/scene3d";

export type WorldEnvironmentHandles = {
  skyDome: THREE.Mesh;
};

export function setupWorldEnvironment(
  scene: THREE.Scene,
): WorldEnvironmentHandles {
  scene.fog = new THREE.FogExp2("#d7e3ea", 0.0038);

  const ambientLight = new THREE.AmbientLight("#f8efe1", 0.9);
  scene.add(ambientLight);

  const hemiLight = new THREE.HemisphereLight("#c7ecff", "#6c7d51", 1.35);
  hemiLight.position.set(0, 40, 0);
  scene.add(hemiLight);

  const directionalLight = new THREE.DirectionalLight("#fff4df", 1.7);
  directionalLight.position.set(26, 34, 18);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.set(2048, 2048);
  directionalLight.shadow.camera.left = -60;
  directionalLight.shadow.camera.right = 60;
  directionalLight.shadow.camera.top = 60;
  directionalLight.shadow.camera.bottom = -60;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 120;
  directionalLight.shadow.bias = -0.001;
  scene.add(directionalLight);

  const rimLight = new THREE.DirectionalLight("#d4e3ff", 0.42);
  rimLight.position.set(-30, 18, -12);
  scene.add(rimLight);

  const skyGeo = new THREE.SphereGeometry(400, 32, 16);
  const skyColors = new Float32Array(skyGeo.attributes.position.count * 3);
  const topColor = new THREE.Color("#7fb2dc");
  const horizonColor = new THREE.Color("#f7dcc0");
  const bottomColor = new THREE.Color("#8da97d");
  const tempColor = new THREE.Color();
  for (let i = 0; i < skyGeo.attributes.position.count; i++) {
    const y = skyGeo.attributes.position.getY(i);
    const normalizedY = y / 400;
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

  const terrainSize = 900;
  const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, 64, 64);
  terrainGeo.rotateX(-Math.PI / 2);
  const posAttr = terrainGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    const distFromCenter = Math.sqrt(x * x + z * z);
    const flatRadius = 78;
    const transitionWidth = 110;
    const rawT = Math.max(0, (distFromCenter - flatRadius) / transitionWidth);
    const hillFactor = rawT * rawT * (3 - 2 * rawT); // smoothstep
    const height =
      hillFactor *
      (Math.sin(x * 0.018) * 1.6 +
        Math.cos(z * 0.028) * 1.2 +
        Math.sin((x + z) * 0.014) * 1.8);
    posAttr.setY(i, Math.min(height, 9) - 0.22);
  }
  terrainGeo.computeVertexNormals();

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
  const grassColors = [
    new THREE.Color("#6f9d52"),
    new THREE.Color("#5a8a3e"),
    new THREE.Color("#7db560"),
  ];
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
    const dist = Math.sqrt(x * x + z * z);
    const rawGrassT = Math.max(0, (dist - 78) / 110);
    const grassHillFactor = rawGrassT * rawGrassT * (3 - 2 * rawGrassT);
    const baseHeight =
      grassHillFactor *
        (Math.sin(x * 0.018) * 1.6 +
          Math.cos(z * 0.028) * 1.2 +
          Math.sin((x + z) * 0.014) * 1.8) -
      0.18;
    grassDummy.position.set(x, Math.min(baseHeight, 9), z);
    grassDummy.rotation.y = Math.random() * Math.PI;
    grassDummy.rotation.x = (Math.random() - 0.5) * 0.3;
    grassDummy.rotation.z = (Math.random() - 0.5) * 0.25;
    const grassScale = 0.85 + Math.random() * 0.8;
    grassDummy.scale.setScalar(grassScale);
    grassDummy.updateMatrix();
    grass.setMatrixAt(grassIndex, grassDummy.matrix);
    grass.setColorAt(grassIndex, grassColors[grassIndex % 3]);
    grassIndex += 1;
  }
  grass.instanceMatrix.needsUpdate = true;
  if (grass.instanceColor) grass.instanceColor.needsUpdate = true;
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

  buildBuildablePlot(scene);

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

  // ── Trees and bushes around the perimeter ──
  buildTrees(scene);
  buildBushes(scene);

  scene.background = null;

  return { skyDome };
}

function buildBuildablePlot(scene: THREE.Scene) {
  const plotSize = BUILDABLE_LAND_SIZE / SCENE3D_SCALE;
  const plotHalf = plotSize / 2;
  const cornerRadius = Math.min(6, plotHalf * 0.16);

  const plotShape = createRoundedRectShape(
    -plotHalf,
    -plotHalf,
    plotSize,
    plotSize,
    cornerRadius,
  );
  const plotGeometry = new THREE.ShapeGeometry(plotShape, 32);
  plotGeometry.rotateX(-Math.PI / 2);

  const soilPatch = new THREE.Mesh(
    plotGeometry,
    new THREE.MeshStandardMaterial({
      color: "#b99364",
      roughness: 1,
      metalness: 0,
      transparent: true,
      opacity: 0.92,
    }),
  );
  soilPatch.position.y = 0.025;
  scene.add(soilPatch);

  const borderPatch = new THREE.Mesh(
    new THREE.ShapeGeometry(
      createRoundedRectShape(
        -plotHalf - 0.8,
        -plotHalf - 0.8,
        plotSize + 1.6,
        plotSize + 1.6,
        cornerRadius + 0.6,
      ),
      32,
    ),
    new THREE.MeshStandardMaterial({
      color: "#8f6e48",
      roughness: 1,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    }),
  );
  borderPatch.geometry.rotateX(-Math.PI / 2);
  borderPatch.position.y = 0.018;
  scene.add(borderPatch);

  const postGeometry = new THREE.CylinderGeometry(0.09, 0.12, 1.25, 6);
  const postMaterial = new THREE.MeshStandardMaterial({
    color: "#765635",
    roughness: 0.95,
  });
  const ropeMaterial = new THREE.LineBasicMaterial({
    color: "#cdb88d",
    transparent: true,
    opacity: 0.75,
  });

  const corners = [
    new THREE.Vector3(-plotHalf, 0.62, -plotHalf),
    new THREE.Vector3(plotHalf, 0.62, -plotHalf),
    new THREE.Vector3(plotHalf, 0.62, plotHalf),
    new THREE.Vector3(-plotHalf, 0.62, plotHalf),
  ];

  corners.forEach((corner, index) => {
    const post = new THREE.Mesh(postGeometry, postMaterial.clone());
    post.position.copy(corner);
    scene.add(post);

    const nextCorner = corners[(index + 1) % corners.length];
    const rope = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        corner.clone().setY(0.88),
        nextCorner.clone().setY(0.88),
      ]),
      ropeMaterial,
    );
    scene.add(rope);
  });

  const markerStoneGeometry = new THREE.BoxGeometry(0.55, 0.16, 0.55);
  const markerStoneMaterial = new THREE.MeshStandardMaterial({
    color: "#b7a48b",
    roughness: 1,
  });
  [
    [-plotHalf + 1.4, -plotHalf + 1.4],
    [plotHalf - 1.4, -plotHalf + 1.4],
    [plotHalf - 1.4, plotHalf - 1.4],
    [-plotHalf + 1.4, plotHalf - 1.4],
  ].forEach(([x, z]) => {
    const stone = new THREE.Mesh(
      markerStoneGeometry,
      markerStoneMaterial.clone(),
    );
    stone.position.set(x, 0.08, z);
    scene.add(stone);
  });
}

function createRoundedRectShape(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const shape = new THREE.Shape();
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

/* ------------------------------------------------------------------ */
/*  Trees — simple cone + cylinder scattered around the perimeter      */
/* ------------------------------------------------------------------ */

function getTerrainHeight(x: number, z: number): number {
  const dist = Math.sqrt(x * x + z * z);
  const flatRadius = 78;
  const rawT = Math.max(0, (dist - flatRadius) / 110);
  const hillFactor = rawT * rawT * (3 - 2 * rawT);
  const height =
    hillFactor *
    (Math.sin(x * 0.018) * 1.6 +
      Math.cos(z * 0.028) * 1.2 +
      Math.sin((x + z) * 0.014) * 1.8);
  return Math.min(height, 9) - 0.22;
}

function buildTrees(scene: THREE.Scene) {
  const trunkGeometry = new THREE.CylinderGeometry(0.18, 0.24, 2.2, 8);
  const trunkMaterial = new THREE.MeshStandardMaterial({
    color: "#6b4c30",
    roughness: 0.95,
  });

  const foliageColors = ["#3d7a2e", "#4a8c38", "#2f6b24"];

  const treePositions: { x: number; z: number; scale: number }[] = [];

  // Seed a deterministic-looking spread using a simple hash
  const seed = (n: number) =>
    (((Math.sin(n * 127.1 + 311.7) * 43758.5453) % 1) + 1) % 1;

  for (let i = 0; i < 55; i++) {
    const angle = seed(i) * Math.PI * 2;
    const radius = 95 + seed(i + 100) * 140;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const scale = 0.8 + seed(i + 200) * 0.9;
    treePositions.push({ x, z, scale });
  }

  treePositions.forEach(({ x, z, scale }, i) => {
    const treeGroup = new THREE.Group();
    const y = getTerrainHeight(x, z);

    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial.clone());
    trunk.position.y = 1.1 * scale;
    trunk.scale.setScalar(scale);
    trunk.castShadow = true;
    treeGroup.add(trunk);

    const foliageColor = foliageColors[i % foliageColors.length];
    const foliageMat = new THREE.MeshStandardMaterial({
      color: foliageColor,
      roughness: 0.9,
    });

    // Two stacked cones for a fuller look
    const lowerCone = new THREE.Mesh(
      new THREE.ConeGeometry(1.8 * scale, 2.8 * scale, 7),
      foliageMat,
    );
    lowerCone.position.y = 2.6 * scale;
    lowerCone.castShadow = true;
    treeGroup.add(lowerCone);

    const upperCone = new THREE.Mesh(
      new THREE.ConeGeometry(1.2 * scale, 2.2 * scale, 7),
      foliageMat.clone(),
    );
    upperCone.position.y = 4.2 * scale;
    upperCone.castShadow = true;
    treeGroup.add(upperCone);

    treeGroup.position.set(x, y, z);
    treeGroup.rotation.y = seed(i + 300) * Math.PI * 2;
    scene.add(treeGroup);
  });
}

/* ------------------------------------------------------------------ */
/*  Bushes — low rounded shapes near the tree line                     */
/* ------------------------------------------------------------------ */

function buildBushes(scene: THREE.Scene) {
  const bushColors = ["#4e8a3a", "#3a7530", "#5c9945"];

  const seed = (n: number) =>
    (((Math.sin(n * 78.233 + 142.1) * 29837.123) % 1) + 1) % 1;

  for (let i = 0; i < 80; i++) {
    const angle = seed(i) * Math.PI * 2;
    const radius = 82 + seed(i + 50) * 120;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = getTerrainHeight(x, z);

    const scaleX = 0.6 + seed(i + 100) * 0.8;
    const scaleY = 0.4 + seed(i + 150) * 0.5;
    const scaleZ = 0.6 + seed(i + 200) * 0.8;

    const bushMat = new THREE.MeshStandardMaterial({
      color: bushColors[i % bushColors.length],
      roughness: 0.95,
    });

    const bush = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), bushMat);
    bush.scale.set(scaleX, scaleY, scaleZ);
    bush.position.set(x, y + scaleY * 0.5, z);
    bush.castShadow = true;
    scene.add(bush);
  }
}
