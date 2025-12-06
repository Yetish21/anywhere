"use client";

/**
 * Anywhere Explorer component.
 * Main orchestrator that coordinates all features:
 * - Street View panorama
 * - Gemini Live voice interaction
 * - Navigation function execution
 * - UI state management
 *
 * @module anywhere-explorer
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { StreetViewPanorama } from "@/components/street-view/street-view-panorama";
import { VoiceControlPanel } from "@/components/voice-control-panel";
import { LocationOverlay } from "@/components/location-overlay";
import { SelfieDialog } from "@/components/selfie-dialog";
import { TourHistorySheet } from "@/components/tour-history-sheet";
import { GeminiLiveClient } from "@/lib/gemini-live-client";
import { AudioHandler } from "@/lib/audio-handler";
import { useStreetViewStore } from "@/stores/street-view-store";
import { navigationFunctions } from "@/lib/navigation-tools";
import { SYSTEM_PROMPT } from "@/lib/system-prompt";

/**
 * AnywhereExplorer is the main container component that orchestrates
 * all features of the Anywhere application.
 *
 * Responsibilities:
 * - Initializes and manages the Gemini Live connection
 * - Handles audio capture and playback
 * - Routes AI function calls to Street View controls
 * - Manages periodic context updates to the AI
 * - Coordinates all UI components
 *
 * @example
 * ```tsx
 * // In your page component
 * export default function Home() {
 *   return (
 *     <main className="h-screen w-screen">
 *       <AnywhereExplorer />
 *     </main>
 *   );
 * }
 * ```
 */
