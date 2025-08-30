// src/api/spotify.ts
function b64url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export async function startSpotifyLogin() {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string | undefined
  const redirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI as string | undefined

  if (!clientId || !redirectUri) {
    console.error('Missing VITE_SPOTIFY_CLIENT_ID or VITE_SPOTIFY_REDIRECT_URI')
    alert('Spotify login is not configured. Check your .env values.')
    return
  }

  // PKCE
  const verifierBytes = new Uint8Array(32)
  crypto.getRandomValues(verifierBytes)
  const code_verifier = b64url(verifierBytes)

  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code_verifier))
  const code_challenge = b64url(new Uint8Array(digest))

  // Keep a state for CSRF protection
  const state = crypto.randomUUID()
  sessionStorage.setItem('spotify_state', state)

  // Store verifier for the server callback to read
  document.cookie = `sp_code_verifier=${encodeURIComponent(code_verifier)}; Path=/; SameSite=Lax; Secure; Max-Age=600`

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri, // MUST be /api/spotifyCallback
    code_challenge_method: 'S256',
    code_challenge,
    scope: 'user-read-email streaming user-read-playback-state user-modify-playback-state',
    state,
  })

  const authorizeUrl = `https://accounts.spotify.com/authorize?${params.toString()}`
  console.log('[spotify] redirecting to', authorizeUrl)
  window.location.assign(authorizeUrl)
}
