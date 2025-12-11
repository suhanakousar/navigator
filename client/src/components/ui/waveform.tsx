import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface WaveformProps {
  isActive?: boolean;
  barCount?: number;
  className?: string;
  variant?: "default" | "mini" | "large";
}

export function Waveform({
  isActive = false,
  barCount = 40,
  className,
  variant = "default",
}: WaveformProps) {
  const [heights, setHeights] = useState<number[]>([]);

  useEffect(() => {
    // Initialize with random heights
    setHeights(Array.from({ length: barCount }, () => Math.random() * 60 + 20));
  }, [barCount]);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setHeights(prev =>
        prev.map(() => Math.random() * 80 + 20)
      );
    }, 100);

    return () => clearInterval(interval);
  }, [isActive]);

  const variantClasses = {
    default: "h-16",
    mini: "h-8",
    large: "h-24",
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-0.5",
        variantClasses[variant],
        className
      )}
      data-testid="waveform"
    >
      {heights.map((height, i) => (
        <div
          key={i}
          className={cn(
            "rounded-full transition-all duration-100",
            variant === "mini" ? "w-0.5" : "w-1",
            isActive
              ? "bg-gradient-to-t from-cyan-400 to-purple-500"
              : "bg-white/20"
          )}
          style={{
            height: isActive ? `${height}%` : "30%",
            transitionDelay: `${i * 10}ms`,
          }}
        />
      ))}
    </div>
  );
}

interface AudioWaveformProps {
  audioUrl?: string;
  isPlaying?: boolean;
  currentTime?: number;
  duration?: number;
  onSeek?: (time: number) => void;
  className?: string;
}

export function AudioWaveform({
  isPlaying = false,
  currentTime = 0,
  duration = 100,
  onSeek,
  className,
}: AudioWaveformProps) {
  const [waveData, setWaveData] = useState<number[]>([]);
  const barCount = 80;

  useEffect(() => {
    // Generate mock waveform data
    setWaveData(
      Array.from({ length: barCount }, () => Math.random() * 0.7 + 0.3)
    );
  }, []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    onSeek(percentage * duration);
  };

  return (
    <div
      className={cn(
        "relative h-20 cursor-pointer rounded-xl bg-white/5 p-4",
        className
      )}
      onClick={handleClick}
      data-testid="audio-waveform"
    >
      <div className="flex items-center justify-between h-full gap-0.5">
        {waveData.map((height, i) => {
          const isPlayed = (i / barCount) * 100 <= progress;
          return (
            <div
              key={i}
              className={cn(
                "flex-1 max-w-1 rounded-full transition-colors duration-150",
                isPlayed
                  ? "bg-gradient-to-t from-cyan-400 to-purple-500"
                  : "bg-white/20"
              )}
              style={{ height: `${height * 100}%` }}
            />
          );
        })}
      </div>

      {/* Progress indicator */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
        style={{ left: `${progress}%` }}
      />
    </div>
  );
}

interface VoiceInputIndicatorProps {
  isListening?: boolean;
  volume?: number;
  className?: string;
}

export function VoiceInputIndicator({
  isListening = false,
  volume = 0,
  className,
}: VoiceInputIndicatorProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-1",
        className
      )}
      data-testid="voice-input-indicator"
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const height = isListening
          ? Math.min(100, 20 + volume * 80 + Math.sin(Date.now() / 100 + i) * 20)
          : 20;
        return (
          <div
            key={i}
            className={cn(
              "w-1 rounded-full transition-all duration-100",
              isListening
                ? "bg-gradient-to-t from-purple-500 to-cyan-400"
                : "bg-white/30"
            )}
            style={{
              height: `${height}%`,
              transitionDelay: `${i * 50}ms`,
            }}
          />
        );
      })}
    </div>
  );
}
