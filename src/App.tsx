// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import RootLayout from "@/components/layouts/RootLayout";
import Home from '@/pages/Home'
import Colophon from '@/pages/Colophon'
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
               <Route element={<RootLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/callback" element={<SpotifyCallback />} />
                <Route path="/colophon" element={<Colophon />} />
               </Route>
            </Routes>
          </BrowserRouter>
      </SpotifyPlayerProvider>
    </AtcAudioProvider>
  )
}