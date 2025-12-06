/**
 * Google Maps API loader utility.
 * Ensures the Google Maps script is loaded only once and provides
 * typed access to the google.maps namespace.
 *
 * @module maps-loader
 */

import { Loader } from "@googlemaps/js-api-loader";

/** Singleton loader instance */
let loaderInstance: Loader | undefined;

/** Promise that resolves when the API is loaded */
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
  libraries?: ("places" | "geometry" | "drawing" | "visualization")[];
};

/**
 * Initializes and returns the Google Maps API.
 * This function is idempotent—calling it multiple times returns the same promise.
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
    throw new Error("Google Maps API key is required. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment.");
  }

  // Create loader instance
  loaderInstance = new Loader({
    apiKey: config.apiKey,
    version: config.version ?? "weekly",
    libraries: config.libraries ?? ["places", "geometry"]
  });

  // Store and return the load promise
  loadPromise = loaderInstance.load();
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
 */
export function resetMapsLoader(): void {
  loaderInstance = undefined;
  loadPromise = undefined;
}

/**
 * Gets the current loader instance, if one exists.
 *
 * @returns The Loader instance or undefined if not initialized
 */
export function getLoaderInstance(): Loader | undefined {
  return loaderInstance;
}
