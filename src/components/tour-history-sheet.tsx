"use client";

/**
 * Tour History Sheet component.
 * Displays a slide-out panel with visited locations and generated selfies.
 *
 * @module tour-history-sheet
 */

import { useCallback } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Clock, Trash2, Navigation, Image as ImageIcon, ChevronRight } from "lucide-react";
import { useStreetViewStore, type TourCheckpoint, type SelfieImage } from "@/stores/street-view-store";

/**
 * Props for the TourHistorySheet component.
 */
export type TourHistorySheetProps = {
  /** Whether the sheet is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
};

/**
 * Formats a date for display.
 */
function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(date);
}

/**
 * Formats coordinates for display.
 */
function formatCoords(lat: number, lng: number): string {
  return `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
}

/**
 * CheckpointCard displays a single tour checkpoint.
 */
function CheckpointCard({
  checkpoint,
  onTeleport,
  onDelete
}: {
  checkpoint: TourCheckpoint;
  onTeleport: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="p-3 group hover:bg-muted/50 transition-colors">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <MapPin className="h-4 w-4 text-primary" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Address */}
          <p className="text-sm font-medium leading-tight truncate">{checkpoint.address || "Unknown location"}</p>

          {/* Coordinates and time */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">{formatCoords(checkpoint.position.lat, checkpoint.position.lng)}</span>
            <span>•</span>
            <Clock className="h-3 w-3" />
            <span>{formatTime(checkpoint.timestamp)}</span>
          </div>

          {/* AI narration preview */}
          {checkpoint.aiNarration && (
            <p className="text-xs text-muted-foreground line-clamp-2 italic">&quot;{checkpoint.aiNarration}&quot;</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onTeleport} title="Go to this location">
            <Navigation className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={onDelete}
            title="Remove from history"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

/**
 * SelfieCard displays a generated selfie image.
 */
function SelfieCard({ selfie, onView, onDelete }: { selfie: SelfieImage; onView: () => void; onDelete: () => void }) {
  return (
    <Card className="overflow-hidden group">
      {/* Thumbnail */}
      <div className="relative aspect-video cursor-pointer" onClick={onView}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:${selfie.mimeType};base64,${selfie.imageBase64}`}
          alt="Selfie"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <ChevronRight className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Style badge */}
        <Badge variant="secondary" className="absolute top-2 left-2 text-xs capitalize">
          {selfie.style}
        </Badge>
      </div>

      {/* Info */}
      <div className="p-2 space-y-1">
        <p className="text-xs text-muted-foreground truncate">{selfie.location.address || "Unknown location"}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{formatTime(selfie.timestamp)}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

/**
 * TourHistorySheet displays the tour history and generated selfies in a slide-out panel.
 *
 * @example
 * ```tsx
 * <TourHistorySheet
 *   open={historyOpen}
 *   onOpenChange={setHistoryOpen}
 * />
 * ```
 */
export function TourHistorySheet({ open, onOpenChange }: TourHistorySheetProps) {
  const { tourHistory, selfieImages, removeCheckpoint, removeSelfieImage, clearTour } = useStreetViewStore();

  /**
   * Handle teleporting to a checkpoint location.
   */
  const handleTeleport = useCallback(
    async (checkpoint: TourCheckpoint) => {
      const anywhere = window.anywhere;
      if (!anywhere) {
        console.warn("[TourHistory] Control API not available");
        return;
      }

      try {
        // Use the address if available, otherwise coordinates
        const location = checkpoint.address || `${checkpoint.position.lat},${checkpoint.position.lng}`;
        await anywhere.teleportTo(location);
        onOpenChange(false);
      } catch (error) {
        console.error("[TourHistory] Teleport failed:", error);
      }
    },
    [onOpenChange]
  );

  /**
   * Handle viewing a selfie in full size.
   */
  const handleViewSelfie = useCallback((selfie: SelfieImage) => {
    // Open in new tab
    const win = window.open();
    if (win) {
      win.document.write(`
        <html>
          <head><title>Anywhere Selfie</title></head>
          <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#000;">
            <img src="data:${selfie.mimeType};base64,${selfie.imageBase64}" style="max-width:100%;max-height:100vh;object-fit:contain;" />
          </body>
        </html>
      `);
    }
  }, []);

  const hasContent = tourHistory.length > 0 || selfieImages.length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Tour History</SheetTitle>
          <SheetDescription>
            {hasContent ? `${tourHistory.length} locations visited • ${selfieImages.length} selfies` : "No history yet"}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-10rem)] mt-4">
          <div className="space-y-6 pr-4">
            {/* Selfies section */}
            {selfieImages.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Selfies</h3>
                  <Badge variant="secondary" className="ml-auto">
                    {selfieImages.length}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {selfieImages.map((selfie) => (
                    <SelfieCard
                      key={selfie.id}
                      selfie={selfie}
                      onView={() => handleViewSelfie(selfie)}
                      onDelete={() => removeSelfieImage(selfie.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {selfieImages.length > 0 && tourHistory.length > 0 && <Separator />}

            {/* Checkpoints section */}
            {tourHistory.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Visited Locations</h3>
                  <Badge variant="secondary" className="ml-auto">
                    {tourHistory.length}
                  </Badge>
                </div>

                <div className="space-y-2">
                  {[...tourHistory].reverse().map((checkpoint) => (
                    <CheckpointCard
                      key={checkpoint.id}
                      checkpoint={checkpoint}
                      onTeleport={() => handleTeleport(checkpoint)}
                      onDelete={() => removeCheckpoint(checkpoint.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!hasContent && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MapPin className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">No history yet</h3>
                <p className="text-sm text-muted-foreground/70 mt-1">Start exploring to build your tour history</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer actions */}
        {hasContent && (
          <div className="pt-4 border-t">
            <Button variant="outline" className="w-full text-destructive hover:text-destructive" onClick={clearTour}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All History
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
