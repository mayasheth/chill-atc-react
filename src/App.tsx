// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from '@/pages/Home'
import SpotifyCallback from '@/pages/SpotifyCallback' 
import { SessionTracker } from '@/lib/airtime/SessionTracker'
import { SpotifyPlayerProvider } from '@/lib/spotify/SpotifyPlayerProvider'
import { AtcAudioProvider } from '@/lib/atc/AtcAudioProvider'

/**
 * App = (Provider → Router → Pages)
 *
 * - SpotifyPlayerProvider initializes the Spotify Web Playback SDK once,
 *   and keeps playback state in a global store (Zustand).
 * - BrowserRouter does client-side routing without full page reloads.
 * - Routes map URL paths to React components.
 */

export default function App() {
  return (
    <AtcAudioProvider>
      <SpotifyPlayerProvider>
        <SessionTracker />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/callback" element={<SpotifyCallback />} />
            </Routes>
          </BrowserRouter>
      </SpotifyPlayerProvider>
    </AtcAudioProvider>
  )
}
