import { useGLTF,Sky } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { MathUtils, Quaternion, Vector3 } from 'three';
import { useEffect, useRef } from 'react';

const ZOOM_START = 500;
const ZOOM_DISTANCE = 900;
const LID_SCROLL_DISTANCE = ZOOM_START + ZOOM_DISTANCE;
const LID_HINGE_POSITION = new Vector3(-0.077, 0.37, 0.2125);
const LID_HINGE_AXIS = new Vector3(0, 0, 1);
const LID_INITIAL_ANGLE = MathUtils.degToRad(5);
const LID_BACK_OFFSET = new Vector3(-0.2, 0, 0);
const SCREEN_ROTATION_OFFSET = new Quaternion().setFromAxisAngle(LID_HINGE_AXIS, MathUtils.degToRad(-7.5));
const SCREEN_FORWARD_OFFSET = new Vector3(0.01, 0.009, 0);

function LaptopModel({ onCameraEndChange, onIntroVisibilityChange }) {
  // Загружаем 3D-модель 
  const { scene } = useGLTF('/models/Laptop_project.glb');
  const laptopbottom = scene.getObjectByName('bottom_laptop');
  const screenlaptop = scene.getObjectByName('screen_laptop');
  const laptoptop = scene.getObjectByName('top_laptop');

  // Храним текущее виртуальное положение скролла
  const scrollAmount = useRef(0);
  const lidProgress = useRef(0);
  const lidTarget = useRef(0);
  const lidRotation = useRef(new Quaternion());
  const zoomProgress = useRef(0);
  const zoomTarget = useRef(0);
  const cameraAtEnd = useRef(false);
  const scrollActive = useRef(false);
  const camera = useThree((state) => state.camera);
  const cameraStart = useRef(new Vector3(3.6, 0.39, -1.2));
  const cameraEnd = useRef(new Vector3(0.2, 0.30, 0.03));
  const cameraLookTarget = useRef(new Vector3());
  const screenFocus = useRef(new Vector3(-0.25, 0.24, 0.21));
  const screenBasePosition = useRef(screenlaptop.position.clone());
  const screenBaseRotation = useRef(screenlaptop.quaternion.clone());
  const lidBasePosition = useRef(laptoptop.position.clone());
  const lidBaseRotation = useRef(laptoptop.quaternion.clone());
//настройка позиции и вращения
//настройка анимации крышки и камеры в зависимости от скролла (за векторы отвечал ии)
  useFrame((_, delta) => {
    lidProgress.current = MathUtils.damp(lidProgress.current, lidTarget.current, 4, delta);
    const lidAngle = MathUtils.lerp(LID_INITIAL_ANGLE, Math.PI / 2, lidProgress.current);
    lidRotation.current.setFromAxisAngle(LID_HINGE_AXIS, lidAngle);
    if (screenlaptop && laptoptop) {
      screenlaptop.position.copy(screenBasePosition.current).sub(LID_HINGE_POSITION).applyQuaternion(lidRotation.current).add(LID_HINGE_POSITION).add(LID_BACK_OFFSET).add(SCREEN_FORWARD_OFFSET);
      screenlaptop.quaternion.copy(lidRotation.current).multiply(screenBaseRotation.current).multiply(SCREEN_ROTATION_OFFSET);
      laptoptop.position.copy(lidBasePosition.current).sub(LID_HINGE_POSITION).applyQuaternion(lidRotation.current).add(LID_HINGE_POSITION).add(LID_BACK_OFFSET);
      laptoptop.quaternion.copy(lidRotation.current).multiply(lidBaseRotation.current);
    }

    zoomProgress.current = MathUtils.damp(zoomProgress.current, zoomTarget.current, 3, delta);
    const reachedCameraEnd = zoomProgress.current >= 0.995;
    if (reachedCameraEnd !== cameraAtEnd.current) {
      cameraAtEnd.current = reachedCameraEnd;
      onCameraEndChange(reachedCameraEnd);
    }
    camera.position.lerpVectors(cameraStart.current, cameraEnd.current, zoomProgress.current);
    cameraLookTarget.current.set(0, 0, 0).lerp(screenFocus.current, zoomProgress.current);
    camera.lookAt(cameraLookTarget.current);
    const turnProgress = MathUtils.smoothstep(zoomProgress.current, 0.82, 1);
    camera.rotateY(-0.2 * turnProgress);
  });
  //настройка анимации крышки и камеры в зависимости от скролла (за векторы отвечал ии)
//начальная позиция 
  useEffect(() => {
    laptopbottom?.scale.set(3, 3, 3);
    screenlaptop?.scale.set(3, 3, 3);
    laptoptop?.scale.set(3, 3, 3);

    if (screenlaptop?.material) {
      const makeBlackMaterial = (material) => {
        const blackMaterial = material.clone();
        blackMaterial.color?.set('#000000');
        return blackMaterial;
      };

      screenlaptop.material = Array.isArray(screenlaptop.material)
        ? screenlaptop.material.map(makeBlackMaterial)
        : makeBlackMaterial(screenlaptop.material);
    }

    if (screenlaptop && laptoptop) {
      screenlaptop.geometry.computeBoundingBox();
      laptoptop.geometry.computeBoundingBox();
      const screenCenter = screenlaptop.geometry.boundingBox.getCenter(new Vector3()).multiply(screenlaptop.scale);
      const lidCenter = laptoptop.geometry.boundingBox.getCenter(new Vector3()).multiply(laptoptop.scale);
      screenBaseRotation.current.copy(lidBaseRotation.current);
      screenBasePosition.current.copy(lidBasePosition.current)
        .add(lidCenter.applyQuaternion(lidBaseRotation.current))
        .sub(screenCenter.applyQuaternion(lidBaseRotation.current));
    }

    //  Обработчик вращения колесика мыши
    const handleWheel = (e) => {
      const stackContent = document.querySelector('[data-stack-scroll]');
      if (
        zoomProgress.current >= 0.995 &&
        stackContent?.contains(e.target) &&
        (e.deltaY > 0 || stackContent.scrollTop > 0)
      ) {
        return;
      }

      // Блокируем реальную прокрутку страницы сайта вниз/вверх
      e.preventDefault();

      // Накапливаем значение скролла (e.deltaY выдает положительное число при скролле вниз)
      scrollAmount.current += e.deltaY;

      // Ограничиваем скролл, чтобы он не уходил в минус
      if (scrollAmount.current < 0) scrollAmount.current = 0;

      const isScrollActive = scrollAmount.current > 0;
      if (isScrollActive !== scrollActive.current) {
        scrollActive.current = isScrollActive;
        onIntroVisibilityChange(!isScrollActive);
      }

      lidTarget.current = MathUtils.clamp(scrollAmount.current / LID_SCROLL_DISTANCE, 0, 1);
      zoomTarget.current = MathUtils.clamp((scrollAmount.current - ZOOM_START) / ZOOM_DISTANCE, 0, 1);
    };

    //  слушатель 
    window.addEventListener('wheel', handleWheel, { passive: false });

    // Очищаем слушатель 
    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, [laptopbottom, onCameraEndChange, onIntroVisibilityChange, screenlaptop, laptoptop]);

  return (
    <group position={[0, -0.5, 0]} scale={[1, 1, 1]}>
      <primitive object={scene} />
    </group>
  );
}

export default function LaptopScene({ onCameraEndChange, onIntroVisibilityChange }) {
  return (
    <>
      <ambientLight color="#aab8e8" intensity={0.75} />
      <directionalLight position={[10, 10, 5]} color="#c4d8ff" intensity={1.1} />
      <LaptopModel
        onCameraEndChange={onCameraEndChange}
        onIntroVisibilityChange={onIntroVisibilityChange}
      />
      
    </>
  );
}
