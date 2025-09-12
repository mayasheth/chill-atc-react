import { useMemo } from 'react'
import { useWeatherStore } from '@/store/weather'
import { cToF } from '@/lib/weather/convertUnits'

// helper: convert a °C value into current units and round
const toUnitValue = (units: 'metric' | 'imperial') => (c?: number | null) =>
  c == null ? null : Math.round(units === 'metric' ? c : cToF(c))

export function useFormattedTemps(
  tempC?: number | null,
  tempMinC?: number | null,
  tempMaxC?: number | null
) {
  const units = useWeatherStore(s => s.units)
  const convert = useMemo(() => toUnitValue(units), [units])

  const [tempVal, minVal, maxVal] = useMemo(
    () => [tempC, tempMinC, tempMaxC].map(convert),
    [convert, tempC, tempMinC, tempMaxC]
  )

  const tempUnit = units === 'metric' ? '°C' : '°F'

  // return strings for easy rendering (use nulls if you prefer numbers)
  return {
    tempValue: tempVal == null ? '—' : String(tempVal),
    tempUnit, // separate so you can style it independently
    minValue:  minVal == null ? '—' : String(minVal), // no unit
    maxValue:  maxVal == null ? '—' : String(maxVal)  // no unit
  }
}