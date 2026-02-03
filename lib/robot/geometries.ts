import * as THREE from 'three';

// 光滑黑色反光头盔材质
function createHelmetMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x080808,
    metalness: 0.98,
    roughness: 0.02,
    reflectivity: 1.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
    envMapIntensity: 3.0
  });
}

// 银白色金属材质
function createMetalMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0xc8c8d0,
    metalness: 0.9,
    roughness: 0.12,
    reflectivity: 0.95,
    clearcoat: 0.4,
    clearcoatRoughness: 0.08,
    envMapIntensity: 2.0
  });
}

// 深灰色关节材质
function createJointMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x1a1a1e,
    metalness: 0.95,
    roughness: 0.15,
    reflectivity: 0.85,
    envMapIntensity: 1.8
  });
}

export function createHeadGeometry() {
  const headGroup = new THREE.Group();
  
  const helmetMaterial = createHelmetMaterial();
  
  // 主头部 - 光滑椭圆头盔
  const headGeom = new THREE.SphereGeometry(0.42, 128, 128);
  headGeom.scale(0.95, 1.15, 1.0);
  const head = new THREE.Mesh(headGeom, helmetMaterial);
  head.castShadow = true;
  head.receiveShadow = true;
  headGroup.add(head);
  
  // 头顶高光区域
  const highlightGeom = new THREE.SphereGeometry(0.18, 64, 64);
  highlightGeom.scale(1.3, 0.35, 1);
  const highlightMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.12,
    blending: THREE.AdditiveBlending
  });
  const highlight = new THREE.Mesh(highlightGeom, highlightMaterial);
  highlight.position.set(0, 0.28, 0.08);
  headGroup.add(highlight);
  
  // 颈部下方过渡
  const neckBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.22, 0.08, 32),
    createJointMaterial()
  );
  neckBase.position.y = -0.48;
  headGroup.add(neckBase);
  
  // 兼容性元素
  const dummyEyeLeft = createDummyEye();
  dummyEyeLeft.name = 'leftEye';
  dummyEyeLeft.visible = false;
  headGroup.add(dummyEyeLeft);
  
  const dummyEyeRight = createDummyEye();
  dummyEyeRight.name = 'rightEye';
  dummyEyeRight.visible = false;
  headGroup.add(dummyEyeRight);
  
  const dummyMouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.1, 0.1),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  dummyMouth.name = 'mouth';
  dummyMouth.visible = false;
  headGroup.add(dummyMouth);
  
  return headGroup;
}

function createDummyEye() {
  const eyeGroup = new THREE.Group();
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.1, 0.1),
    new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(0x00ffff) },
        uTime: { value: 0 },
        uIntensity: { value: 1.0 },
        uBlink: { value: 1.0 }
      },
      vertexShader: `void main() { gl_Position = vec4(0.0); }`,
      fragmentShader: `void main() { discard; }`,
      transparent: true
    })
  );
  screen.name = 'eyeScreen';
  eyeGroup.add(screen);
  return eyeGroup;
}

