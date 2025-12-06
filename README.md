# Anywhere

**Go _Anywhere_** — A voice-controlled virtual explorer that transforms Google Street View into an interactive, AI-guided tour experience.

## Overview

Anywhere is a next-generation virtual tour guide powered by Google's Gemini AI. Unlike traditional Street View exploration, Anywhere provides:

- **Voice Interaction**: Talk naturally with an AI tour guide using Gemini Live API
- **Intelligent Navigation**: AI-controlled camera movements via function calling (not browser automation)
- **Real-Time Knowledge**: Live Google Search grounding for accurate, up-to-date information
- **AI Selfie Souvenirs**: Generate composite images placing you in any location worldwide

## Features

### 🎙️ Voice-Controlled Navigation

Speak naturally to navigate:

- "Take me to the Colosseum"
- "Turn around and show me what's behind us"
- "Walk forward down this street"
- "What's that building on the left?"

### 🗺️ Global Exploration

Access any location with Street View coverage:

- Instant teleportation to landmarks worldwide
- Smooth GSAP-animated camera movements
- Real-time location awareness with reverse geocoding

### 🧠 AI Tour Guide

Get intelligent commentary powered by Gemini:

- Historical facts and architectural details
- Local recommendations and cultural insights
- Context-aware descriptions of visible landmarks

### 📸 AI Selfie Generation

Create souvenir photos with Nano Banana Pro:

- Upload your photo and place yourself in any scene
- Multiple styles: Polaroid, Vintage, Professional, Fun
- High-quality composites with matched lighting

## Technology Stack

| Category  | Technology                          |
| --------- | ----------------------------------- |
| Framework | Next.js 16.0.7 with React 19.2      |
| AI        | Gemini Live API, Gemini 3 Pro Image |
| Maps      | Google Maps JavaScript API          |
| Animation | GSAP 3.12                           |
| State     | Zustand 5                           |
| UI        | Shadcn UI + Tailwind CSS 4          |
| Audio     | Web Audio API                       |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Google Cloud Platform account
- Google AI Studio account

### API Keys Setup

#### Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Library**
4. Enable the following APIs:
   - Maps JavaScript API
   - Street View Static API
   - Geocoding API
   - Places API
5. Go to **APIs & Services** > **Credentials**
6. Click **Create Credentials** > **API Key**
7. (Recommended) Restrict the key to your domain and the required APIs

#### Gemini API Key

1. Go to [Google AI Studio](https://ai.google.dev/)
2. Click **Get API key** or navigate to API keys
3. Create a new API key
4. Ensure access to:
   - Gemini Live API (real-time audio streaming)
   - Gemini 3 Pro Image (selfie generation)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/anywhere.git
cd anywhere

# Install dependencies
pnpm install

# Create environment file
cp .env.example .env.local

# Add your API keys to .env.local
# NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_key_here
# NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_key_here

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to start exploring.

## Usage

1. **Connect**: Click the green phone button to connect to the AI tour guide
2. **Speak**: Click the microphone (or press Space) and speak naturally
3. **Navigate**: Ask to visit places, turn around, or walk forward
4. **Learn**: Ask about landmarks, history, or local recommendations
5. **Selfie**: Click the camera button to create AI-generated souvenirs

### Voice Commands Examples

| Command                             | Action                           |
| ----------------------------------- | -------------------------------- |
| "Take me to the Eiffel Tower"       | Teleports to Paris               |
| "Turn around"                       | Rotates view 180°                |
| "Walk forward"                      | Advances along the street        |
| "Look up at the ceiling"            | Tilts camera upward              |
| "What's the history of this place?" | Triggers Google Search for facts |
| "Take a selfie"                     | Opens selfie generation dialog   |

## Project Structure

```
src/
├── app/
│   ├── api/selfie/          # Server-side selfie API
│   ├── layout.tsx           # Root layout with fonts
│   ├── page.tsx             # Main application page
│   └── globals.css          # Global styles + Tailwind
├── components/
│   ├── street-view/         # Street View panorama
│   ├── anywhere-explorer.tsx # Main orchestrator
│   ├── voice-control-panel.tsx
│   ├── location-overlay.tsx
│   ├── selfie-dialog.tsx
│   └── tour-history-sheet.tsx
├── lib/
│   ├── gemini-live-client.ts # Gemini Live API client
│   ├── audio-handler.ts     # Microphone & playback
│   ├── navigation-tools.ts  # AI function declarations
│   ├── selfie-generator.ts  # Image generation
│   ├── system-prompt.ts     # AI persona definition
│   └── maps-loader.ts       # Google Maps loader
└── stores/
    └── street-view-store.ts # Zustand state management
```

## Architecture

### Key Design Decision: Function Calling over Browser Automation

Street View renders as a WebGL canvas with no DOM buttons. Browser automation tools fail because there's nothing to click. Instead, Anywhere uses **Agentic Function Calling**:

1. AI receives voice input: "Turn around"
2. AI issues structured command: `pan_camera({ heading: 180, pitch: 0 })`
3. Frontend executes against Google Maps API with GSAP animation
4. Updated viewport context sent back to AI

### Audio Pipeline

```
Microphone → Web Audio API → PCM 16-bit 16kHz → Gemini Live API
                                                      ↓
                                            PCM 24kHz Response
                                                      ↓
                      Speakers ← Web Audio API ← PCM to Float32
```

## Environment Variables

```bash
# Required
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key

# Optional (for server-side selfie generation)
GEMINI_API_KEY=your_gemini_api_key
```

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Configure environment variables in Vercel dashboard.

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install -g pnpm && pnpm install
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

## Known Limitations

| Limitation                  | Mitigation                           |
| --------------------------- | ------------------------------------ |
| Street View coverage gaps   | AI detects and suggests alternatives |
| Live API latency            | Visual feedback during processing    |
| Image generation quality    | Multiple style options, regeneration |
| Browser audio compatibility | Tested on Chrome, Firefox, Safari    |

## Contributing

Contributions are welcome! Please read the [Contributing Guide](CONTRIBUTING.md) first.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Google Gemini AI for powering the tour guide intelligence
- Google Maps Platform for Street View
- Shadcn UI for the beautiful component library
- GSAP for smooth animations

---

**Built for the Gemini 3 Hackathon — December 2025**
