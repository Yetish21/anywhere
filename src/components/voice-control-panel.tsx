"use client";

/**
 * Voice Control Panel component.
 * Provides UI for voice interaction with the AI tour guide.
 * Features glassmorphism design with visual state indicators.
 *
 * @module voice-control-panel
 */

import { useCallback } from "react";
import { Mic, MicOff, Phone, PhoneOff, History, Camera, Volume2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Props for the VoiceControlPanel component.
 */
export type VoiceControlPanelProps = {
  /** Whether the AI is connected */
  isConnected: boolean;
  /** Whether microphone capture is active */
  isListening: boolean;
  /** Whether the AI is currently speaking */
  isSpeaking: boolean;
  /** Whether navigation is in progress */
  isNavigating?: boolean;
  /** Current user transcript */
  transcript?: string;
  /** Latest AI response */
  aiResponse?: string;
  /** Audio level for visualization (0-1) */
  audioLevel?: number;
  /** Callback to initiate connection */
  onConnect: () => void;
  /** Callback to toggle listening state */
  onToggleListening: () => void;
  /** Callback to open tour history */
  onOpenHistory: () => void;
  /** Callback to open selfie dialog */
  onOpenSelfie: () => void;
  /** Callback to disconnect */
  onDisconnect?: () => void;
};

/**
 * VoiceControlPanel provides the main UI for interacting with the AI.
 * Features include:
 * - Connect/disconnect button
 * - Microphone toggle with visual feedback
 * - Audio level visualization
 * - Speaking indicator
 * - Quick access to history and selfie features
 *
 * @example
 * ```tsx
 * <VoiceControlPanel
 *   isConnected={isConnected}
 *   isListening={isListening}
 *   isSpeaking={isSpeaking}
 *   onConnect={handleConnect}
 *   onToggleListening={handleToggleMic}
 *   onOpenHistory={() => setHistoryOpen(true)}
 *   onOpenSelfie={() => setSelfieOpen(true)}
 * />
 * ```
 */
export function VoiceControlPanel({
  isConnected,
  isListening,
  isSpeaking,
  isNavigating = false,
  transcript = "",
  aiResponse = "",
  audioLevel = 0,
  onConnect,
  onToggleListening,
  onOpenHistory,
  onOpenSelfie,
  onDisconnect
}: VoiceControlPanelProps) {
  /**
   * Handle connection toggle.
   */
  const handleConnectionToggle = useCallback(() => {
    if (isConnected) {
      onDisconnect?.();
    } else {
      onConnect();
    }
  }, [isConnected, onConnect, onDisconnect]);

  /**
   * Get the status text based on current state.
   */
  const getStatusText = useCallback(() => {
    if (!isConnected) return "Not connected";
    if (isNavigating) return "Navigating...";
    if (isSpeaking) return "Speaking...";
    if (isListening) return "Listening...";
    return "Ready";
  }, [isConnected, isNavigating, isSpeaking, isListening]);

  /**
   * Get the status color class based on current state.
   */
  const getStatusColor = useCallback(() => {
    if (!isConnected) return "bg-muted-foreground";
    if (isNavigating) return "bg-yellow-500";
    if (isSpeaking) return "bg-purple-500";
    if (isListening) return "bg-green-500";
    return "bg-blue-500";
  }, [isConnected, isNavigating, isSpeaking, isListening]);

  return (
    <TooltipProvider>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        {/* Main control panel */}
        <div
          className={cn(
            "flex flex-col items-center gap-4 rounded-2xl p-4",
            "bg-black/60 backdrop-blur-xl border border-white/10",
            "shadow-2xl shadow-black/50"
          )}
        >
          {/* Status indicator and response area */}
          <div className="flex items-center gap-3 px-2">
            {/* Status dot */}
            <div
              className={cn("h-2 w-2 rounded-full", getStatusColor(), (isListening || isSpeaking) && "animate-pulse")}
            />

            {/* Status text */}
            <span className="text-sm font-medium text-white/80">{getStatusText()}</span>

            {/* Audio level indicator when listening */}
            {isListening && (
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-1 rounded-full bg-green-500 transition-all duration-75",
                      audioLevel > i * 0.2 ? "opacity-100" : "opacity-30"
                    )}
                    style={{
                      height: `${Math.max(4, Math.min(16, 4 + audioLevel * 12 * (1 + Math.sin(i))))}px`
                    }}
                  />
                ))}
              </div>
            )}

            {/* Speaking indicator */}
            {isSpeaking && <Volume2 className="h-4 w-4 text-purple-400 animate-pulse" />}
          </div>

          {/* Transcript/Response display */}
          {(transcript || aiResponse) && (
            <div className="max-w-md px-3">
              {transcript && <p className="text-xs text-white/60 italic truncate">You: {transcript}</p>}
              {aiResponse && <p className="text-sm text-white/90 line-clamp-2 mt-1">{aiResponse}</p>}
            </div>
          )}

          {/* Control buttons */}
          <div className="flex items-center gap-3">
            {/* Connection button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isConnected ? "destructive" : "default"}
                  size="icon"
                  className={cn("h-12 w-12 rounded-full", !isConnected && "bg-green-600 hover:bg-green-700")}
                  onClick={handleConnectionToggle}
                >
                  {isConnected ? <PhoneOff className="h-5 w-5" /> : <Phone className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isConnected ? "Disconnect" : "Connect to AI"}</TooltipContent>
            </Tooltip>

            {/* Microphone button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isListening ? "default" : "outline"}
                  size="icon"
                  className={cn(
                    "h-14 w-14 rounded-full transition-all",
                    isListening
                      ? "bg-green-600 hover:bg-green-700 ring-4 ring-green-500/30"
                      : "bg-white/10 hover:bg-white/20 border-white/20"
                  )}
                  onClick={onToggleListening}
                  disabled={!isConnected}
                >
                  {isListening ? <Mic className="h-6 w-6 text-white" /> : <MicOff className="h-6 w-6 text-white/70" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isListening ? "Stop listening" : "Start listening"}</TooltipContent>
            </Tooltip>

            {/* History button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 border-white/20"
                  onClick={onOpenHistory}
                >
                  <History className="h-5 w-5 text-white/70" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Tour History</TooltipContent>
            </Tooltip>

            {/* Selfie button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 border-white/20"
                  onClick={onOpenSelfie}
                >
                  <Camera className="h-5 w-5 text-white/70" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Take Selfie</TooltipContent>
            </Tooltip>
          </div>

          {/* Navigation indicator */}
          {isNavigating && (
            <div className="flex items-center gap-2 text-yellow-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs font-medium">Moving...</span>
            </div>
          )}
        </div>

        {/* Keyboard hint */}
        {isConnected && !isListening && (
          <p className="mt-2 text-center text-xs text-white/40">
            Click the microphone or press <kbd className="px-1 py-0.5 rounded bg-white/10">Space</kbd> to talk
          </p>
        )}
      </div>
    </TooltipProvider>
  );
}
