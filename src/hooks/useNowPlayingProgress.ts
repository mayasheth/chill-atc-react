// src/hooks/useNowPlayingProgress.ts
import { useEffect, useRef, useState } from "react"
import { usePlayback } from "@/store/playback"

export function useNowPlayingProgress() {
  const playing  = usePlayback(s => s.musicPlaying)
  const position = usePlayback(s => s.position)   // ms
  const duration = usePlayback(s => s.duration)   // ms

  const [uiPos, setUiPos] = useState(position)

  const basePosRef  = useRef(position)
  const baseTimeRef = useRef(performance.now())
  const rafRef      = useRef<number | null>(null)

  // Reset baseline when SDK updates position
  useEffect(() => {
    basePosRef.current  = position
    baseTimeRef.current = performance.now()
    setUiPos(position)
  }, [position])

  // Animate while playing
  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      return
    }

    const tick = () => {
      const now = performance.now()
      const elapsed = now - baseTimeRef.current
      const next = Math.min(duration, Math.max(0, basePosRef.current + elapsed))
      setUiPos(next)
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [playing, duration])

  const percent = duration > 0 ? (uiPos / duration) * 100 : 0
  return { uiPos, duration, percent }
}
