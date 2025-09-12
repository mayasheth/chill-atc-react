// src/store/weather.ts
import { create } from 'zustand'
import { AIRPORTS, type AirportCode } from '@/lib/atc/atcStreams'
import { fetchForecast } from '@/lib/weather/openmeteo'
import type { WeatherForecast } from '@/lib/weather/types'

/** TTLs (ms) */
const NOW_REFRESH_MS = 60_000       // refresh "current" every 60s
const STALE_MS = 55_000             // treat older-than as stale (triggers a fetch)

type Units = 'metric' | 'imperial'

type WeatherEntry = {
  data: WeatherForecast | null
  loading: boolean
  error: string | null
  fetchedAt: number | null
  lat: number
  lon: number
}

type WeatherState = {
  byKey: Record<string, WeatherEntry>
  units: Units

  /** internal watchers for background refresh */
  _refs: Record<string, number>
  _timers: Record<string, number> // window.setInterval ids

  // ---------- selectors / helpers ----------
  keyForAirport: (code: AirportCode) => string
  keyForCoords: (lat: number, lon: number) => string
  get: (key: string) => WeatherEntry | undefined

  // ---------- core actions ----------
  fetchForAirport: (code: AirportCode, force?: boolean) => Promise<WeatherForecast>
  fetchForCoords: (lat: number, lon: number, force?: boolean) => Promise<WeatherForecast>

  watchAirport: (code: AirportCode) => string              // returns key
  watchCoords: (lat: number, lon: number) => string        // returns key
  unwatchKey: (key: string) => void

  setUnits: (u: Units) => void
}

const newEmpty = (lat: number, lon: number): WeatherEntry => ({
  data: null, loading: false, error: null, fetchedAt: null, lat, lon,
})

export const useWeatherStore = create<WeatherState>((set, get) => ({
  byKey: {},
  units: 'metric',
  _refs: {},
  _timers: {},

  keyForAirport: (code) => {
    const a = AIRPORTS[code]
    return `${code}|${a.latitude}|${a.longitude}`
  },

  keyForCoords: (lat, lon) => `${lat.toFixed(4)}|${lon.toFixed(4)}`,

  get: (key) => get().byKey[key],

  async fetchForAirport(code, force = false) {
    const a = AIRPORTS[code]
    if (!a) throw new Error(`Unknown airport: ${code}`)
    return get().fetchForCoords(a.latitude, a.longitude, force)
  },

  async fetchForCoords(lat, lon, force = false) {
    const key = get().keyForCoords(lat, lon)
    const entry = get().byKey[key] ?? newEmpty(lat, lon)

    const now = Date.now()
    const isStale = !entry.fetchedAt || now - entry.fetchedAt > STALE_MS
    if (!force && entry.loading) return entry.data as WeatherForecast
    if (!force && !isStale && entry.data) return entry.data

    set((s) => ({
      byKey: {
        ...s.byKey,
        [key]: { ...(s.byKey[key] ?? newEmpty(lat, lon)), loading: true, error: null },
      },
    }))

    try {
      const data = await fetchForecast(lat, lon)
      set((s) => ({
        byKey: {
          ...s.byKey,
          [key]: { ...(s.byKey[key] ?? newEmpty(lat, lon)), data, loading: false, error: null, fetchedAt: Date.now() },
        },
      }))
      return data
    } catch (e: any) {
      const msg = e?.message ?? 'weather fetch failed'
      console.warn('[weather] fetch error', msg)
      set((s) => ({
        byKey: {
          ...s.byKey,
          [key]: { ...(s.byKey[key] ?? newEmpty(lat, lon)), loading: false, error: msg },
        },
      }))
      throw e
    }
  },

  watchAirport(code) {
    const a = AIRPORTS[code]
    const key = get().keyForAirport(code)
    // initialize entry
    set((s) => ({
      byKey: { ...s.byKey, [key]: s.byKey[key] ?? newEmpty(a.latitude, a.longitude) },
      _refs: { ...s._refs, [key]: (s._refs[key] ?? 0) + 1 },
    }))

    // start background interval if first watcher
    if (!get()._timers[key]) {
      // kick off an immediate fetch
      void get().fetchForCoords(a.latitude, a.longitude, true)
      const id = window.setInterval(() => {
        void get().fetchForCoords(a.latitude, a.longitude, false)
      }, NOW_REFRESH_MS)
      set((s) => ({ _timers: { ...s._timers, [key]: id } }))
    }
    return key
  },

  watchCoords(lat, lon) {
    const key = get().keyForCoords(lat, lon)
    set((s) => ({
      byKey: { ...s.byKey, [key]: s.byKey[key] ?? newEmpty(lat, lon) },
      _refs: { ...s._refs, [key]: (s._refs[key] ?? 0) + 1 },
    }))

    if (!get()._timers[key]) {
      void get().fetchForCoords(lat, lon, true)
      const id = window.setInterval(() => {
        void get().fetchForCoords(lat, lon, false)
      }, NOW_REFRESH_MS)
      set((s) => ({ _timers: { ...s._timers, [key]: id } }))
    }
    return key
  },

  unwatchKey(key) {
    const refs = (get()._refs[key] ?? 0) - 1
    const nextRefs = { ...get()._refs, [key]: Math.max(0, refs) }
    // clear interval if nobody watching
    if (refs <= 0 && get()._timers[key]) {
      clearInterval(get()._timers[key])
      const { [key]: _t, ...restTimers } = get()._timers
      set({ _timers: restTimers })
    }
    set({ _refs: nextRefs })
  },

  setUnits(u) { set({ units: u }) },
}))
