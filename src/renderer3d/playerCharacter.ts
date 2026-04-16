import * as THREE from "three";

const PLAYER_SPEED = 8;
const FOREMAN_SITE_POSITION = new THREE.Vector3(-18, 0, 18);

export type PlayerCharacter = {
  group: THREE.Group;
  update(dt: number, keysDown: Set<string>, camera: THREE.Camera): boolean;
  setVisible(visible: boolean): void;
};

function createStylizedWorker(colors: {
  jacket: string;
  vest: string;
  pants: string;
  skin: string;
  helmet: string;
  boot: string;
}) {
  const rig = new THREE.Group();

  const torso = new THREE.Group();
  torso.position.y = 0.88;
  rig.add(torso);

  const jacket = new THREE.Mesh(
    new THREE.BoxGeometry(0.56, 0.72, 0.26),
    new THREE.MeshStandardMaterial({
      color: colors.jacket,
      roughness: 0.9,
    }),
  );
  torso.add(jacket);

  const vest = new THREE.Mesh(
    new THREE.BoxGeometry(0.44, 0.46, 0.28),
    new THREE.MeshStandardMaterial({
      color: colors.vest,
      roughness: 0.8,
    }),
  );
  vest.position.z = 0.02;
  torso.add(vest);

  const reflectiveStripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.08, 0.3),
    new THREE.MeshStandardMaterial({
      color: "#fff2b0",
      emissive: "#8f7d3f",
      emissiveIntensity: 0.08,
      roughness: 0.4,
    }),
  );
  reflectiveStripe.position.y = -0.08;
  reflectiveStripe.position.z = 0.03;
  torso.add(reflectiveStripe);

  const belt = new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 0.08, 0.28),
    new THREE.MeshStandardMaterial({ color: "#4b3b2a", roughness: 0.95 }),
  );
  belt.position.y = -0.3;
  torso.add(belt);

  const head = new THREE.Group();
  head.position.y = 1.47;
  rig.add(head);

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 0.1, 12),
    new THREE.MeshStandardMaterial({ color: colors.skin }),
  );
  neck.position.y = -0.15;
  head.add(neck);

  const face = new THREE.Mesh(
    new THREE.SphereGeometry(0.21, 20, 16),
    new THREE.MeshStandardMaterial({ color: colors.skin, roughness: 0.92 }),
  );
  head.add(face);

  const nose = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.06, 0.04),
    new THREE.MeshStandardMaterial({ color: colors.skin }),
  );
  nose.position.set(0, -0.02, 0.2);
  head.add(nose);

  const helmetBrim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.28, 0.05, 20),
    new THREE.MeshStandardMaterial({ color: colors.helmet, roughness: 0.7 }),
  );
  helmetBrim.position.y = 0.18;
  head.add(helmetBrim);

  const helmetDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.23, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: colors.helmet, roughness: 0.68 }),
  );
  helmetDome.position.y = 0.18;
  head.add(helmetDome);

  const helmetBand = new THREE.Mesh(
    new THREE.TorusGeometry(0.18, 0.014, 8, 24),
    new THREE.MeshStandardMaterial({ color: "#d9dbe3", roughness: 0.3 }),
  );
  helmetBand.rotation.x = Math.PI / 2;
  helmetBand.position.y = 0.12;
  head.add(helmetBand);

  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.36, 1.08, 0);
  rig.add(leftArmPivot);
  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.36, 1.08, 0);
  rig.add(rightArmPivot);

  const upperArmGeometry = new THREE.CapsuleGeometry(0.065, 0.28, 4, 8);
  const sleeveMaterial = new THREE.MeshStandardMaterial({
    color: colors.jacket,
    roughness: 0.88,
  });
  const leftUpperArm = new THREE.Mesh(upperArmGeometry, sleeveMaterial);
  leftUpperArm.rotation.z = 0.12;
  leftUpperArm.position.y = -0.18;
  leftArmPivot.add(leftUpperArm);
  const rightUpperArm = new THREE.Mesh(
    upperArmGeometry.clone(),
    sleeveMaterial.clone(),
  );
  rightUpperArm.rotation.z = -0.12;
  rightUpperArm.position.y = -0.18;
  rightArmPivot.add(rightUpperArm);

  const forearmGeometry = new THREE.CapsuleGeometry(0.055, 0.24, 4, 8);
  const skinMaterial = new THREE.MeshStandardMaterial({
    color: colors.skin,
    roughness: 0.92,
  });
  const leftForearm = new THREE.Mesh(forearmGeometry, skinMaterial);
  leftForearm.position.set(0, -0.44, 0);
  leftArmPivot.add(leftForearm);
  const rightForearm = new THREE.Mesh(
    forearmGeometry.clone(),
    skinMaterial.clone(),
  );
  rightForearm.position.set(0, -0.44, 0);
  rightArmPivot.add(rightForearm);

  const leftHand = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 10, 8),
    skinMaterial.clone(),
  );
  leftHand.position.set(0, -0.61, 0);
  leftArmPivot.add(leftHand);
  const rightHand = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 10, 8),
    skinMaterial.clone(),
  );
  rightHand.position.set(0, -0.61, 0);
  rightArmPivot.add(rightHand);

  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.14, 0.5, 0);
  rig.add(leftLegPivot);
  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.14, 0.5, 0);
  rig.add(rightLegPivot);

  const upperLegMaterial = new THREE.MeshStandardMaterial({
    color: colors.pants,
    roughness: 0.9,
  });
  const legGeometry = new THREE.CapsuleGeometry(0.085, 0.38, 4, 8);
  const leftLeg = new THREE.Mesh(legGeometry, upperLegMaterial);
  leftLeg.position.y = -0.24;
  leftLegPivot.add(leftLeg);
  const rightLeg = new THREE.Mesh(legGeometry.clone(), upperLegMaterial.clone());
  rightLeg.position.y = -0.24;
  rightLegPivot.add(rightLeg);

  const leftBoot = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.1, 0.28),
    new THREE.MeshStandardMaterial({ color: colors.boot, roughness: 0.9 }),
  );
  leftBoot.position.set(0, -0.54, 0.06);
  leftLegPivot.add(leftBoot);
  const rightBoot = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.1, 0.28),
    new THREE.MeshStandardMaterial({ color: colors.boot, roughness: 0.9 }),
  );
  rightBoot.position.set(0, -0.54, 0.06);
  rightLegPivot.add(rightBoot);

  return {
    group: rig,
    leftArmPivot,
    rightArmPivot,
    leftLegPivot,
    rightLegPivot,
    head,
    rightHand,
  };
}

