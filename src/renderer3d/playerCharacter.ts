import * as THREE from "three";

const PLAYER_SPEED = 8;

export type PlayerCharacter = {
  group: THREE.Group;
  update(dt: number, keysDown: Set<string>, camera: THREE.Camera): boolean;
  setVisible(visible: boolean): void;
};

export function createPlayerCharacter(): PlayerCharacter {
  const group = new THREE.Group();
  group.position.set(5, 0, 5);

  // Body (torso)
  const bodyGeo = new THREE.CylinderGeometry(0.28, 0.22, 0.9, 12);
  const bodyMat = new THREE.MeshStandardMaterial({ color: "#3b82f6" });
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  bodyMesh.position.y = 0.65;
  group.add(bodyMesh);

  // Head
  const headGeo = new THREE.SphereGeometry(0.22, 16, 12);
  const headMat = new THREE.MeshStandardMaterial({ color: "#fcd6b0" });
  const headMesh = new THREE.Mesh(headGeo, headMat);
  headMesh.position.y = 1.3;
  group.add(headMesh);

  // Hard hat
  const hatMat = new THREE.MeshStandardMaterial({ color: "#f5b73d" });
  const hatBrimGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.06, 16);
  const hatBrim = new THREE.Mesh(hatBrimGeo, hatMat);
  hatBrim.position.y = 1.46;
  group.add(hatBrim);
  const hatDomeGeo = new THREE.SphereGeometry(
    0.24,
    16,
    8,
    0,
    Math.PI * 2,
    0,
    Math.PI / 2,
  );
  const hatDome = new THREE.Mesh(hatDomeGeo, hatMat);
  hatDome.position.y = 1.46;
  group.add(hatDome);

  // Arms
  const armGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.55, 8);
  const armMat = new THREE.MeshStandardMaterial({ color: "#3b82f6" });
  const leftArm = new THREE.Mesh(armGeo, armMat);
  leftArm.position.set(-0.35, 0.65, 0);
  leftArm.rotation.z = 0.15;
  group.add(leftArm);
  const rightArm = new THREE.Mesh(armGeo.clone(), armMat.clone());
  rightArm.position.set(0.35, 0.65, 0);
  rightArm.rotation.z = -0.15;
  group.add(rightArm);

  // Hands
  const handGeo = new THREE.SphereGeometry(0.07, 8, 6);
  const handMat = new THREE.MeshStandardMaterial({ color: "#fcd6b0" });
  const leftHand = new THREE.Mesh(handGeo, handMat);
  leftHand.position.set(-0.38, 0.36, 0);
  group.add(leftHand);
  const rightHand = new THREE.Mesh(handGeo.clone(), handMat.clone());
  rightHand.position.set(0.38, 0.36, 0);
  group.add(rightHand);

  // Legs
  const legGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.4, 8);
  const legMat = new THREE.MeshStandardMaterial({ color: "#1e3a5f" });
  const leftLeg = new THREE.Mesh(legGeo, legMat);
  leftLeg.position.set(-0.12, 0.2, 0);
  group.add(leftLeg);
  const rightLeg = new THREE.Mesh(legGeo, legMat);
  rightLeg.position.set(0.12, 0.2, 0);
  group.add(rightLeg);

  function update(
    dt: number,
    keysDown: Set<string>,
    camera: THREE.Camera,
  ): boolean {
    if (keysDown.size === 0) {
      leftLeg.rotation.x *= 0.85;
      rightLeg.rotation.x *= 0.85;
      leftArm.rotation.x *= 0.85;
      rightArm.rotation.x *= 0.85;
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
      leftLeg.rotation.x *= 0.85;
      rightLeg.rotation.x *= 0.85;
      leftArm.rotation.x *= 0.85;
      rightArm.rotation.x *= 0.85;
      return false;
    }

    moveDir.normalize();
    group.position.addScaledVector(moveDir, PLAYER_SPEED * dt);
    group.rotation.y = Math.atan2(moveDir.x, moveDir.z);

    const now = performance.now();
    const walkCycle = Math.sin(now * 0.012) * 0.35;
    leftLeg.rotation.x = walkCycle;
    rightLeg.rotation.x = -walkCycle;
    leftArm.rotation.x = -walkCycle * 0.7;
    rightArm.rotation.x = walkCycle * 0.7;

    return true;
  }

  function setVisible(visible: boolean) {
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) child.visible = visible;
    });
  }

  return { group, update, setVisible };
}

/* ------------------------------------------------------------------ */
/*  Foreman NPC                                                        */
/* ------------------------------------------------------------------ */

export type ForemanNPC = {
  group: THREE.Group;
  update(playerPosition: THREE.Vector3, dt: number): void;
  setDialogue(text: string): void;
};

