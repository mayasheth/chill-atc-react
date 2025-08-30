import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/store/auth'

export default function SpotifyCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    ;(async () => {
      try {
        // Immediately fetch a fresh access token via our refresh endpoint
        const r = await fetch('/api/spotifyRefresh', { method: 'POST', credentials: 'include' })
        if (!r.ok) throw new Error('refresh failed')
        const { access_token, expires_in } = await r.json()

        // (Optional) fetch email
        let email: string | null = null
        try {
          const me = await fetch('https://api.spotify.com/v1/me', {
            headers: { Authorization: `Bearer ${access_token}` },
          })
          if (me.ok) {
            const j = await me.json()
            email = j?.email ?? null
          }
        } catch {}

        useAuth.getState().setLoggedIn(email, {
          access_token,
          expires_in,
        })

        navigate('/')
      } catch (e) {
        console.error('Callback error', e)
        navigate('/')
      }
    })()
  }, [navigate])

  return <div className="p-6">Finishing login…</div>
}
