import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, OrbitControls, Float, Stars } from '@react-three/drei';
import * as THREE from 'three';

// 3D Animated Medical Sphere Mesh
const AnimatedBrainMesh = () => {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.25;
      meshRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.15) * 0.2;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1.5} floatIntensity={2}>
      <Sphere ref={meshRef} args={[1.8, 64, 64]} scale={1.2}>
        <MeshDistortMaterial
          color="#06b6d4"
          attach="material"
          distort={0.4}
          speed={3}
          roughness={0.2}
          metalness={0.8}
          wireframe
        />
      </Sphere>
      <Sphere args={[1.5, 32, 32]}>
        <meshStandardMaterial
          color="#3b82f6"
          emissive="#06b6d4"
          emissiveIntensity={0.5}
          transparent
          opacity={0.3}
        />
      </Sphere>
    </Float>
  );
};

// Fallback HTML5 Canvas render in case WebGL is unavailable
const FallbackCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const radius = 120;

      angle += 0.02;

      // Draw outer glowing ring
      ctx.beginPath();
      ctx.arc(cx, cy, radius + Math.sin(angle) * 8, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#06b6d4';
      ctx.stroke();

      // Draw inner wireframe nodes
      for (let i = 0; i < 16; i++) {
        const theta = (i / 16) * Math.PI * 2 + angle;
        const r = radius * 0.85 + Math.sin(angle * 2 + i) * 15;
        const x = cx + Math.cos(theta) * r;
        const y = cy + Math.sin(theta) * r;

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? '#06b6d4' : '#3b82f6';
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(x, y);
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={400}
      className="w-full h-full max-w-[400px] max-h-[400px]"
    />
  );
};

export const Medical3DObject: React.FC = () => {
  return (
    <div className="relative w-full h-[450px] flex items-center justify-center">
      {/* Background Animated Particle Stars */}
      <div className="absolute inset-0 pointer-events-none opacity-60">
        <Canvas camera={{ position: [0, 0, 5], fov: 60 }} fallback={<FallbackCanvas />}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 5]} intensity={1.2} color="#06b6d4" />
          <pointLight position={[-10, -10, -5]} intensity={0.8} color="#3b82f6" />
          <AnimatedBrainMesh />
          <Stars radius={100} depth={50} count={1200} factor={4} saturation={0} fade speed={1.5} />
          <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.8} />
        </Canvas>
      </div>

      {/* Futuristic Medical Scan Line Effect */}
      <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none border border-cyan-500/20">
        <div className="animate-scanline" />
      </div>
    </div>
  );
};
