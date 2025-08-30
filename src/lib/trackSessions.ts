// src/lib/trackSessions.ts

// --- existing ---
export function getUserId(): string {
  try {
    let id = localStorage.getItem("uid")
    if (!id) {
      id = "anon_" + (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2))
      localStorage.setItem("uid", id)
    }
    return id
  } catch {
    return "anon_fallback"
  }
}

export type UpsertPayload = {
  sessionId: string
  userId?: string | null
  loginId?: string | null
  atcStreamId?: string | null
  playlistId?: string | null
  durationSeconds?: number | null
  updatedAt?: string | null
  event: 'start' | 'heartbeat' | 'stop'
}

export async function upsertSession(p: UpsertPayload) {
  const r = await fetch('/api/googleSheets?action=upsertSession', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(p),
  })
  if (!r.ok) throw new Error('upsert-session failed')
  return r.json()
}

// --- new: local persistence for session reuse ---
const SID_KEY = (sessionKey: string) => `sid:${sessionKey}`
const SID_STARTED = (sessionId: string) => `sid-started:${sessionId}`

export function getPersistedSessionId(sessionKey: string): string | null {
  try {
    return localStorage.getItem(SID_KEY(sessionKey))
  } catch {
    return null
  }
}

export function setPersistedSessionId(sessionKey: string, sessionId: string) {
  try {
    localStorage.setItem(SID_KEY(sessionKey), sessionId)
  } catch {}
}

export function clearPersistedSession(sessionKey: string) {
  try {
    localStorage.removeItem(SID_KEY(sessionKey))
  } catch {}
}

export function hasSessionStarted(sessionId: string): boolean {
  try {
    return localStorage.getItem(SID_STARTED(sessionId)) === '1'
  } catch {
    return false
  }
}

export function markSessionStarted(sessionId: string) {
  try {
    localStorage.setItem(SID_STARTED(sessionId), '1')
  } catch {}
}

export function clearSessionStarted(sessionId: string) {
  try {
    localStorage.removeItem(SID_STARTED(sessionId))
  } catch {}
}
