import { useGLTF, View } from '@react-three/drei';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Box3, DoubleSide, ExtrudeGeometry, Quaternion, Vector3 } from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import './StackPage.css';

const technologies = [
  { name: 'React', category: 'UI', description: 'Интерфейсы и архитектура компонентов', model: { type: 'gltf', src: '/models/react_logo_circle.glb', rotation: [0, 0, 0] } },
  { name: 'TypeScript', category: 'LANGUAGE', description: 'Типизация и более надёжный код', model: { type: 'gltf', src: '/models/ts-logo.glb', rotation: [0, 0, 0] } },
  { name: 'JavaScript', category: 'LANGUAGE', description: 'Логика и интерактивность проектов', model: { type: 'gltf', src: '/models/js-logo.glb', rotation: [0, Math.PI / -6, 0] } },
  { name: 'Node.js', category: 'RUNTIME', description: 'Среда выполнения JavaScript', model: { type: 'gltf', src: '/models/node.js_logo__3d_model.glb', rotation: [0, Math.PI, 0] } },
  { name: 'Vite', category: 'BUILD', description: 'Сборка и быстрый цикл разработки', model: { type: 'gltf', src: '/models/vitest-logo.glb', rotation: [0, 0, 0] } },
  { name: 'Axios', category: 'HTTP', description: 'Запросы к API и работа с данными', model: { type: 'svg', src: '/models/axios.svg' , rotation: [0, Math.PI, 0] } },
  { name: 'Zustand', category: 'STATE', description: 'Управление состоянием приложения', model: { type: 'svg', src: '/models/zustand.svg' } },
  { name: 'Three.js', category: '3D', description: '3D-графика прямо в браузере', model: { type: 'svg', src: '/models/threejs.svg', rotation: [0, 0, 0], color: '#f4f4ef' } },
];

const scrollbarColors = [
  '#59bcee',
  '#3978ff',
  '#ffd447',
  '#54c86a',
  '#f2cf42',
  '#8b5cf6',
  '#c8a878',
  '#f4f4ef',
];

