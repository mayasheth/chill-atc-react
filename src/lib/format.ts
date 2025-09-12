// src/lib/format.ts


export function formatTime(ms: number): string {
  if (!ms || ms < 0) return "0:00"
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

export function formatDuration(sec: number, digits: number = 3): [number, string] {
  const s = Math.max(0, Math.round(sec))
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  const max_value = 10 ** digits
  
  if (s < max_value) {
    if (s == 1) return [s, "second"]
    return [s, "seconds"]
  }
  if (m < max_value) {
    return [m, "minutes"]
  }

  return [h, 'hours']
}