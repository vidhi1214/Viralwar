"use client";

import React, { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface SwarmParticle {
  origX: number;
  origY: number;
  origZ: number;
  currentX: number;
  currentY: number;
  currentZ: number;
  vx: number;
  vy: number;
  vz: number;
  speed: number;
  scale: number;
  phase: number;
}

function CursorReactiveParticleSwarm({
  count = 95,
  color = "#ec4899",
}: {
  count?: number;
  color?: string;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const mouseLightRef = useRef<THREE.PointLight>(null);
  const prevPointer = useRef({ x: 0, y: 0 });

  // Generate particles in 3D volume
  const particles = useMemo<SwarmParticle[]>(() => {
    const list: SwarmParticle[] = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 18;
      const y = (Math.random() - 0.5) * 11;
      const z = (Math.random() - 0.5) * 12;
      list.push({
        origX: x,
        origY: y,
        origZ: z,
        currentX: x,
        currentY: y,
        currentZ: z,
        vx: 0,
        vy: 0,
        vz: 0,
        speed: 0.4 + Math.random() * 0.8,
        scale: 0.08 + Math.random() * 0.18,
        phase: Math.random() * Math.PI * 2,
      });
    }
    return list;
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();

    // Map pointer (-1 to 1) to 3D world space
    const targetMouseX = state.pointer.x * 7.5;
    const targetMouseY = state.pointer.y * 4.8;

    // Sub-pixel velocity vector
    const dPx = state.pointer.x - prevPointer.current.x;
    const dPy = state.pointer.y - prevPointer.current.y;
    prevPointer.current = { x: state.pointer.x, y: state.pointer.y };

    // Move dynamic point light exactly with cursor in 3D space
    if (mouseLightRef.current) {
      mouseLightRef.current.position.x = THREE.MathUtils.lerp(
        mouseLightRef.current.position.x,
        targetMouseX,
        0.16
      );
      mouseLightRef.current.position.y = THREE.MathUtils.lerp(
        mouseLightRef.current.position.y,
        targetMouseY,
        0.16
      );
      mouseLightRef.current.position.z = 2.4;
    }

    // Camera micro-parallax tilt reacting to every mouse move
    state.camera.position.x = THREE.MathUtils.lerp(
      state.camera.position.x,
      state.pointer.x * 2.4,
      0.08
    );
    state.camera.position.y = THREE.MathUtils.lerp(
      state.camera.position.y,
      state.pointer.y * 1.6,
      0.08
    );

    // Particle physics reacting to cursor proximity, pointer velocity, & harmonic wave
    particles.forEach((p, i) => {
      // Natural harmonic wave
      const waveX = Math.cos(time * 0.5 * p.speed + p.phase) * 0.35;
      const waveY = Math.sin(time * 0.7 * p.speed + p.phase) * 0.35;
      const naturalX = p.origX + waveX;
      const naturalY = p.origY + waveY;
      const naturalZ = p.origZ;

      // Distance to cursor in 3D projection
      const dx = naturalX - targetMouseX;
      const dy = naturalY - targetMouseY;
      const dist = Math.hypot(dx, dy);

      // Repulsion force when cursor approaches
      const repelRadius = 4.2;
      if (dist < repelRadius && dist > 0.01) {
        const force = (1 - dist / repelRadius) * 3.2;
        // Directional push away from cursor
        p.vx += (dx / dist) * force * 0.1;
        p.vy += (dy / dist) * force * 0.1;

        // Add kinetic swirl impulse from cursor movement velocity
        p.vx += dPx * force * 1.2;
        p.vy += dPy * force * 1.2;
      }

      // Return-to-home spring physics + damping
      p.vx += (naturalX - p.currentX) * 0.06;
      p.vy += (naturalY - p.currentY) * 0.06;
      p.vz += (naturalZ - p.currentZ) * 0.06;

      p.vx *= 0.86;
      p.vy *= 0.86;
      p.vz *= 0.86;

      p.currentX += p.vx;
      p.currentY += p.vy;
      p.currentZ += p.vz;

      dummy.position.set(p.currentX, p.currentY, p.currentZ);
      dummy.scale.set(p.scale, p.scale, p.scale);
      dummy.rotation.x = time * 0.3 + p.phase;
      dummy.rotation.y = time * 0.4 + p.phase;
      dummy.updateMatrix();

      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      {/* Real-time point light tracking cursor */}
      <pointLight
        ref={mouseLightRef}
        position={[0, 0, 2]}
        intensity={4.2}
        color={color}
        distance={20}
      />
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.85}
          roughness={0.15}
          metalness={0.85}
        />
      </instancedMesh>
    </>
  );
}

function CursorTrackingHologram({ color = "#14b8a6" }: { color?: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const outerTorusRef = useRef<THREE.Mesh>(null);
  const innerIcosaRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // The group smoothly orients towards cursor coordinates with high reactivity
    if (groupRef.current) {
      const targetRotX = state.pointer.y * 1.1;
      const targetRotY = state.pointer.x * 1.4;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        targetRotX,
        0.1
      );
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotY,
        0.1
      );
      groupRef.current.position.y = 0.2 + Math.sin(t * 1.5) * 0.12;
    }

    if (outerTorusRef.current) {
      outerTorusRef.current.rotation.z = t * 0.9;
    }
    if (innerIcosaRef.current) {
      innerIcosaRef.current.rotation.x = -t * 0.7;
      innerIcosaRef.current.rotation.y = t * 0.8;
    }
  });

  return (
    <group ref={groupRef} position={[3.6, 0.2, -1.8]}>
      {/* Outer Holographic Gyro Ring */}
      <mesh ref={outerTorusRef}>
        <torusGeometry args={[1.8, 0.07, 16, 100]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.3}
          wireframe
        />
      </mesh>

      {/* Second Perpendicular Gyro Ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.4, 0.05, 16, 80]} />
        <meshStandardMaterial
          color="#a855f7"
          emissive="#a855f7"
          emissiveIntensity={0.9}
          wireframe
        />
      </mesh>

      {/* Central Interactive Crystal */}
      <mesh ref={innerIcosaRef}>
        <icosahedronGeometry args={[0.9, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.75}
          metalness={0.9}
          roughness={0.1}
          wireframe={false}
        />
      </mesh>
    </group>
  );
}

interface ThreeDParticleFieldProps {
  className?: string;
  themeColor?: "pink" | "teal" | "amber" | "purple";
  showCenterHologram?: boolean;
}

export default function ThreeDParticleField({
  className = "w-full h-48",
  themeColor = "pink",
  showCenterHologram = true,
}: ThreeDParticleFieldProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={className} />;
  }

  const primaryColor =
    themeColor === "teal"
      ? "#14b8a6"
      : themeColor === "amber"
      ? "#f59e0b"
      : themeColor === "purple"
      ? "#a855f7"
      : "#ec4899";

  return (
    <div className={`relative overflow-hidden pointer-events-auto ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 7.5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={1.4} />
        <CursorReactiveParticleSwarm count={95} color={primaryColor} />
        {showCenterHologram && <CursorTrackingHologram color={primaryColor} />}
      </Canvas>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black pointer-events-none" />
    </div>
  );
}
