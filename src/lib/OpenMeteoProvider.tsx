import { useEffect } from "react"
import { useWeatherStore } from "@/store/weather"
import { useQueryClient } from "@tanstack/react-query"
import { getForecast } from "@/lib/getOpenMeteoForecast"

export function WeatherProvider({ children }: { children: React.ReactNode }) {
  const { lat, lon, geoEnabled, setLocation } = useWeatherStore()
  const qc = useQueryClient()

  // Geolocation (watch; falls back gracefully if denied)
  useEffect(() => {
    if (!geoEnabled || !("geolocation" in navigator)) return
    const id = navigator.geolocation.watchPosition(
      (pos) => setLocation(pos.coords.latitude, pos.coords.longitude),
      () => {/* ignore errors; user may deny */},
      { maximumAge: 10 * 60_000, enableHighAccuracy: false }
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [geoEnabled, setLocation])

  // Prefetch current forecast when we have coords
  useEffect(() => {
    if (lat == null || lon == null) return
    qc.prefetchQuery({ queryKey: ["weather", lat, lon], queryFn: () => getForecast(lat, lon) })
  }, [lat, lon, qc])

  return <>{children}</>
}
