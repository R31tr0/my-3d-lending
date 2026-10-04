import { useGLTF,Sky } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { AdditiveBlending, MathUtils, Quaternion, Vector3 } from 'three';
import { useEffect, useMemo, useRef } from 'react';

const ZOOM_START = 500;
const ZOOM_DISTANCE = 900;
const LID_SCROLL_DISTANCE = ZOOM_START + ZOOM_DISTANCE;
const LID_HINGE_POSITION = new Vector3(-0.077, 0.37, 0.2125);
const LID_HINGE_AXIS = new Vector3(0, 0, 1);
const LID_INITIAL_ANGLE = MathUtils.degToRad(5);
const LID_BACK_OFFSET = new Vector3(-0.2, 0, 0);
const SCREEN_ROTATION_OFFSET = new Quaternion().setFromAxisAngle(LID_HINGE_AXIS, MathUtils.degToRad(-7.5));
const SCREEN_FORWARD_OFFSET = new Vector3(0.01, 0.009, 0);

function createCloudMaterial(material, cloudUniforms) {
  const cloudMaterial = material.clone();
  cloudMaterial.transparent = true;
  cloudMaterial.depthWrite = false;
  cloudMaterial.opacity = 0.78;
  cloudMaterial.roughness = 0.9;
  cloudMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.uCloudTime = cloudUniforms.uTime;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying vec3 vCloudPosition;',
      )
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvCloudPosition = position;',
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uCloudTime;
        varying vec3 vCloudPosition;

        float cloudHash(vec3 p) {
          p = fract(p * 0.1031);
          p += dot(p, p.yxz + 33.33);
          return fract((p.x + p.y) * p.z);
        }

        float cloudNoise(vec3 p) {
          vec3 cell = floor(p);
          vec3 blend = fract(p);
          blend = blend * blend * (3.0 - 2.0 * blend);
          float a = mix(cloudHash(cell), cloudHash(cell + vec3(1.0, 0.0, 0.0)), blend.x);
          float b = mix(cloudHash(cell + vec3(0.0, 1.0, 0.0)), cloudHash(cell + vec3(1.0, 1.0, 0.0)), blend.x);
          float c = mix(cloudHash(cell + vec3(0.0, 0.0, 1.0)), cloudHash(cell + vec3(1.0, 0.0, 1.0)), blend.x);
          float d = mix(cloudHash(cell + vec3(0.0, 1.0, 1.0)), cloudHash(cell + vec3(1.0, 1.0, 1.0)), blend.x);
          return mix(mix(a, b, blend.y), mix(c, d, blend.y), blend.z);
        }

        float cloudFbm(vec3 p) {
          float value = 0.0;
          float amplitude = 0.5;
          for (int octave = 0; octave < 3; octave++) {
            value += cloudNoise(p) * amplitude;
            p *= 2.03;
            amplitude *= 0.5;
          }
          return value / 0.875;
        }`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        vec3 cloudPoint = vCloudPosition * 3.2
          + vec3(uCloudTime * 0.028, uCloudTime * 0.012, -uCloudTime * 0.02);
        float cloudBody = cloudFbm(cloudPoint);
        float cloudWisps = cloudFbm(cloudPoint * 2.4 + vec3(7.1, 2.4, 4.8));
        float cloudShape = cloudBody + (cloudWisps - 0.5) * 0.32;
        float cloudDensity = smoothstep(0.32, 0.68, cloudShape);
        float cloudOpacity = smoothstep(0.28, 0.72, cloudShape)
          * mix(0.24, 0.82, cloudDensity);
        float cloudScatter = smoothstep(0.34, 0.78, cloudShape)
          * (0.55 + cloudWisps * 0.45);
        float cloudRim = pow(
          1.0 - max(dot(normalize(normal), normalize(-vViewPosition)), 0.0),
          2.2
        );
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.56, 0.66, 0.84), 0.28);
        diffuseColor.rgb += vec3(0.12, 0.17, 0.27) * cloudScatter;
        diffuseColor.rgb += vec3(0.18, 0.23, 0.34) * cloudRim * cloudOpacity;
        diffuseColor.a *= cloudOpacity;`,
      );
  };
  cloudMaterial.customProgramCacheKey = () => 'soft-vapor-cloud-v1';

  return cloudMaterial;
}

