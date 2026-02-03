'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { Suspense, useState } from 'react';
import { RobotModel, RobotModelRef } from './RobotModel';

interface SceneProps {
  expression?: 'neutral' | 'happy' | 'thinking' | 'listening' | 'speaking' | 'greeting' | 'sad';
}

export function Scene({ expression = 'neutral' }: SceneProps) {
  const [robotRef, setRobotRef] = useState<RobotModelRef | null>(null);

  const handleRobotRef = (ref: RobotModelRef | null) => {
    setRobotRef(ref);
  };

  return (
    <div className="w-full h-screen bg-black">
      <Canvas
        camera={{ position: [0, 0.3, 3.5], fov: 40 }}
        gl={{ 
          antialias: true, 
          alpha: false, 
          toneMapping: 3,
          toneMappingExposure: 1.1
        }}
        dpr={[1, 2]}
        shadows
      >
        <color attach="background" args={['#000000']} />
        
        {/* 柔和环境光 */}
        <ambientLight intensity={0.12} color="#ffffff" />
        
        {/* 主光源 - 顶部前方 */}
        <directionalLight 
          position={[0, 5, 5]} 
          intensity={1.8} 
          color="#ffffff"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        
        {/* 左侧边缘光 */}
        <spotLight 
          position={[-4, 2, 3]} 
          intensity={0.7} 
          color="#b0c8ff"
          angle={0.6}
          penumbra={1}
        />
        
        {/* 右侧边缘光 */}
        <spotLight 
          position={[4, 2, 3]} 
          intensity={0.5} 
          color="#d0d8ff"
          angle={0.6}
          penumbra={1}
        />
        
        {/* 背光 - 轮廓光 */}
        <pointLight position={[0, 1, -3]} intensity={0.3} color="#4080ff" />
        
        {/* 底部微光 */}
        <pointLight position={[0, -2, 1]} intensity={0.15} color="#202030" />

        <Suspense fallback={null}>
          <RobotModel 
            ref={handleRobotRef}
            position={[0, 0.4, 0]}
            initialExpression={expression}
          />
          
          {/* 高质量HDR环境 */}
          <Environment 
            preset="studio"
            background={false}
          />
        </Suspense>
        
        {/* 桌面反射 */}
        <ContactShadows
          position={[0, -1.24, 0]}
          opacity={0.6}
          scale={6}
          blur={2}
          far={3}
          color="#000000"
        />
        
        {/* 相机控制 */}
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={2.5}
          maxDistance={5}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2.1}
          maxAzimuthAngle={Math.PI / 5}
          minAzimuthAngle={-Math.PI / 5}
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.35}
          zoomSpeed={0.4}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  );
}
