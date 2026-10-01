import { useGLTF, View } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box3, Vector3 } from 'three';
import { Suspense, useRef, useState } from 'react';
import './StackPage.css';

const technologies = [
  { name: 'React', category: 'UI', description: 'Интерфейсы и архитектура компонентов', modelUrl: '', modelRotation: [0, 0, 0] },
  { name: 'TypeScript', category: 'LANGUAGE', description: 'Типизация и более надёжный код', modelUrl: '', modelRotation: [0, 0, 0] },
  { name: 'JavaScript', category: 'LANGUAGE', description: 'Логика и интерактивность проектов', modelUrl: '', modelRotation: [0, 0, 0] },
  { name: 'Node.js', category: 'RUNTIME', description: 'Среда выполнения JavaScript', modelUrl: '', modelRotation: [0, 0, 0] },
  { name: 'Vite', category: 'BUILD', description: 'Сборка и быстрый цикл разработки', modelUrl: '', modelRotation: [0, 0, 0] },
  { name: 'Axios', category: 'HTTP', description: 'Запросы к API и работа с данными', modelUrl: '', modelRotation: [0, 0, 0] },
  { name: 'Zustand', category: 'STATE', description: 'Управление состоянием приложения', modelUrl: '', modelRotation: [0, 0, 0] },
  { name: 'Three.js', category: '3D', description: '3D-графика прямо в браузере', modelUrl: '', modelRotation: [0, 0, 0] },
];

function LoadedModel({ modelUrl, rotation }) {
  const { scene } = useGLTF(modelUrl);
  const [modelFit] = useState(() => {
    const modelScene = scene.clone(true);
    const bounds = new Box3().setFromObject(modelScene);
    const size = bounds.getSize(new Vector3());
    const center = bounds.getCenter(new Vector3());
    const scale = 1.5 / Math.max(size.x, size.y, size.z, 0.001);

    return {
      scene: modelScene,
      scale,
      position: [-center.x * scale, -center.y * scale, -center.z * scale],
    };
  });

  return (
    <group position={modelFit.position} scale={modelFit.scale} rotation={rotation}>
      <primitive object={modelFit.scene} />
    </group>
  );
}

function TechnologyModel({ modelUrl, modelRotation, scrollProgress }) {
  const model = useRef(null);

  useFrame(() => {
    if (!model.current) return;
    model.current.rotation.y = scrollProgress.current * Math.PI * 2;
    model.current.rotation.x = 0;
  });

  return (
    <>
      <ambientLight intensity={1.5} />
      <directionalLight position={[3, 4, 5]} intensity={2.2} />
      <group ref={model}>
        {modelUrl && (
          <Suspense fallback={null}>
            <LoadedModel modelUrl={modelUrl} rotation={modelRotation} />
          </Suspense>
        )}
      </group>
    </>
  );
}

export default function StackPage() {
  const scrollProgress = useRef(0);

  return (
    <main className="stack-page">
      <div
        className="stack-page__content"
        data-stack-scroll
        role="region"
        tabIndex={0}
        aria-label="Мой технологический стек"
        onScroll={(event) => {
          const content = event.currentTarget;
          const scrollRange = content.scrollHeight - content.clientHeight;
          scrollProgress.current = scrollRange > 0 ? content.scrollTop / scrollRange : 0;
        }}
      >
        <header className="stack-header">
         
          <h1>Мой стек<span>.</span></h1>
          <p className="stack-lead">Инструменты которые я использую в своих проектах.</p>
        </header>

        <ol className="stack-list">
          {technologies.map((technology, index) => (
            <li
              className="stack-item"
              key={technology.name}
              style={{ '--item-delay': `${220 + index * 200}ms` }}
            >
              <div className="stack-item__details">
               
                <h2>{technology.name}</h2>
                <p>{technology.description}</p>
                <span className="stack-item__category">{technology.category}</span>
              </div>
              <View className="stack-model-space" role="img" aria-label={`3D-модель для ${technology.name}`}>
                <TechnologyModel
                  modelUrl={technology.modelUrl}
                  modelRotation={technology.modelRotation}
                  scrollProgress={scrollProgress}
                />
              </View>
            </li>
          ))}
        </ol>

       
      </div>
      <Canvas
        className="stack-view-canvas"
        camera={{ position: [0, 0, 3.8], fov: 42 }}
        dpr={1}
        gl={{ alpha: true, antialias: true }}
      >
        <View.Port />
      </Canvas>
    </main>
  );
}