// src/lib/AtcAudioProvider.tsx
import { useEffect, useRef } from "react"
import { useAtc } from "@/store/atc"

export function AtcAudioProvider({ children }: { children: React.ReactNode }) {
  const setAudio = useAtc(s => s.setAudio)
  const ref = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (ref.current) setAudio(ref.current)
    return () => setAudio(null)
  }, [setAudio])

  return (
    <>
      <audio ref={ref} preload="none" /> {/* hidden; controlled via store */}
      {children}
    </>
  )
}
