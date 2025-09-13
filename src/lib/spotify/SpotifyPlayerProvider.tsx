// src/lib/SpotifyPlayerProvider.tsx
import { useEffect, useRef } from 'react'
import { usePlayback } from '@/store/playback'
import { useAuth } from '@/store/auth'
import { transferPlayback } from '@/api/spotifyPlayback'

// wait for SDK script to be present and window.Spotify to exist
async function loadSpotifySDK(): Promise<void> {
  if (window.Spotify) return
  // avoid duplicate tags
  const src = 'https://sdk.scdn.co/spotify-player.js'
  let script = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`)
  if (!script) {
    script = document.createElement('script')
    script.src = src
    script.async = true
    document.body.appendChild(script)
  }
  // prefer the official ready callback when available
  await new Promise<void>((resolve) => {
    (window as any).onSpotifyWebPlaybackSDKReady = () => resolve()
    // fallback: poll in case the global callback isn’t used
    const id = window.setInterval(() => {
      if (window.Spotify) {
        clearInterval(id)
        resolve()
      }
    }, 50)
  })
}

export function SpotifyPlayerProvider({ children }: { children: React.ReactNode }) {
  // IMPORTANT: drive init from login state, not the access token (which refreshes)
  const isLoggedIn = useAuth((s) => s.isLoggedIn)
  const { ensureFreshAccessToken } = useAuth.getState()

  const { setPlayer, setDeviceId, setFromSDK } = usePlayback()

  // guard so StrictMode doesn’t double-init
  const initRef = useRef(false)

  useEffect(() => {
    if (!isLoggedIn) return
    if (initRef.current) return
    initRef.current = true

    let player: Spotify.Player | null = null
    let canceled = false

    const init = async () => {
      await loadSpotifySDK()
      if (canceled || !window.Spotify) return

      player = new window.Spotify.Player({
        name: 'chill atc player',
        getOAuthToken: async (cb: (token: string) => void) => {
          try {
            const token = await ensureFreshAccessToken()
            cb(token)
          } catch (e) {
            console.warn('getOAuthToken failed', e)
          }
        },
        volume: 0.7,
      })

      // --- listeners ---
      player.addListener('ready', async ({ device_id }: { device_id: string }) => {
        if (canceled) return
        setDeviceId(device_id)

        // apply stored volume
        try {
          const vol = usePlayback.getState().volume
          await player!.setVolume(vol / 100)
        } catch {}

        // route playback to this device (don’t auto-play)
        try {
          const token = await ensureFreshAccessToken()
          await transferPlayback(token, device_id, false)
        } catch (e) {
          console.warn('transferPlayback failed', e)
        }

        // tiny delay can help with “No active device” races
        await new Promise((r) => setTimeout(r, 250))
      })

      player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        if (device_id) setDeviceId(null)
      })

      player.addListener('player_state_changed', (state: Spotify.PlaybackState | null) => {
        setFromSDK(state)
      })

      player.addListener('initialization_error', ({ message }) => console.error('init', message))
      player.addListener('authentication_error', ({ message }) => console.error('auth', message))
      player.addListener('account_error', ({ message }) => console.error('account', message))
      player.addListener('playback_error', ({ message }) => console.error('playback', message))

      try {
        await player.connect()
        setPlayer(player)
      } catch (e) {
        console.error('player.connect failed', e)
      }
    }

    init()

    return () => {
      canceled = true
      setFromSDK(null)
      setDeviceId(null)
      if (player) {
        try {
          player.disconnect()
        } catch {}
        setPlayer(null)
      }
    }
  }, [isLoggedIn, setDeviceId, setFromSDK, setPlayer, ensureFreshAccessToken])

  return <>{children}</>
}
