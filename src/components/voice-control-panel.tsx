"use client";

/**
 * Voice Control Panel component.
 * Provides UI for voice interaction with the AI tour guide.
 * Features glassmorphism design with visual state indicators.
 *
 * Redesigned for simplicity:
 * - Single primary button combines connect + mic control
 * - Text wraps properly and area expands to fit content
 * - Cleaner visual hierarchy
 *
 * @module voice-control-panel
 */

import { useCallback } from "react";
import { Mic, MicOff, Phone, History, Camera, Volume2, Loader2 } from "lucide-react";
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
 *
 * Redesigned UX:
 * - NOT CONNECTED: Shows "Start Call" button
 * - CONNECTED + LISTENING: Shows active mic with visual feedback
 * - CONNECTED + NOT LISTENING: Shows muted mic button
 *
 * The transcript/response area now:
 * - Wraps text properly (no truncation)
 * - Expands to fit content (up to a reasonable max)
 * - Shows a scrollable area for very long responses
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
   * Handle primary button click.
   * - If not connected: Connect
   * - If connected: Toggle listening
   */
  const handlePrimaryAction = useCallback(() => {
    if (!isConnected) {
      onConnect();
    } else {
      onToggleListening();
    }
  }, [isConnected, onConnect, onToggleListening]);

  /**
   * Handle disconnect button click.
   */
  const handleDisconnect = useCallback(() => {
    onDisconnect?.();
  }, [onDisconnect]);

  /**
   * Get the status text based on current state.
   */
  const getStatusText = useCallback(() => {
    if (!isConnected) return "Ready to connect";
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

  /**
   * Get primary button configuration.
   */
  const getPrimaryButtonConfig = useCallback(() => {
    if (!isConnected) {
      return {
        icon: Phone,
        label: "Start Call",
        className: "bg-green-600 hover:bg-green-700 text-white",
        tooltip: "Connect to AI Tour Guide"
      };
    }
    if (isListening) {
      return {
        icon: Mic,
        label: "Listening",
        className: "bg-green-600 hover:bg-green-700 text-white ring-4 ring-green-500/30",
        tooltip: "Mute microphone"
      };
    }
    return {
      icon: MicOff,
      label: "Muted",
      className: "bg-red-600/80 hover:bg-red-700 text-white",
      tooltip: "Unmute microphone"
    };
  }, [isConnected, isListening]);

  const primaryConfig = getPrimaryButtonConfig();
  const PrimaryIcon = primaryConfig.icon;

  return (
    <TooltipProvider>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90vw] max-w-2xl">
        {/* Main control panel */}
        <div
          className={cn(
            "flex flex-col items-center gap-4 rounded-2xl p-4",
            "bg-black/70 backdrop-blur-xl border border-white/10",
            "shadow-2xl shadow-black/50"
          )}
        >
          {/* Status indicator row */}
          <div className="flex items-center justify-center gap-3 w-full">
            {/* Status dot */}
            <div
              className={cn(
                "h-2.5 w-2.5 rounded-full flex-shrink-0",
                getStatusColor(),
                (isListening || isSpeaking) && "animate-pulse"
              )}
            />

            {/* Status text */}
            <span className="text-sm font-medium text-white/90">{getStatusText()}</span>

            {/* Audio level indicator when listening */}
            {isListening && (
              <div className="flex items-center gap-0.5 ml-2">
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
            {isSpeaking && <Volume2 className="h-4 w-4 text-purple-400 animate-pulse ml-2" />}

            {/* Navigation indicator */}
            {isNavigating && <Loader2 className="h-4 w-4 text-yellow-400 animate-spin ml-2" />}
          </div>

          {/* Transcript/Response display - expandable with wrapping */}
          {(transcript || aiResponse) && (
            <div className="w-full max-h-40 overflow-y-auto px-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
              {transcript && (
                <p className="text-sm text-white/60 italic mb-1 break-words">
                  <span className="font-medium">You:</span> {transcript}
                </p>
              )}
              {aiResponse && <p className="text-sm text-white/90 break-words leading-relaxed">{aiResponse}</p>}
            </div>
          )}

          {/* Control buttons */}
          <div className="flex items-center gap-3">
            {/* Disconnect button - only shown when connected */}
            {isConnected && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-11 w-11 rounded-full bg-red-600/60 hover:bg-red-700"
                    onClick={handleDisconnect}
                  >
                    <Phone className="h-4 w-4 rotate-[135deg]" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>End Call</TooltipContent>
              </Tooltip>
            )}

            {/* Primary action button - Connect or Mic toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="lg"
                  className={cn("h-16 w-16 rounded-full transition-all font-medium", primaryConfig.className)}
                  onClick={handlePrimaryAction}
                >
                  <PrimaryIcon className="h-7 w-7" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{primaryConfig.tooltip}</TooltipContent>
            </Tooltip>

            {/* History button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 border-white/20"
                  onClick={onOpenHistory}
                >
                  <History className="h-4 w-4 text-white/70" />
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
                  className="h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 border-white/20"
                  onClick={onOpenSelfie}
                >
                  <Camera className="h-4 w-4 text-white/70" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Take Selfie</TooltipContent>
            </Tooltip>
          </div>

          {/* Keyboard hint - only when connected and not listening */}
          {isConnected && !isListening && (
            <p className="text-xs text-white/40">
              Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono">Space</kbd> to unmute
            </p>
          )}

          {/* Initial hint when not connected */}
          {!isConnected && <p className="text-xs text-white/40">Click to start your AI-guided tour</p>}
        </div>
      </div>
    </TooltipProvider>
  );
}
