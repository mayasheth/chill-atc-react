# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (runs Vite + Vercel API concurrently)
npm run dev

# Run frontend only (port 8111)
npm run dev:app

# Run API only (port 3000)
npm run dev:api

# Build for production
npm run build

# Lint
npm run lint
npm run lint:fix

# Format
npm run format

# Tests
npm run test        # run once
npm run test:ui     # watch mode
```

Tests use Vitest with jsdom. Test files should be `*.test.ts` or `*.spec.ts`.

## Architecture

This is a React SPA for playing lofi music via Spotify alongside live ATC (air traffic control) audio streams. Deployed on Vercel.

### Core Stack
- React 19 + Vite + TypeScript
- Tailwind CSS v4
- Zustand for state management
- React Query for data fetching
- React Router for client-side routing

### Key Directories

- `src/store/` - Zustand stores: `auth.ts` (Spotify OAuth + token refresh), `playback.ts` (Spotify player state), `atc.ts` (ATC audio state), `weather.ts`, `tracking.ts`
- `src/lib/` - Core logic organized by domain:
  - `spotify/` - `SpotifyPlayerProvider.tsx` initializes the Spotify Web Playback SDK
  - `atc/` - `AtcAudioProvider.tsx` manages the HTML audio element; `atcStreams.ts` resolves stream data from JSON
  - `weather/` - OpenMeteo integration and weather code mapping
  - `airtime/` - Session tracking and waveform visualization
- `src/api/` - Client-side API helpers (`spotifyAuth.ts`, `spotifyPlayback.ts`)
- `api/` - Vercel serverless functions: `spotifyCallback.ts`, `spotifyRefresh.ts`, `googleSheets.ts`, `carbonFootprint.ts`
- `src/assets/data/` - Static JSON: airports, locations, ATC streams, Spotify playlists

### Provider Hierarchy

App wraps providers in this order:
1. `AtcAudioProvider` - creates hidden `<audio>` element, registers with `useAtc` store
2. `SpotifyPlayerProvider` - loads Spotify SDK, initializes player, syncs to `usePlayback` store
3. `SessionTracker` - tracks listening sessions for stats
4. `BrowserRouter` with routes

### Spotify OAuth Flow

Uses PKCE (no client secret). The flow:
1. Client generates code verifier, stores in cookie, redirects to Spotify
2. `/api/spotifyCallback` exchanges code for tokens, stores refresh token in httpOnly cookie
3. Client gets access token via `/api/spotifyRefresh`
4. `useAuth` store manages token refresh with `ensureFreshAccessToken()`

### Path Alias

`@/` maps to `src/` (configured in vite.config.mts)

## System Schematic

### Component & Provider Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│ App.tsx                                                             │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ AtcAudioProvider                                                │ │
│ │   └─ creates <audio> element ──────────────────┐                │ │
│ │ ┌─────────────────────────────────────────────────────────────┐ │ │
│ │ │ SpotifyPlayerProvider                        │              │ │ │
│ │ │   └─ loads SDK, creates Spotify.Player ──────┼──┐           │ │ │
│ │ │ ┌─────────────────────────────────────────────────────────┐ │ │ │
│ │ │ │ SessionTracker                             │  │          │ │ │ │
│ │ │ │ ┌─────────────────────────────────────────────────────┐ │ │ │ │
│ │ │ │ │ BrowserRouter                            │  │        │ │ │ │ │
│ │ │ │ │   ├─ / ────────── Home                   │  │        │ │ │ │ │
│ │ │ │ │   ├─ /callback ── SpotifyCallback        │  │        │ │ │ │ │
│ │ │ │ │   └─ /colophon ── Colophon               ▼  ▼        │ │ │ │ │
│ │ │ │ └─────────────────────────────────────────────────────┘ │ │ │ │
│ │ │ └─────────────────────────────────────────────────────────┘ │ │ │
│ │ └─────────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### Dual Audio System

```
┌──────────────────────────────────┐    ┌──────────────────────────────────┐
│        SPOTIFY AUDIO             │    │          ATC AUDIO               │
├──────────────────────────────────┤    ├──────────────────────────────────┤
│                                  │    │                                  │
│  SpotifyPlayerProvider           │    │  AtcAudioProvider                │
│         │                        │    │         │                        │
│         ▼                        │    │         ▼                        │
│  ┌─────────────────┐             │    │  ┌─────────────────┐             │
│  │ Spotify.Player  │             │    │  │ <audio> element │             │
│  │ (Web Playback   │             │    │  │ (HTML5 audio)   │             │
│  │  SDK)           │             │    │  │                 │             │
│  └────────┬────────┘             │    │  └────────┬────────┘             │
│           │ events               │    │           │ events               │
│           ▼                      │    │           ▼                      │
│  ┌─────────────────┐             │    │  ┌─────────────────┐             │
│  │ usePlayback     │◄── store    │    │  │ useAtc          │◄── store    │
│  │ (Zustand)       │             │    │  │ (Zustand)       │             │
│  └────────┬────────┘             │    │  └────────┬────────┘             │
│           │                      │    │           │                      │
│           ▼                      │    │           ▼                      │
│  ┌─────────────────┐             │    │  ┌─────────────────┐             │
│  │ PlaybackPanel   │             │    │  │ AtcStreamingPanel│            │
│  │ NowPlayingPanel │ ◄── UI      │    │  │ WeatherPanel    │ ◄── UI     │
│  └─────────────────┘             │    │  └─────────────────┘             │
│                                  │    │                                  │
└──────────────────────────────────┘    └──────────────────────────────────┘
```

### Spotify OAuth Flow (PKCE)

```
┌─────────┐         ┌─────────┐         ┌─────────────────┐         ┌─────────┐
│ Browser │         │ Client  │         │ Vercel API      │         │ Spotify │
└────┬────┘         └────┬────┘         └────────┬────────┘         └────┬────┘
     │                   │                       │                       │
     │  1. Click Login   │                       │                       │
     │──────────────────►│                       │                       │
     │                   │                       │                       │
     │                   │  2. Generate code_verifier + code_challenge   │
     │                   │     Store verifier in cookie                  │
     │                   │                       │                       │
     │  3. Redirect to Spotify /authorize        │                       │
     │◄──────────────────────────────────────────────────────────────────│
     │                                           │                       │
     │  4. User authorizes                       │                       │
     │──────────────────────────────────────────────────────────────────►│
     │                                           │                       │
     │  5. Redirect to /api/spotifyCallback?code=...                     │
     │◄──────────────────────────────────────────────────────────────────│
     │                   │                       │                       │
     │                   │  6. Exchange code     │                       │
     │                   │     + verifier        │                       │
     │                   │──────────────────────►│                       │
     │                   │                       │  7. Token request     │
     │                   │                       │─────────────────────► │
     │                   │                       │  8. access_token +    │
     │                   │                       │◄───── refresh_token   │
     │                   │                       │                       │
     │                   │  9. Set httpOnly cookie (refresh_token)       │
     │                   │     Redirect to /callback?ok=1                │
     │◄──────────────────│───────────────────────│                       │
     │                   │                       │                       │
     │                   │ 10. POST /api/spotifyRefresh                  │
     │                   │──────────────────────►│                       │
     │                   │ 11. access_token      │                       │
     │                   │◄──────────────────────│                       │
     │                   │                       │                       │
     │                   │ 12. Store in useAuth, init SDK                │
     │                   │                       │                       │
