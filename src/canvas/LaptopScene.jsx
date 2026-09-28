import { useGLTF } from '@react-three/drei';

function LaptopModel() {
  // Загружаем 3D-модель (этот компонент должен быть внутри Canvas)
  const { scene } = useGLTF('/models/Laptop_project.glb');
  const laptopbottom = scene.getObjectByName('bottom_laptop');
  const screenlaptop = scene.getObjectByName('screen_laptop');
  const laptoptop = scene.getObjectByName('top_laptop');
  if (laptopbottom, screenlaptop, laptoptop) {
      laptopbottom.scale.set(3, 3, 3);
      screenlaptop.scale.set(3, 3, 3);
      laptoptop.scale.set(3, 3, 3);
      laptoptop.rotation.set(Math.PI / 90, 0, 0);
      laptoptop.position.set(-0.3, 0.4, 0); 
  }
  return (
    <group 
      position={[0, -0.5, 0]} 
      // Угол наклона и поворота самого ноутбука
      scale={[1, 1, 1]}
    >
      <primitive object={scene} />
    </group>
  );
}

export default function LaptopScene() {
  return (
    <>
      {/* Базовое освещение, чтобы модель не была черной */}
      <ambientLight intensity={1.5} />
      <directionalLight position={[10, 10, 5]} intensity={2} />

      {/* Сама модель */}
      <LaptopModel />
    </>
  );
}
