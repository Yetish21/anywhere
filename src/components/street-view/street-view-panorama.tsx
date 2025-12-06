"use client";

/**
 * Street View Panorama component.
 * Renders a full-screen Google Street View with programmatic control API.
 * Exposes window.anywhere for AI agent control.
 *
 * @module street-view-panorama
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { loadGoogleMaps } from "@/lib/maps-loader";
import { useStreetViewStore } from "@/stores/street-view-store";
import gsap from "gsap";

/**
 * Props for the StreetViewPanorama component.
 */
export type StreetViewPanoramaProps = {
  /** Google Maps API key */
  apiKey: string;
  /** Initial latitude (default: Eiffel Tower) */
  initialLat?: number;
  /** Initial longitude (default: Eiffel Tower) */
  initialLng?: number;
  /** Initial heading in degrees 0-360 (default: 0 = North) */
  initialHeading?: number;
  /** Initial pitch in degrees -90 to 90 (default: 0 = horizon) */
  initialPitch?: number;
  /** Callback when position changes */
  onPositionChange?: (lat: number, lng: number) => void;
  /** Callback when POV changes */
  onPovChange?: (heading: number, pitch: number) => void;
  /** Callback when panorama is ready */
  onReady?: () => void;
  /** Callback on error */
  onError?: (error: Error) => void;
};

/**
 * Result of a moveForward operation.
 */
export type MoveForwardResult = {
  /** Number of steps that were successfully completed */
  stepsCompleted: number;
  /** Number of steps originally requested */
  stepsRequested: number;
  /** Whether movement was blocked (dead end, no links) */
  blocked: boolean;
  /** Optional message explaining partial or failed movement */
  message?: string;
};

/**
 * Control API exposed on window.anywhere for AI agent access.
 */
export type AnywhereControlAPI = {
  /** Smoothly pan the camera to a new heading and pitch */
  panTo: (targetHeading: number, targetPitch: number, duration?: number) => Promise<void>;
  /** Move forward along the current street. Returns details about movement success. */
  moveForward: (steps?: number) => Promise<MoveForwardResult>;
  /** Teleport to a named location */
  teleportTo: (locationName: string) => Promise<void>;
  /** Get the current viewport context */
  getContext: () => {
    position: { lat: number; lng: number } | undefined;
    pov: { heading: number; pitch: number };
    availableDirections:
      | {
          heading: number | null;
          description: string | null;
        }[]
      | undefined;
    panoId: string;
    address: string | undefined;
  };
  /** Get a static image URL of the current view */
  getStaticImageUrl: (width?: number, height?: number) => string | undefined;
};

// Declare the global window.anywhere property
declare global {
  interface Window {
    anywhere?: AnywhereControlAPI;
  }
}

/**
 * StreetViewPanorama renders a full-screen Google Street View panorama
 * and exposes a control API via the global window.anywhere object.
 *
 * The control API allows the AI agent to:
 * - Pan the camera smoothly to any direction
 * - Move forward along streets
 * - Teleport to any location worldwide
 * - Get context about the current view
 *
 * @example
 * ```tsx
 * <StreetViewPanorama
 *   apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
 *   initialLat={48.8584}
 *   initialLng={2.2945}
 *   initialHeading={180}
 *   onPositionChange={(lat, lng) => console.log("Moved to", lat, lng)}
 * />
 * ```
 */
