import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
// import { OrbitControls } from '@react-three/drei';
import LaptopScene from './canvas/LaptopScene';
import SkyDome, { SKY } from './canvas/SkyDome';
import HeroOverlay from './components/HeroOverlay';
import './App.css';

export default function App() {
  return (
    <div className="app-shell">
      <HeroOverlay />

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
         <hemisphereLight args={['#9cd0ff', '#4a5568', 0.7]} /> 
       
        <directionalLight
          position={SKY.sunDir.clone().multiplyScalar(12).toArray()}
          color="#fff0d6"
          intensity={2.4}
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

        <LaptopScene />
      </Canvas>
    </div>
  );
}