import { useEffect, useState } from "react";
import { CheckCircle2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuccessAnimationProps {
  show?: boolean;
  message?: string;
  onComplete?: () => void;
  className?: string;
}

export function SuccessAnimation({ show = false, message, onComplete, className }: SuccessAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center pointer-events-none",
        "animate-fade-in",
        className
      )}
    >
      <div className="relative">
        {/* Outer glow ring */}
        <div
          className="absolute inset-0 rounded-full animate-orb-pulse"
          style={{
            background: "radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%)",
            transform: "scale(2)",
          }}
        />
        
        {/* Middle ring */}
        <div
          className="absolute inset-0 rounded-full animate-orb-rotate"
          style={{
            background: "conic-gradient(from 0deg, rgba(168, 85, 247, 0.3), rgba(236, 72, 153, 0.3), rgba(6, 182, 212, 0.3), rgba(168, 85, 247, 0.3))",
            transform: "scale(1.5)",
          }}
        />
        
        {/* Icon container */}
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 backdrop-blur-xl border border-white/20 flex items-center justify-center animate-scale-in">
          <CheckCircle2 className="w-12 h-12 text-green-400 animate-fade-in" />
          <Sparkles className="absolute w-16 h-16 text-purple-400/50 animate-pulse" />
        </div>
        
        {/* Message */}
        {message && (
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 animate-fade-in-up">
            <p className="text-sm font-medium text-white whitespace-nowrap">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
}