export function createBodyGeometry() {
  const bodyGroup = new THREE.Group();
  
  const metalMaterial = createMetalMaterial();
  const jointMaterial = createJointMaterial();
  
  // 颈部
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.16, 0.2, 32),
    metalMaterial
  );
  neck.position.y = -0.1;
  bodyGroup.add(neck);
  
  // 颈部关节环
  const neckRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.14, 0.012, 16, 32),
    jointMaterial
  );
  neckRing.position.y = -0.15;
  neckRing.rotation.x = Math.PI / 2;
  bodyGroup.add(neckRing);
  
  // 胸部主体 - 更宽更圆润
  const chestGeom = new THREE.SphereGeometry(0.5, 64, 64);
  chestGeom.scale(1.4, 0.9, 0.75);
  const chest = new THREE.Mesh(chestGeom, metalMaterial);
  chest.position.y = -0.55;
  chest.castShadow = true;
  chest.receiveShadow = true;
  bodyGroup.add(chest);
  
  // 胸部中线
  const chestLineGeom = new THREE.BoxGeometry(0.025, 0.55, 0.08);
  const chestLine = new THREE.Mesh(chestLineGeom, jointMaterial);
  chestLine.position.set(0, -0.55, 0.34);
  bodyGroup.add(chestLine);
  
  // 胸部横线细节
  for (let i = 0; i < 3; i++) {
    const detailLine = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.015, 0.04),
      jointMaterial
    );
    detailLine.position.set(0, -0.4 - i * 0.12, 0.35);
    bodyGroup.add(detailLine);
  }
  
  // 肩部
  const shoulderWidth = 0.65;
  [-1, 1].forEach((side) => {
    // 肩关节球
    const shoulderBall = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 32, 32),
      metalMaterial
    );
    shoulderBall.position.set(side * shoulderWidth, -0.35, 0.05);
    shoulderBall.castShadow = true;
    bodyGroup.add(shoulderBall);
    
    // 肩部装甲 - 更小更贴合
    const shoulderPlateGeom = new THREE.SphereGeometry(0.14, 32, 32);
    shoulderPlateGeom.scale(1.1, 0.65, 0.85);
    const shoulderPlate = new THREE.Mesh(shoulderPlateGeom, metalMaterial);
    shoulderPlate.position.set(side * (shoulderWidth + 0.04), -0.32, 0.02);
    shoulderPlate.castShadow = true;
    bodyGroup.add(shoulderPlate);
  });
  
  // 腹部
  const abdomenGeom = new THREE.CylinderGeometry(0.38, 0.48, 0.35, 32);
  const abdomen = new THREE.Mesh(abdomenGeom, metalMaterial);
  abdomen.position.y = -1.0;
  bodyGroup.add(abdomen);
  
  // 腹部装饰线
  for (let i = 0; i < 2; i++) {
    const abdomenLine = new THREE.Mesh(
      new THREE.TorusGeometry(0.4 + i * 0.04, 0.008, 16, 32),
      jointMaterial
    );
    abdomenLine.position.y = -0.9 - i * 0.12;
    abdomenLine.rotation.x = Math.PI / 2;
    bodyGroup.add(abdomenLine);
  }
  
  // 隐藏的能量核心（兼容性）
  const dummyCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.01, 8, 8),
    new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0x00ffff) }
      },
      vertexShader: `void main() { gl_Position = vec4(0.0); }`,
      fragmentShader: `void main() { discard; }`,
      transparent: true
    })
  );
  dummyCore.name = 'energyCore';
  dummyCore.visible = false;
  bodyGroup.add(dummyCore);
  
  // 创建手臂 - 放在桌面上交叉（整体作为一个单元）
  const arms = createCrossedArms();
  arms.name = 'armsGroup';
  bodyGroup.add(arms);
  
  // 为动画控制器创建空的手臂引用
  const leftArmDummy = new THREE.Group();
  leftArmDummy.name = 'leftArm';
  bodyGroup.add(leftArmDummy);
  
  const rightArmDummy = new THREE.Group();
  rightArmDummy.name = 'rightArm';
  bodyGroup.add(rightArmDummy);
  
  return bodyGroup;
}

