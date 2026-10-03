import * as THREE from 'three';
import { useMemo } from 'react';

export const SKY = {
  top: '#050a18',
  mid: '#111b38',
  horizon: '#263454',
  bottom: '#0a1022',
  fog: '#18233b',
  keyLightDir: new THREE.Vector3(-0.8, 0.12, 0.35).normalize(),
};
const vertexShader = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    vec4 pos = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * pos;
  }
`;
//шейдеры (ии помогал с ними, но я их немного подправил, чтобы не было слишком ярко и контрастно)
const fragmentShader = /* glsl */ `
  uniform vec3 topColor;
  uniform vec3 midColor;
  uniform vec3 horizonColor;
  uniform vec3 bottomColor;
  varying vec3 vDir;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main() {
    vec3 dir = normalize(vDir);
    float h = dir.y;

    vec3 col = mix(bottomColor, horizonColor, smoothstep(-0.22, 0.04, h));
    col = mix(col, midColor, smoothstep(0.02, 0.38, h));
    col = mix(col, topColor, smoothstep(0.34, 0.88, h));

    vec2 starUv = vec2(atan(dir.z, dir.x) * 0.15915494, asin(clamp(h, -1.0, 1.0)) * 0.31830989) + 0.5;
    vec2 starGrid = starUv * vec2(340.0, 170.0);
    vec2 starCell = floor(starGrid);
    vec2 starOffset = fract(starGrid) - 0.5;
    float starSeed = hash21(starCell);
    vec2 starJitter = vec2(hash21(starCell + 13.7), hash21(starCell + 71.3)) - 0.5;
    float starDot = 1.0 - smoothstep(0.015, 0.085, length(starOffset - starJitter * 0.55));
    float stars = starDot * step(0.984, starSeed) * smoothstep(0.015, 0.25, h);
    float starTwinkle = 0.55 + hash21(starCell + 91.7) * 0.45;
    col += vec3(0.72, 0.81, 1.0) * stars * starTwinkle * 2.1;

    float brightStars = starDot * step(0.998, starSeed) * smoothstep(0.08, 0.38, h);
    col += vec3(0.86, 0.91, 1.0) * brightStars * 2.2;

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
//шейдеры (ии помогал с ними, но я их немного подправил, чтобы не было слишком ярко и контрастно)
export default function SkyDome() {
  const uniforms = useMemo(
    () => ({
      topColor: { value: new THREE.Color(SKY.top) },
      midColor: { value: new THREE.Color(SKY.mid) },
      horizonColor: { value: new THREE.Color(SKY.horizon) },
      bottomColor: { value: new THREE.Color(SKY.bottom) },
    }),
    []
  );

  return (
    <mesh scale={100} renderOrder={-1}>
      <sphereGeometry args={[1, 32, 32]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        fog={false}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  );
}