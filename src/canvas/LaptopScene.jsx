import { useGLTF } from '@react-three/drei';
import { useEffect, useRef } from 'react';

function LaptopModel() {
  // Загружаем 3D-модель 
  const { scene } = useGLTF('/models/Laptop_project.glb');
  const laptopbottom = scene.getObjectByName('bottom_laptop');
  const screenlaptop = scene.getObjectByName('screen_laptop');
  const laptoptop = scene.getObjectByName('top_laptop');

  // Храним текущее виртуальное положение скролла
  const scrollAmount = useRef(0);
  // Флаг, чтобы понимать, открыт ноутбук в данный момент или нет
  const isOpen = useRef(false);

  // Функция для закрытия
  const closedlaptop = () => {
    if (laptopbottom && screenlaptop && laptoptop) {
      laptopbottom.scale.set(3, 3, 3);
      
      screenlaptop.scale.set(3, 3, 3);
      screenlaptop.rotation.set(Math.PI / 0.1, 0, 1.8); 
      screenlaptop.position.set(0.04, 0.35, 0.2); 

      laptoptop.scale.set(3, 3, 3);
      laptoptop.rotation.set(Math.PI / 0, 0, 0);
      laptoptop.position.set(0.3, 0.3, 0); 
    }
  };

  // Функция для открытия 
  const openedlaptop = () => {
    if (laptopbottom && screenlaptop && laptoptop) {
      laptopbottom.scale.set(3, 3, 3);

      screenlaptop.scale.set(3, 3, 3);
      screenlaptop.rotation.set(Math.PI / 0.1, 0, -0.13);
      screenlaptop.position.set(-0.25, 0.74, 0.21);

      laptoptop.scale.set(3, 3, 3);
      laptoptop.rotation.set(Math.PI / 0.1, 0, 0);
      laptoptop.position.set(-0.31, 0.38, 0.21);
    }
  };

  useEffect(() => {
    //  Принудительно закрываем ноутбук при первой загрузке
    closedlaptop();

    //  Обработчик вращения колесика мыши
    const handleWheel = (e) => {
      // Блокируем реальную прокрутку страницы сайта вниз/вверх
      e.preventDefault();

      // Накапливаем значение скролла (e.deltaY выдает положительное число при скролле вниз)
      scrollAmount.current += e.deltaY;

      // Ограничиваем скролл, чтобы он не уходил в минус
      if (scrollAmount.current < 0) scrollAmount.current = 0;

      // ПОРОГ СКРОЛЛА
      const threshold = 500; 

      if (scrollAmount.current > threshold && !isOpen.current) {
        
        openedlaptop();
        isOpen.current = true;
      } else if (scrollAmount.current <= threshold && isOpen.current) {
       
        closedlaptop();
        isOpen.current = false;
      }
    };

    //  слушатель 
    window.addEventListener('wheel', handleWheel, { passive: false });

    // Очищаем слушатель 
    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, [laptopbottom, screenlaptop, laptoptop]);

  return (
    <group position={[0, -0.5, 0]} scale={[1, 1, 1]}>
      <primitive object={scene} />
    </group>
  );
}

export default function LaptopScene() {
  return (
    <>
      <ambientLight intensity={1.5} />
      <directionalLight position={[10, 10, 5]} intensity={2} />
      <LaptopModel />
    </>
  );
}
