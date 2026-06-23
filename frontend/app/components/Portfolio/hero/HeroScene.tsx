"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Stars, Sparkles, Environment } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

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

// --------------- Chess King ---------------

function ChessKing() {
  const groupRef = useRef<THREE.Group>(null!);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const { latheGeo, crossGeoVert, crossGeoHoriz, material } = useMemo(() => {
    // Generate smooth profile points for the King lathe geometry
    const points: THREE.Vector2[] = [];
    const addPt = (x: number, y: number) => {
      points.push(new THREE.Vector2(x, y));
    };

    // King profile (highly detailed and smooth curve subdivisions)
    addPt(0, 0);
    addPt(0.9, 0);
    addPt(0.9, 0.15);
    addPt(0.82, 0.22);
    addPt(0.68, 0.25);
    
    // Tapered pedestal (concave curve)
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      const y = 0.25 + t * 0.25;
      const x = 0.68 - Math.sin(t * Math.PI / 2) * 0.13;
      addPt(x, y);
    }

    // Collar (rounded torus shape)
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      const angle = (t - 0.5) * Math.PI; // -pi/2 to pi/2
      const y = 0.6 + Math.sin(angle) * 0.1;
      const x = 0.6 + Math.cos(angle) * 0.1;
      addPt(x, y);
    }
    addPt(0.5, 0.7);

    // Main shaft (straight tapered line)
    for (let i = 1; i <= 8; i++) {
      const t = i / 8;
      const y = 0.7 + t * 0.9;
      const x = 0.5 - t * 0.2;
      addPt(x, y);
    }

    // Neck ring / Head base (torus-like ring)
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      const angle = (t - 0.5) * Math.PI;
      const y = 1.7 + Math.sin(angle) * 0.08;
      const x = 0.36 + Math.cos(angle) * 0.06;
      addPt(x, y);
    }

    // Head/Crown body (flared bulbous shape)
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const y = 1.8 + t * 0.7;
      const x = 0.3 + Math.sin(t * Math.PI) * 0.23 - t * 0.04 + (t > 0.5 ? (t-0.5)*0.08 : 0);
      addPt(x, y);
    }

    // Crown top (flares out at the top rim)
    for (let i = 1; i <= 6; i++) {
      const t = i / 6;
      const y = 2.5 + t * 0.3;
      const x = 0.4 + t * 0.25;
      addPt(x, y);
    }
    
    // Top surface closing
    addPt(0, 2.8);

    // Lathe geometry with high segment count for ultra-smooth circular rendering
    const latheGeo = new THREE.LatheGeometry(points, 128);
    
    // Cross geometries for the top
    const crossGeoVert = new THREE.BoxGeometry(0.12, 0.45, 0.12);
    const crossGeoHoriz = new THREE.BoxGeometry(0.32, 0.12, 0.12);

    // Premium matte ivory/bone material with zero metallic reflection (smooth wooden/plastic look)
    const material = new THREE.MeshStandardMaterial({
      color: "#faf6e8",
      metalness: 0.0,
      roughness: 0.65,
    });

    return { latheGeo, crossGeoVert, crossGeoHoriz, material };
  }, []);

  useFrame(({ clock, mouse }) => {
    const t = clock.getElapsedTime();
    // Smooth idle floating and rotation
    groupRef.current.rotation.y = t * 0.25 + mouse.x * 0.42;
    groupRef.current.rotation.x = Math.sin(t * 0.4) * 0.08 + mouse.y * 0.18;
    groupRef.current.position.x = isMobile ? 0 : 1.15;
    groupRef.current.position.y = -1.4; // Keep it centered vertically
  });

  return (
    <Float speed={1.2} floatIntensity={0.6} rotationIntensity={0.1}>
      <Group ref={groupRef}>
        <Mesh geometry={latheGeo} material={material} castShadow receiveShadow />
        {/* Cross on top */}
        <Group position={[0, 2.9, 0]}>
          <Mesh geometry={crossGeoVert} material={material} castShadow />
          <Mesh position={[0, 0.08, 0]} geometry={crossGeoHoriz} material={material} castShadow />
        </Group>
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
        <ChessKing />
        <Particles />
        <Environment preset="city" background={false} />
      </Suspense>
    </Canvas>
  );
}