export function StreetViewPanorama({
  apiKey,
  initialLat = 48.8584, // Eiffel Tower default
  initialLng = 2.2945,
  initialHeading = 0,
  initialPitch = 0,
  onPositionChange,
  onPovChange,
  onReady,
  onError
}: StreetViewPanoramaProps) {
  /** Container ref for the panorama */
  const containerRef = useRef<HTMLDivElement>(null);

  /** Google Maps Panorama instance */
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);

  /** Street View Service for finding panoramas */
  const streetViewServiceRef = useRef<google.maps.StreetViewService | null>(null);

  /** Geocoder for address resolution */
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  /** Loading state */
  const [isLoaded, setIsLoaded] = useState(false);

  /** Error state */
  const [error, setError] = useState<string | undefined>();

  /** Zustand store actions */
  const { setPosition, setPov, setAddress, setPanoId, setIsNavigating, currentAddress } = useStreetViewStore();

  /**
   * Reverse geocode coordinates to get address.
   */
  const reverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      if (!geocoderRef.current) return;

      try {
        const response = await geocoderRef.current.geocode({
          location: { lat, lng }
        });

        if (response.results[0]) {
          setAddress(response.results[0].formatted_address);
        }
      } catch (err) {
        console.warn("[StreetView] Reverse geocoding failed:", err);
      }
    },
    [setAddress]
  );

  /**
   * Expose control API on window.anywhere for AI agent access.
   */
  const exposeControlAPI = useCallback(
    (panorama: google.maps.StreetViewPanorama) => {
      const api: AnywhereControlAPI = {
        /**
         * Smoothly pan the camera to a new heading and pitch.
         * Uses GSAP for smooth interpolation.
         */
        panTo: (targetHeading: number, targetPitch: number, duration = 2) => {
          return new Promise<void>((resolve) => {
            const currentPov = panorama.getPov();
            const animationTarget = {
              heading: currentPov.heading,
              pitch: currentPov.pitch
            };

            // Normalize heading difference for shortest path
            let headingDiff = targetHeading - currentPov.heading;
            if (headingDiff > 180) headingDiff -= 360;
            if (headingDiff < -180) headingDiff += 360;

            setIsNavigating(true);

            gsap.to(animationTarget, {
              heading: currentPov.heading + headingDiff,
              pitch: Math.max(-90, Math.min(90, targetPitch)),
              duration,
              ease: "power2.inOut",
              onUpdate: () => {
                const normalizedHeading = ((animationTarget.heading % 360) + 360) % 360;
                panorama.setPov({
                  heading: normalizedHeading,
                  pitch: animationTarget.pitch
                });
              },
              onComplete: () => {
                setIsNavigating(false);
                resolve();
              }
            });
          });
        },

        /**
         * Move forward along the street by a number of steps.
         * Returns a result object indicating how many steps were completed.
         *
         * @param steps - Number of steps to move forward (1-5)
         * @returns MoveForwardResult indicating success/failure details
         */
        moveForward: async (steps = 1): Promise<MoveForwardResult> => {
          setIsNavigating(true);

          const stepsRequested = Math.min(steps, 5);
          let stepsCompleted = 0;
          let blocked = false;
          let message: string | undefined;

          try {
            for (let i = 0; i < stepsRequested; i++) {
              const links = panorama.getLinks();
              if (!links || links.length === 0) {
                console.warn("[StreetView] No links available to move forward");
                blocked = true;
                if (stepsCompleted === 0) {
                  message =
                    "Cannot move forward: no navigable paths available from this location. " +
                    "This may be a dead end, or Street View coverage is limited here. " +
                    "Try turning to face a different direction or teleporting to a nearby location.";
                } else {
                  message =
                    `Reached a dead end after ${stepsCompleted} step${stepsCompleted > 1 ? "s" : ""}. ` +
                    "No further paths available in this direction.";
                }
                break;
              }

              // Find the link closest to current heading
              const currentHeading = panorama.getPov().heading;
              let closestLink: google.maps.StreetViewLink | null = links[0] ?? null;
              let minDiff = Infinity;

              for (const link of links) {
                if (link && link.heading != null) {
                  let diff = Math.abs(link.heading - currentHeading);
                  if (diff > 180) diff = 360 - diff;
                  if (diff < minDiff) {
                    minDiff = diff;
                    closestLink = link;
                  }
                }
              }

              if (closestLink && closestLink.pano) {
                const targetPano = closestLink.pano;
                await new Promise<void>((resolve) => {
                  panorama.setPano(targetPano);
                  // Wait for panorama to load
                  const listener = panorama.addListener("pano_changed", () => {
                    google.maps.event.removeListener(listener);
                    setTimeout(resolve, 400); // Brief pause between steps
                  });

                  // Timeout fallback
                  setTimeout(resolve, 2000);
                });
                stepsCompleted++;
              } else {
                // No valid link found despite having links array
                blocked = true;
                if (stepsCompleted === 0) {
                  message =
                    "Cannot move forward: no valid path found in the current direction. " +
                    "Try turning to face a different direction where a path is visible.";
                } else {
                  message = `Moved ${stepsCompleted} step${stepsCompleted > 1 ? "s" : ""} but then reached a point with no clear path forward.`;
                }
                break;
              }
            }

            // Set success message if we moved at all
            if (!message && stepsCompleted > 0) {
              message = `Successfully moved forward ${stepsCompleted} step${stepsCompleted > 1 ? "s" : ""}.`;
            }

            return {
              stepsCompleted,
              stepsRequested,
              blocked,
              message
            };
          } finally {
            setIsNavigating(false);
          }
        },

        /**
         * Teleport to a named location.
         */
        teleportTo: async (locationName: string) => {
          setIsNavigating(true);

          try {
            // Geocode the location name
            if (!geocoderRef.current) {
              throw new Error("Geocoder not initialized");
            }

            const response = await geocoderRef.current.geocode({
              address: locationName
            });

            if (!response.results[0]) {
              throw new Error(`Location not found: ${locationName}`);
            }

            const location = response.results[0].geometry.location;

            // Find nearest Street View panorama
            if (!streetViewServiceRef.current) {
              throw new Error("Street View service not initialized");
            }

            const svResponse = await streetViewServiceRef.current.getPanorama({
              location: { lat: location.lat(), lng: location.lng() },
              radius: 100,
              preference: google.maps.StreetViewPreference.NEAREST,
              source: google.maps.StreetViewSource.OUTDOOR
            });

            if (svResponse.data.location?.pano) {
              panorama.setPano(svResponse.data.location.pano);

              // Wait for panorama to load
              await new Promise<void>((resolve) => {
                const listener = panorama.addListener("pano_changed", () => {
                  google.maps.event.removeListener(listener);
                  resolve();
                });
                setTimeout(resolve, 2000);
              });
            } else {
              throw new Error(`No Street View coverage at ${locationName}`);
            }
          } finally {
            setIsNavigating(false);
          }
        },

        /**
         * Get current viewport context for AI.
         */
        getContext: () => {
          const pos = panorama.getPosition();
          const pov = panorama.getPov();
          const links = panorama.getLinks();

          return {
            position: pos ? { lat: pos.lat(), lng: pos.lng() } : undefined,
            pov: { heading: pov.heading, pitch: pov.pitch },
            availableDirections: links
              ?.filter((l): l is google.maps.StreetViewLink => l !== null)
              .map((l) => ({
                heading: l.heading,
                description: l.description
              })),
            panoId: panorama.getPano(),
            address: currentAddress
          };
        },

        /**
         * Get current panorama image URL for selfie compositing.
         */
        getStaticImageUrl: (width = 1920, height = 1080) => {
          const pos = panorama.getPosition();
          const pov = panorama.getPov();

          if (!pos) return undefined;

          const params = new URLSearchParams({
            size: `${width}x${height}`,
            location: `${pos.lat()},${pos.lng()}`,
            heading: pov.heading.toString(),
            pitch: pov.pitch.toString(),
            fov: "90",
            key: apiKey
          });

          return `https://maps.googleapis.com/maps/api/streetview?${params.toString()}`;
        }
      };

      // Expose globally
      window.anywhere = api;

      return api;
    },
    [apiKey, setIsNavigating, currentAddress]
  );

  /**
   * Initialize the Street View panorama.
   */
  useEffect(() => {
    let isMounted = true;

    async function initStreetView() {
      if (!containerRef.current) return;

      try {
        // Validate API key
        if (!apiKey || apiKey.trim() === "") {
          throw new Error("Google Maps API key is required");
        }

        const google = await loadGoogleMaps({ apiKey });

        if (!isMounted) return;

        // Initialize Street View Panorama
        const panorama = new google.maps.StreetViewPanorama(containerRef.current, {
          position: { lat: initialLat, lng: initialLng },
          pov: { heading: initialHeading, pitch: initialPitch },
          zoom: 1,
          // Disable default UI for AI control
          disableDefaultUI: true,
          // Keep address control for context
          addressControl: true,
          addressControlOptions: {
            position: google.maps.ControlPosition.BOTTOM_CENTER
          },
          // Disable other controls
          zoomControl: false,
          panControl: false,
          linksControl: false,
          fullscreenControl: false,
          enableCloseButton: false,
          showRoadLabels: true,
          motionTracking: false,
          motionTrackingControl: false
        });

        panoramaRef.current = panorama;
        streetViewServiceRef.current = new google.maps.StreetViewService();
        geocoderRef.current = new google.maps.Geocoder();

        // Listen for position changes
        panorama.addListener("position_changed", () => {
          const pos = panorama.getPosition();
          if (pos) {
            const lat = pos.lat();
            const lng = pos.lng();
            setPosition(lat, lng);
            onPositionChange?.(lat, lng);
            reverseGeocode(lat, lng);
          }
        });

        // Listen for POV changes
        panorama.addListener("pov_changed", () => {
          const pov = panorama.getPov();
          setPov(pov.heading, pov.pitch);
          onPovChange?.(pov.heading, pov.pitch);
        });

        // Listen for pano changes
        panorama.addListener("pano_changed", () => {
          const panoId = panorama.getPano();
          setPanoId(panoId);
        });

        // Expose control API globally for AI agent
        exposeControlAPI(panorama);

        setIsLoaded(true);
        onReady?.();

        console.log("[StreetView] Initialized successfully");
      } catch (err) {
        console.error("[StreetView] Failed to initialize:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to load Street View";
        setError(errorMessage);
        onError?.(err instanceof Error ? err : new Error(errorMessage));
      }
    }

    initStreetView();

    return () => {
      isMounted = false;
      if (panoramaRef.current) {
        google.maps.event.clearInstanceListeners(panoramaRef.current);
      }
      // Clean up global API
      if (window.anywhere) {
        window.anywhere = undefined;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  // Error display
  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive">Failed to Load Street View</h2>
          <p className="mt-2 text-muted-foreground">{error}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            Please check your Google Maps API key and ensure the required APIs are enabled.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {/* Panorama container */}
      <div ref={containerRef} className="h-full w-full" />

      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-lg font-medium text-foreground">Loading Street View...</p>
            <p className="text-sm text-muted-foreground">Preparing your virtual tour</p>
          </div>
        </div>
      )}
    </div>
  );
}
