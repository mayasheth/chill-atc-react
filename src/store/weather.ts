import { create } from "zustand"

type Units = "imperial" | "metric"

type WeatherState = {
  lat: number | null
  lon: number | null
  units: Units
  geoEnabled: boolean
  setLocation: (lat: number, lon: number) => void
  setUnits: (u: Units) => void
  enableGeo: () => void
  disableGeo: () => void
}

export const useWeatherStore = create<WeatherState>((set) => ({
  lat: null,
  lon: null,
  units: "imperial",
  geoEnabled: true,
  setLocation: (lat, lon) => set({ lat, lon }),
  setUnits: (u) => set({ units: u }),
  enableGeo: () => set({ geoEnabled: true }),
  disableGeo: () => set({ geoEnabled: false }),
}))
