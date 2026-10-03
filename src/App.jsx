import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { useState } from 'react';
// import { OrbitControls } from '@react-three/drei';
import LaptopScene from './canvas/LaptopScene';
import SkyDome, { SKY } from './canvas/SkyDome';
import HeroOverlay from './components/HeroOverlay';
import StackPage from './components/StackPage';
import './App.css';

export default function App() {
  const [showStack, setShowStack] = useState(false);
  const [showHero, setShowHero] = useState(true);

  return (
    <div className="app-shell">
      <HeroOverlay isVisible={showHero} />
      {showStack && <StackPage />}

      <Canvas
        camera={{ position: [3.6, 0.39, -1.2], fov: 40 }}
        className="app-canvas"
        shadows
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
      >
        <SkyDome />
       
        <fog attach="fog" args={[SKY.fog, 18, 55]} />

        {/* Свет */}
         <hemisphereLight args={['#9baee8', '#111526', 0.5]} /> 
       
        <directionalLight
          position={SKY.keyLightDir.clone().multiplyScalar(12).toArray()}
          color="#a9c9ff"
          intensity={1.1}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0002}
          shadow-camera-near={0.5}
          shadow-camera-far={40}
          shadow-camera-left={-8}
          shadow-camera-right={8}
          shadow-camera-top={8}
          shadow-camera-bottom={-8}
        />
       
        <directionalLight position={[4, 2, -6]} color="#7fb6ff" intensity={0.6} />

        <LaptopScene
          onCameraEndChange={setShowStack}
          onIntroVisibilityChange={setShowHero}
        />
      </Canvas>
    </div>
  );
}