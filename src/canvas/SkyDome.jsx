import * as THREE from 'three';
import { useMemo } from 'react';

export const SKY = {
  top: '#0b3d91',
  mid: '#2f86d6',
  horizon: '#60b2ed',   
  bottom: '#266bb0',    
  fog: '#477ba3',       // цвет тумана, чуть светлее низа, чтобы дальние облака не серели
  sunDir: new THREE.Vector3(-0.8, 0.28, 0.35).normalize(),
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
  uniform vec3 sunDir;
  varying vec3 vDir;

  void main() {
    vec3 dir = normalize(vDir);
    float h = dir.y;

    
    vec3 col = mix(horizonColor, midColor, smoothstep(0.0, 0.25, h));
    col = mix(col, topColor, smoothstep(0.15, 0.85, h));

   
    col = mix(col, horizonColor, smoothstep(0.0, -0.2, h));

   
    float s = max(dot(dir, normalize(sunDir)), 0.0);
    vec3 sunCol = vec3(1.0, 0.85, 0.6);
    col += sunCol * (pow(s, 8.0) * 0.18 + pow(s, 64.0) * 0.5 + pow(s, 1200.0) * 3.0);

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
      sunDir: { value: SKY.sunDir },
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