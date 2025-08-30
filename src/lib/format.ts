import type { Channel } from '@/config/atcStreams'

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

export function timeOfDay(date: Date, tz = 'America/Los_Angeles') {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true, timeZone: tz
  }).format(date)
}


export type NonNullChannel = Exclude<Channel, null>

export const formatChannels = (ch?: Channel | Channel[] | null) => {
  if (!ch) return ''
  const list = Array.isArray(ch) ? ch : [ch]
  return list
    .filter((c): c is NonNullChannel => c !== null)
    .map((c) => c.toLowerCase())
    .join(' | ')
}