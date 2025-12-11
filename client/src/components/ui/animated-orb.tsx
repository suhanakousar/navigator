import { cn } from "@/lib/utils";

interface AnimatedOrbProps {
  size?: "sm" | "md" | "lg" | "xl" | "hero";
  isActive?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "w-16 h-16",
  md: "w-24 h-24",
  lg: "w-40 h-40",
  xl: "w-56 h-56",
  hero: "w-72 h-72 md:w-96 md:h-96",
};

export function AnimatedOrb({ size = "lg", isActive = false, className }: AnimatedOrbProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center",
        sizeClasses[size],
        className
      )}
      data-testid="animated-orb"
    >
      {/* Outer glow ring */}
      <div
        className={cn(
          "absolute inset-0 rounded-full opacity-40 blur-xl",
          "bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500",
          isActive ? "animate-orb-pulse" : "animate-pulse"
        )}
      />
      
      {/* Middle rotating gradient */}
      <div
        className={cn(
          "absolute inset-2 rounded-full opacity-60",
          "orb-gradient",
          "animate-orb-rotate blur-sm"
        )}
      />
      
      {/* Inner core */}
      <div
        className={cn(
          "absolute inset-4 rounded-full",
          "bg-gradient-to-br from-purple-600/80 via-fuchsia-500/60 to-cyan-400/80",
          "backdrop-blur-sm border border-white/20",
          isActive ? "animate-orb-pulse" : "animate-orb-float"
        )}
      />
      
      {/* Center highlight */}
      <div
        className={cn(
          "absolute inset-8 rounded-full",
          "bg-gradient-to-br from-white/30 via-transparent to-transparent"
        )}
      />
      
      {/* Shimmer effect */}
      <div
        className={cn(
          "absolute inset-6 rounded-full overflow-hidden",
          "bg-gradient-to-r from-transparent via-white/10 to-transparent",
          isActive && "animate-shimmer"
        )}
        style={{ backgroundSize: "200% 100%" }}
      />
      
      {/* Floating particles */}
      {isActive && (
        <>
          <div
            className="absolute w-2 h-2 rounded-full bg-cyan-400/60 animate-orb-float"
            style={{ top: "10%", left: "20%", animationDelay: "0s" }}
          />
          <div
            className="absolute w-1.5 h-1.5 rounded-full bg-purple-400/60 animate-orb-float"
            style={{ top: "30%", right: "15%", animationDelay: "0.5s" }}
          />
          <div
            className="absolute w-2 h-2 rounded-full bg-pink-400/60 animate-orb-float"
            style={{ bottom: "20%", left: "25%", animationDelay: "1s" }}
          />
        </>
      )}
    </div>
  );
}