export function createForemanNPC(): ForemanNPC {
  const group = new THREE.Group();
  group.position.set(7, 0, 5);

  // Body (torso) — orange hi-vis vest
  const bodyGeo = new THREE.CylinderGeometry(0.28, 0.22, 0.9, 12);
  const bodyMat = new THREE.MeshStandardMaterial({ color: "#ff6b00" });
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  bodyMesh.position.y = 0.65;
  group.add(bodyMesh);

  // Head
  const headGeo = new THREE.SphereGeometry(0.22, 16, 12);
  const headMat = new THREE.MeshStandardMaterial({ color: "#d4a574" });
  const headMesh = new THREE.Mesh(headGeo, headMat);
  headMesh.position.y = 1.3;
  group.add(headMesh);

  // White hard hat
  const hatMat = new THREE.MeshStandardMaterial({ color: "#ffffff" });
  const hatBrimGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.06, 16);
  const hatBrim = new THREE.Mesh(hatBrimGeo, hatMat);
  hatBrim.position.y = 1.46;
  group.add(hatBrim);
  const hatDomeGeo = new THREE.SphereGeometry(
    0.24,
    16,
    8,
    0,
    Math.PI * 2,
    0,
    Math.PI / 2,
  );
  const hatDome = new THREE.Mesh(hatDomeGeo, hatMat);
  hatDome.position.y = 1.46;
  group.add(hatDome);

  // Arms
  const armGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.55, 8);
  const armMat = new THREE.MeshStandardMaterial({ color: "#ff6b00" });
  const leftArm = new THREE.Mesh(armGeo, armMat);
  leftArm.position.set(-0.35, 0.65, 0);
  leftArm.rotation.z = 0.15;
  group.add(leftArm);
  const rightArm = new THREE.Mesh(armGeo.clone(), armMat.clone());
  rightArm.position.set(0.35, 0.65, 0);
  rightArm.rotation.z = -0.15;
  group.add(rightArm);

  // Hands
  const handGeo = new THREE.SphereGeometry(0.07, 8, 6);
  const handMat = new THREE.MeshStandardMaterial({ color: "#d4a574" });
  const leftHand = new THREE.Mesh(handGeo, handMat);
  leftHand.position.set(-0.38, 0.36, 0);
  group.add(leftHand);
  const rightHand = new THREE.Mesh(handGeo.clone(), handMat.clone());
  rightHand.position.set(0.38, 0.36, 0);
  group.add(rightHand);

  // Legs
  const legGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.4, 8);
  const legMat = new THREE.MeshStandardMaterial({ color: "#2d2d2d" });
  const leftLeg = new THREE.Mesh(legGeo, legMat);
  leftLeg.position.set(-0.12, 0.2, 0);
  group.add(leftLeg);
  const rightLeg = new THREE.Mesh(legGeo, legMat);
  rightLeg.position.set(0.12, 0.2, 0);
  group.add(rightLeg);

  // Clipboard in right hand
  const clipGeo = new THREE.BoxGeometry(0.15, 0.2, 0.02);
  const clipMat = new THREE.MeshStandardMaterial({ color: "#d4a06a" });
  const clipboard = new THREE.Mesh(clipGeo, clipMat);
  clipboard.position.set(0.42, 0.42, 0.08);
  group.add(clipboard);

  // Speech bubble sprite (canvas texture)
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
  sprite.scale.set(4, 1, 1);
  sprite.position.y = 2.2;
  sprite.visible = false;
  group.add(sprite);

  let currentText = "";

  function drawBubble(text: string) {
    ctx.clearRect(0, 0, 512, 128);
    if (!text) {
      sprite.visible = false;
      return;
    }

    // Background
    ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
    ctx.beginPath();
    ctx.roundRect(4, 4, 504, 100, 16);
    ctx.fill();
    ctx.strokeStyle = "#c6842a";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Tail triangle
    ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
    ctx.beginPath();
    ctx.moveTo(240, 104);
    ctx.lineTo(256, 124);
    ctx.lineTo(272, 104);
    ctx.fill();

    // Text (word-wrapped)
    ctx.fillStyle = "#333";
    ctx.font = "bold 22px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const words = text.split(" ");
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > 470) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);

    const lineHeight = 26;
    const startY = 52 - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((l, i) => {
      ctx.fillText(l, 256, startY + i * lineHeight);
    });

    bubbleTexture.needsUpdate = true;
    sprite.visible = true;
  }

  const FOLLOW_OFFSET = new THREE.Vector3(2, 0, 1);
  const FOLLOW_SPEED = 3;

  function update(playerPosition: THREE.Vector3, dt: number) {
    const target = playerPosition.clone().add(FOLLOW_OFFSET);
    group.position.lerp(target, FOLLOW_SPEED * dt);

    // Face the player
    const dir = playerPosition.clone().sub(group.position);
    dir.y = 0;
    if (dir.lengthSq() > 0.01) {
      group.rotation.y = Math.atan2(dir.x, dir.z);
    }

    // Idle leg sway
    const sway = Math.sin(performance.now() * 0.003) * 0.05;
    leftLeg.rotation.x = sway;
    rightLeg.rotation.x = -sway;
  }

  function setDialogue(text: string) {
    if (text === currentText) return;
    currentText = text;
    drawBubble(text);
  }

  return { group, update, setDialogue };
}
