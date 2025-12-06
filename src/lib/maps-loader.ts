/**
 * Google Maps API loader utility.
 * Ensures the Google Maps script is loaded only once and provides
 * typed access to the google.maps namespace.
 *
 * Uses @googlemaps/js-api-loader v2 API with setOptions() and importLibrary().
 *
 * @module maps-loader
 * @see https://github.com/googlemaps/js-api-loader
 */

import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

/** Flag indicating if setOptions has been called */
let optionsConfigured = false;

/** Promise that resolves when all required libraries are loaded */
let loadPromise: Promise<typeof google> | undefined;

/**
 * Configuration options for the Google Maps loader.
 */
type MapsLoaderConfig = {
  /** Google Maps API key */
  apiKey: string;
  /** API version to load (default: "weekly") */
  version?: string;
  /** Additional libraries to load */
  libraries?: ("places" | "geometry" | "drawing" | "visualization" | "streetView" | "geocoding" | "core" | "maps")[];
};

/**
 * Initializes and returns the Google Maps API.
 * This function is idempotent—calling it multiple times returns the same promise.
 *
 * Uses the v2 API of @googlemaps/js-api-loader which requires:
 * 1. setOptions() to configure the API key and options (called once)
 * 2. importLibrary() to load specific libraries
 *
 * @param config - Configuration options for the loader
 * @returns Promise resolving to the google namespace
 *
 * @example
 * ```typescript
 * const google = await loadGoogleMaps({ apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY! });
 * const panorama = new google.maps.StreetViewPanorama(element, options);
 * ```
 *
 * @throws {Error} If the API fails to load (e.g., invalid API key, network error)
 */
export async function loadGoogleMaps(config: MapsLoaderConfig): Promise<typeof google> {
  // Return existing promise if already loading or loaded
  if (loadPromise) {
    return loadPromise;
  }

  // Validate API key
  if (!config.apiKey || config.apiKey.trim() === "") {
    throw new Error(
      "Google Maps API key is required. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment."
    );
  }

  // Configure options only once (subsequent calls are ignored by the library)
  if (!optionsConfigured) {
    setOptions({
      key: config.apiKey,
      v: config.version ?? "weekly"
    });
    optionsConfigured = true;
  }

  // Determine which libraries to load
  // Default libraries needed for Street View functionality
  const defaultLibraries: MapsLoaderConfig["libraries"] = ["core", "streetView", "geocoding"];

  // Merge user-specified libraries with defaults (deduplicated)
  const librariesToLoad = new Set([...defaultLibraries, ...(config.libraries ?? [])]);

  // Create the load promise that imports all required libraries
  loadPromise = (async (): Promise<typeof google> => {
    try {
      // Load all required libraries in parallel
      // importLibrary() returns the library object and also makes it available globally
      await Promise.all(Array.from(librariesToLoad).map((lib) => importLibrary(lib)));

      // After loading, google.maps namespace is available globally
      if (typeof google === "undefined" || typeof google.maps === "undefined") {
        throw new Error("Google Maps failed to initialize after loading libraries");
      }

      return google;
    } catch (error) {
      // Reset state on error to allow retry
      loadPromise = undefined;
      throw error;
    }
  })();

  return loadPromise;
}

/**
 * Checks if the Google Maps API has been loaded.
 *
 * @returns true if the API is available in the global scope
 *
 * @example
 * ```typescript
 * if (isMapsLoaded()) {
 *   // Safe to use google.maps directly
 *   const geocoder = new google.maps.Geocoder();
 * }
 * ```
 */
export function isMapsLoaded(): boolean {
  return typeof google !== "undefined" && typeof google.maps !== "undefined";
}

/**
 * Resets the loader state. Useful for testing or when you need to
 * reinitialize with different configuration.
 *
 * @remarks
 * This does not unload the Google Maps script from the page—once loaded,
 * the script remains. This only resets the internal state of this module.
 *
 * Note: With v2 of the loader, setOptions() can only be called once.
 * Calling resetMapsLoader() will reset the local state but the API
 * will still use the originally configured options.
 */
export function resetMapsLoader(): void {
  loadPromise = undefined;
  // Note: optionsConfigured is intentionally NOT reset because setOptions()
  // can only be called once per page load according to the v2 API
}

/**
 * Checks if the loader options have been configured.
 *
 * @returns true if setOptions has been called
 */
export function isLoaderConfigured(): boolean {
  return optionsConfigured;
}
