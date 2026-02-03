import * as THREE from 'three';

export type ExpressionType = 'neutral' | 'happy' | 'thinking' | 'listening' | 'speaking' | 'greeting' | 'sad';

interface ExpressionConfig {
  eyeColor: string;
  eyeIntensity: number;
  mouthScale: number;
  headTilt: number;
  headYaw: number;
  blinkRate: number;
  armWave: boolean;
  bodySway: number;
  breathing: number;
}

export const expressions: Record<ExpressionType, ExpressionConfig> = {
  neutral: {
    eyeColor: '#00ffff',
    eyeIntensity: 1.0,
    mouthScale: 1.0,
    headTilt: 0,
    headYaw: 0,
    blinkRate: 0.02,
    armWave: false,
    bodySway: 0.005,
    breathing: 0.02
  },
  happy: {
    eyeColor: '#00ff88',
    eyeIntensity: 1.4,
    mouthScale: 1.4,
    headTilt: 0.08,
    headYaw: 0,
    blinkRate: 0.03,
    armWave: false,
    bodySway: 0.008,
    breathing: 0.03
  },
  greeting: {
    eyeColor: '#00ff88',
    eyeIntensity: 1.8,
    mouthScale: 1.6,
    headTilt: 0.15,
    headYaw: 0.1,
    blinkRate: 0.04,
    armWave: true,
    bodySway: 0.01,
    breathing: 0.025
  },
  thinking: {
    eyeColor: '#ffaa00',
    eyeIntensity: 1.1,
    mouthScale: 0.65,
    headTilt: -0.15,
    headYaw: 0.15,
    blinkRate: 0.015,
    armWave: false,
    bodySway: 0.003,
    breathing: 0.015
  },
  listening: {
    eyeColor: '#00aaff',
    eyeIntensity: 1.8,
    mouthScale: 0.85,
    headTilt: 0.02,
    headYaw: 0,
    blinkRate: 0.05,
    armWave: false,
    bodySway: 0.004,
    breathing: 0.02
  },
  speaking: {
    eyeColor: '#ff6600',
    eyeIntensity: 1.6,
    mouthScale: 1.8,
    headTilt: 0.03,
    headYaw: -0.05,
    blinkRate: 0.018,
    armWave: false,
    bodySway: 0.006,
    breathing: 0.025
  },
  sad: {
    eyeColor: '#6666ff',
    eyeIntensity: 0.7,
    mouthScale: 0.4,
    headTilt: -0.08,
    headYaw: 0,
    blinkRate: 0.015,
    armWave: false,
    bodySway: 0.002,
    breathing: 0.012
  }
};

interface RobotAnimationState {
  currentExpression: ExpressionType;
  targetExpression: ExpressionType;
  transitionProgress: number;
  isBlinking: boolean;
  blinkProgress: number;
  nextBlinkTime: number;
  headRotation: THREE.Euler;
  targetHeadRotation: THREE.Euler;
  armRotation: { left: number; right: number };
  bodyOffset: THREE.Vector3;
  isWaving: boolean;
  waveProgress: number;
  idleTime: number;
}

export class RobotAnimationController {
  private state: RobotAnimationState;
  private headGroup: THREE.Group | null = null;
  private bodyGroup: THREE.Group | null = null;
  private leftArm: THREE.Group | null = null;
  private rightArm: THREE.Group | null = null;
  private eyeScreens: THREE.Mesh[] = [];
  private mouth: THREE.Mesh | null = null;
  private energyCore: THREE.Mesh | null = null;
  private pulseRing: THREE.Mesh | null = null;
  private clock: THREE.Clock;
  private originalArmRotation: { left: number; right: number } = { left: -0.08, right: 0.08 };
  private baseY: number = 0;

  constructor() {
    this.clock = new THREE.Clock();
    this.state = {
      currentExpression: 'neutral',
      targetExpression: 'neutral',
      transitionProgress: 1.0,
      isBlinking: false,
      blinkProgress: 0,
      nextBlinkTime: 0,
      headRotation: new THREE.Euler(0, 0, 0),
      targetHeadRotation: new THREE.Euler(0, 0, 0),
      armRotation: { left: 0, right: 0 },
      bodyOffset: new THREE.Vector3(0, 0, 0),
      isWaving: false,
      waveProgress: 0,
      idleTime: 0
    };
  }

  setHead(headGroup: THREE.Group) {
    this.headGroup = headGroup;
  }

  setBody(bodyGroup: THREE.Group) {
    this.bodyGroup = bodyGroup;
  }

  setArms(leftArm: THREE.Group, rightArm: THREE.Group) {
    this.leftArm = leftArm;
    this.rightArm = rightArm;
  }

