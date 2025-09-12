// hooks/useWeather.ts
import { useEffect, useMemo, useRef, useState } from 'react'
import { AIRPORTS, type AirportCode } from '@/lib/atc/atcStreams'
import { fetchForecast } from '@/lib/weather/openmeteo'
import type { WeatherForecast, WeatherNow, WeatherDaily } from '@/lib/weather/types'

type Coords = { lat: number; lon: number }
type Input = AirportCode | string | Coords | null

const TTL_MS = 2 * 60_000
const CACHE = new Map<string, { data: WeatherForecast; at: number }>()
const INFLIGHT = new Map<string, AbortController>()

const isAirportCode = (v: unknown): v is AirportCode =>
  typeof v === 'string' && v.toUpperCase() in AIRPORTS

const keyForCoords = (lat: number, lon: number) =>
  `coords:${lat.toFixed(4)},${lon.toFixed(4)}`
const keyForAirport = (code: AirportCode) => `apt:${code}`

function resolve(input: Input): { key: string; coords: Coords } | null {
  if (!input) return null
  if (typeof input === 'object') {
    return { key: keyForCoords(input.lat, input.lon), coords: input }
  }
  if (isAirportCode(input)) {
    const code = input.toUpperCase() as AirportCode
    const a = AIRPORTS[code]
    if (!a) return null
    return { key: keyForAirport(code), coords: { lat: a.latitude, lon: a.longitude } }
  }
  return null
}

// guard that what we got is the normalized shape your UI expects
function looksNormalized(x: any): x is WeatherForecast {
  return !!(x && x.now && typeof x.now.tempC === 'number')
}

export function useWeather(input: Input, opts?: { ttlMs?: number; revalidate?: boolean }) {
  const ttlMs = opts?.ttlMs ?? TTL_MS
  const revalidate = opts?.revalidate ?? true

  const plan = useMemo(() => resolve(input), [input])
  const [data, setData] = useState<WeatherForecast | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const lastKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (!plan) {
      lastKeyRef.current = null
      setData(null); setLoading(false); setError(null)
      return
    }

    const { key, coords } = plan
    lastKeyRef.current = key

    // 1) serve fresh cache immediately
    const hit = CACHE.get(key)
    const fresh = hit && Date.now() - hit.at < ttlMs
    if (fresh) {
      setData(hit.data); setLoading(false); setError(null)
      if (!revalidate) return
    } else {
      setLoading(true); setError(null)
    }

    // 2) cancel any in-flight for this key
    INFLIGHT.get(key)?.abort()
    const ac = new AbortController()
    INFLIGHT.set(key, ac)

    // 3) fetch with abort + SWR
    fetchForecast(coords.lat, coords.lon, { signal: ac.signal })
      .then((json: any) => {
        if (ac.signal.aborted || lastKeyRef.current !== key) return

        if (!looksNormalized(json)) {
          if (import.meta.env.DEV) {
            console.warn('[useWeather] Unexpected payload shape. Your UI expects { now: { tempC... }, daily: { sunrise... }, ... }')
            console.log('payload sample:', json)
          }
        }

        const normalized = json as WeatherForecast
        CACHE.set(key, { data: normalized, at: Date.now() })
        setData(normalized)
        setLoading(false)
        setError(null)
      })
      .catch((err) => {
        if (ac.signal.aborted || lastKeyRef.current !== key) return
        setError(err)
        setLoading(false)
      })
      .finally(() => {
        if (INFLIGHT.get(key) === ac) INFLIGHT.delete(key)
      })

    return () => {
      if (INFLIGHT.get(key) === ac) {
        ac.abort()
        INFLIGHT.delete(key)
      }
    }
  }, [plan, ttlMs, revalidate])

  return { data, loading, error }
}