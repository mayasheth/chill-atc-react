// api/spotifyCallback.ts (Vercel serverless style)
import type { VercelRequest, VercelResponse } from '@vercel/node'

const TOKEN_URL = 'https://accounts.spotify.com/api/token'
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID as string
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI as string // e.g., https://your.app/api/spotifyCallback
const REFRESH_COOKIE = 'sp_refresh_token'
const VERIFIER_COOKIE = 'sp_code_verifier'

function getCookie(req: VercelRequest, name: string): string | null {
  const raw = req.headers.cookie || ''
  for (const part of raw.split(';')) {
    const [k, v] = part.trim().split('=')
    if (k === name) return decodeURIComponent(v || '')
  }
  return null
}

export function setHttpOnlyCookie(res: VercelResponse, name: string, value: string, maxAgeSec = 60 * 24 * 60 * 60, secure?: boolean) {
  const useSecure = secure ?? true
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSec}`,
  ]
  if (useSecure) parts.splice(3, 0, 'Secure')
  res.setHeader('Set-Cookie', parts.join('; '))
}


export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { code, state, error } = req.query as Record<string, string | undefined>
    if (error) return res.status(400).send(error)
    if (!code) return res.status(400).send('Missing code')

    // PKCE: read verifier from a NON-httpOnly cookie set by your login start
    const code_verifier = getCookie(req, VERIFIER_COOKIE)
    if (!code_verifier) return res.status(400).send('Missing code_verifier cookie')

    const body = new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      grant_type: 'authorization_code',
      code,
      redirect_uri: SPOTIFY_REDIRECT_URI,
      code_verifier,
    })

    const tr = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    if (!tr.ok) {
      const text = await tr.text()
      return res.status(400).send(`Token exchange failed: ${text}`)
    }

    const data = await tr.json() as {
      access_token: string
      token_type: 'Bearer'
      expires_in: number
      scope?: string
      refresh_token?: string
    }
    if (!data.refresh_token) return res.status(400).send('Spotify did not return refresh_token')

    // Determine if request is HTTPS (vercel dev is http)
    const isHttps = (req.headers['x-forwarded-proto'] || '').toString().includes('https')
    // Store refresh token securely (Secure only on https)
    setHttpOnlyCookie(res, REFRESH_COOKIE, data.refresh_token, 60 * 24 * 60 * 60, isHttps)


    // Redirect to SPA callback WITHOUT including tokens in URL
    res.status(302).setHeader('Location', '/callback?ok=1' + (state ? `&state=${encodeURIComponent(state)}` : ''))
    res.end()
  } catch (e: any) {
    res.status(500).send(e?.message ?? 'internal')
  }
}