export function AnywhereExplorer() {
  // UI state
  const [selfieDialogOpen, setSelfieDialogOpen] = useState(false);
  const [historySheetOpen, setHistorySheetOpen] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // Refs for clients (preserved across renders)
  const geminiClientRef = useRef<GeminiLiveClient | undefined>(undefined);
  const audioHandlerRef = useRef<AudioHandler | undefined>(undefined);
  const contextIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Zustand store
  const {
    currentPosition,
    currentPov,
    currentAddress,
    isConnected,
    isListening,
    isSpeaking,
    isNavigating,
    currentTranscript,
    latestAiResponse,
    setIsConnected,
    setIsListening,
    setIsSpeaking,
    setCurrentTranscript,
    setLatestAiResponse,
    addCheckpoint,
    setError
  } = useStreetViewStore();

  /**
   * Execute a navigation function called by Gemini.
   * Routes function calls to the window.anywhere control API.
   */
  const executeFunctionCall = useCallback(async (name: string, args: Record<string, unknown>): Promise<unknown> => {
    const anywhere = window.anywhere;

    if (!anywhere) {
      console.error("[Explorer] Street View control API not available");
      return {
        success: false,
        error: "Street View control API not available"
      };
    }

    console.log(`[Explorer] Executing function: ${name}`, args);

    try {
      switch (name) {
        case "pan_camera": {
          const heading = args.heading_degrees as number;
          const pitch = args.pitch_degrees as number;
          await anywhere.panTo(heading, pitch);
          return {
            success: true,
            message: `Camera panned to heading ${heading}°, pitch ${pitch}°`
          };
        }

        case "move_forward": {
          const steps = args.steps as number;
          await anywhere.moveForward(steps);
          return {
            success: true,
            message: `Moved forward ${steps} step${steps > 1 ? "s" : ""}`
          };
        }

        case "teleport": {
          const locationName = args.location_name as string;
          await anywhere.teleportTo(locationName);
          return {
            success: true,
            message: `Teleported to ${locationName}`
          };
        }

        case "look_at": {
          // For look_at, we would need vision capabilities
          // For now, acknowledge the request
          const objectDescription = args.object_description as string;
          return {
            success: false,
            message: `Vision-based look_at for "${objectDescription}" not yet implemented. Please use pan_camera with specific heading/pitch values instead.`
          };
        }

        case "get_location_info": {
          // Return current context - Gemini will use Google Search grounding
          const context = anywhere.getContext();
          return {
            success: true,
            context,
            message: "Use Google Search to find information about this location"
          };
        }

        case "take_selfie": {
          setSelfieDialogOpen(true);
          return {
            success: true,
            message: "Selfie dialog opened. The user can now upload their photo and generate a souvenir image."
          };
        }

        default:
          return {
            success: false,
            error: `Unknown function: ${name}`
          };
      }
    } catch (error) {
      console.error(`[Explorer] Function ${name} failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }, []);

  /**
   * Initialize the Gemini Live client and audio handler.
   */
  const initializeConnection = useCallback(async () => {
    const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!geminiApiKey) {
      setError("Gemini API key not configured. Please set NEXT_PUBLIC_GEMINI_API_KEY.");
      return;
    }

    try {
      // Initialize Gemini Live client
      geminiClientRef.current = new GeminiLiveClient({
        apiKey: geminiApiKey,
        systemInstruction: SYSTEM_PROMPT,
        tools: navigationFunctions,
        onAudioResponse: (audioData) => {
          setIsSpeaking(true);
          audioHandlerRef.current?.playAudio(audioData);
        },
        onFunctionCall: executeFunctionCall,
        onTextResponse: (text) => {
          setLatestAiResponse(text);
        },
        onConnectionChange: (connected) => {
          setIsConnected(connected);
          if (!connected) {
            setIsListening(false);
            setIsSpeaking(false);
          }
        },
        onError: (error) => {
          console.error("[Explorer] Gemini error:", error);
          setError(error.message);
        },
        onTurnComplete: () => {
          setIsSpeaking(false);
        },
        onTranscript: (transcript) => {
          setCurrentTranscript(transcript);
        }
      });

      // Initialize audio handler
      audioHandlerRef.current = new AudioHandler({
        onAudioData: (buffer) => {
          if (geminiClientRef.current?.isConnected()) {
            geminiClientRef.current.sendAudio(buffer);
          }
        },
        onAudioLevel: (level) => {
          setAudioLevel(level);
        },
        onPlaybackStop: () => {
          setIsSpeaking(false);
        }
      });

      // Connect to Gemini
      await geminiClientRef.current.connect();

      // Send initial greeting
      if (currentPosition && currentAddress) {
        setTimeout(() => {
          geminiClientRef.current?.sendText(
            `Hello! I've just connected. I'm currently at ${currentAddress}. Please give me a brief welcome and describe what I'm seeing.`
          );
        }, 1000);
      }
    } catch (error) {
      console.error("[Explorer] Failed to initialize:", error);
      setError(error instanceof Error ? error.message : "Failed to connect");
    }
  }, [
    executeFunctionCall,
    setIsConnected,
    setIsListening,
    setIsSpeaking,
    setLatestAiResponse,
    setCurrentTranscript,
    setError,
    currentPosition,
    currentAddress
  ]);

  /**
   * Disconnect from Gemini and cleanup.
   */
  const disconnect = useCallback(() => {
    audioHandlerRef.current?.stopCapture();
    audioHandlerRef.current?.stopPlayback();
    geminiClientRef.current?.disconnect();
    setIsConnected(false);
    setIsListening(false);
    setIsSpeaking(false);
  }, [setIsConnected, setIsListening, setIsSpeaking]);

  /**
   * Toggle microphone capture.
   */
  const toggleListening = useCallback(async () => {
    if (!isConnected) {
      console.warn("[Explorer] Cannot toggle listening: not connected");
      return;
    }

    if (isListening) {
      audioHandlerRef.current?.stopCapture();
      setIsListening(false);
    } else {
      try {
        await audioHandlerRef.current?.startCapture();
        setIsListening(true);
      } catch (error) {
        console.error("[Explorer] Failed to start capture:", error);
        setError(error instanceof Error ? error.message : "Failed to access microphone");
      }
    }
  }, [isConnected, isListening, setIsListening, setError]);

  /**
   * Send periodic context updates to keep the AI aware of current position.
   */
  useEffect(() => {
    if (!isConnected || !currentPosition) {
      if (contextIntervalRef.current) {
        clearInterval(contextIntervalRef.current);
        contextIntervalRef.current = undefined;
      }
      return;
    }

    // Send context update every 5 seconds
    contextIntervalRef.current = setInterval(() => {
      if (geminiClientRef.current?.isConnected()) {
        geminiClientRef.current.sendContextUpdate({
          position: currentPosition,
          pov: currentPov,
          address: currentAddress
        });
      }
    }, 5000);

    return () => {
      if (contextIntervalRef.current) {
        clearInterval(contextIntervalRef.current);
      }
    };
  }, [isConnected, currentPosition, currentPov, currentAddress]);

  /**
   * Handle keyboard shortcuts.
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Space to toggle listening
      if (event.code === "Space" && isConnected && !event.repeat) {
        event.preventDefault();
        toggleListening();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isConnected, toggleListening]);

  /**
   * Cleanup on unmount.
   */
  useEffect(() => {
    return () => {
      audioHandlerRef.current?.dispose();
      geminiClientRef.current?.disconnect();
      if (contextIntervalRef.current) {
        clearInterval(contextIntervalRef.current);
      }
    };
  }, []);

  /**
   * Handle position changes - add checkpoint on significant moves.
   */
  const handlePositionChange = useCallback(() => {
    // Add checkpoint if we've moved significantly
    if (isConnected && latestAiResponse) {
      addCheckpoint(latestAiResponse);
    }
  }, [isConnected, latestAiResponse, addCheckpoint]);

  // Get API key for Street View
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  return (
    <div className="relative h-full w-full bg-black">
      {/* Street View Panorama */}
      <StreetViewPanorama
        apiKey={mapsApiKey}
        initialLat={48.8584}
        initialLng={2.2945}
        initialHeading={180}
        initialPitch={0}
        onPositionChange={handlePositionChange}
      />

      {/* Location Overlay */}
      <LocationOverlay
        address={currentAddress}
        position={currentPosition}
        heading={currentPov.heading}
        isNavigating={isNavigating}
      />

      {/* Voice Control Panel */}
      <VoiceControlPanel
        isConnected={isConnected}
        isListening={isListening}
        isSpeaking={isSpeaking}
        isNavigating={isNavigating}
        transcript={currentTranscript}
        aiResponse={latestAiResponse}
        audioLevel={audioLevel}
        onConnect={initializeConnection}
        onToggleListening={toggleListening}
        onOpenHistory={() => setHistorySheetOpen(true)}
        onOpenSelfie={() => setSelfieDialogOpen(true)}
        onDisconnect={disconnect}
      />

      {/* Selfie Dialog */}
      <SelfieDialog open={selfieDialogOpen} onOpenChange={setSelfieDialogOpen} />

      {/* Tour History Sheet */}
      <TourHistorySheet open={historySheetOpen} onOpenChange={setHistorySheetOpen} />

      {/* API Key Warning */}
      {!mapsApiKey && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/90 z-50">
          <div className="text-center max-w-md p-6">
            <h2 className="text-xl font-bold text-destructive mb-2">API Key Required</h2>
            <p className="text-muted-foreground mb-4">
              Please configure your Google Maps API key in the environment variables:
            </p>
            <code className="block bg-muted p-3 rounded text-sm">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here</code>
          </div>
        </div>
      )}
    </div>
  );
}
