'use client';

import { useEffect, useRef } from 'react';
import { Braces, Code2, Layers, Smartphone } from 'lucide-react';

type BackgroundProps = { variant?: 'hero' | 'closing' };
type Particle = { x: number; y: number; vx: number; vy: number; radius: number; opacity: number };

function createParticles(count: number, initialSeed: number): Particle[] {
  let seed = initialSeed;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  return Array.from({ length: count }, () => ({
    x: random(),
    y: random(),
    vx: (random() - 0.5) * 13,
    vy: -(20 + random() * 20),
    radius: 1.1 + random() * 1.5,
    opacity: 0.17 + random() * 0.2,
  }));
}

export function AcademyBackground({ variant = 'hero' }: BackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    const context = canvas?.getContext('2d');
    if (!canvas || !host || !context) return;

    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let width = 1;
    let height = 1;
    let particles: Particle[] = [];
    let frameId = 0;
    let lastPaint = 0;
    let elapsed = 0;
    let inView = false;
    let disposed = false;

    function draw(time: number) {
      context.clearRect(0, 0, width, height);
      const spacing = width < 640 ? 48 : 56;
      const offsetX = (time * 2.8) % spacing;
      const offsetY = (time * 2.8) % spacing;

      context.lineWidth = 0.75;
      context.strokeStyle = 'rgba(199, 71, 23, 0.055)';
      context.beginPath();
      for (let x = offsetX; x <= width; x += spacing) {
        context.moveTo(x, 0);
        context.lineTo(x, height);
      }
      for (let y = offsetY; y <= height; y += spacing) {
        context.moveTo(0, y);
        context.lineTo(width, y);
      }
      context.stroke();

      const positions = particles.map(particle => ({
        ...particle,
        x: ((particle.x * width + time * particle.vx) % width + width) % width,
        y: ((particle.y * height + time * particle.vy) % height + height) % height,
      }));
      const connectionDistance = width < 640 ? 90 : 130;
      for (let index = 0; index < positions.length; index++) {
        const particle = positions[index];
        for (let otherIndex = index + 1; otherIndex < positions.length; otherIndex++) {
          const other = positions[otherIndex];
          const distance = Math.hypot(particle.x - other.x, particle.y - other.y);
          if (distance >= connectionDistance) continue;
          context.strokeStyle = `rgba(199, 71, 23, ${0.1 * (1 - distance / connectionDistance)})`;
          context.beginPath();
          context.moveTo(particle.x, particle.y);
          context.lineTo(other.x, other.y);
          context.stroke();
        }
        const edgeFade = Math.min(1, particle.y / 48, (height - particle.y) / 48);
        context.fillStyle = `rgba(199, 71, 23, ${particle.opacity * edgeFade})`;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();
      }
    }

    function canAnimate() {
      return !disposed && !motionPreference.matches && inView && document.visibilityState !== 'hidden';
    }

    function animate(timestamp: number) {
      frameId = 0;
      if (!canAnimate()) return;
      if (!lastPaint || timestamp - lastPaint >= 1000 / 30) {
        if (lastPaint) elapsed += Math.min((timestamp - lastPaint) / 1000, 0.1);
        lastPaint = timestamp;
        draw(elapsed);
      }
      frameId = window.requestAnimationFrame(animate);
    }

    function synchronize() {
      if (disposed) return;
      if (frameId) window.cancelAnimationFrame(frameId);
      frameId = 0;
      lastPaint = 0;
      host.dataset.paused = String(!canAnimate());
      if (motionPreference.matches) {
        elapsed = 0;
        draw(0);
      } else if (canAnimate()) {
        frameId = window.requestAnimationFrame(animate);
      }
    }

    function resize() {
      if (disposed) return;
      const bounds = host.getBoundingClientRect();
      width = Math.max(1, Math.round(bounds.width));
      height = Math.max(1, Math.round(bounds.height));
      const density = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * density);
      canvas.height = Math.round(height * density);
      context.setTransform(density, 0, 0, density, 0, 0);
      particles = createParticles(width < 640 ? 10 : 22, variant === 'closing' ? 89 : 41);
      draw(motionPreference.matches ? 0 : elapsed);
      synchronize();
    }

    const resizeObserver = new ResizeObserver(resize);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      synchronize();
    });

    resize();
    resizeObserver.observe(host);
    intersectionObserver.observe(host);
    motionPreference.addEventListener('change', synchronize);
    document.addEventListener('visibilitychange', synchronize);

    return () => {
      disposed = true;
      if (frameId) window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      motionPreference.removeEventListener('change', synchronize);
      document.removeEventListener('visibilitychange', synchronize);
    };
  }, [variant]);

  return <div className={`academy-background${variant === 'closing' ? ' academy-background-closing' : ''}`} aria-hidden="true">
    <canvas ref={canvasRef} className="academy-background-canvas" />
    <div className="academy-background-icons">
      <span className="academy-background-icon academy-background-icon-1"><Code2 size={36} strokeWidth={1.3} /></span>
      <span className="academy-background-icon academy-background-icon-2"><Smartphone size={32} strokeWidth={1.3} /></span>
      <span className="academy-background-icon academy-background-icon-3"><Layers size={34} strokeWidth={1.3} /></span>
      <span className="academy-background-icon academy-background-icon-4"><Braces size={34} strokeWidth={1.3} /></span>
    </div>
  </div>;
}
