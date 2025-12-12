import { cn } from "@/lib/utils";

interface LoadingDotsProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  color?: "purple" | "cyan" | "pink";
}

const sizeClasses = {
  sm: "w-1.5 h-1.5",
  md: "w-2 h-2",
  lg: "w-3 h-3",
};

const colorClasses = {
  purple: "bg-purple-400",
  cyan: "bg-cyan-400",
  pink: "bg-pink-400",
};

export function LoadingDots({ className, size = "md", color = "purple" }: LoadingDotsProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div
        className={cn(
          sizeClasses[size],
          colorClasses[color],
          "rounded-full animate-pulse"
        )}
        style={{ animationDelay: "0s", animationDuration: "1.4s" }}
      />
      <div
        className={cn(
          sizeClasses[size],
          colorClasses[color],
          "rounded-full animate-pulse"
        )}
        style={{ animationDelay: "0.2s", animationDuration: "1.4s" }}
      />
      <div
        className={cn(
          sizeClasses[size],
          colorClasses[color],
          "rounded-full animate-pulse"
        )}
        style={{ animationDelay: "0.4s", animationDuration: "1.4s" }}
      />
    </div>
  );
}

