/**
 * Zustand store for Street View state management.
 * Maintains current position, POV, navigation state, and tour history.
 *
 * @module street-view-store
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";

/**
 * Geographic position with latitude and longitude.
 */
export type Position = {
  /** Latitude in degrees */
  lat: number;
  /** Longitude in degrees */
  lng: number;
};

/**
 * Point of View representing camera orientation.
 */
export type Pov = {
  /** Heading in degrees (0-360, where 0=North, 90=East) */
  heading: number;
  /** Pitch in degrees (-90 to 90, where 0=horizon) */
  pitch: number;
};

/**
 * Tour checkpoint for history tracking.
 * Captures the state at a specific moment during the tour.
 */
export type TourCheckpoint = {
  /** Unique identifier for this checkpoint */
  id: string;
  /** Geographic position at this checkpoint */
  position: Position;
  /** Camera orientation at this checkpoint */
  pov: Pov;
  /** Reverse-geocoded address (if available) */
  address: string | undefined;
  /** When this checkpoint was created */
  timestamp: Date;
  /** AI's narration or description at this point */
  aiNarration: string | undefined;
  /** Optional screenshot thumbnail (base64) */
  thumbnail?: string;
};

/**
 * Generated selfie image record.
 */
export type SelfieImage = {
  /** Unique identifier */
  id: string;
  /** Base64 encoded image data */
  imageBase64: string;
  /** MIME type of the image */
  mimeType: string;
  /** Location where the selfie was taken */
  location: {
    position: Position;
    address: string | undefined;
  };
  /** Style used for generation */
  style: string;
  /** When the selfie was generated */
  timestamp: Date;
};

/**
 * Street View store state shape.
 */
export type StreetViewState = {
  // ============================================
  // Current Viewport State
  // ============================================

  /** Current geographic position */
  currentPosition: Position | undefined;
  /** Current camera point of view */
  currentPov: Pov;
  /** Current reverse-geocoded address */
  currentAddress: string | undefined;
  /** Current Street View panorama ID */
  currentPanoId: string | undefined;

  // ============================================
  // Session State
  // ============================================

  /** Whether the AI is connected */
  isConnected: boolean;
  /** Whether navigation is in progress */
  isNavigating: boolean;
  /** Whether the AI is currently speaking */
  isSpeaking: boolean;
  /** Whether microphone capture is active */
  isListening: boolean;
  /** Current transcription of user speech */
  currentTranscript: string;
  /** Latest AI response text */
  latestAiResponse: string;

  // ============================================
  // Tour History
  // ============================================

  /** Array of visited locations */
  tourHistory: TourCheckpoint[];

  // ============================================
  // Selfie Feature
  // ============================================

  /** User's uploaded photo for selfie generation (base64) */
  userPhoto: string | undefined;
  /** MIME type of the user's photo */
  userPhotoMimeType: string | undefined;
  /** Array of generated selfie images */
  selfieImages: SelfieImage[];
  /** Whether a selfie is currently being generated */
  isGeneratingSelfie: boolean;

  // ============================================
  // Error State
  // ============================================

  /** Current error message (if any) */
  error: string | undefined;

  // ============================================
  // Actions
  // ============================================

  /** Sets the current geographic position */
  setPosition: (lat: number, lng: number) => void;
  /** Sets the current point of view */
  setPov: (heading: number, pitch: number) => void;
  /** Sets the current address */
  setAddress: (address: string) => void;
  /** Sets the current panorama ID */
  setPanoId: (panoId: string) => void;
  /** Sets the connection state */
  setIsConnected: (connected: boolean) => void;
  /** Sets the navigation state */
  setIsNavigating: (navigating: boolean) => void;
  /** Sets the speaking state */
  setIsSpeaking: (speaking: boolean) => void;
  /** Sets the listening state */
  setIsListening: (listening: boolean) => void;
  /** Sets the current transcript */
  setCurrentTranscript: (transcript: string) => void;
  /** Sets the latest AI response */
  setLatestAiResponse: (response: string) => void;
  /** Adds a checkpoint to the tour history */
  addCheckpoint: (narration?: string, thumbnail?: string) => void;
  /** Removes a checkpoint from history */
  removeCheckpoint: (id: string) => void;
  /** Sets the user's photo for selfie generation */
  setUserPhoto: (photo: string | undefined, mimeType?: string) => void;
  /** Adds a generated selfie image */
  addSelfieImage: (image: Omit<SelfieImage, "id" | "timestamp">) => void;
  /** Removes a selfie image */
  removeSelfieImage: (id: string) => void;
  /** Sets the selfie generation state */
  setIsGeneratingSelfie: (generating: boolean) => void;
  /** Sets an error message */
  setError: (error: string | undefined) => void;
  /** Clears the tour history and selfies */
  clearTour: () => void;
  /** Resets the entire store to initial state */
  reset: () => void;
};

/**
 * Initial state values for the store.
 */
const initialState: Omit<StreetViewState, keyof StreetViewActions> = {
  currentPosition: undefined,
  currentPov: { heading: 0, pitch: 0 },
  currentAddress: undefined,
  currentPanoId: undefined,
  isConnected: false,
  isNavigating: false,
  isSpeaking: false,
  isListening: false,
  currentTranscript: "",
  latestAiResponse: "",
  tourHistory: [],
  userPhoto: undefined,
  userPhotoMimeType: undefined,
  selfieImages: [],
  isGeneratingSelfie: false,
  error: undefined
};

/**
 * Action methods for the store (used for typing).
 */
