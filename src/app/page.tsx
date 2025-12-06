/**
 * Main page component for Anywhere.
 * Renders the Street View panorama with voice interaction overlay.
 *
 * @module page
 */

import { Suspense } from "react";
import { AnywhereExplorer } from "@/components/anywhere-explorer";

/**
 * Loading fallback component displayed while the explorer loads.
 */
function LoadingFallback() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-6">
        {/* Spinner */}
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-white/10" />
          <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-transparent border-t-white" />
        </div>

        {/* Branding */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">Anywhere</h1>
          <p className="mt-2 text-white/60">Loading your virtual tour guide...</p>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 text-sm text-white/40">
          <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          <span>Initializing Street View</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Home page component.
 * Renders the full-screen Anywhere explorer application.
 */
export default function Home() {
  return (
    <main className="h-screen w-screen overflow-hidden bg-black">
      <Suspense fallback={<LoadingFallback />}>
        <AnywhereExplorer />
      </Suspense>
    </main>
  );
}