// Загружает GLTF-модель и подгоняет её размер и положение под карточку технологии.
function LoadedModel({ modelUrl, rotation }) {
  const { scene } = useGLTF(modelUrl);
  // Создаёт копию и нормализует её, не изменяя исходную сцену из кэша.
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
// Преобразует залитые контуры SVG в центрированные и объединённые 3D-меши.
function SvgLogoModel({ src, rotation, color: colorOverride }) {
  const svg = useLoader(SVGLoader, src);
  // Пересобирает геометрию только при изменении загруженного SVG.
  const model = useMemo(() => {
    const geometriesByColor = new Map();

    // Создаёт объём для каждого залитого контура и группирует его по цвету.
    svg.paths.forEach((path, pathIndex) => {
      const fill = path.userData.style.fill;
      if (!fill || fill === 'none') return;

      for (const shape of SVGLoader.createShapes(path)) {
        const geometry = new ExtrudeGeometry(shape, {
          depth: 7,
          bevelEnabled: false,
          steps: 1,
          curveSegments: 6,
        });
        geometry.translate(0, 0, pathIndex * 0.04);
        const geometries = geometriesByColor.get(fill) ?? [];
        geometries.push(geometry);
        geometriesByColor.set(fill, geometries);
      }
    });

    // Объединяет контуры одного цвета, чтобы сократить количество мешей.
    const entries = [...geometriesByColor].map(([fill, geometries]) => {
      const geometry = mergeGeometries(geometries);
      // Освобождает исходную геометрию после объединения.
      geometries.forEach((sourceGeometry) => sourceGeometry.dispose());
      return { color: colorOverride ?? fill, geometry };
    });

    const bounds = new Box3();
    for (const { geometry } of entries) {
      if (!geometry) continue;
      geometry.computeBoundingBox();
      if (!geometry.boundingBox) continue;
      bounds.expandByPoint(geometry.boundingBox.min);
      bounds.expandByPoint(geometry.boundingBox.max);
    }

    const size = bounds.getSize(new Vector3());
    const center = bounds.getCenter(new Vector3());
    const scale = 1.5 / Math.max(size.x, size.y, size.z, 0.001);

    return { entries, center, scale };
  }, [svg]);

  return (
    <group rotation={rotation}>
      <group
        scale={[model.scale, -model.scale, model.scale]}
        position={[-model.center.x * model.scale, model.center.y * model.scale, -model.center.z * model.scale]}
      >
        {model.entries.map(/* Создаёт меш для каждой объединённой группы цвета. */ ({ color, geometry }) => (
          <mesh key={color} geometry={geometry} castShadow receiveShadow>
            <meshStandardMaterial color={color} side={DoubleSide} metalness={0.2} roughness={0.32} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// Показывает модель из конфигурации и вращает её вслед за прокруткой стека.
function TechnologyModel({ modelConfig, scrollProgress }) {
  const model = useRef(null);

  // Обновляет вращение модели без React-перерисовки каждый кадр.
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
        {modelConfig?.type === 'gltf' && (
          <Suspense fallback={null}>
            <LoadedModel modelUrl={modelConfig.src} rotation={modelConfig.rotation} />
          </Suspense>
        )}
        {modelConfig?.type === 'svg' && (
          <Suspense fallback={null}>
            <SvgLogoModel
              src={modelConfig.src}
              rotation={modelConfig.rotation}
              color={modelConfig.color}
            />
          </Suspense>
        )}
      </group>
    </>
  );
}

// Создаёт сцену модели, когда карточка приближается к видимой области.
function TechnologyModelView({ name, modelConfig, scrollProgress }) {
  const view = useRef(null);
  const [shouldRenderModel, setShouldRenderModel] = useState(false);

  // Следит за карточкой и отключает наблюдение после первого появления.
  useEffect(() => {
    const element = view.current;
    if (!element) return undefined;

    const observer = new IntersectionObserver(
      // Запускает отложенный рендеринг, когда область модели входит в viewport.
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShouldRenderModel(true);
        observer.disconnect();
      },
      {
        root: element.closest('[data-stack-scroll]'),
        rootMargin: '240px 0px',
      },
    );

    observer.observe(element);
    // Отключает наблюдатель, если компонент размонтирован.
    return () => observer.disconnect();
  }, []);

  return (
    <View
      ref={view}
      className="stack-model-space"
      role="img"
      aria-label={`3D-модель для ${name}`}
    >
      {shouldRenderModel && (
        <TechnologyModel
          modelConfig={modelConfig}
          scrollProgress={scrollProgress}
        />
      )}
    </View>
  );
}

// Ограничивает прогресс диапазоном и сглаживает его кубической кривой.
function smoothStep(start, end, value) {
  const progress = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return progress * progress * (3 - 2 * progress);
}

// Анимирует падение, приземление и перекат монеты GitHub в финальной сцене.
function EndingScene({ progress }) {
  const { scene: coinAsset } = useGLTF('/models/github.glb');
  const coin = useRef(null);
  // Создаёт оси вращения и кватернионы, используемые анимацией монеты.
  const coinRotation = useMemo(() => ({
    tumbleAxis: new Vector3(1, 0.8, 0.55).normalize(),
    tiltAxis: new Vector3(0.65, 0, 1).normalize(),
    rollAxis: new Vector3(0, 0, 1),
    tumble: new Quaternion(),
    tilt: new Quaternion(),
    roll: new Quaternion(),
  }), []);

  // Один раз центрирует и масштабирует загруженную модель монеты.
  const coinModel = useMemo(() => {
    const scene = coinAsset.clone(true);
    const bounds = new Box3().setFromObject(scene);
    const size = bounds.getSize(new Vector3());
    const center = bounds.getCenter(new Vector3());

    return {
      scene,
      scale: 1.15 / Math.max(size.x, size.y, size.z, 0.001),
      position: [-center.x, -center.y, -center.z],
    };
  }, [coinAsset]);

  // Вычисляет положение и вращение монеты по прогрессу прокрутки.
  useFrame(() => {
    const value = progress.current;
    const fall = smoothStep(0, 0.38, value);
    const landing = smoothStep(0.32, 0.44, value);
    const roll = smoothStep(0.48, 0.66, value);

    if (coin.current) {
      const settlingBounce = Math.sin(landing * Math.PI) * 0.07;
      const tumble = fall * Math.PI * 2;
      const edgeTilt = Math.sin(fall * Math.PI) * 0.35;

      coin.current.position.set(
        1.2 * (1 - fall) - roll * 1.9,
        1.35 - fall * 1.95 + settlingBounce + Math.sin(roll * Math.PI * 2) * 0.035,
        0.2,
      );
      coinRotation.tumble.setFromAxisAngle(coinRotation.tumbleAxis, tumble);
      coinRotation.tilt.setFromAxisAngle(coinRotation.tiltAxis, edgeTilt);
      coinRotation.roll.setFromAxisAngle(coinRotation.rollAxis, roll * Math.PI * 2);
      coin.current.quaternion
        .copy(coinRotation.tumble)
        .multiply(coinRotation.tilt)
        .multiply(coinRotation.roll);
    }
  });

  return (
    <>
      <ambientLight intensity={1.8} />
      <directionalLight position={[2, 4, 5]} intensity={2.5} />
      <group ref={coin}>
        <group
          scale={coinModel.scale}
          position={[
            coinModel.position[0] * coinModel.scale,
            coinModel.position[1] * coinModel.scale,
            coinModel.position[2] * coinModel.scale,
          ]}
        >
          <primitive object={coinModel.scene} />
        </group>
      </group>
    </>
  );
}

// Откладывает загрузку сцены монеты до приближения финального блока.
function EndingSceneView({ progress }) {
  const view = useRef(null);
  const [shouldRenderScene, setShouldRenderScene] = useState(false);

  // Включает сцену при приближении и отключает наблюдение после первого входа.
  useEffect(() => {
    const element = view.current;
    if (!element) return undefined;

    const observer = new IntersectionObserver(
      // Начинает загружать монету только при появлении её области.
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShouldRenderScene(true);
        observer.disconnect();
      },
      {
        root: element.closest('[data-stack-scroll]'),
        rootMargin: '240px 0px',
      },
    );

    observer.observe(element);
    // Отключает наблюдатель при удалении финальной сцены.
    return () => observer.disconnect();
  }, []);

  return (
    <View
      ref={view}
      className="stack-ending__view"
      role="img"
      aria-label="Падающая и вращающаяся 3D-монета с логотипом GitHub"
    >
      {shouldRenderScene && (
        <Suspense fallback={null}>
          <EndingScene progress={progress} />
        </Suspense>
      )}
    </View>
  );
}

// Отображает стек технологий и финальные карточки, переключаемые прокруткой.
export default function StackPage() {
  const scrollProgress = useRef(0);
  const endingProgress = useRef(0);

  return (
    <main className="stack-page" data-ending-step="-1">
      <div
        className="stack-page__content"
        data-stack-scroll
        role="region"
        tabIndex={0}
        aria-label="Мой технологический стек"
        onScroll={/* Обновляет вращение моделей, финальные карточки и цвет полосы прокрутки. */ (event) => {
          const content = event.currentTarget;
          const scrollRange = content.scrollHeight - content.clientHeight;
          scrollProgress.current = scrollRange > 0 ? content.scrollTop / scrollRange : 0;
          const endingTrack = content.querySelector('.stack-ending-track');
          const contentTop = content.getBoundingClientRect().top;
          const trackTop = endingTrack
            ? endingTrack.getBoundingClientRect().top - contentTop
            : content.clientHeight;
          endingProgress.current = Math.max(
            0,
            Math.min(
              1,
              -trackTop / Math.max(1, (endingTrack?.offsetHeight ?? content.clientHeight) - content.clientHeight),
            ),
          );
          const stackPage = content.closest('.stack-page');
          stackPage?.style.setProperty('--ending-progress', endingProgress.current);
          stackPage?.style.setProperty(
            '--ending-percent',
            `${endingProgress.current * 100}%`,
          );
          stackPage?.style.setProperty(
            '--experience-opacity',
            smoothStep(0.66, 0.72, endingProgress.current)
              * (1 - smoothStep(0.8, 0.86, endingProgress.current)),
          );
          stackPage?.style.setProperty(
            '--development-opacity',
            smoothStep(0.8, 0.86, endingProgress.current)
              * (1 - smoothStep(0.92, 0.97, endingProgress.current)),
          );
          stackPage?.style.setProperty(
            '--contact-opacity',
            smoothStep(0.92, 0.97, endingProgress.current),
          );
          const activeEndingStep = endingProgress.current < 0.72
            ? -1
            : endingProgress.current < 0.83
              ? 0
              : endingProgress.current < 0.945
                ? 1
                : 2;
          stackPage?.setAttribute(
            'data-ending-step',
            String(activeEndingStep),
          );
          // Оставляет доступной с клавиатуры только активную финальную карточку.
          content.querySelectorAll('[data-ending-panel]').forEach((panel) => {
            panel.inert = Number(panel.dataset.endingPanel) !== activeEndingStep;
          });

          const activePoint = content.getBoundingClientRect().top + content.clientHeight * 0.35;
          const stackItems = [...content.querySelectorAll('.stack-item')];
          const activeIndex = stackItems.findIndex(
            /* Находит первую карточку, дошедшую до контрольной точки прокрутки. */
            (item) => item.getBoundingClientRect().bottom > activePoint,
          );
          const colorIndex = activeIndex === -1 ? scrollbarColors.length - 1 : activeIndex;
          content.style.setProperty(
            '--stack-scrollbar-accent',
            scrollbarColors[colorIndex % scrollbarColors.length],
          );
        }}
      >
        <header className="stack-header">
         
          <h1>Мой стек<span>.</span></h1>
          <p className="stack-lead">Инструменты которые я использую в своих проектах.</p>
        </header>

        <ol className="stack-list">
          {technologies.map(/* Создаёт карточку и 3D-модель каждой технологии. */ (technology, index) => (
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
              <TechnologyModelView
                name={technology.name}
                modelConfig={technology.model}
                scrollProgress={scrollProgress}
              />
            </li>
          ))}
        </ol>

        <div className="stack-ending-track">
          <section className="stack-ending" aria-label="Обо мне">
            <EndingSceneView progress={endingProgress} />
            <div className="stack-ending__panels">
              <article
                className="stack-ending__panel stack-ending__panel--experience"
                data-ending-panel="0"
                inert
              >
                <div className="stack-ending__card">
                  <span className="stack-ending__eyebrow">МОЙ ОПЫТ</span>
                  <h2>1 год 4 месяца</h2>
                  <p>Фриланс и проектная разработка.</p>
                </div>
              </article>
              <article
                className="stack-ending__panel stack-ending__panel--development"
                data-ending-panel="1"
                inert
              >
                <div className="stack-ending__card">
                  <span className="stack-ending__eyebrow">ЧЕМ ЗАНИМАЮСЬ</span>
                  <h2>Что я разрабатываю</h2>
                  <p>
                    Создаю современные веб-интерфейсы и приложения, имею опыт интеграции с сложными бекендами.
                     Открыт к новым идеям и
                    интересным задачам.<br></br><br></br>
                    мой проекты можете посмотреть на моем гитхаб 
                  </p>
                </div>
              </article>
              <article
                className="stack-ending__panel stack-ending__panel--contact"
                data-ending-panel="2"
                inert
              >
                <div className="stack-ending__card">
                  <span className="stack-ending__eyebrow">LET'S CONNECT</span>
                  <h2>Где меня найти</h2>
                  <p>
                    На GitHub - мои проекты и эксперименты. Открыт к сотрудничеству,
                    новым идеям и интересным проектам.
                  </p>
                  <a href="https://github.com/R31tr0" target="_blank" rel="noreferrer">
                    GitHub <span aria-hidden="true">↗</span>
                  </a>
                  <a href="https://t.me/idcamselff" target="_blank" rel="noreferrer">
                    Telegram <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </article>
            </div>
          </section>
        </div>
        <footer className="stack-footer">
          <span>© R31tr0 </span>
          <a
            href="https://github.com/R31tr0/my-3d-lending#readme"
            target="_blank"
            rel="noreferrer"
          >
            Credits и информация о проекте <span aria-hidden="true">↗</span>
          </a>
        </footer>
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