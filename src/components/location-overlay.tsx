"use client";

/**
 * Location Overlay component.
 * Displays current address, coordinates, and compass heading.
 * Positioned at the top of the screen with glassmorphism styling.
 *
 * @module location-overlay
 */

import { MapPin, Compass, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Props for the LocationOverlay component.
 */
export type LocationOverlayProps = {
  /** Current reverse-geocoded address */
  address?: string;
  /** Current geographic position */
  position?: {
    lat: number;
    lng: number;
  };
  /** Current heading in degrees (0-360) */
  heading?: number;
  /** Whether navigation is currently in progress */
  isNavigating?: boolean;
  /** Additional CSS classes */
  className?: string;
};

/**
 * Converts heading degrees to cardinal direction.
 *
 * @param heading - Heading in degrees (0-360)
 * @returns Cardinal direction string
 */
function headingToCardinal(heading: number): string {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const normalizedHeading = ((heading % 360) + 360) % 360;
  const index = Math.round(normalizedHeading / 45) % 8;
  return directions[index];
}

/**
 * Formats coordinates for display.
 *
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Formatted coordinate string
 */
function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? "N" : "S";
  const lngDir = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
}

/**
 * LocationOverlay displays location information at the top of the screen.
 * Shows the current address, GPS coordinates, and compass heading.
 *
 * @example
 * ```tsx
 * <LocationOverlay
 *   address="Eiffel Tower, Paris, France"
 *   position={{ lat: 48.8584, lng: 2.2945 }}
 *   heading={180}
 *   isNavigating={false}
 * />
 * ```
 */
export function LocationOverlay({
  address,
  position,
  heading = 0,
  isNavigating = false,
  className
}: LocationOverlayProps) {
  const cardinalDirection = headingToCardinal(heading);

  return (
    <div
      className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 z-40",
        "flex flex-col items-center gap-2",
        "max-w-xl w-full px-4",
        className
      )}
    >
      {/* Main location card */}
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl px-4 py-3 w-full",
          "bg-black/50 backdrop-blur-xl border border-white/10",
          "shadow-lg shadow-black/30"
        )}
      >
        {/* Location icon */}
        <div className={cn("flex-shrink-0 p-2 rounded-lg", isNavigating ? "bg-yellow-500/20" : "bg-white/10")}>
          {isNavigating ? (
            <Navigation className="h-5 w-5 text-yellow-400 animate-pulse" />
          ) : (
            <MapPin className="h-5 w-5 text-white/70" />
          )}
        </div>

        {/* Address and coordinates */}
        <div className="flex-1 min-w-0">
          {address ? (
            <p className="text-sm font-medium text-white truncate">{address}</p>
          ) : (
            <p className="text-sm text-white/50 italic">Location unknown</p>
          )}

          {position && (
            <p className="text-xs text-white/50 font-mono">{formatCoordinates(position.lat, position.lng)}</p>
          )}
        </div>

        {/* Compass */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div
            className="relative h-8 w-8 rounded-full bg-white/10 flex items-center justify-center"
            style={{ transform: `rotate(${-heading}deg)` }}
          >
            <Compass className="h-5 w-5 text-white/70" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-0.5 w-1 h-1 rounded-full bg-red-500" />
          </div>

          <div className="text-right">
            <p className="text-sm font-bold text-white">{cardinalDirection}</p>
            <p className="text-xs text-white/50">{Math.round(heading)}°</p>
          </div>
        </div>
      </div>

      {/* Navigation status banner */}
      {isNavigating && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/30">
          <div className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
          <span className="text-xs font-medium text-yellow-200">Navigating...</span>
        </div>
      )}
    </div>
  );
}
