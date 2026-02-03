'use client';

import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { 
  createHeadGeometry, 
  createBodyGeometry, 
  createNeckGeometry, 
  createBaseGeometry 
} from '@/lib/robot/geometries';
import { RobotAnimationController, ExpressionType } from '@/lib/robot/animations';

export interface RobotModelRef {
  setExpression: (expression: ExpressionType) => void;
  waveHand: () => void;
  nodHead: () => void;
  shakeHead: () => void;
}

interface RobotModelProps {
  position?: [number, number, number];
  initialExpression?: ExpressionType;
}

export const RobotModel = forwardRef<RobotModelRef, RobotModelProps>(({ 
  position = [0, 0, 0],
  initialExpression = 'neutral'
}, ref) => {
  const robotRef = useRef<THREE.Group>(null);
  const animationController = useRef<RobotAnimationController | null>(null);
  const bodyGroupRef = useRef<THREE.Group | null>(null);

  useImperativeHandle(ref, () => ({
    setExpression: (expression: ExpressionType) => {
      animationController.current?.setExpression(expression);
    },
    waveHand: () => {
      animationController.current?.waveHand();
    },
    nodHead: () => {
      animationController.current?.nodHead();
    },
    shakeHead: () => {
      animationController.current?.shakeHead();
    }
  }));

  useEffect(() => {
    if (!robotRef.current) return;

    // 创建各个部件
    const head = createHeadGeometry();
    const neck = createNeckGeometry();
    const body = createBodyGeometry();
    const base = createBaseGeometry();

    // 设置层级 - 半身机器人坐在桌前
    head.position.y = 0.55;
    neck.position.y = 0;
    body.position.y = 0;
    base.position.y = 0;

    // 获取引用
    const headGroup = head;
    const bodyGroup = body;
    bodyGroupRef.current = bodyGroup;
    
    const leftArm = bodyGroup.getObjectByName('leftArm') as THREE.Group;
    const rightArm = bodyGroup.getObjectByName('rightArm') as THREE.Group;
    const eyeScreens = [
      headGroup.getObjectByName('leftEye')?.getObjectByName('eyeScreen') as THREE.Mesh,
      headGroup.getObjectByName('rightEye')?.getObjectByName('eyeScreen') as THREE.Mesh,
    ].filter(Boolean);
    const mouth = headGroup.getObjectByName('mouth') as THREE.Mesh;
    const energyCore = bodyGroup.getObjectByName('energyCore') as THREE.Mesh;
    const pulseRing = base.getObjectByName('pulseRing') as THREE.Mesh;

    // 创建动画控制器
    const controller = new RobotAnimationController();
    controller.setHead(headGroup);
    controller.setBody(bodyGroup);
    controller.setArms(leftArm!, rightArm!);
    controller.setEyeScreens(eyeScreens);
    controller.setMouth(mouth);
    
    if (energyCore) {
      controller.setEnergyCore(energyCore);
    }
    if (pulseRing) {
      controller.setPulseRing(pulseRing);
    }
    
    controller.setBaseY(bodyGroup.position.y);
    controller.setExpression(initialExpression);

    animationController.current = controller;

    // 添加到机器人组
    robotRef.current.add(base);
    robotRef.current.add(bodyGroup);
    robotRef.current.add(neck);
    robotRef.current.add(head);
  }, [initialExpression]);

  useFrame((state) => {
    if (animationController.current) {
      animationController.current.update(state.clock.getElapsedTime());
    }
  });

  return (
    <group ref={robotRef} position={position}>
      {/* 机器人部件在 useEffect 中动态添加 */}
    </group>
  );
});

RobotModel.displayName = 'RobotModel';
