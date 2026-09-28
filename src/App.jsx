import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import LaptopScene from './canvas/LaptopScene';
import HeroOverlay from './components/HeroOverlay';
import './App.css';

export default function App() {
  const [, setIsZoomed] = useState(false);

  const handleZoomIn = () => {
    setIsZoomed(true);
    console.log("Влет в ноутбук активирован!");
    // Здесь позже сделаем анимацию камеры внутрь
  };

  return (
    <div className="app-shell">
      {/* UI Оверлей с текстом */}
      <HeroOverlay onZoom={handleZoomIn} />

      {/* 3D Холст */}
      <Canvas 
        camera={{ 
          position: [12, 1.3, -4], 
          fov: 9  }}
        className="app-canvas"
      >
        <LaptopScene />
        <OrbitControls
          enableRotate={false}
          enablePan={false}
          enableZoom={false}
        />
      </Canvas>
    </div>
  );
}