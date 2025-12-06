/**
 * Root layout for the Anywhere application.
 * Configures fonts, metadata, and global providers.
 *
 * @module layout
 */

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

/**
 * Primary sans-serif font (Geist).
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
});

/**
 * Monospace font for coordinates and technical data.
 */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
});

/**
 * Application metadata for SEO and social sharing.
 */
export const metadata: Metadata = {
  title: "Anywhere - Virtual World Explorer",
  description:
    "Explore the world with an AI-powered tour guide. Voice-controlled Street View navigation with real-time knowledge and AI selfie generation.",
  keywords: ["virtual tour", "street view", "AI tour guide", "explore world", "voice navigation", "travel"],
  authors: [{ name: "Anywhere Team" }],
  creator: "Anywhere",
  openGraph: {
    title: "Anywhere - Virtual World Explorer",
    description: "Explore the world with an AI-powered tour guide",
    type: "website",
    locale: "en_US"
  },
  twitter: {
    card: "summary_large_image",
    title: "Anywhere - Virtual World Explorer",
    description: "Explore the world with an AI-powered tour guide"
  },
  robots: {
    index: true,
    follow: true
  }
};

/**
 * Viewport configuration for responsive behavior.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000"
};

/**
 * Root layout component.
 * Wraps all pages with common fonts and styles.
 *
 * @param children - Page content to render
 */
export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-black text-white overflow-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
