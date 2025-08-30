// src/store/playback.ts
import { create } from "zustand"
import { playContext} from "@/api/spotifyPlayback"
import { seek as apiSeek } from "@/api/spotifyPlayback"
import { setVolume as apiSetVolume } from "@/api/spotifyPlayback"
import { useAuth } from "@/store/auth"

const DEBOUNCE_MS = 200
const SLIDER_DEBOUNCE_MS = 120

type Track = {
  id: string
  name: string
  artists: string[]
  album?: string
  image?: string
}

type PlaybackState = {
  player: Spotify.Player | null
  deviceId: string | null
  musicPlaying: boolean
  track: Track | null
  position: number
  duration: number
  volume: number

  selectedPlaylistUri: string | null
  currentContextUri: string | null

  _selectDebounce?: number
  _sliderDebounce?: number

  setPlayer: (p: Spotify.Player | null) => void
  setDeviceId: (id: string | null) => void
  setFromSDK: (s: Spotify.PlaybackState | null) => void
  setSelectedPlaylist: (uri: string | null) => void

  playPause: () => Promise<void>
  next: () => Promise<void>
  previous: () => Promise<void>
  restartPlaylist: (playlistUri?: string) => Promise<void>

  setVolumeImmediate: (pct: number) => Promise<void> // apply immediately
  setVolume: (pct: number) => void                   // debounced for sliders
  seek: (position: number) => Promise<void>

  // helper
  playPlaylist: (uri: string, offset?: number) => Promise<void>

}

export const usePlayback = create<PlaybackState>((set, get) => ({
  player: null,
  deviceId: null,
  musicPlaying: false,
  track: null,
  position: 0,
  duration: 0,
  volume: 70,
  
  selectedPlaylistUri: null,
  currentContextUri: null,

  _selectDebounce: undefined,
  _sliderDebounce: undefined,

  setPlayer: (p) => set({ player: p }),
  setDeviceId: (id) => set({ deviceId: id }),

  setFromSDK: (state) => {
    if (!state) {
      set({ musicPlaying: false, track: null, position: 0, duration: 0 })
      return
    }

    const curAny = (state as any)?.track_window?.current_track
    const mapped: Track | null = curAny
    ? {
      id: String(curAny.id ?? ""),
      name: String(curAny.name ?? ""),
      artists: Array.isArray(curAny.artists)
        ? curAny.artists.map((a: any) => String(a?.name ?? "")).filter(Boolean)
        : [],
      album: String(curAny.album?.name ?? ""), // 👈 capture album name
      image: curAny?.album?.images?.[0]?.url as string | undefined,
    }
    : null

    set({
      musicPlaying: !state.paused,
      position: state.position,
      duration: state.duration,
      track: mapped,
      // NOTE: we only update currentContextUri when *we* call playPlaylist/restartPlaylist
    })
  },

  // Centralized way to start a playlist and remember the loaded context
  playPlaylist: async (uri: string, offset = 0) => {
    const token = useAuth.getState().accessToken()
    const { deviceId } = get()
    if (!token || !deviceId || !uri) return
    await playContext(token, deviceId, uri, offset)
    set({ currentContextUri: uri })
  },

  setSelectedPlaylist: (uri) => {
    const next = uri ?? null
    const { selectedPlaylistUri, _selectDebounce, musicPlaying: playing, playPlaylist } = get()

    // Immediately reflect selection in state
    set({ selectedPlaylistUri: next })

    // Only react when the selection actually changes AND music is playing
    if (!next || next === selectedPlaylistUri || !playing) return

    // Clear any pending auto-start
    if (_selectDebounce !== undefined) {
      clearTimeout(_selectDebounce)
    }

    // Schedule auto-start from top (debounced)
    const handle = window.setTimeout(() => {
      void playPlaylist(next, 0) // will also set currentContextUri
      set({ _selectDebounce: undefined })
    }, DEBOUNCE_MS)

    set({ _selectDebounce: handle })
  },
  
  playPause: async () => {
    const { player, musicPlaying: playing, track, selectedPlaylistUri, currentContextUri, playPlaylist } = get()
    if (!player) return

    // If a pending auto-start exists, cancel it when user explicitly toggles
    const { _selectDebounce } = get()
    if (_selectDebounce !== undefined) {
      clearTimeout(_selectDebounce)
      set({ _selectDebounce: undefined })
    }

    if (playing) {
      await player.pause()
      return
    }

    // If paused on an old context and a different playlist is selected, switch to it
    if (selectedPlaylistUri && selectedPlaylistUri !== currentContextUri) {
      await playPlaylist(selectedPlaylistUri, 0)
      return
    }

    // If nothing loaded, start the selected playlist
    if (!track && selectedPlaylistUri) {
      await playPlaylist(selectedPlaylistUri, 0)
      return
    }

    // Otherwise resume current context
    await player.resume()
  },

  next: async () => {
    const p = get().player
    if (p) await p.nextTrack()
  },

  previous: async () => {
    const p = get().player
    if (p) await p.previousTrack()
  },


  restartPlaylist: async (playlistUri) => {
    const uri = playlistUri ?? get().selectedPlaylistUri
    if (!uri) {
      const token = useAuth.getState().accessToken()
      const { deviceId } = get()
      if (!token || !deviceId) return
      await apiSeek(token, deviceId, 0) // fallback
      return
    }
    await get().playPlaylist(uri, 0) // also sets currentContextUri
  },

  // Set volume now (SDK if available & this device; else Web API)
  setVolumeImmediate: async (pct) => {
    const vol = Math.max(0, Math.min(100, Math.round(pct)))
    set({ volume: vol })

    const { player, deviceId } = get()
    const token = useAuth.getState().accessToken()
    if (!deviceId || !token) return

    // Prefer SDK for our web player (smoother)
    if (player) {
      try {
        await player.setVolume(vol / 100) // 0..1
        return
      } catch (e) {
        // Fall back to Web API if SDK call fails
      }
    }

    try {
      await apiSetVolume(token, deviceId, vol)
    } catch (e) {
      console.warn("setVolumeImmediate failed:", e)
    }
  },

  // Debounced setter for slider onChange
  setVolume: (pct) => {
    const vol = Math.max(0, Math.min(100, Math.round(pct)))
    set({ volume: vol })

    const pending = get()._sliderDebounce
    if (pending !== undefined) clearTimeout(pending)

    const handle = window.setTimeout(() => {
      void get().setVolumeImmediate(vol)
      set({ _sliderDebounce: undefined })
    }, SLIDER_DEBOUNCE_MS)

    set({ _sliderDebounce: handle })
  },

  seek: async (position) => {
      const token = useAuth.getState().accessToken()
      const { deviceId } = get()

      if (!token || !deviceId) return
        await apiSeek(token, deviceId, position) 
        return
  },
}))