export function createPlayerCharacter(): PlayerCharacter {
  const worker = createStylizedWorker({
    jacket: "#365d8f",
    vest: "#f2c54d",
    pants: "#243448",
    skin: "#f0c7a1",
    helmet: "#f4b63d",
    boot: "#43362d",
  });

  const group = worker.group;
  group.position.set(5, 0, 5);

  const tapeMeasure = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 0.11, 0.05),
    new THREE.MeshStandardMaterial({ color: "#efb62e", roughness: 0.65 }),
  );
  tapeMeasure.position.set(0.27, 0.56, 0.12);
  group.add(tapeMeasure);

  function update(
    dt: number,
    keysDown: Set<string>,
    camera: THREE.Camera,
  ): boolean {
    if (keysDown.size === 0) {
      worker.leftLegPivot.rotation.x *= 0.82;
      worker.rightLegPivot.rotation.x *= 0.82;
      worker.leftArmPivot.rotation.x *= 0.82;
      worker.rightArmPivot.rotation.x *= 0.82;
      worker.head.rotation.y *= 0.8;
      return false;
    }

    const camForward = new THREE.Vector3();
    camera.getWorldDirection(camForward);
    camForward.y = 0;
    camForward.normalize();
    const camRight = new THREE.Vector3()
      .crossVectors(camForward, new THREE.Vector3(0, 1, 0))
      .normalize();

    const moveDir = new THREE.Vector3();
    if (keysDown.has("w")) moveDir.add(camForward);
    if (keysDown.has("s")) moveDir.sub(camForward);
    if (keysDown.has("d")) moveDir.add(camRight);
    if (keysDown.has("a")) moveDir.sub(camRight);

    if (moveDir.lengthSq() === 0) {
      worker.leftLegPivot.rotation.x *= 0.82;
      worker.rightLegPivot.rotation.x *= 0.82;
      worker.leftArmPivot.rotation.x *= 0.82;
      worker.rightArmPivot.rotation.x *= 0.82;
      return false;
    }

    moveDir.normalize();
    group.position.addScaledVector(moveDir, PLAYER_SPEED * dt);
    group.rotation.y = Math.atan2(moveDir.x, moveDir.z);

    const now = performance.now();
    const walkCycle = Math.sin(now * 0.012) * 0.5;
    worker.leftLegPivot.rotation.x = walkCycle;
    worker.rightLegPivot.rotation.x = -walkCycle;
    worker.leftArmPivot.rotation.x = -walkCycle * 0.65;
    worker.rightArmPivot.rotation.x = walkCycle * 0.65;
    worker.head.rotation.y = Math.sin(now * 0.002) * 0.06;

    return true;
  }

  function setVisible(visible: boolean) {
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) child.visible = visible;
    });
  }

  return { group, update, setVisible };
}

export type ForemanNPC = {
  group: THREE.Group;
  update(playerPosition: THREE.Vector3, dt: number): void;
  setDialogue(text: string): void;
};

