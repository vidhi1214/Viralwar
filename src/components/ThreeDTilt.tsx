"use client";

import React, { useRef, useState, useCallback } from "react";

interface ThreeDTiltProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number; // degrees
  scale?: number;
  perspective?: number;
  glare?: boolean;
  borderGlow?: boolean;
}

export default function ThreeDTilt({
  children,
  className = "",
  maxTilt = 14,
  scale = 1.025,
  perspective = 1000,
  glare = true,
  borderGlow = true,
}: ThreeDTiltProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<string>("");
  const [glarePosition, setGlarePosition] = useState<{ x: number; y: number; opacity: number }>({
    x: 50,
    y: 50,
    opacity: 0,
  });
  const [isHovered, setIsHovered] = useState(false);
  const [borderLight, setBorderLight] = useState<{ x: number; y: number }>({ x: 50, y: 50 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Percentage from -0.5 to 0.5
      const xPct = mouseX / width - 0.5;
      const yPct = mouseY / height - 0.5;

      // High-precision multi-axis 3D rotation reacting to every sub-pixel move
      const rotateX = -yPct * maxTilt * 2;
      const rotateY = xPct * maxTilt * 2;
      const rotateZ = -xPct * yPct * 5; // Subtle organic 3D torque twist

      setTransform(
        `perspective(${perspective}px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(
          2
        )}deg) rotateZ(${rotateZ.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`
      );

      const pctX = (mouseX / width) * 100;
      const pctY = (mouseY / height) * 100;

      setBorderLight({ x: pctX, y: pctY });

      if (glare) {
        setGlarePosition({
          x: pctX,
          y: pctY,
          opacity: 0.22,
        });
      }
    },
    [maxTilt, scale, perspective, glare]
  );

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTransform(`perspective(${perspective}px) rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale3d(1, 1, 1)`);
    setGlarePosition((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: transform || `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale3d(1, 1, 1)`,
        transition: isHovered ? "transform 0.06s ease-out" : "transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)",
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
      className={`relative ${className}`}
    >
      {/* 3D Border Glow that tracks cursor position around the perimeter */}
      {borderGlow && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: -1,
            borderRadius: "inherit",
            pointerEvents: "none",
            background: isHovered
              ? `radial-gradient(circle 280px at ${borderLight.x}% ${borderLight.y}%, rgba(236,72,153,0.45), rgba(20,184,166,0.3) 40%, transparent 75%)`
              : "transparent",
            opacity: isHovered ? 1 : 0,
            transition: "opacity 0.25s ease-out",
            zIndex: 0,
          }}
        />
      )}

      {/* 3D Content wrapper with elevation in Z-space */}
      <div
        className="relative z-10 h-full w-full"
        style={{
          transform: isHovered ? "translateZ(14px)" : "translateZ(0px)",
          transformStyle: "preserve-3d",
          transition: "transform 0.15s ease-out",
        }}
      >
        {children}
      </div>

      {/* Dynamic Specular Holographic Sheen reacting to cursor */}
      {glare && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            pointerEvents: "none",
            background: `radial-gradient(circle 320px at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,${glarePosition.opacity}), rgba(20,184,166,0.08) 50%, transparent 80%)`,
            transition: isHovered ? "opacity 0.1s ease-out" : "opacity 0.4s ease-out",
            mixBlendMode: "overlay",
            zIndex: 20,
          }}
        />
      )}
    </div>
  );
}
