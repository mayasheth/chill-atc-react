// src/lib/weather/codes.ts

import RAW_TSV from '@/assets/data/weatherCodes.tsv?raw'

type Row = {
  code: number
  label: string
  label_short: string
  icon: string
  night_icon?: string
}

function parseTsv(raw: string): Record<string, string>[] {
  const lines = raw.trim().split(/\r?\n/).filter(l => l.trim() && !l.trim().startsWith('#'))
  const header = lines.shift()!
  const cols = header.split('\t').map(h => h.trim())
  return lines.map(line => {
    const parts = line.split('\t')
    const obj: Record<string, string> = {}
    cols.forEach((c, i) => { obj[c] = (parts[i] ?? '').trim() })
    return obj
  })
}

function toRows(records: Record<string, string>[]): Row[] {
  const rows: Row[] = []
  for (const r of records) {
    const code = Number(r.code)
    if (!Number.isInteger(code)) continue
    rows.push({
      code,
      label: r.label ?? `Weather code ${code}`,
      label_short: r.label_short ?? 'Weather',
      icon: r.icon ?? 'wi-day-cloudy',
      night_icon: r.night_icon || undefined
    })
  }
  return rows
}

const rows = toRows(parseTsv(RAW_TSV))

// Build lookups
const LABEL = new Map<number, string>()
const SHORT = new Map<number, string>()
const ICONS = new Map<number, { icon: string; night?: string }>()

for (const r of rows) {
  LABEL.set(r.code, r.label)
  SHORT.set(r.code, r.label_short)
  ICONS.set(r.code, { icon: r.icon, night: r.night_icon })
}

// Public API
export function codeToLabel(code: number): string {
  return LABEL.get(code) ?? `Weather code ${code}`
}
export function codeToShortLabel(code: number): string {
  return SHORT.get(code) ?? 'Weather'
}
export function codeToIconKey(code: number, isNight = false): string {
  const hit = ICONS.get(code)
  if (!hit) return isNight ? 'wi-night-alt-cloudy' : 'wi-day-cloudy'
  return isNight && hit.night ? hit.night : hit.icon
}

// Optional: export table for debugging
export const WEATHER_TABLE = rows
