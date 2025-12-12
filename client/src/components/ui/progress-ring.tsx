import { cn } from "@/lib/utils";

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLabel?: boolean;
  color?: "purple" | "cyan" | "pink";
}

const colorClasses = {
  purple: "stroke-purple-400",
  cyan: "stroke-cyan-400",
  pink: "stroke-pink-400",
};

export function ProgressRing({
  progress,
  size = 60,
  strokeWidth = 4,
  className,
  showLabel = false,
  color = "purple",
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-white/10"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn(
            colorClasses[color],
            "transition-all duration-300 ease-out",
            "drop-shadow-[0_0_8px_currentColor]"
          )}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold text-white">{Math.round(progress)}%</span>
        </div>
      )}
    </div>
  );
}