export function createForemanCabin(): THREE.Group {
  const cabin = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(6.8, 0.28, 5.4),
    new THREE.MeshStandardMaterial({
      color: "#8a755d",
      roughness: 0.96,
    }),
  );
  base.position.set(0, 0.14, 0);
  base.receiveShadow = true;
  cabin.add(base);

  const gravelPad = new THREE.Mesh(
    new THREE.CylinderGeometry(5.8, 6.2, 0.08, 24),
    new THREE.MeshStandardMaterial({
      color: "#c4b59c",
      roughness: 1,
    }),
  );
  gravelPad.position.set(0.2, 0.02, 0.2);
  gravelPad.receiveShadow = true;
  cabin.add(gravelPad);

  const wallMaterial = new THREE.MeshStandardMaterial({
    color: "#d4c1a4",
    roughness: 0.9,
  });
  const trimMaterial = new THREE.MeshStandardMaterial({
    color: "#6a5847",
    roughness: 0.92,
  });

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(5.6, 2.7, 4.2),
    wallMaterial,
  );
  body.position.set(0, 1.63, 0);
  body.castShadow = true;
  body.receiveShadow = true;
  cabin.add(body);

  const door = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 1.95, 0.12),
    new THREE.MeshStandardMaterial({
      color: "#6f523f",
      roughness: 0.88,
    }),
  );
  door.position.set(-1.35, 1.12, 2.16);
  door.castShadow = true;
  cabin.add(door);

  const doorWindow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.28, 0.42),
    new THREE.MeshStandardMaterial({
      color: "#a9d0de",
      emissive: "#3e5662",
      emissiveIntensity: 0.12,
      roughness: 0.18,
      metalness: 0.08,
      side: THREE.DoubleSide,
    }),
  );
  doorWindow.position.set(-1.35, 1.42, 2.225);
  cabin.add(doorWindow);

  [
    [-2.25, 1.46, 2.16],
    [1.55, 1.46, 2.16],
  ].forEach(([x, y, z]) => {
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(1.18, 1.04, 0.12),
      trimMaterial,
    );
    frame.position.set(x, y, z);
    frame.castShadow = true;
    cabin.add(frame);

    const pane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.92, 0.78),
      new THREE.MeshStandardMaterial({
        color: "#c7e0ea",
        emissive: "#698d98",
        emissiveIntensity: 0.15,
        roughness: 0.12,
        metalness: 0.08,
        side: THREE.DoubleSide,
      }),
    );
    pane.position.set(x, y, z + 0.065);
    cabin.add(pane);
  });

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(4.6, 1.85, 4),
    new THREE.MeshStandardMaterial({
      color: "#84644e",
      roughness: 0.95,
    }),
  );
  roof.rotation.y = Math.PI / 4;
  roof.position.set(0, 3.76, 0);
  roof.castShadow = true;
  cabin.add(roof);

  const porch = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 0.18, 1.4),
    new THREE.MeshStandardMaterial({
      color: "#9a8465",
      roughness: 0.95,
    }),
  );
  porch.position.set(-1.05, 0.31, 2.82);
  porch.receiveShadow = true;
  cabin.add(porch);

  [-2.15, -0.15].forEach((x) => {
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 2.05, 10),
      trimMaterial.clone(),
    );
    post.position.set(x, 1.2, 2.42);
    post.castShadow = true;
    cabin.add(post);
  });

  const signPost = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 2.25, 0.16),
    new THREE.MeshStandardMaterial({ color: "#6f5843", roughness: 0.96 }),
  );
  signPost.position.set(3.75, 1.18, 1.65);
  signPost.castShadow = true;
  cabin.add(signPost);

  const signCanvas = document.createElement("canvas");
  signCanvas.width = 512;
  signCanvas.height = 192;
  const signCtx = signCanvas.getContext("2d");
  if (signCtx) {
    signCtx.fillStyle = "#fbf3e4";
    signCtx.fillRect(0, 0, signCanvas.width, signCanvas.height);
    signCtx.strokeStyle = "#8f6d47";
    signCtx.lineWidth = 14;
    signCtx.strokeRect(7, 7, signCanvas.width - 14, signCanvas.height - 14);
    signCtx.fillStyle = "#684e33";
    signCtx.font = "700 56px sans-serif";
    signCtx.textAlign = "center";
    signCtx.textBaseline = "middle";
    signCtx.fillText("FOREMAN", signCanvas.width / 2, 70);
    signCtx.font = "600 38px sans-serif";
    signCtx.fillText("CABIN", signCanvas.width / 2, 126);
    signCtx.font = "500 24px sans-serif";
    signCtx.fillText("Need help? Come by.", signCanvas.width / 2, 162);
  }

  const signBoard = new THREE.Mesh(
    new THREE.PlaneGeometry(2.05, 0.78),
    new THREE.MeshStandardMaterial({
      map: new THREE.CanvasTexture(signCanvas),
      transparent: false,
      side: THREE.DoubleSide,
    }),
  );
  signBoard.position.set(3.75, 2.2, 1.65);
  signBoard.rotation.y = -Math.PI / 6;
  cabin.add(signBoard);

  const crate = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.55, 0.8),
    new THREE.MeshStandardMaterial({
      color: "#8d6f54",
      roughness: 0.93,
    }),
  );
  crate.position.set(2.35, 0.36, 2.55);
  crate.castShadow = true;
  cabin.add(crate);

  const lamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 12, 10),
    new THREE.MeshStandardMaterial({
      color: "#ffd994",
      emissive: "#c89435",
      emissiveIntensity: 0.4,
      roughness: 0.2,
    }),
  );
  lamp.position.set(-1.35, 2.18, 2.18);
  cabin.add(lamp);

  cabin.position.copy(FOREMAN_SITE_POSITION);
  return cabin;
}