  setEyeScreens(eyeScreens: THREE.Mesh[]) {
    this.eyeScreens = eyeScreens;
  }

  setMouth(mouth: THREE.Mesh) {
    this.mouth = mouth;
  }

  setEnergyCore(core: THREE.Mesh) {
    this.energyCore = core;
  }

  setPulseRing(ring: THREE.Mesh) {
    this.pulseRing = ring;
  }

  setBaseY(y: number) {
    this.baseY = y;
  }

  setExpression(expression: ExpressionType) {
    if (this.state.currentExpression !== expression) {
      this.state.targetExpression = expression;
      this.state.transitionProgress = 0;
      
      if (expression === 'greeting' && !this.state.isWaving) {
        this.waveHand();
      }
    }
  }

  private getCurrentExpression(): ExpressionConfig {
    const current = expressions[this.state.currentExpression];
    const target = expressions[this.state.targetExpression];
    const t = this.state.transitionProgress;
    
    const easeT = this.easeInOutCubic(t);
    
    return {
      eyeColor: this.interpolateColor(current.eyeColor, target.eyeColor, easeT),
      eyeIntensity: THREE.MathUtils.lerp(current.eyeIntensity, target.eyeIntensity, easeT),
      mouthScale: THREE.MathUtils.lerp(current.mouthScale, target.mouthScale, easeT),
      headTilt: THREE.MathUtils.lerp(current.headTilt, target.headTilt, easeT),
      headYaw: THREE.MathUtils.lerp(current.headYaw, target.headYaw, easeT),
      blinkRate: THREE.MathUtils.lerp(current.blinkRate, target.blinkRate, easeT),
      armWave: target.armWave,
      bodySway: THREE.MathUtils.lerp(current.bodySway, target.bodySway, easeT),
      breathing: THREE.MathUtils.lerp(current.breathing, target.breathing, easeT)
    };
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private interpolateColor(color1: string, color2: string, t: number): string {
    const c1 = new THREE.Color(color1);
    const c2 = new THREE.Color(color2);
    const result = c1.clone().lerp(c2, t);
    return '#' + result.getHexString();
  }

  update(time: number) {
    const delta = Math.min(this.clock.getDelta(), 0.1);
    const expr = this.getCurrentExpression();
    this.state.idleTime += delta;

    // 更新过渡
    if (this.state.transitionProgress < 1.0) {
      this.state.transitionProgress = Math.min(1.0, this.state.transitionProgress + delta * 2.5);
      if (this.state.transitionProgress >= 1.0) {
        this.state.currentExpression = this.state.targetExpression;
      }
    }

    // 眨眼逻辑 - 更自然
    if (time > this.state.nextBlinkTime && !this.state.isWaving) {
      this.state.isBlinking = true;
      this.state.blinkProgress = 0;
      this.state.nextBlinkTime = time + (1 / expr.blinkRate) + Math.random() * 2.5;
    }

    // 更新眨眼进度
    if (this.state.isBlinking) {
      this.state.blinkProgress += delta * 8;
      if (this.state.blinkProgress >= Math.PI) {
        this.state.isBlinking = false;
        this.state.blinkProgress = 0;
      }
    }

    const blinkAmount = this.state.isBlinking ? 
      Math.sin(this.state.blinkProgress) : 1;

    // 头部动画 - 更平滑
    if (this.headGroup) {
      const idleNod = Math.sin(time * 0.8) * 0.02;
      
      this.state.targetHeadRotation.x = expr.headTilt + idleNod;
      this.state.targetHeadRotation.y = expr.headYaw;
      
      // 聆听时轻微左右摆动
      if (this.state.currentExpression === 'listening') {
        this.state.targetHeadRotation.y += Math.sin(time * 0.4) * 0.08;
      }
      
      this.state.headRotation.x = THREE.MathUtils.lerp(
        this.state.headRotation.x,
        this.state.targetHeadRotation.x,
        delta * 4
      );
      this.state.headRotation.y = THREE.MathUtils.lerp(
        this.state.headRotation.y,
        this.state.targetHeadRotation.y,
        delta * 4
      );
      
      this.headGroup.rotation.x = this.state.headRotation.x;
      this.headGroup.rotation.y = this.state.headRotation.y;
    }

    // 眼睛更新 - Shader动画
    this.eyeScreens.forEach((eyeScreen) => {
      const material = eyeScreen.material as THREE.ShaderMaterial;
      if (material.uniforms) {
        material.uniforms.uColor.value.set(expr.eyeColor);
        material.uniforms.uIntensity.value = expr.eyeIntensity * blinkAmount;
        material.uniforms.uTime.value = time;
        material.uniforms.uBlink.value = blinkAmount;
      }
    });

    // 嘴巴动画
    if (this.mouth) {
      const baseScale = expr.mouthScale;
      
      if (this.state.currentExpression === 'speaking') {
        const speakAnim = 0.7 + 0.3 * Math.sin(time * 12);
        this.mouth.scale.y = baseScale * speakAnim;
      } else if (this.state.currentExpression === 'happy' || this.state.currentExpression === 'greeting') {
        const happyAnim = 0.9 + 0.1 * Math.sin(time * 3);
        this.mouth.scale.y = baseScale * happyAnim;
      } else {
        this.mouth.scale.y = THREE.MathUtils.lerp(this.mouth.scale.y, baseScale, delta * 5);
      }
    }

    // 能量核心动画
    if (this.energyCore) {
      const coreMaterial = this.energyCore.material as THREE.ShaderMaterial;
      if (coreMaterial.uniforms) {
        coreMaterial.uniforms.uTime.value = time;
        coreMaterial.uniforms.uColor.value.set(expr.eyeColor);
      }
    }

    // 脉冲环动画
    if (this.pulseRing) {
      const pulse = (Math.sin(time * 2) + 1) * 0.5;
      this.pulseRing.material.opacity = 0.3 + pulse * 0.4;
      this.pulseRing.scale.setScalar(0.95 + pulse * 0.1);
    }

    // 身体呼吸动画
    if (this.bodyGroup && this.baseY !== 0) {
      const breath = Math.sin(time * 1.2) * expr.breathing;
      const swayX = Math.sin(time * 0.7) * expr.bodySway;
      const swayZ = Math.cos(time * 0.5) * expr.bodySway * 0.5;
      
      this.bodyGroup.position.y = this.baseY + breath;
      this.bodyGroup.position.x = THREE.MathUtils.lerp(
        this.bodyGroup.position.x,
        swayX,
        delta * 2
      );
      this.bodyGroup.position.z = THREE.MathUtils.lerp(
        this.bodyGroup.position.z,
        swayZ,
        delta * 2
      );
    }

    // 手臂动画
    if (this.leftArm && this.rightArm) {
      const breath = Math.sin(time * 0.8) * 0.015;
      
      if (!this.state.isWaving) {
        const targetLeft = this.originalArmRotation.left + breath;
        const targetRight = this.originalArmRotation.right - breath;
        
        this.leftArm.rotation.z = THREE.MathUtils.lerp(
          this.leftArm.rotation.z,
          targetLeft,
          delta * 3
        );
        this.rightArm.rotation.z = THREE.MathUtils.lerp(
          this.rightArm.rotation.z,
          targetRight,
          delta * 3
        );
      }
      
      // 说话时手臂轻微移动
      if (this.state.currentExpression === 'speaking' && !this.state.isWaving) {
        const gesture = Math.sin(time * 6) * 0.05;
        this.rightArm.rotation.x = THREE.MathUtils.lerp(
          this.rightArm.rotation.x,
          gesture,
          delta * 6
        );
      } else if (!this.state.isWaving) {
        this.rightArm.rotation.x = THREE.MathUtils.lerp(
          this.rightArm.rotation.x,
          0,
          delta * 4
        );
      }
    }
  }

  waveHand(duration: number = 1800) {
    if (!this.rightArm || this.state.isWaving) return;
    
    this.state.isWaving = true;
    this.state.waveProgress = 0;
    const startRotation = this.rightArm.rotation.x;
    
    const animate = () => {
      this.state.waveProgress += 16;
      const progress = Math.min(this.state.waveProgress / duration, 1);
      
      const wave = Math.sin(progress * Math.PI * 2.5) * 1.2;
      this.rightArm!.rotation.x = startRotation + wave;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.rightArm!.rotation.x = 0;
        this.state.isWaving = false;
      }
    };
    animate();
  }

  nodHead(duration: number = 800) {
    if (!this.headGroup) return;
    
    const startX = this.headGroup.rotation.x;
    const startTime = performance.now();
    
    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const nod = Math.sin(progress * Math.PI) * 0.4;
      this.headGroup!.rotation.x = startX + nod;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.headGroup!.rotation.x = startX;
      }
    };
    animate();
  }

  shakeHead(duration: number = 1000) {
    if (!this.headGroup) return;
    
    const startY = this.headGroup.rotation.y;
    const startTime = performance.now();
    
    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const shake = Math.sin(progress * Math.PI * 6) * (1 - progress) * 0.3;
      this.headGroup!.rotation.y = startY + shake;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.headGroup!.rotation.y = startY;
      }
    };
    animate();
  }
}
