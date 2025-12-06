"use client";

/**
 * Waveform Visualizer component.
 * Displays animated audio visualization bars.
 *
 * @module waveform-visualizer
 */

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Props for the WaveformVisualizer component.
 */
export type WaveformVisualizerProps = {
  /** Audio level (0-1 range) */
  level: number;
  /** Number of bars to display */
  barCount?: number;
  /** Whether the visualizer is active */
  isActive?: boolean;
  /** Color variant */
  variant?: "listening" | "speaking" | "default";
  /** Additional CSS classes */
  className?: string;
};

/**
 * Color configurations for different variants.
 */
const VARIANT_COLORS = {
  listening: "bg-green-500",
  speaking: "bg-purple-500",
  default: "bg-primary"
};

/**
 * WaveformVisualizer displays animated bars that respond to audio levels.
 * Used to provide visual feedback during voice interaction.
 *
 * @example
 * ```tsx
 * <WaveformVisualizer
 *   level={audioLevel}
 *   isActive={isListening}
 *   variant="listening"
 * />
 * ```
 */
export function WaveformVisualizer({
  level,
  barCount = 5,
  isActive = false,
  variant = "default",
  className
}: WaveformVisualizerProps) {
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Animate bars based on level
  useEffect(() => {
    if (!isActive) return;

    barsRef.current.forEach((bar, index) => {
      if (!bar) return;

      // Create variation for each bar
      const variation = Math.sin((Date.now() / 100 + index * 0.5) * 0.5) * 0.3;
      const barLevel = Math.max(0.1, Math.min(1, level + variation * level));

      bar.style.transform = `scaleY(${barLevel})`;
    });
  }, [level, isActive]);

  const colorClass = VARIANT_COLORS[variant];

  return (
    <div className={cn("flex items-center justify-center gap-1", className)}>
      {Array.from({ length: barCount }).map((_, index) => (
        <div
          key={index}
          ref={(el) => {
            barsRef.current[index] = el;
          }}
          className={cn(
            "w-1 rounded-full transition-transform duration-75",
            colorClass,
            isActive ? "opacity-100" : "opacity-30"
          )}
          style={{
            height: 16,
            transform: `scaleY(${isActive ? 0.3 + index * 0.05 : 0.2})`,
            transformOrigin: "bottom"
          }}
        />
      ))}
    </div>
  );
}

/**
 * CircularWaveform displays a circular audio visualization.
 * Alternative visualization style for different UI contexts.
 */
export type CircularWaveformProps = {
  /** Audio level (0-1 range) */
  level: number;
  /** Size in pixels */
  size?: number;
  /** Whether active */
  isActive?: boolean;
  /** Color variant */
  variant?: "listening" | "speaking" | "default";
  /** Additional CSS classes */
  className?: string;
};

/**
 * CircularWaveform displays a pulsing circle that responds to audio.
 *
 * @example
 * ```tsx
 * <CircularWaveform
 *   level={audioLevel}
 *   size={60}
 *   isActive={isListening}
 *   variant="listening"
 * />
 * ```
 */
export function CircularWaveform({
  level,
  size = 48,
  isActive = false,
  variant = "default",
  className
}: CircularWaveformProps) {
  const ringColors = {
    listening: "ring-green-500/30",
    speaking: "ring-purple-500/30",
    default: "ring-primary/30"
  };

  const bgColors = {
    listening: "bg-green-500",
    speaking: "bg-purple-500",
    default: "bg-primary"
  };

  const scale = isActive ? 1 + level * 0.3 : 1;
  const ringScale = isActive ? 1 + level * 0.5 : 1;

  return (
    <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
      {/* Outer pulsing ring */}
      <div
        className={cn(
          "absolute inset-0 rounded-full ring-4 transition-all duration-100",
          ringColors[variant],
          isActive && "animate-pulse"
        )}
        style={{
          transform: `scale(${ringScale})`
        }}
      />

      {/* Inner circle */}
      <div
        className={cn("absolute rounded-full transition-all duration-100", bgColors[variant])}
        style={{
          width: size * 0.6,
          height: size * 0.6,
          transform: `scale(${scale})`
        }}
      />

      {/* Additional rings for active state */}
      {isActive && level > 0.3 && (
        <div
          className={cn("absolute rounded-full ring-2 opacity-50 transition-all duration-100", ringColors[variant])}
          style={{
            width: size * 0.8,
            height: size * 0.8,
            transform: `scale(${1 + level * 0.4})`
          }}
        />
      )}
    </div>
  );
}