```

### Data Flow: Store → UI

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ZUSTAND STORES                                 │
├─────────────────┬─────────────────┬─────────────────┬───────────────────────┤
│    useAuth      │   usePlayback   │     useAtc      │    useTracking        │
│                 │                 │                 │                       │
│ • isLoggedIn    │ • player        │ • audio         │ • sessionId           │
│ • tokens        │ • deviceId      │ • atcPlaying    │ • totalListenTime     │
│ • userEmail     │ • musicPlaying  │ • volume        │ • bytesTransferred    │
│                 │ • track         │ • selectedStream│                       │
│                 │ • volume        │ • currentStream │                       │
│                 │ • position      │                 │                       │
└────────┬────────┴────────┬────────┴────────┬────────┴───────────┬───────────┘
         │                 │                 │                    │
         ▼                 ▼                 ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              UI COMPONENTS                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Home Page                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Card: "music"                                                       │   │
│  │   LoginPanel ◄──────────────────── useAuth                          │   │
│  │   PlaybackPanel ◄───────────────── usePlayback (controls)           │   │
│  │   NowPlayingPanel ◄─────────────── usePlayback (track info)         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Card: "atc"                                                         │   │
│  │   AtcStreamingPanel ◄───────────── useAtc                           │   │
│  │   WeatherPanel ◄────────────────── useWeather + selected airport    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Card: "airtime"                                                     │   │
│  │   WaveformPanel ◄───────────────── useAtc (audio analyser)          │   │
│  │   StatsPanel ◄──────────────────── useTracking                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### API Routes

```
/api/
  ├── spotifyCallback   POST   OAuth callback, exchanges code, sets refresh cookie
  ├── spotifyRefresh    POST   Returns fresh access_token (reads httpOnly cookie)
  ├── googleSheets      GET    Fetches data from Google Sheets
  └── carbonFootprint   GET    Carbon footprint estimation
```

### Environment Variables

Required for Spotify integration:
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_REDIRECT_URI`
