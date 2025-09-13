// src/lib/weather/openmeteo.ts
import type { WeatherForecast, WeatherDaily, WeatherNow } from './types'

/**
 * Fetches "current" + "daily" for a single lat/lon.
 * Uses timezone=auto so we also get a proper IANA tz for the airport.
 */
export async function fetchForecast(lat: number, lon: number, opts?: { signal?: AbortSignal }): Promise<WeatherForecast> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    timezone: 'auto',
    forecast_days: '1',
    models: 'best_match',
    // Note: order doesn't matter in the plain JSON API
    current: [
      'is_day',
      'weather_code',
      'temperature_2m',
      'apparent_temperature',
      'cloud_cover',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m',
      'precipitation',
      'rain',
      'showers',
      'snowfall',
    ].join(','),
    daily: [
      'sunrise',
      'sunset',
      'sunshine_duration',
      'temperature_2m_min',
      'temperature_2m_max',
      'precipitation_probability_max',
    ].join(','),
  })

  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`
  const res = await fetch(url, { signal: opts?.signal })
  if (!res.ok) throw new Error(`open-meteo ${res.status} ${res.statusText}`)
  const j = await res.json()

  const tz = String(j.timezone ?? 'UTC')
  const elevation = Number(j.elevation ?? NaN)

  // current fields are simple scalars; time is ISO without seconds
  const currentTimeIso: string | undefined = j.current?.time // e.g. "2025-01-20T10:00"
  const currentTime = currentTimeIso ? new Date(currentTimeIso) : new Date()

  const now: WeatherNow = {
    time: currentTime,
    isDay: Boolean(j.current?.is_day ?? 1),
    weatherCode: Number(j.current?.weather_code ?? 0),
    tempC: Number(j.current?.temperature_2m ?? NaN),
    apparentTempC: Number(j.current?.apparent_temperature ?? NaN),
    cloudCoverPct: Number(j.current?.cloud_cover ?? NaN),
    windSpeedKph: Number(j.current?.wind_speed_10m ?? NaN),
    windDirDeg: Number(j.current?.wind_direction_10m ?? NaN),
    windGustKph: Number(j.current?.wind_gusts_10m ?? NaN),
    precipitationMm: Number(j.current?.precipitation ?? 0),
    rainMm: Number(j.current?.rain ?? 0),
    showersMm: Number(j.current?.showers ?? 0),
    snowfallMm: Number(j.current?.snowfall ?? 0),
  }

  const daily: WeatherDaily = {
    sunrise: new Date(j.daily?.sunrise?.[0] ?? Date.now()),
    sunset: new Date(j.daily?.sunset?.[0] ?? Date.now()),
    sunshineDurationS: Number(j.daily?.sunshine_duration?.[0] ?? 0),
    tempMinC: Number(j.daily?.temperature_2m_min?.[0] ?? NaN),
    tempMaxC: Number(j.daily?.temperature_2m_max?.[0] ?? NaN),
    precipitationProbMax: Number(j.daily?.precipitation_probability_max?.[0] ?? 0),
  }

  return {
    now,
    daily,
    timezone: tz,                        // ← pass to useLocalClock
    latitude: Number(j.latitude ?? lat),
    longitude: Number(j.longitude ?? lon),
    fetchedAt: Date.now(),
    elevation: elevation,
  }
}
