import { useEffect, useMemo, useRef, useState } from 'react'
import { useTracking } from '@/store/tracking'
import { formatDuration } from '@/lib/format'
import { StatField } from '@/components/ui'
import { useWaveform } from "@/hooks/useWaveform";
import { useAtc } from "@/store/atc";
import { usePlayback } from "@/store/playback";

/** ms until the next boundary of the given granularity (in seconds) */
function msToNextBoundary(totalSeconds: number, granularitySec: number) {
  const into = totalSeconds % granularitySec
  const toNext = into === 0 ? granularitySec : granularitySec - into
  return toNext * 1000
}

/** For totals: 1s if <1000s; 1m if <1000min; else 1h */
function nextTickForTotalsSeconds(totalSeconds: number) {
  if (totalSeconds < 1000) return msToNextBoundary(totalSeconds, 1)          // seconds
  if (totalSeconds < 1000 * 60) return msToNextBoundary(totalSeconds, 60)    // minutes
  return msToNextBoundary(totalSeconds, 3600)                                 // hours
}

/** For the session tile: tick on second/min/hour boundaries based on units */
function nextTickForSession(elapsedSeconds: number, units: string) {
  const u = (units || '').toLowerCase()
  if (u.startsWith('sec')) return msToNextBoundary(elapsedSeconds, 1)
  if (u.startsWith('min')) return msToNextBoundary(elapsedSeconds, 60)
  return msToNextBoundary(elapsedSeconds, 3600)
}

export function StatsPanel() {
  const {
    sessionActive,
    userTotalSeconds: baseUserSec,
    globalTotalSeconds: baseGlobalSec,
    getElapsedSeconds,
  } = useTracking()

  // Force re-render on a schedule
  const [, bump] = useState(0)
  const bumpNow = () => bump(x => x + 1)

  // Track when totals last changed so we add only the **delta since that refresh**
  const lastTotalsAtMsRef = useRef<number>(Date.now())
  const elapsedAtRefreshRef = useRef<number>(0)

  // Whenever the server totals change, capture a fresh snapshot
  useEffect(() => {
    lastTotalsAtMsRef.current = Date.now()
    elapsedAtRefreshRef.current = getElapsedSeconds()
  }, [baseUserSec, baseGlobalSec, getElapsedSeconds])

  // Live session seconds
  const elapsedSeconds = getElapsedSeconds()
  const [elapsedDur, elapsedUnits] = formatDuration(elapsedSeconds)

  // Live delta since last totals refresh (never negative)
  const liveDeltaSinceRefresh = useMemo(() => {
    const delta = elapsedSeconds - elapsedAtRefreshRef.current
    return Math.max(0, delta)
  }, [elapsedSeconds])

  // Displayed totals = base + live delta (while active)
  const userDisplaySeconds = baseUserSec + (sessionActive ? liveDeltaSinceRefresh : 0)
  const globalDisplaySeconds = baseGlobalSec + (sessionActive ? liveDeltaSinceRefresh : 0)

  const [userDur, userUnits] = formatDuration(userDisplaySeconds)
  const [globalDur, globalUnits] = formatDuration(globalDisplaySeconds)

  // Single self-scheduling timeout that picks the earliest needed tick
  useEffect(() => {
    // Compute delays for each tile
    const dSession = nextTickForSession(elapsedSeconds, elapsedUnits)
    const dUser = nextTickForTotalsSeconds(userDisplaySeconds)
    const dGlobal = nextTickForTotalsSeconds(globalDisplaySeconds)

    const delay = Math.max(200, Math.min(dSession, dUser, dGlobal))
    const id = window.setTimeout(bumpNow, delay)
    return () => clearTimeout(id)
  }, [
    // values that affect tick cadence
    elapsedSeconds,
    elapsedUnits,
    userDisplaySeconds,
    globalDisplaySeconds,
  ])

  // Resync immediately when tab becomes visible
  useEffect(() => {
    const onVisible = () => document.visibilityState === 'visible' && bumpNow()
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:gap-16 sm:flex-grow mt-0">
      <StatField value={elapsedDur} unit={elapsedUnits} label="current session" active={sessionActive} />
      <StatField value={userDur} unit={userUnits} label="your total" />
      <StatField value={globalDur} unit={globalUnits} label="global total" />
    </div>
  )
}


export function WaveformPanel() {
  const isAtcPlaying     = useAtc(s => s.atcPlaying)
  const atcVolume        = useAtc(s => s.volume)
  const atcStreamId      = useAtc(s => s.currentStreamId)

  const isSpotifyPlaying = usePlayback(s => s.musicPlaying)
  const spotifyVolume    = usePlayback(s => s.volume)
  const playlistId       = usePlayback(s => s.currentContextUri)

  const { canvasRef } = useWaveform({
    isSpotifyPlaying,
    isAtcPlaying,
    spotifyVolume,
    atcVolume,
    playlistId,
    atcStreamId,
  })

  return (
    <div className="w-full self-stretch">                {/* defeat Card's items-center */}
      <div className="mx-auto w-11/12 max-w-2xl">        {/* ← centered + narrower */}
        {/* alternatives:
            className="mx-auto w-[min(92%,720px)]"
            className="mx-auto w-5/6 md:w-4/5 lg:w-3/4 xl:w-2/3"
        */}
        <canvas
          ref={canvasRef}
          className="block w-full h-20 md:h-24 rounded-xl"
          aria-label="waveform visualization"
        />
      </div>
    </div>
  );

}