export function createForemanNPC(): ForemanNPC {
  const worker = createStylizedWorker({
    jacket: "#5d4637",
    vest: "#ff7f36",
    pants: "#2b2b30",
    skin: "#d1a178",
    helmet: "#f5f5f5",
    boot: "#2e2622",
  });
  const group = worker.group;
  group.position.copy(FOREMAN_SITE_POSITION).add(new THREE.Vector3(0.4, 0, 3));

  const clipboard = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.22, 0.025),
    new THREE.MeshStandardMaterial({ color: "#c6905e", roughness: 0.75 }),
  );
  clipboard.position.set(0.06, -0.58, 0.08);
  worker.rightHand.add(clipboard);
  worker.rightHand.rotation.z = -0.25;

  const bubbleCanvas = document.createElement("canvas");
  bubbleCanvas.width = 512;
  bubbleCanvas.height = 128;
  const ctx = bubbleCanvas.getContext("2d")!;
  const bubbleTexture = new THREE.CanvasTexture(bubbleCanvas);
  const spriteMat = new THREE.SpriteMaterial({
    map: bubbleTexture,
    transparent: true,
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(4.2, 1.1, 1);
  sprite.position.y = 2.35;
  sprite.visible = false;
  group.add(sprite);

  let currentText = "";
  let playerNearby = false;

  function drawBubble(text: string) {
    ctx.clearRect(0, 0, 512, 128);
    if (!text) {
      sprite.visible = false;
      return;
    }

    ctx.fillStyle = "rgba(255, 251, 244, 0.96)";
    ctx.beginPath();
    ctx.roundRect(4, 4, 504, 100, 18);
    ctx.fill();
    ctx.strokeStyle = "#d58b39";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 251, 244, 0.96)";
    ctx.beginPath();
    ctx.moveTo(238, 104);
    ctx.lineTo(256, 124);
    ctx.lineTo(274, 104);
    ctx.fill();

    ctx.fillStyle = "#43362a";
    ctx.font = "600 22px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const words = text.split(" ");
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > 460) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);

    const lineHeight = 25;
    const startY = 50 - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((value, index) => {
      ctx.fillText(value, 256, startY + index * lineHeight);
    });

    bubbleTexture.needsUpdate = true;
    sprite.visible = playerNearby;
  }

  const homePosition = group.position.clone();
  const facingPoint = new THREE.Vector3(
    homePosition.x + 10,
    0,
    homePosition.z - 14,
  );

  function update(playerPosition: THREE.Vector3, dt: number) {
    const distanceToPlayer = playerPosition.distanceTo(group.position);
    playerNearby = distanceToPlayer < 10.5;
    sprite.visible = playerNearby && !!currentText;

    const lookTarget = playerNearby ? playerPosition : facingPoint;
    const dir = lookTarget.clone().sub(group.position);
    dir.y = 0;
    if (dir.lengthSq() > 0.01) {
      const targetRotation = Math.atan2(dir.x, dir.z);
      let delta = targetRotation - group.rotation.y;
      while (delta > Math.PI) delta -= Math.PI * 2;
      while (delta < -Math.PI) delta += Math.PI * 2;
      group.rotation.y += delta * Math.min(1, dt * 4.5);
    }

    const sway = Math.sin(performance.now() * 0.003) * 0.05;
    worker.leftLegPivot.rotation.x = sway;
    worker.rightLegPivot.rotation.x = -sway;
    worker.leftArmPivot.rotation.x = -sway * 0.45;
    worker.rightArmPivot.rotation.x = sway * 0.35;
    worker.head.rotation.y = Math.sin(performance.now() * 0.0014) * 0.08;
  }

  function setDialogue(text: string) {
    if (text === currentText) return;
    currentText = text;
    drawBubble(text);
  }

  return { group, update, setDialogue };
}
