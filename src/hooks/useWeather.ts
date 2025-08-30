import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getForecast, type WeatherForecast } from "@/lib/getOpenMeteoForecast";

export function useWeather(lat: number | null, lon: number | null) {
  return useQuery<WeatherForecast>({
    queryKey: ["weather", lat, lon],
    queryFn: () => getForecast(lat!, lon!),
    enabled: lat != null && lon != null,
    staleTime: 5 * 60 * 1000,  // 5 min
    gcTime: 30 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}
