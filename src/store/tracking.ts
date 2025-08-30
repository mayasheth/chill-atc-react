// src/store/tracking.ts
import { create } from 'zustand'

type Status = 'idle' | 'active' | 'paused'

export type TrackingState = {
  // identity for the logical session
  sessionKey: string | null        // e.g., `${userId}|${playlistId}|${atcStreamId}|${loginSessionId ?? ''}`
  sessionId: string | null

  // timing
  status: Status
  sessionActive: boolean           // mirror of (status === 'active') for easy subscription
  activeSinceIso: string | null    // anchor of the current active run; null if paused
  accumulatedSec: number           // total from prior runs in this session

  // totals (from Sheets)
  userTotalSeconds: number
  globalTotalSeconds: number
  updateIntervalSec: number

  // actions
  startOrResume: (sessionKey: string, reuseSessionId?: string | null) => string // returns used sessionId
  pause: () => number                                     // returns current total seconds (folded)
  end: () => number | null                                // returns final seconds (or null if no session)
  setTotals: (globalSec: number, userSec: number) => void
  setUpdateInterval: (n: number) => void

  // selectors
  getElapsedSeconds: () => number                         // accumulated + live delta (if active)
}

const newSessionId = () => `session_${Math.random().toString(36).slice(2, 10)}`

export const useTracking = create<TrackingState>()((set, get) => ({
  sessionKey: null,
  sessionId: null,

  status: 'idle',
  sessionActive: false,
  activeSinceIso: null,
  accumulatedSec: 0,

  userTotalSeconds: 0,
  globalTotalSeconds: 0,
  updateIntervalSec: 120,

  getElapsedSeconds() {
    const s = get()
    const live = s.activeSinceIso
      ? Math.max(0, Math.floor((Date.now() - Date.parse(s.activeSinceIso)) / 1000))
      : 0
    return s.accumulatedSec + live
  },

  setTotals(globalSec, userSec) {
    set({ globalTotalSeconds: globalSec, userTotalSeconds: userSec })
  },

  setUpdateInterval(n) {
    set({ updateIntervalSec: n })
  },

  startOrResume(nextKey, reuseSessionId) {
    const s = get()

    // Switching keys: end() the current session if it exists.
    if (s.sessionKey && s.sessionKey !== nextKey) {
      // finalize current before switching
      const extra = s.activeSinceIso
        ? Math.max(0, Math.floor((Date.now() - Date.parse(s.activeSinceIso)) / 1000))
        : 0
      const final = s.accumulatedSec + extra
      // Reset to idle; caller will start new session below.
      set({
        sessionId: null,
        sessionKey: null,
        status: 'idle',
        sessionActive: false,
        activeSinceIso: null,
        accumulatedSec: 0,
      })
      // We deliberately do not return here—flow continues to start the new key.
      // If you need the old `final`, compute it again at the callsite via getElapsedSeconds() before calling startOrResume on a different key.
    }

    // Reuse a provided/persisted sessionId or mint a new one
    const currentId = reuseSessionId ?? get().sessionId ?? newSessionId()

    // If we were paused, we keep accumulatedSec; if idle, we start fresh.
    const wasPaused = get().status === 'paused'

    set({
      sessionKey: nextKey,
      sessionId: currentId,
      status: 'active',
      sessionActive: true,
      activeSinceIso: new Date().toISOString(),
      accumulatedSec: wasPaused ? get().accumulatedSec : 0,
    })

    return currentId
  },

  pause() {
    const s = get()
    if (s.status !== 'active') return s.accumulatedSec
    const extra = Math.max(0, Math.floor((Date.now() - Date.parse(s.activeSinceIso!)) / 1000))
    const total = s.accumulatedSec + extra
    set({
      accumulatedSec: total,
      activeSinceIso: null,
      status: 'paused',
      sessionActive: false,
    })
    return total
  },

  end() {
    const s = get()
    if (!s.sessionId && !s.sessionKey) return null
    const extra = s.activeSinceIso
      ? Math.max(0, Math.floor((Date.now() - Date.parse(s.activeSinceIso)) / 1000))
      : 0
    const final = s.accumulatedSec + extra
    set({
      sessionId: null,
      sessionKey: null,
      status: 'idle',
      sessionActive: false,
      activeSinceIso: null,
      accumulatedSec: 0,
    })
    return final
  },
}))
