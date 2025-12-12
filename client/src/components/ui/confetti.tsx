import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ConfettiProps {
  trigger?: boolean;
  duration?: number;
  particleCount?: number;
  className?: string;
}

export function Confetti({ trigger = false, duration = 3000, particleCount = 50, className }: ConfettiProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string; delay: number }>>([]);

  useEffect(() => {
    if (!trigger) {
      setParticles([]);
      return;
    }

    // Generate particles
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10,
      color: [
        "rgb(168, 85, 247)", // purple
        "rgb(236, 72, 153)", // pink
        "rgb(6, 182, 212)",  // cyan
        "rgb(251, 191, 36)",  // amber
        "rgb(34, 197, 94)",  // green
      ][Math.floor(Math.random() * 5)],
      delay: Math.random() * 0.5,
    }));

    setParticles(newParticles);

    // Clear particles after duration
    const timer = setTimeout(() => {
      setParticles([]);
    }, duration);

    return () => clearTimeout(timer);
  }, [trigger, duration, particleCount]);

  if (particles.length === 0) return null;

  return (
    <div className={cn("fixed inset-0 pointer-events-none z-50 overflow-hidden", className)}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            backgroundColor: particle.color,
            boxShadow: `0 0 10px ${particle.color}, 0 0 20px ${particle.color}`,
            animation: `confetti-fall ${2 + Math.random() * 2}s ease-out ${particle.delay}s forwards`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

