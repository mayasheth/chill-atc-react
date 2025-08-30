import { create } from 'zustand'

// --- Helpers ---
const nowMs = () => Date.now()
const msFromNow = (sec: number) => nowMs() + sec * 1000
const EARLY_REFRESH_SEC = 30 // refresh a little before expiry

export type Tokens = {
  access_token: string
  refresh_token?: string
  expires_in?: number
  token_type?: string
  scope?: string
  /** Computed helper for refresh logic (epoch ms) */
  expires_at?: number
}

type AuthState = {
  // Identity
  isLoggedIn: boolean
  loginSessionId: string | null // NEW SESSION ID ONLY on login, never on refresh
  userEmail: string | null
  tz: string

  // Tokens
  tokens?: Tokens
  refreshInFlight: boolean

  /** Derived getter so consumers don’t need to know structure */
  accessToken: () => string | null

  /** Actions (existing) */
  setLoggedIn: (email: string | null, tokens?: Tokens) => void
  setTokens: (tokens?: Tokens) => void
  logout: () => void

  /** NEW: refresh + usage */
  ensureFreshAccessToken: () => Promise<string>
  refreshAccessToken: () => Promise<Tokens> // hits /api/spotify/refresh (httpOnly cookie)
  spotifyApiFetch: (path: string, init?: RequestInit) => Promise<Response>
}

// Module-scope guard to dedupe concurrent refresh calls
let refreshPromise: Promise<Tokens> | null = null

export const useAuth = create<AuthState>((set, get) => ({
  isLoggedIn: false,
  loginSessionId: null,
  userEmail: null,
  tokens: undefined,
  tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
  refreshInFlight: false,

  accessToken: () => get().tokens?.access_token ?? null,

  // Called on successful OAuth callback only (sets a NEW loginSessionId)
  setLoggedIn: (email, tokens) => {
    const expires_at =
      tokens?.expires_in != null ? nowMs() + tokens.expires_in * 1000 : tokens?.expires_at
    set({
      isLoggedIn: !!tokens?.access_token,
      loginSessionId: crypto.randomUUID(), // <-- stable across refresh; only set here
      userEmail: email,
      tokens: tokens ? { ...tokens, expires_at } : undefined,
    })
  },

  // Can be used to update tokens without touching loginSessionId
  setTokens: (tokens) => {
    const expires_at =
      tokens?.expires_in != null ? nowMs() + tokens.expires_in * 1000 : tokens?.expires_at
    set({
      isLoggedIn: !!tokens?.access_token,
      tokens: tokens ? { ...tokens, expires_at } : undefined,
    })
  },

  logout: () =>
    set({
      isLoggedIn: false,
      loginSessionId: null, // clear on explicit logout only
      userEmail: null,
      tokens: undefined,
    }),

  // Ensure a valid token; refresh if near-expiry or missing.
  async ensureFreshAccessToken() {
    const s = get()
    const tok = s.tokens?.access_token ?? null
    const exp = s.tokens?.expires_at ?? null

    const stillValid =
      tok && exp != null && exp - nowMs() > EARLY_REFRESH_SEC * 1000

    if (stillValid) return tok!

    // Refresh (dedup concurrent calls)
    const t = await get().refreshAccessToken()
    set({
      isLoggedIn: !!t.access_token,
      tokens: t,
      // loginSessionId UNCHANGED here
    })
    return t.access_token
  },

  // POST to your server’s /api/spotify/refresh; server reads httpOnly refresh cookie
  async refreshAccessToken() {
    if (refreshPromise) return refreshPromise

    set({ refreshInFlight: true })
    refreshPromise = (async () => {
      const r = await fetch('/api/spotifyRefresh', {
        method: 'POST',
        credentials: 'include', // send refresh cookie
      })
      if (!r.ok) {
        // Do NOT change loginSessionId here; caller can handle re-login UX
        set({ refreshInFlight: false })
        refreshPromise = null
        throw new Error('spotify refresh failed')
      }
      const data = (await r.json()) as { access_token: string; expires_in: number }
      const tokens: Tokens = {
        access_token: data.access_token,
        expires_in: data.expires_in,
        expires_at: msFromNow(Math.max(1, data.expires_in - EARLY_REFRESH_SEC)),
        token_type: 'Bearer',
      }
      set({ refreshInFlight: false })
      refreshPromise = null
      return tokens
    })()

    return refreshPromise
  },

  // Convenience wrapper for Spotify Web API calls with auto-refresh + one retry on 401
  async spotifyApiFetch(path, init = {}) {
    // Ensure fresh token
    const token = await get().ensureFreshAccessToken()

    const doFetch = (bearer: string) =>
      fetch(`https://api.spotify.com/v1${path}`, {
        ...init,
        headers: {
          ...(init.headers || {}),
          Authorization: `Bearer ${bearer}`,
          'Content-Type':
            (init.headers as any)?.['Content-Type'] ?? 'application/json',
        },
      })

    let resp = await doFetch(token)
    if (resp.status !== 401) return resp

    // If unauthorized, force a refresh and retry once
    try {
      const t = await get().refreshAccessToken()
      set({ isLoggedIn: !!t.access_token, tokens: t })
      resp = await doFetch(t.access_token)
    } catch {
      // Keep loginSessionId as-is; UI can prompt re-login
      return resp
    }
    return resp
  },
}))
