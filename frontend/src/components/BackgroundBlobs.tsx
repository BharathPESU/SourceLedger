import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  color: string;
  alpha: number;
  phase: number;
  speed: number;
}

interface Orb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  targetX: number;
  targetY: number;
}

export const BackgroundBlobs: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 500,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 400,
    targetX: typeof window !== 'undefined' ? window.innerWidth / 2 : 500,
    targetY: typeof window !== 'undefined' ? window.innerHeight / 2 : 400,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Warm, sophisticated color palette matching the brand
    const orbColors = [
      { r: 232, g: 98, b: 44 },   // Vibrant Burnt Orange (#E8622C)
      { r: 242, g: 153, b: 74 },  // Warm Amber / Apricot
      { r: 212, g: 83, b: 32 },   // Deep Terracotta (#D45320)
      { r: 223, g: 205, b: 188 }, // Warm Champagne Stone (#DFCDBC)
      { r: 245, g: 233, b: 216 }, // Soft Light Sand (#F5E9D8)
    ];

    // Floating large luminous orbs
    const orbs: Orb[] = [
      {
        x: width * 0.8,
        y: height * 0.2,
        targetX: width * 0.8,
        targetY: height * 0.2,
        vx: 0.3,
        vy: 0.2,
        radius: Math.min(width, height) * 0.32,
        color: '232, 98, 44',
        alpha: 0.16,
      },
      {
        x: width * 0.15,
        y: height * 0.75,
        targetX: width * 0.15,
        targetY: height * 0.75,
        vx: -0.25,
        vy: 0.3,
        radius: Math.min(width, height) * 0.36,
        color: '242, 153, 74',
        alpha: 0.14,
      },
      {
        x: width * 0.85,
        y: height * 0.85,
        targetX: width * 0.85,
        targetY: height * 0.85,
        vx: -0.2,
        vy: -0.2,
        radius: Math.min(width, height) * 0.28,
        color: '212, 83, 32',
        alpha: 0.12,
      },
      {
        x: width * 0.2,
        y: height * 0.25,
        targetX: width * 0.2,
        targetY: height * 0.25,
        vx: 0.3,
        vy: -0.15,
        radius: Math.min(width, height) * 0.34,
        color: '223, 205, 188',
        alpha: 0.35,
      },
      {
        x: width * 0.5,
        y: height * 0.5,
        targetX: width * 0.5,
        targetY: height * 0.5,
        vx: 0.15,
        vy: 0.2,
        radius: Math.min(width, height) * 0.25,
        color: '232, 98, 44',
        alpha: 0.10,
      }
    ];

    // Floating stardust / ambient luminous micro-particles
    const particleCount = 38;
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const col = orbColors[Math.floor(Math.random() * orbColors.length)];
      const baseR = Math.random() * 2.5 + 1.2;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -Math.random() * 0.35 - 0.1, // gently float upwards
        radius: baseR,
        baseRadius: baseR,
        color: `${col.r}, ${col.g}, ${col.b}`,
        alpha: Math.random() * 0.5 + 0.2,
        phase: Math.random() * Math.PI * 2,
        speed: 0.02 + Math.random() * 0.02,
      });
    }

    let time = 0;

    const render = () => {
      time += 0.012;

      // Smooth mouse interpolation
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.04;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.04;

      const mouseX = mouseRef.current.x;
      const mouseY = mouseRef.current.y;
      const mouseFactorX = (mouseX / width - 0.5) * 45;
      const mouseFactorY = (mouseY / height - 0.5) * 45;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw smooth harmonic flowing ribbons across canvas
      ctx.save();
      for (let waveIdx = 0; waveIdx < 3; waveIdx++) {
        ctx.beginPath();
        const waveOffset = waveIdx * 1.8;
        const waveY = height * (0.3 + waveIdx * 0.25);
        ctx.moveTo(0, height);
        ctx.lineTo(0, waveY);

        for (let x = 0; x <= width; x += 25) {
          const sin1 = Math.sin(x * 0.002 + time * 0.8 + waveOffset) * 45;
          const cos1 = Math.cos(x * 0.003 - time * 0.5 + waveOffset * 0.7) * 35;
          const y = waveY + sin1 + cos1 + Math.sin((x + mouseX) * 0.001) * 15;
          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, waveY - 80, width, waveY + 160);
        if (waveIdx === 0) {
          grad.addColorStop(0, 'rgba(232, 98, 44, 0.035)');
          grad.addColorStop(0.5, 'rgba(242, 153, 74, 0.025)');
          grad.addColorStop(1, 'rgba(223, 205, 188, 0.01)');
        } else if (waveIdx === 1) {
          grad.addColorStop(0, 'rgba(223, 205, 188, 0.04)');
          grad.addColorStop(0.5, 'rgba(232, 98, 44, 0.02)');
          grad.addColorStop(1, 'rgba(245, 233, 216, 0.01)');
        } else {
          grad.addColorStop(0, 'rgba(242, 153, 74, 0.025)');
          grad.addColorStop(1, 'rgba(232, 98, 44, 0.015)');
        }

        ctx.fillStyle = grad;
        ctx.fill();
      }
      ctx.restore();

      // 2. Draw moving luminous blurred orbs with soft radial gradients
      orbs.forEach((orb, i) => {
        // Move with smooth harmonic path + mouse parallax
        const tOffset = i * 2.3;
        const currentX = orb.x + Math.sin(time * 0.6 + tOffset) * 60 + mouseFactorX * (0.8 + i * 0.2);
        const currentY = orb.y + Math.cos(time * 0.5 + tOffset) * 45 + mouseFactorY * (0.8 + i * 0.2);
        const currentRadius = orb.radius * (1 + Math.sin(time * 0.8 + tOffset) * 0.08);

        const radialGrad = ctx.createRadialGradient(
          currentX,
          currentY,
          0,
          currentX,
          currentY,
          currentRadius
        );

        radialGrad.addColorStop(0, `rgba(${orb.color}, ${orb.alpha})`);
        radialGrad.addColorStop(0.5, `rgba(${orb.color}, ${orb.alpha * 0.45})`);
        radialGrad.addColorStop(1, `rgba(${orb.color}, 0)`);

        ctx.fillStyle = radialGrad;
        ctx.beginPath();
        ctx.arc(currentX, currentY, currentRadius, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Draw and update glowing ambient particles
      particles.forEach((p) => {
        p.phase += p.speed;
        p.x += p.vx + Math.sin(p.phase) * 0.3;
        p.y += p.vy;

        // Wrap around borders gracefully
        if (p.y < -20) {
          p.y = height + 20;
          p.x = Math.random() * width;
        }
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;

        const currentR = p.baseRadius * (1 + Math.sin(p.phase) * 0.35);
        const currentAlpha = p.alpha * (0.6 + Math.sin(p.phase) * 0.4);

        ctx.beginPath();
        ctx.arc(p.x, p.y, currentR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${currentAlpha})`;
        ctx.shadowColor = `rgba(${p.color}, 0.8)`;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {/* HTML5 Dynamic Fluid Particles & Luminous Waves Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ mixBlendMode: 'normal' }}
      />

      {/* Floating Animated Geometric SVG Wireframes for Tech Craft Aesthetic */}
      <div className="absolute -top-16 -right-16 w-96 h-96 pointer-events-none opacity-40 animate-float-slow">
        <svg viewBox="0 0 200 200" className="w-full h-full text-[#E8622C]/20">
          <circle cx="100" cy="100" r="85" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="6 8" />
          <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="100" cy="100" r="35" fill="none" stroke="currentColor" strokeWidth="0.75" strokeDasharray="3 4" />
        </svg>
      </div>

      <div className="absolute bottom-12 -left-16 w-80 h-80 pointer-events-none opacity-35 animate-float-reverse">
        <svg viewBox="0 0 200 200" className="w-full h-full text-[#DFCDBC]">
          <rect x="30" y="30" width="140" height="140" rx="35" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(15 100 100)" />
          <circle cx="100" cy="100" r="45" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" />
        </svg>
      </div>
    </div>
  );
};
