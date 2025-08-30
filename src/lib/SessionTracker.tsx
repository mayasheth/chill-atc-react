// src/components/system/SessionTracker.tsx
import { useEffect, useRef, useState } from 'react'
import { useAtc } from '@/store/atc'
import { usePlayback } from '@/store/playback'
import { useAuth } from '@/store/auth'
import { useTracking } from '@/store/tracking'
import {
  upsertSession,
  getUserId as getAnonUserId,
  getPersistedSessionId,
  setPersistedSessionId,
  clearPersistedSession,
  hasSessionStarted,
  markSessionStarted,
  clearSessionStarted,
} from '@/lib/trackSessions'

//  Helper to get total listening times 
async function fetchTotals(userId: string) {
  const url = new URL("/api/googleSheets", location.origin)
  url.searchParams.set("action", "sessionTotals")
  url.searchParams.set("userId", userId)
  const r = await fetch(url.toString())
  if (!r.ok) throw new Error("totals failed")
  return r.json() as Promise<{ globalTotalSeconds: number; userTotalSeconds: number }>
}

// Helper to debounce canStart
function useDebouncedBool(value: boolean, delayMs = 800) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(id)
  }, [value, delayMs])
  return debounced
}

export function SessionTracker({ updateIntervalSec = 120 }: { updateIntervalSec?: number }) {
  // Stream state
  const atcPlaying   = useAtc(s => s.atcPlaying)
  const atcStreamId  = useAtc(s => s.currentStreamId)

  const musicPlaying = usePlayback(s => s.musicPlaying)
  const playlistId   = usePlayback(s => s.currentContextUri)

  // Auth / identity
  const loginSessionId = useAuth(s => s.loginSessionId) // include in sessionKey per your requirement
  const authId  = useAuth(s => s.userEmail ?? null)
  const userId  = authId ?? getAnonUserId()

  // Tracking store
  const {
    sessionActive,
    sessionId,
    sessionKey,
    status,
    startOrResume,
    pause,
    end,
    getElapsedSeconds,
    setTotals,
    setUpdateInterval,
    updateIntervalSec: storeInterval,
  } = useTracking()

  // Derived flags
  const bothPlaying  = atcPlaying && musicPlaying
  const rawCanStart  = bothPlaying && !!atcStreamId && !!playlistId
  const canStart     = useDebouncedBool(rawCanStart, 900) // ~0.9s debounce

  // Key includes loginSessionId (so sessions on different logins are separate)
  const ctxKey = [userId, playlistId ?? '', atcStreamId ?? '', loginSessionId ?? ''].join('|')

  // Refs
  const prevKeyRef = useRef<string | null>(null)
  const hbRef  = useRef<number | null>(null)
  const totalsRef = useRef<number | null>(null)

  // ---- helper ops ----
  const startNow = async () => {
    // try to reuse persisted sid for this key
    const persistedSid = getPersistedSessionId(ctxKey)
    const usedSid = startOrResume(ctxKey, persistedSid ?? undefined)

    // persist mapping (in case we minted a new one)
    if (!persistedSid || persistedSid !== usedSid) {
      setPersistedSessionId(ctxKey, usedSid)
    }

    // emit "start" only once per sessionId
    if (!hasSessionStarted(usedSid)) {
      await upsertSession({
        sessionId: usedSid,
        event: 'start',
        userId,
        loginId: loginSessionId ?? null,
        atcStreamId: atcStreamId ?? null,
        playlistId: playlistId ?? null,
        durationSeconds: 0,
        updatedAt: new Date().toISOString(),
      })
      markSessionStarted(usedSid)
    }
  }

  const pauseNow = async () => {
    const total = pause() // fold current run
    const sid = useTracking.getState().sessionId
    if (!sid) return
    try {
      await upsertSession({
        sessionId: sid,
        event: 'heartbeat',
        durationSeconds: total,
        userId,
        loginId: loginSessionId ?? null,
        atcStreamId: atcStreamId ?? null,
        playlistId: playlistId ?? null,
        updatedAt: new Date().toISOString(),
      })
    } catch {}
  }

  const stopNow = async () => {
    const sidBefore = useTracking.getState().sessionId
    const finalSec = end()
    if (hbRef.current) { window.clearInterval(hbRef.current); hbRef.current = null }
    if (!sidBefore || finalSec == null) return
    try {
      await upsertSession({
        sessionId: sidBefore,
        event: 'stop',
        durationSeconds: finalSec,
        userId,
        loginId: loginSessionId ?? null,
        atcStreamId: atcStreamId ?? null,
        playlistId: playlistId ?? null,
        updatedAt: new Date().toISOString(),
      })
    } finally {
      // clear persistence so new sessions create new IDs
      clearPersistedSession(ctxKey)
      clearSessionStarted(sidBefore)
    }
  }

  // ---- effects ----

  // initial totals + on user change
  useEffect(() => {
    fetchTotals(userId).then(t => setTotals(t.globalTotalSeconds, t.userTotalSeconds)).catch(() => {})
  }, [userId, setTotals])

  // keep heartbeat interval length in store
  useEffect(() => { setUpdateInterval(updateIntervalSec) }, [updateIntervalSec, setUpdateInterval])

  // transition manager (start/resume, pause, end; also handle key changes)
  useEffect(() => {
    const prevKey = prevKeyRef.current
    prevKeyRef.current = ctxKey

    // If key changed mid-session, stop old and start new (if canStart)
    if ((sessionActive || sessionId) && prevKey && prevKey !== ctxKey) {
      void (async () => {
        await stopNow()
        if (canStart) await startNow()
      })()
      return
    }

    // Normal transitions
    if (canStart) {
      if (!sessionActive || !sessionId || sessionKey !== ctxKey) {
        void startNow()
      }
    } else {
      if (sessionActive) {
        void pauseNow()
      }
    }

    // cleanup intervals on key change handled in specific effects below
  }, [canStart, sessionActive, sessionId, sessionKey, ctxKey])

  // heartbeat loop (separate from transitions)
  useEffect(() => {
    if (!sessionActive || !sessionId) return
    if (hbRef.current) { window.clearInterval(hbRef.current); hbRef.current = null }

    const tick = async () => {
      const state = useTracking.getState()
      const sid = state.sessionId
      const isActive = state.sessionActive
      if (!sid || !isActive) return
      const durationSeconds = state.getElapsedSeconds()
      try {
        await upsertSession({
          sessionId: sid,
          event: 'heartbeat',
          durationSeconds,
          userId,
          loginId: loginSessionId ?? null,
          atcStreamId: atcStreamId ?? null,
          playlistId: playlistId ?? null,
          updatedAt: new Date().toISOString(),
        })
      } catch {}
    }

    // fire immediately, then on interval
    void tick()
    hbRef.current = window.setInterval(tick, storeInterval * 1000)
    return () => { if (hbRef.current) { window.clearInterval(hbRef.current); hbRef.current = null } }
  }, [sessionActive, sessionId, storeInterval, userId, loginSessionId, atcStreamId, playlistId])

  // totals refresher (every 60s, independent of heartbeat)
  useEffect(() => {
    const refresh = async () => {
      try {
        const t = await fetchTotals(userId)
        setTotals(t.globalTotalSeconds, t.userTotalSeconds)
      } catch {}
    }
    void refresh()
    totalsRef.current = window.setInterval(refresh, 60 * 1000)
    return () => { if (totalsRef.current) { window.clearInterval(totalsRef.current); totalsRef.current = null } }
  }, [userId, setTotals])

  // finalize on unmount
  useEffect(() => {
    return () => {
      if (hbRef.current) { window.clearInterval(hbRef.current); hbRef.current = null }
      if (totalsRef.current) { window.clearInterval(totalsRef.current); totalsRef.current = null }
      if (useTracking.getState().sessionId) void stopNow()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // resync on visibility
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      // force immediate heartbeat + totals refresh on resume
      if (useTracking.getState().sessionActive && useTracking.getState().sessionId) {
        void (async () => {
          try {
            await upsertSession({
              sessionId: useTracking.getState().sessionId!,
              event: 'heartbeat',
              durationSeconds: useTracking.getState().getElapsedSeconds(),
              userId,
              loginId: loginSessionId ?? null,
              atcStreamId: atcStreamId ?? null,
              playlistId: playlistId ?? null,
              updatedAt: new Date().toISOString(),
            })
          } catch {}
        })()
      }
      void fetchTotals(userId).then(t => setTotals(t.globalTotalSeconds, t.userTotalSeconds)).catch(() => {})
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [userId, setTotals, loginSessionId, atcStreamId, playlistId])

  return null
}
