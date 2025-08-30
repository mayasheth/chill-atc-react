// src/api/spotify.ts
// Thin wrappers around Spotify Web API endpoints

export async function transferPlayback(token: string, deviceId: string, play = false) {
  const res = await fetch('https://api.spotify.com/v1/me/player', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_ids: [deviceId], play }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`transferPlayback failed [${res.status}]: ${text || res.statusText}`)
  }
}

export async function playContext(
  token: string,
  deviceId: string,
  contextUri: string,
  offsetIndex = 0
) {
  const url = `https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(deviceId)}`
  const res = await fetch(url, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      context_uri: contextUri,           // must be spotify:playlist:<id>
      offset: { position: offsetIndex }, // first track
      position_ms: 0,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    // Common messages: "Player command failed: No active device found", "Premium required"
    throw new Error(`playContext failed [${res.status}]: ${text || res.statusText}`)
  }
}

export async function getCurrentPlayback(token: string) {
  const res = await fetch("https://api.spotify.com/v1/me/player", {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null
  return res.json()
}

export async function seek(token: string, deviceId: string, ms: number) {
  const url = `https://api.spotify.com/v1/me/player/seek?device_id=${encodeURIComponent(deviceId)}&position_ms=${ms}`
  await fetch(url, { method: "PUT", headers: { Authorization: `Bearer ${token}` } })
}

export async function setVolume(token: string, deviceId: string, volumePct: number) {
  const vol = Math.max(0, Math.min(100, Math.round(volumePct)))
  const url = `https://api.spotify.com/v1/me/player/volume?device_id=${encodeURIComponent(deviceId)}&volume_pct=${vol}`
  const res = await fetch(url, { method: "PUT", headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) {
    const msg = await res.text().catch(() => "")
    throw new Error(`setVolume failed [${res.status}]: ${msg || res.statusText}`)
  }
}