// 创建交叉的手臂整体
function createCrossedArms() {
  const armsGroup = new THREE.Group();
  
  const metalMaterial = createMetalMaterial();
  const jointMaterial = createJointMaterial();
  
  // 左臂
  // 左上臂
  const leftUpperArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.055, 0.32, 32),
    metalMaterial
  );
  leftUpperArm.position.set(-0.52, -0.22, 0.12);
  leftUpperArm.rotation.set(0.6, 0.18, 0.4);
  leftUpperArm.castShadow = true;
  armsGroup.add(leftUpperArm);
  
  // 左肘
  const leftElbow = new THREE.Mesh(
    new THREE.SphereGeometry(0.052, 32, 32),
    jointMaterial
  );
  leftElbow.position.set(-0.38, -0.48, 0.35);
  armsGroup.add(leftElbow);
  
  // 左前臂
  const leftForearm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.038, 0.048, 0.4, 32),
    metalMaterial
  );
  leftForearm.position.set(-0.08, -0.68, 0.48);
  leftForearm.rotation.set(0.05, 0.1, Math.PI / 2);
  leftForearm.castShadow = true;
  armsGroup.add(leftForearm);
  
  // 左手腕
  const leftWrist = new THREE.Mesh(
    new THREE.SphereGeometry(0.038, 32, 32),
    jointMaterial
  );
  leftWrist.position.set(0.14, -0.68, 0.52);
  armsGroup.add(leftWrist);
  
  // 左手
  const leftHand = createSimpleHand();
  leftHand.position.set(0.22, -0.68, 0.55);
  leftHand.rotation.set(-0.1, -0.3, 0);
  leftHand.scale.setScalar(0.92);
  armsGroup.add(leftHand);
  
  // 右臂
  // 右上臂
  const rightUpperArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.055, 0.32, 32),
    metalMaterial
  );
  rightUpperArm.position.set(0.52, -0.22, 0.12);
  rightUpperArm.rotation.set(0.6, -0.18, -0.4);
  rightUpperArm.castShadow = true;
  armsGroup.add(rightUpperArm);
  
  // 右肘
  const rightElbow = new THREE.Mesh(
    new THREE.SphereGeometry(0.052, 32, 32),
    jointMaterial
  );
  rightElbow.position.set(0.38, -0.48, 0.35);
  armsGroup.add(rightElbow);
  
  // 右前臂
  const rightForearm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.038, 0.048, 0.4, 32),
    metalMaterial
  );
  rightForearm.position.set(0.08, -0.68, 0.48);
  rightForearm.rotation.set(0.05, -0.1, Math.PI / 2);
  rightForearm.castShadow = true;
  armsGroup.add(rightForearm);
  
  // 右手腕
  const rightWrist = new THREE.Mesh(
    new THREE.SphereGeometry(0.038, 32, 32),
    jointMaterial
  );
  rightWrist.position.set(-0.14, -0.68, 0.52);
  armsGroup.add(rightWrist);
  
  // 右手
  const rightHand = createSimpleHand();
  rightHand.position.set(-0.22, -0.68, 0.55);
  rightHand.rotation.set(-0.1, 0.3, 0);
  rightHand.scale.setScalar(0.92);
  armsGroup.add(rightHand);
  
  return armsGroup;
}

// 简化的手部
function createSimpleHand() {
  const handGroup = new THREE.Group();
  const metalMaterial = createMetalMaterial();
  const jointMaterial = createJointMaterial();
  
  // 手掌
  const palm = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.045, 0.06),
    metalMaterial
  );
  handGroup.add(palm);
  
  // 手指
  for (let i = 0; i < 4; i++) {
    const finger = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.008, 0.04, 4, 8),
      metalMaterial
    );
    finger.position.set(-0.025 + i * 0.018, 0, 0.045);
    finger.rotation.x = 0.15;
    handGroup.add(finger);
  }
  
  // 拇指
  const thumb = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.009, 0.03, 4, 8),
    metalMaterial
  );
  thumb.position.set(0.045, 0, 0.02);
  thumb.rotation.z = 0.4;
  handGroup.add(thumb);
  
  return handGroup;
}

export function createNeckGeometry() {
  const neckGroup = new THREE.Group();
  // 颈部已集成到头部和身体中
  return neckGroup;
}

export function createBaseGeometry() {
  const baseGroup = new THREE.Group();
  
  // 隐藏的脉冲环（兼容性）
  const dummyRing = new THREE.Mesh(
    new THREE.RingGeometry(0.01, 0.02, 8),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
  );
  dummyRing.name = 'pulseRing';
  dummyRing.visible = false;
  baseGroup.add(dummyRing);
  
  // 反光桌面 - 调整高度与手臂对齐
  const tableGeom = new THREE.PlaneGeometry(18, 18);
  const tableMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x020204,
    metalness: 0.98,
    roughness: 0.06,
    reflectivity: 0.98,
    clearcoat: 0.9,
    clearcoatRoughness: 0.03,
    envMapIntensity: 1.8
  });
  const table = new THREE.Mesh(tableGeom, tableMaterial);
  table.rotation.x = -Math.PI / 2;
  table.position.y = -1.15;
  table.receiveShadow = true;
  baseGroup.add(table);
  
  return baseGroup;
}
