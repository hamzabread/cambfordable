"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Stars, Sparkles, Environment } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const SIDE = 0.44;
const STEP = SIDE + 0.026;
const Group = "group" as any;
const Mesh = "mesh" as any;
const Points = "points" as any;
const BufferGeometry = "bufferGeometry" as any;
const BufferAttribute = "bufferAttribute" as any;
const PointsMaterial = "pointsMaterial" as any;
const Color = "color" as any;
const Fog = "fog" as any;
const AmbientLight = "ambientLight" as any;
const DirectionalLight = "directionalLight" as any;
const PointLight = "pointLight" as any;

// --------------- Rubik's Cube ---------------

function RubiksCube() {
  const groupRef = useRef<THREE.Group>(null!);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const { geo, cubies } = useMemo(() => {
    const geo = new THREE.BoxGeometry(SIDE, SIDE, SIDE);

    const mk = (color: string, rough = 0.08) =>
      new THREE.MeshStandardMaterial({ color, metalness: 0.18, roughness: rough });

    const M = {
      r: mk("#FF6B1A"),       // +X  right  = orange
      l: mk("#E8282E"),       // -X  left   = red
      t: mk("#EDE7DB"),       // +Y  top    = cream/white
      b: mk("#F5C518"),       // -Y  bottom = yellow
      f: mk("#1B5BBE"),       // +Z  front  = blue
      k: mk("#1EA851"),       // -Z  back   = green
      i: mk("#0c0916", 0.95), //    inner  = dark
    };

    const cubies: { pos: [number, number, number]; mats: THREE.MeshStandardMaterial[] }[] = [];

    for (let gx = -1; gx <= 1; gx++) {
      for (let gy = -1; gy <= 1; gy++) {
        for (let gz = -1; gz <= 1; gz++) {
          cubies.push({
            pos: [gx * STEP, gy * STEP, gz * STEP],
            mats: [
              gx === 1  ? M.r : M.i,
              gx === -1 ? M.l : M.i,
              gy === 1  ? M.t : M.i,
              gy === -1 ? M.b : M.i,
              gz === 1  ? M.f : M.i,
              gz === -1 ? M.k : M.i,
            ],
          });
        }
      }
    }

    return { geo, cubies };
  }, []);

  useFrame(({ clock, mouse }) => {
    const t = clock.getElapsedTime();
    groupRef.current.rotation.x = t * 0.14 + mouse.y * 0.22;
    groupRef.current.rotation.y = t * 0.20 + mouse.x * 0.36;
    groupRef.current.position.x = isMobile ? 0 : 1.15;
  });

  return (
    <Float speed={1.3} floatIntensity={0.55} rotationIntensity={0}>
      <Group ref={groupRef}>
        {cubies.map(({ pos, mats }, i) => (
          <Mesh key={i} position={pos} geometry={geo} material={mats} castShadow />
        ))}
      </Group>
    </Float>
  );
}

// --------------- Particles ---------------

function Particles({ count = 450 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null!);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 7 + Math.random() * 8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count]);

  useFrame(({ clock }) => {
    ref.current.rotation.y = clock.getElapsedTime() * 0.025;
    ref.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.08) * 0.1;
  });

  return (
    <Points ref={ref}>
      <BufferGeometry>
        <BufferAttribute attach="attributes-position" args={[positions, 3]} />
      </BufferGeometry>
      <PointsMaterial
        size={0.032}
        color="#c4b5fd"
        sizeAttenuation
        transparent
        opacity={0.75}
        depthWrite={false}
      />
    </Points>
  );
}

// --------------- Scene ---------------

export default function HeroScene() {
  return (
    <Canvas
      dpr={[1, 1.6]}
      camera={{ position: [0, 0, 5.6], fov: 44 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <Color attach="background" args={["#0c0916"]} />
      <Fog attach="fog" args={["#0c0916", 12, 24]} />

      <AmbientLight intensity={0.55} />
      <DirectionalLight position={[6, 7, 5]} intensity={1.1} color="#fff5e8" />
      <PointLight position={[-4, 2, 3]} intensity={1.4} color="#9d7ff5" />
      <PointLight position={[4, -3, 2]} intensity={0.9} color="#5de6cb" />
      <PointLight position={[0, 4, -4]} intensity={0.6} color="#ffb3c3" />

      <Suspense fallback={null}>
        <Stars radius={60} depth={28} count={2000} factor={3} saturation={0.3} fade speed={0.45} />
        <Sparkles count={55} scale={[9, 7, 7]} size={1.4} speed={0.25} color="#bf8fff" />
        <RubiksCube />
        <Particles />
        <Environment preset="city" background={false} />
      </Suspense>
    </Canvas>
  );
}