function LaptopLightEffects({ zoomProgress }) {
  const glow = useRef(null);
  const keyLight = useRef(null);
  const fillLight = useRef(null);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uStrength: { value: 0 },
  }), []);

  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    const zoom = zoomProgress.current;
    const pulse = 0.82 + Math.sin(time * 1.4) * 0.08;
    const strength = pulse * (1 - zoom * 0.55);
    uniforms.uTime.value = time;
    uniforms.uStrength.value = strength;

    if (glow.current) {
      glow.current.position.x = -0.65 + Math.sin(time * 0.34) * 0.12;
    }

    if (keyLight.current) {
      keyLight.current.position.set(
        1.2 + Math.cos(time * 0.65) * 0.75,
        1.3 + Math.sin(time * 0.8) * 0.35,
        0.7 + Math.sin(time * 0.65) * 0.45,
      );
      keyLight.current.intensity = 12 * strength;
    }

    if (fillLight.current) {
      fillLight.current.position.set(
        -1.3 + Math.cos(time * 0.55 + Math.PI) * 0.55,
        0.4 + Math.sin(time * 0.7 + Math.PI) * 0.25,
        -0.8,
      );
      fillLight.current.intensity = 6 * strength;
    }
  });

  return (
    <>
      <mesh
        ref={glow}
        position={[-0.65, -0.2, 0.55]}
        rotation={[0, 1.89, 0]}
        renderOrder={-1}
      >
        <planeGeometry args={[7, 4.8]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
          uniforms={uniforms}
          vertexShader={`
            varying vec2 vUv;

            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform float uTime;
            uniform float uStrength;
            varying vec2 vUv;

            void main() {
              vec2 point = (vUv - 0.5) * 2.0;
              float radius = length(point * vec2(0.82, 1.0));
              float angle = atan(point.y, point.x);
              float aura = exp(-radius * radius * 2.1);
              float ring = exp(-pow((radius - 0.62) * 5.0, 2.0));
              float sweep = pow(max(0.0, cos(angle - uTime * 0.7)), 22.0)
                * exp(-pow((radius - 0.68) * 3.5, 2.0));
              float rays = pow(max(0.0, cos(angle * 5.0 + uTime * 0.3)), 34.0)
                * exp(-pow((radius - 0.78) * 4.0, 2.0));
              float strength = (aura * 0.09 + ring * 0.07 + sweep * 0.38 + rays * 0.14)
                * uStrength;
              vec3 lightColor = mix(
                vec3(0.22, 0.34, 0.62),
                vec3(0.48, 0.62, 0.88),
                smoothstep(0.1, 0.8, aura + sweep)
              );

              gl_FragColor = vec4(lightColor * strength, strength);
            }
          `}
        />
      </mesh>
      <pointLight
        ref={keyLight}
        color="#829bd6"
        intensity={0}
        distance={7}
        decay={2}
      />
      <pointLight
        ref={fillLight}
        color="#657ebc"
        intensity={0}
        distance={6}
        decay={2}
      />
    </>
  );
}

function LaptopModel({ onCameraEndChange, onIntroVisibilityChange }) {
  // Загружаем 3D-модель 
  const { scene } = useGLTF('/models/Laptop_project.glb');
  const sceneGroup = useRef(null);
  const laptopbottom = scene.getObjectByName('bottom_laptop');
  const screenlaptop = scene.getObjectByName('screen_laptop');
  const laptoptop = scene.getObjectByName('top_laptop');
  const cloudUniforms = useMemo(() => ({
    uTime: { value: 0 },
  }), []);

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
  useFrame(({ pointer, clock }, delta) => {
    cloudUniforms.uTime.value = clock.elapsedTime;

    if (sceneGroup.current) {
      sceneGroup.current.rotation.y = MathUtils.damp(
        sceneGroup.current.rotation.y,
        pointer.x * 0.1,
        2.5,
        delta,
      );
    }

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
    const cloudMeshes = [];
    laptopbottom?.scale.set(3, 3, 3);
    screenlaptop?.scale.set(3, 3, 3);
    laptoptop?.scale.set(3, 3, 3);

    scene.traverse((object) => {
      if (!object.isMesh || !/^Mball\.\d+$/.test(object.name)) return;

      const originalMaterial = object.material;
      const cloudMaterial = Array.isArray(originalMaterial)
        ? originalMaterial.map((material) => createCloudMaterial(material, cloudUniforms))
        : createCloudMaterial(originalMaterial, cloudUniforms);
      object.material = cloudMaterial;
      cloudMeshes.push({ object, originalMaterial, cloudMaterial });
    });

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
      cloudMeshes.forEach(({ object, originalMaterial, cloudMaterial }) => {
        object.material = originalMaterial;
        if (Array.isArray(cloudMaterial)) {
          cloudMaterial.forEach((material) => material.dispose());
        } else {
          cloudMaterial.dispose();
        }
      });
    };
  }, [cloudUniforms, laptopbottom, onCameraEndChange, onIntroVisibilityChange, scene, screenlaptop, laptoptop]);

  return (
    <group ref={sceneGroup} position={[0, -0.5, 0]} scale={[1, 1, 1]}>
      <LaptopLightEffects zoomProgress={zoomProgress} />
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
