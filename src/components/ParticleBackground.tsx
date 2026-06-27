"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  glowColor: string;
}

const COLORS = [
  { core: "#3aad6a", glow: "rgba(58,173,106," },
  { core: "#d4a843", glow: "rgba(212,168,67," },
  { core: "#38c97a", glow: "rgba(56,201,122," },
  { core: "#c49a35", glow: "rgba(196,154,53," },
  { core: "#2d8a56", glow: "rgba(45,138,86," },
  { core: "#e8c76a", glow: "rgba(232,199,106," },
];

const CONNECTION_DIST = 120;
const PARTICLE_COUNT_BASE = 50;

function createParticle(w: number, h: number): Particle {
  const c = COLORS[Math.floor(Math.random() * COLORS.length)];
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    radius: Math.random() * 1.8 + 0.6,
    color: c.core,
    glowColor: c.glow,
  };
}

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let particles: Particle[] = [];
    let w = 0;
    let h = 0;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * devicePixelRatio;
      canvas.height = h * devicePixelRatio;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx!.scale(devicePixelRatio, devicePixelRatio);

      const count = Math.min(PARTICLE_COUNT_BASE, Math.floor((w * h) / 25000));
      particles = Array.from({ length: count }, () => createParticle(w, h));
    }

    function draw() {
      ctx!.clearRect(0, 0, w, h);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        p.x = Math.max(0, Math.min(w, p.x));
        p.y = Math.max(0, Math.min(h, p.y));
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECTION_DIST) {
            const alpha = (1 - dist / CONNECTION_DIST) * 0.35;

            const grad = ctx!.createLinearGradient(a.x, a.y, b.x, b.y);
            grad.addColorStop(0, a.glowColor + alpha + ")");
            grad.addColorStop(1, b.glowColor + alpha + ")");

            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.strokeStyle = grad;
            ctx!.lineWidth = 0.6;
            ctx!.stroke();
          }
        }
      }

      for (const p of particles) {
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.radius + 1.5, 0, Math.PI * 2);
        ctx!.fillStyle = p.glowColor + "0.15)";
        ctx!.fill();

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx!.fillStyle = p.color;
        ctx!.fill();
      }

      animId = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