type StreetViewActions = {
  setPosition: (lat: number, lng: number) => void;
  setPov: (heading: number, pitch: number) => void;
  setAddress: (address: string) => void;
  setPanoId: (panoId: string) => void;
  setIsConnected: (connected: boolean) => void;
  setIsNavigating: (navigating: boolean) => void;
  setIsSpeaking: (speaking: boolean) => void;
  setIsListening: (listening: boolean) => void;
  setCurrentTranscript: (transcript: string) => void;
  setLatestAiResponse: (response: string) => void;
  addCheckpoint: (narration?: string, thumbnail?: string) => void;
  removeCheckpoint: (id: string) => void;
  setUserPhoto: (photo: string | undefined, mimeType?: string) => void;
  addSelfieImage: (image: Omit<SelfieImage, "id" | "timestamp">) => void;
  removeSelfieImage: (id: string) => void;
  setIsGeneratingSelfie: (generating: boolean) => void;
  setError: (error: string | undefined) => void;
  clearTour: () => void;
  reset: () => void;
};

/**
 * Generates a unique ID for checkpoints and selfies.
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Street View store instance.
 * Uses Zustand with devtools middleware for debugging.
 *
 * @example
 * ```typescript
 * // In a component
 * const { currentPosition, currentPov, setPosition } = useStreetViewStore();
 *
 * // Or select specific values
 * const isConnected = useStreetViewStore((state) => state.isConnected);
 * ```
 */
export const useStreetViewStore = create<StreetViewState>()(
  devtools(
    (set, get) => ({
      // Initial state
      ...initialState,

      // Actions
      setPosition: (lat, lng) => {
        set({ currentPosition: { lat, lng } }, false, "setPosition");
      },

      setPov: (heading, pitch) => {
        set({ currentPov: { heading, pitch } }, false, "setPov");
      },

      setAddress: (address) => {
        set({ currentAddress: address }, false, "setAddress");
      },

      setPanoId: (panoId) => {
        set({ currentPanoId: panoId }, false, "setPanoId");
      },

      setIsConnected: (connected) => {
        set({ isConnected: connected }, false, "setIsConnected");
      },

      setIsNavigating: (navigating) => {
        set({ isNavigating: navigating }, false, "setIsNavigating");
      },

      setIsSpeaking: (speaking) => {
        set({ isSpeaking: speaking }, false, "setIsSpeaking");
      },

      setIsListening: (listening) => {
        set({ isListening: listening }, false, "setIsListening");
      },

      setCurrentTranscript: (transcript) => {
        set({ currentTranscript: transcript }, false, "setCurrentTranscript");
      },

      setLatestAiResponse: (response) => {
        set({ latestAiResponse: response }, false, "setLatestAiResponse");
      },

      addCheckpoint: (narration, thumbnail) => {
        const state = get();
        if (!state.currentPosition) {
          console.warn("[Store] Cannot add checkpoint: no current position");
          return;
        }

        const checkpoint: TourCheckpoint = {
          id: generateId(),
          position: { ...state.currentPosition },
          pov: { ...state.currentPov },
          address: state.currentAddress,
          timestamp: new Date(),
          aiNarration: narration,
          thumbnail
        };

        set({ tourHistory: [...state.tourHistory, checkpoint] }, false, "addCheckpoint");
      },

      removeCheckpoint: (id) => {
        const state = get();
        set(
          {
            tourHistory: state.tourHistory.filter((c) => c.id !== id)
          },
          false,
          "removeCheckpoint"
        );
      },

      setUserPhoto: (photo, mimeType) => {
        set(
          {
            userPhoto: photo,
            userPhotoMimeType: mimeType ?? "image/jpeg"
          },
          false,
          "setUserPhoto"
        );
      },

      addSelfieImage: (image) => {
        const state = get();
        const selfieImage: SelfieImage = {
          ...image,
          id: generateId(),
          timestamp: new Date()
        };

        set({ selfieImages: [...state.selfieImages, selfieImage] }, false, "addSelfieImage");
      },

      removeSelfieImage: (id) => {
        const state = get();
        set(
          {
            selfieImages: state.selfieImages.filter((s) => s.id !== id)
          },
          false,
          "removeSelfieImage"
        );
      },

      setIsGeneratingSelfie: (generating) => {
        set({ isGeneratingSelfie: generating }, false, "setIsGeneratingSelfie");
      },

      setError: (error) => {
        set({ error }, false, "setError");
      },

      clearTour: () => {
        set(
          {
            tourHistory: [],
            selfieImages: []
          },
          false,
          "clearTour"
        );
      },

      reset: () => {
        set(initialState, false, "reset");
      }
    }),
    { name: "StreetViewStore" }
  )
);

/**
 * Selector for getting the current viewport context.
 * Useful for sending context updates to the AI.
 */
export const selectViewportContext = (state: StreetViewState) => ({
  position: state.currentPosition,
  pov: state.currentPov,
  address: state.currentAddress
});

/**
 * Selector for getting the current session state.
 */
export const selectSessionState = (state: StreetViewState) => ({
  isConnected: state.isConnected,
  isNavigating: state.isNavigating,
  isSpeaking: state.isSpeaking,
  isListening: state.isListening
});

/**
 * Selector for getting tour history count.
 */
export const selectTourHistoryCount = (state: StreetViewState) => state.tourHistory.length;

/**
 * Selector for getting selfie count.
 */
export const selectSelfieCount = (state: StreetViewState) => state.selfieImages.length;
