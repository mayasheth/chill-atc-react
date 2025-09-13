export type Units = 'metric' | 'imperial'

export type WeatherNow = {
  time: Date
  isDay: boolean
  weatherCode: number
  tempC: number
  apparentTempC: number
  cloudCoverPct: number
  windSpeedKph: number
  windDirDeg: number
  windGustKph: number
  precipitationMm: number
  rainMm: number
  showersMm: number
  snowfallMm: number
}

export type WeatherDaily = {
  sunrise: Date
  sunset: Date
  sunshineDurationS: number
  tempMinC: number
  tempMaxC: number
  precipitationProbMax?: number
}

export type WeatherForecast = {
  now: WeatherNow
  daily: WeatherDaily
  timezone: string            // IANA, e.g. "America/Chicago"
  latitude: number
  longitude: number
  fetchedAt: number           // epoch ms — useful for TTL
  elevation: number
}
