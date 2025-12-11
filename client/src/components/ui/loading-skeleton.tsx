import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  variant?: "text" | "circle" | "card" | "button" | "input";
}

export function LoadingSkeleton({ className, variant = "text" }: LoadingSkeletonProps) {
  const baseClasses = "shimmer rounded-lg bg-white/5";
  
  const variantClasses = {
    text: "h-4 w-full",
    circle: "h-12 w-12 rounded-full",
    card: "h-32 w-full rounded-2xl",
    button: "h-10 w-24 rounded-full",
    input: "h-12 w-full rounded-xl",
  };

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      data-testid="loading-skeleton"
    />
  );
}

interface CardSkeletonProps {
  className?: string;
}

export function CardSkeleton({ className }: CardSkeletonProps) {
  return (
    <div
      className={cn(
        "p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10",
        className
      )}
      data-testid="card-skeleton"
    >
      <div className="flex items-center gap-4 mb-4">
        <LoadingSkeleton variant="circle" />
        <div className="flex-1 space-y-2">
          <LoadingSkeleton variant="text" className="w-3/4" />
          <LoadingSkeleton variant="text" className="w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <LoadingSkeleton variant="text" />
        <LoadingSkeleton variant="text" />
        <LoadingSkeleton variant="text" className="w-2/3" />
      </div>
    </div>
  );
}

interface GridSkeletonProps {
  count?: number;
  className?: string;
}

export function GridSkeleton({ count = 6, className }: GridSkeletonProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

interface ChatSkeletonProps {
  messageCount?: number;
}

export function ChatSkeleton({ messageCount = 3 }: ChatSkeletonProps) {
  return (
    <div className="space-y-4 p-4" data-testid="chat-skeleton">
      {Array.from({ length: messageCount }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex gap-3",
            i % 2 === 0 ? "justify-end" : "justify-start"
          )}
        >
          {i % 2 !== 0 && <LoadingSkeleton variant="circle" className="w-8 h-8" />}
          <div
            className={cn(
              "space-y-2 p-4 rounded-2xl bg-white/5",
              i % 2 === 0 ? "rounded-br-sm" : "rounded-bl-sm",
              "max-w-[70%]"
            )}
          >
            <LoadingSkeleton variant="text" className="w-48" />
            <LoadingSkeleton variant="text" className="w-32" />
          </div>
          {i % 2 === 0 && <LoadingSkeleton variant="circle" className="w-8 h-8" />}
        </div>
      ))}
    </div>
  );
}

interface WaveformSkeletonProps {
  barCount?: number;
  className?: string;
}

export function WaveformSkeleton({ barCount = 30, className }: WaveformSkeletonProps) {
  return (
    <div
      className={cn("flex items-center justify-center gap-1 h-16", className)}
      data-testid="waveform-skeleton"
    >
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          className="w-1 bg-white/10 rounded-full shimmer"
          style={{
            height: `${Math.random() * 60 + 20}%`,
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
    </div>
  );
}
