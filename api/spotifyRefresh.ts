// api/spotifyRefresh.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { setHttpOnlyCookie } from './spotifyCallback'

const TOKEN_URL = 'https://accounts.spotify.com/api/token'
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID as string
const REFRESH_COOKIE = 'sp_refresh_token'

function getCookie(req: VercelRequest, name: string): string | null {
  const raw = req.headers.cookie || ''
  for (const part of raw.split(';')) {
    const [k, v] = part.trim().split('=')
    if (k === name) return decodeURIComponent(v || '')
  }
  return null
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const refresh_token = getCookie(req, REFRESH_COOKIE)
    if (!refresh_token) return res.status(401).json({ error: 'No refresh token' })

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token,
      client_id: SPOTIFY_CLIENT_ID, // PKCE: no client secret
    })

    const r = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    if (!r.ok) {
      const detail = await r.text()
      return res.status(400).json({ error: 'token endpoint failed', detail })
    }

    const data = await r.json() as {
      access_token: string
      token_type: 'Bearer'
      expires_in: number
      scope?: string
      refresh_token?: string // may rotate
    }

    if (data.refresh_token) {
      // Determine if request is HTTPS (vercel dev is http)
      const isHttps = (req.headers['x-forwarded-proto'] || '').toString().includes('https')
      // Store refresh token securely (Secure only on https)
      setHttpOnlyCookie(res, REFRESH_COOKIE, data.refresh_token, 60 * 24 * 60 * 60, isHttps)
    }

    res.status(200).json({
      access_token: data.access_token,
      expires_in: data.expires_in,
    })
  } catch (e: any) {
    res.status(500).json({ error: 'internal', detail: e?.message })
  }
}
