"use client";

import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Satellite node in 3D space
interface SatelliteNode {
  radius: number;
  speed: number;
  angle: number;
  height: number;
  size: number;
  color: string;
}

function ReactiveHeroScene() {
  const coreRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);
  const satellitesGroupRef = useRef<THREE.Group>(null);

  // Satellites orbiting around the core
  const satellites = useMemo<SatelliteNode[]>(
    () => [
      { radius: 3.2, speed: 0.9, angle: 0, height: 0.4, size: 0.35, color: "#ec4899" }, // Viral Pink (YouTube)
      { radius: 4.1, speed: -0.7, angle: 1.8, height: -0.6, size: 0.32, color: "#14b8a6" }, // Teal (Sync)
      { radius: 2.8, speed: 1.2, angle: 3.4, height: 0.9, size: 0.28, color: "#f59e0b" }, // Amber (Prize)
      { radius: 4.8, speed: -0.5, angle: 4.9, height: -0.2, size: 0.4, color: "#a855f7" }, // Purple (Talent)
      { radius: 3.6, speed: 0.8, angle: 2.6, height: -1.1, size: 0.3, color: "#3b82f6" }, // Blue (Security)
    ],
    []
  );

  // Particles field in 3D background
  const particles = useMemo(() => {
    const coords = new Float32Array(150 * 3);
    for (let i = 0; i < 150 * 3; i += 3) {
      coords[i] = (Math.random() - 0.5) * 22;
      coords[i + 1] = (Math.random() - 0.5) * 14;
      coords[i + 2] = (Math.random() - 0.5) * 16 - 3;
    }
    return coords;
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const px = state.pointer.x;
    const py = state.pointer.y;

    // 1. Dynamic Camera Parallax: moves seamlessly with every single sub-pixel cursor move
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, px * 2.8, 0.08);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, py * 1.8, 0.08);
    state.camera.lookAt(0, 0, 0);

    // 2. Cursor PointLight moves directly in 3D space
    if (pointLightRef.current) {
      pointLightRef.current.position.x = THREE.MathUtils.lerp(
        pointLightRef.current.position.x,
        px * 8,
        0.15
      );
      pointLightRef.current.position.y = THREE.MathUtils.lerp(
        pointLightRef.current.position.y,
        py * 5,
        0.15
      );
      pointLightRef.current.position.z = 3.5;
    }

    // 3. Central Core Gyro Reaction
    if (coreRef.current) {
      // Natural slow spin plus dynamic tilt tracking cursor orientation
      const targetRotX = -py * 0.8 + Math.sin(t * 0.5) * 0.1;
      const targetRotY = px * 1.2 + t * 0.2;
      coreRef.current.rotation.x = THREE.MathUtils.lerp(coreRef.current.rotation.x, targetRotX, 0.08);
      coreRef.current.rotation.y = THREE.MathUtils.lerp(coreRef.current.rotation.y, targetRotY, 0.08);
      coreRef.current.position.y = Math.sin(t * 1.2) * 0.15;
    }

    // 4. Nested Gyro Rings tilt and rotate
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = t * 0.6;
      ring1Ref.current.rotation.x = THREE.MathUtils.lerp(
        ring1Ref.current.rotation.x,
        py * 1.1 + Math.PI / 4,
        0.06
      );
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y = -t * 0.7;
      ring2Ref.current.rotation.z = THREE.MathUtils.lerp(
        ring2Ref.current.rotation.z,
        px * 1.1,
        0.06
      );
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.x = t * 0.4;
      ring3Ref.current.rotation.y = THREE.MathUtils.lerp(
        ring3Ref.current.rotation.y,
        -px * 0.9,
        0.06
      );
    }

    // 5. Orbiting Satellites group
    if (satellitesGroupRef.current) {
      satellitesGroupRef.current.children.forEach((child, idx) => {
        const sat = satellites[idx];
        if (!sat) return;
        const currentAngle = sat.angle + t * sat.speed * 0.6;
        child.position.x = Math.cos(currentAngle) * sat.radius;
        child.position.z = Math.sin(currentAngle) * sat.radius;
        child.position.y = sat.height + Math.sin(t * 2 + idx) * 0.2;

        child.rotation.x += 0.02;
        child.rotation.y += 0.03;
      });
    }
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 15, 8]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[-10, -10, -5]} intensity={0.8} color="#ec4899" />

      {/* Reactive cursor spotlight casting specular reflections across 3D facets */}
      <pointLight
        ref={pointLightRef}
        intensity={4.5}
        distance={20}
        color="#14b8a6"
        decay={2}
      />

      {/* 3D Background Dust Particles */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particles, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          color="#a855f7"
          transparent
          opacity={0.5}
          sizeAttenuation
        />
      </points>

      {/* Central Holographic Core Group */}
      <group ref={coreRef}>
        {/* Inner Glowing Crystal Core */}
        <mesh>
          <octahedronGeometry args={[1.5, 0]} />
          <meshStandardMaterial
            color="#ec4899"
            emissive="#ec4899"
            emissiveIntensity={0.65}
            metalness={0.9}
            roughness={0.15}
            wireframe={false}
          />
        </mesh>

        {/* Outer Faceted Hologram Cage */}
        <mesh>
          <icosahedronGeometry args={[2.0, 1]} />
          <meshStandardMaterial
            color="#14b8a6"
            emissive="#14b8a6"
            emissiveIntensity={0.8}
            wireframe
            transparent
            opacity={0.4}
          />
        </mesh>

        {/* Gyro Ring 1 */}
        <mesh ref={ring1Ref}>
          <torusGeometry args={[2.6, 0.05, 16, 100]} />
          <meshStandardMaterial
            color="#ec4899"
            emissive="#ec4899"
            emissiveIntensity={1.1}
            wireframe
          />
        </mesh>

        {/* Gyro Ring 2 */}
        <mesh ref={ring2Ref} rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[3.0, 0.04, 16, 100]} />
          <meshStandardMaterial
            color="#14b8a6"
            emissive="#14b8a6"
            emissiveIntensity={0.9}
            wireframe
          />
        </mesh>

        {/* Gyro Ring 3 */}
        <mesh ref={ring3Ref} rotation={[0, Math.PI / 4, Math.PI / 6]}>
          <torusGeometry args={[3.4, 0.035, 16, 100]} />
          <meshStandardMaterial
            color="#f59e0b"
            emissive="#f59e0b"
            emissiveIntensity={0.8}
            wireframe
          />
        </mesh>
      </group>

      {/* Orbiting Satellites Group */}
      <group ref={satellitesGroupRef}>
        {satellites.map((sat, i) => (
          <mesh key={i}>
            {i % 2 === 0 ? (
              <dodecahedronGeometry args={[sat.size, 0]} />
            ) : (
              <octahedronGeometry args={[sat.size, 0]} />
            )}
            <meshStandardMaterial
              color={sat.color}
              emissive={sat.color}
              emissiveIntensity={0.9}
              metalness={0.85}
              roughness={0.2}
            />
          </mesh>
        ))}
      </group>
    </>
  );
}

interface ThreeDHeroProps {
  className?: string;
}

export default function ThreeDHero({ className }: ThreeDHeroProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={className || "w-full h-[460px]"} />;
  }

  return (
    <div className={className || "w-full h-[460px] relative overflow-hidden"}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 48 }}
        gl={{ antialias: true, alpha: true }}
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        <ReactiveHeroScene />
      </Canvas>
    </div>
  );
}