"use client";

import React, { useEffect, useRef, useState } from "react";

interface SparkNode {
  x: number;
  y: number;
  z: number;
  targetX: number;
  targetY: number;
  delay: number;
}

export default function GlobalCursorLighting() {
  const [mounted, setMounted] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  const gyroRingRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const sparksRef = useRef<(HTMLDivElement | null)[]>([]);

  // Mouse coords & instantaneous physics
  const mouse = useRef({ x: -100, y: -100 });
  const prevMouse = useRef({ x: -100, y: -100 });
  const velocity = useRef({ x: 0, y: 0, speed: 0 });
  const delayed = useRef({ x: -100, y: -100 });
  const tilt = useRef({ x: 0, y: 0, z: 0 });

  // 4 floating 3D micro-sparks with spring delays
  const sparks = useRef<SparkNode[]>([
    { x: -100, y: -100, z: 12, targetX: -100, targetY: -100, delay: 0.28 },
    { x: -100, y: -100, z: 20, targetX: -100, targetY: -100, delay: 0.22 },
    { x: -100, y: -100, z: -8, targetX: -100, targetY: -100, delay: 0.35 },
    { x: -100, y: -100, z: 15, targetX: -100, targetY: -100, delay: 0.18 },
  ]);

  useEffect(() => {
    setMounted(true);

    const handleMouseMove = (e: MouseEvent) => {
      const curX = e.clientX;
      const curY = e.clientY;

      // Calculate instantaneous movement vector
      const dx = curX - mouse.current.x;
      const dy = curY - mouse.current.y;
      const dist = Math.hypot(dx, dy);

      // Dampened velocity
      velocity.current.x = dx;
      velocity.current.y = dy;
      velocity.current.speed = Math.min(dist, 50);

      // 3D tilt calculation based on movement direction & speed
      // Tilt pitch and roll according to movement vector
      const targetTiltX = Math.max(-45, Math.min(45, -dy * 1.8));
      const targetTiltY = Math.max(-45, Math.min(45, dx * 1.8));
      const targetTiltZ = Math.max(-30, Math.min(30, dx * 0.5));

      tilt.current.x += (targetTiltX - tilt.current.x) * 0.3;
      tilt.current.y += (targetTiltY - tilt.current.y) * 0.3;
      tilt.current.z += (targetTiltZ - tilt.current.z) * 0.3;

      prevMouse.current = { ...mouse.current };
      mouse.current = { x: curX, y: curY };
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    let animationFrameId: number;

    const animate = () => {
      // Smooth lerp for main reticle
      delayed.current.x += (mouse.current.x - delayed.current.x) * 0.18;
      delayed.current.y += (mouse.current.y - delayed.current.y) * 0.18;

      // Natural decay of tilt when cursor stops
      tilt.current.x *= 0.92;
      tilt.current.y *= 0.92;
      tilt.current.z *= 0.92;

      // Position pinpoint reticle exactly at cursor with 3D gyro tilt
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${mouse.current.x}px, ${mouse.current.y}px, 0) translate(-50%, -50%)`;
      }

      // Gyro Ring: Tilts in 3D perspective based on every single movement!
      if (gyroRingRef.current) {
        const scaleBoost = 1 + Math.min(velocity.current.speed * 0.015, 0.4);
        gyroRingRef.current.style.transform = `translate3d(${delayed.current.x}px, ${delayed.current.y}px, 0) translate(-50%, -50%) perspective(500px) rotateX(${tilt.current.x.toFixed(
          1
        )}deg) rotateY(${tilt.current.y.toFixed(1)}deg) rotateZ(${tilt.current.z.toFixed(
          1
        )}deg) scale3d(${scaleBoost}, ${scaleBoost}, 1)`;
      }

      // Smooth atmospheric ambient glow tracking
      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(${delayed.current.x}px, ${delayed.current.y}px, 0) translate(-50%, -50%)`;
      }

      // Animate 3D micro-sparks trailing in Z-space
      sparks.current.forEach((spark, index) => {
        spark.x += (mouse.current.x - spark.x) * spark.delay;
        spark.y += (mouse.current.y - spark.y) * spark.delay;

        const el = sparksRef.current[index];
        if (el) {
          el.style.transform = `translate3d(${spark.x}px, ${spark.y}px, ${spark.z}px) translate(-50%, -50%)`;
        }
      });

      // Decay velocity
      velocity.current.speed *= 0.85;

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
      style={{ isolation: "isolate" }}
    >
      {/* 3D Atmospheric Multi-spectrum Spotlight */}
      <div
        ref={glowRef}
        className="absolute top-0 left-0 w-[580px] h-[580px] rounded-full opacity-35 blur-3xl pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(236,72,153,0.18) 0%, rgba(20,184,166,0.14) 30%, rgba(168,85,247,0.06) 65%, transparent 80%)",
          willChange: "transform",
        }}
      />

      {/* Reactive 3D Gyroscope Gimbal Ring - Tilts & Warps in 3D Space */}
      <div
        ref={gyroRingRef}
        className="absolute top-0 left-0 w-11 h-11 pointer-events-none flex items-center justify-center"
        style={{
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      >
        {/* Outer 3D Gyro Bezel */}
        <div
          className="absolute inset-0 rounded-full border border-teal-400/50 shadow-[0_0_12px_rgba(20,184,166,0.4)]"
          style={{
            transform: "translateZ(8px)",
          }}
        />
        {/* Inner Counter-tilt Ring */}
        <div
          className="w-7 h-7 rounded-full border border-pink-500/50 shadow-[0_0_10px_rgba(236,72,153,0.4)] border-dashed animate-spin"
          style={{
            animationDuration: "9s",
            transform: "translateZ(14px)",
          }}
        />
      </div>

      {/* Pinpoint Core - Instantaneous 0-latency tracking */}
      <div
        ref={cursorRef}
        className="absolute top-0 left-0 w-3 h-3 pointer-events-none flex items-center justify-center"
        style={{ willChange: "transform" }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-pink-400 shadow-[0_0_10px_#ec4899] animate-pulse" />
      </div>

      {/* 3D Micro-Spark Satellites trailing in depth */}
      {sparks.current.map((spark, i) => (
        <div
          key={i}
          ref={(el) => {
            sparksRef.current[i] = el;
          }}
          className="absolute top-0 left-0 pointer-events-none"
          style={{ willChange: "transform" }}
        >
          <div
            className={`rounded-full ${
              i % 2 === 0
                ? "w-1.5 h-1.5 bg-teal-300 shadow-[0_0_8px_#14b8a6]"
                : "w-1 h-1 bg-purple-400 shadow-[0_0_6px_#a855f7]"
            }`}
            style={{ opacity: 0.65 }}
          />
        </div>
      ))}
    </div>
  );
}
