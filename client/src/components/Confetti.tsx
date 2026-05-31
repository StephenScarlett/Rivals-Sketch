import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

const COLORS = ['#8b5cf6', '#ec4899', '#eab308', '#22c55e', '#3b82f6', '#ef4444', '#f97316', '#06b6d4'];
const PARTICLE_COUNT = 80;

export default function Confetti() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const p: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      p.push({
        id: i,
        x: Math.random() * 100,
        y: -10 - Math.random() * 20,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 4 + Math.random() * 8,
        speedX: (Math.random() - 0.5) * 3,
        speedY: 2 + Math.random() * 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
      });
    }
    setParticles(p);
  }, []);

  useEffect(() => {
    if (particles.length === 0) return;

    const interval = setInterval(() => {
      setParticles((prev) => {
        const next = prev.map((p) => ({
          ...p,
          x: p.x + p.speedX * 0.3,
          y: p.y + p.speedY * 0.5,
          rotation: p.rotation + p.rotationSpeed,
          opacity: p.y > 80 ? Math.max(0, p.opacity - 0.03) : p.opacity,
        }));
        if (next.every((p) => p.opacity <= 0)) return [];
        return next;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [particles.length > 0]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
            transform: `rotate(${p.rotation}deg)`,
            opacity: p.opacity,
            borderRadius: '2px',
          }}
        />
      ))}
    </div>
  );
}
