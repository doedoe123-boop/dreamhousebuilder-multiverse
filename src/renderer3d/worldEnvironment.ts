import * as THREE from "three";

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
    const hillFactor = Math.max(0, (distFromCenter - flatRadius) / 110);
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
  terrainGeo.setAttribute(
    "color",
    new THREE.BufferAttribute(terrainColors, 3),
  );
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

  return { skyDome };
}
