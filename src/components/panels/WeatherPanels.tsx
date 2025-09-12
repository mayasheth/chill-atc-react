// src/components/weather/WeatherMiniCard.tsx
import { memo, useMemo, useEffect } from 'react'
import { useAtc } from '@/store/atc'
import { RESOLVED_ATC_STREAMS } from '@/lib/atc/atcStreams'
import { useWeather } from '@/hooks/useWeather'
import { useLocalClock } from '@/hooks/useLocalClock'
import { useFormattedTemps } from '@/hooks/useFormattedTemps'
import { useWeatherStore } from '@/store/weather'
import { codeToShortLabel, codeToIconKey } from '@/lib/weather/codes'
import { kphToMph, mToFt, degToCardinal, windSpeedToBeaufort } from '@/lib/weather/convertUnits'
import { WeatherIcon, preloadIcons } from '@/lib/weather/iconLoader'
import { SunriseIcon, SunsetIcon, LocationIcon, ElevationIcon, ThermostatIcon } from '@/assets/icons/weather'
import { WindIcon } from '@/lib/weather/windIcon'

// ---------- helpers ----------
const Skel = ({ w = '4rem' }: { w?: string }) => (
  <span className="inline-block h-4 rounded bg-surface-3 animate-pulse" style={{ width: w }} />
)


const IconForCode = memo(function IconForCode({
  code,
  isNight,
  className = 'w-20 h-auto -mt-4 -mb-3 text-content-1'
}: {
  code: number
  isNight?: boolean
  className?: string
}) {
  const key = codeToIconKey(code, !!isNight)
  return <WeatherIcon name={key} className={className} title={codeToShortLabel(code)} />
})

// ---------- arrangement 0: live from header ----------
export const LiveFromInfo = memo(function LiveFromInfo({
  airportName,
  locationName,
  region,
  country,
  elevationMeters,
  units,
  className = ''
}: {
  airportName: string
  locationName: string
  region?: string | null
  country: string
  elevationMeters?: number | null
  units: 'metric' | 'imperial'
  className?: string
}) {
  const locText = useMemo(() => {
    const parts = [locationName, region || undefined, country].filter(Boolean)
    return parts.join(', ')
  }, [locationName, region, country])

  const elevationText = useMemo(() => {
    if (elevationMeters == null) return '—'

    // assume metric
    let elev = Math.round(elevationMeters)
    let unitLabel = elev == 1 ? 'meter' : 'meters' 

    if (units == "imperial") {
      elev = Math.round(mToFt(elevationMeters))
      unitLabel = elev == 1? 'foot' : 'feet'
    }

    return `${elev} ${unitLabel} above sea level`
  }, [elevationMeters, units])

  return (
    <div className={`flex w-full flex-col items-center text-center ${className}`}>
      {/* Row 1 */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-content-1 text-base sm:text-lg lowercase font-base font-light">
          live from
        </span>
        <span className="text-content-1 text-base sm:text-lg lowercase font-base font-semibold">
          {airportName}
        </span>
      </div>

      {/* Row 2 (location + optional icon) */}
      <div className="mt-0.5 inline-flex items-center gap-2 text-sm sm:text-base lowercase font-base font-light text-content-2">
        <LocationIcon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
        <span className="truncate max-w-[80ch]">{locText}</span>
      </div>

      {/* Row 3 (elevation + optional icon) */}
      <div className="mt-0.5 inline-flex items-center gap-2 text-sm sm:text-base lowercase font-base font-light text-content-3">
        <ElevationIcon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
        <span>{elevationText}</span>
      </div>
    </div>
  )
})

// ---------- arrangement 1: time ----------
const TimeInfo = memo(function TimeInfo({
  tz,
  sunrise,
  sunset
}: {
  tz: string | null
  sunrise?: Date | null
  sunset?: Date | null
}) {
  const fmt = useMemo(
    () => new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', hour12: false }),
    []
  )

  const clock = useLocalClock(tz, 'min')
  const srText = sunrise ? fmt.format(sunrise) : '—'
  const ssText = sunset ? fmt.format(sunset) : '—'

  return (
    <div className="flex min-w-0 flex-col gap-0 items-center text-center">

      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-xl sm:text-2xl font-mono font-semibold tracking-tighter text-content-1">{clock.time}</span>
        <span className="text-lg lowercase font-base font-semibold text-content-1">{clock.tzName}</span>
      </div>

      <div className="inline-flex gap-3">
        <span className="flex flex-col items-center text-content-2">
          <SunriseIcon className="h-10 w-auto -my-1" aria-hidden="true" />
          <span className="font-base font-light text-base"> {srText} </span>
        </span>

        <span className="flex flex-col items-center text-content-3">
          <SunsetIcon className="h-10 w-auto -my-1" aria-hidden="true" />
          <span className="font-base font-light text-base"> {ssText} </span>
        </span>
      </div>

          

    </div>
  )
})

// ---------- arrangement 2a: weather conditions ----------
const isNum = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v)

const ConditionInfo = memo(function ConditionInfo({
  error,
  cloudCoverPct,
  code,
  isNight,
}: {
  error: boolean
  cloudCoverPct?: number
  code?: number
  isNight?: boolean
}) {
  const showIcon = isNum(code)
  const label = showIcon ? codeToShortLabel(code!) : (error ? 'unavailable' : '—')
  const clouds = isNum(cloudCoverPct) ? `${Math.round(cloudCoverPct)}% cloudy` : '—'

  return (
    <div className="flex flex-col items-center gap-0">
      {showIcon ? <IconForCode code={code!} isNight={isNight} /> : <Skel w="2.75rem" />}
      <div className="truncate text-sm sm:text-base lowercase font-base font-semibold text-content-2">
        {label}
      </div>
      <div className="truncate text-sm sm:text-base lowercase font-base font-light text-content-3">
        {clouds}
      </div>
    </div>
  )
})

// ---------- arrangement 2b: temperature ----------
const TempInfo = memo(function TempInfo({
  loading,
  tempC,
  tempMinC,
  tempMaxC,
}: {
  loading: boolean
  tempC?: number
  tempMinC?: number
  tempMaxC?: number
}) {

  const { tempValue, tempUnit, minValue, maxValue } = useFormattedTemps(tempC, tempMinC, tempMaxC)


  return (
    <div className="inline-flex gap-2 items-center">
      <ThermostatIcon className="h-20 w-auto text-content-2 -mx-6 -mb-2" aria-hidden="true" />

      <div className="flex flex-col text-center gap-0">
        <div className="text-base">
          <span className="text-content-3 font-base font-semibold">{minValue}</span>
          <span className="text-content-4 font-base font-light text-sm align-middle"> low </span>
        </div>
        
        <div className="text-lg sm:text-2xl ">
          <span className="font-base font-semibold text-content-1">{ loading ? <Skel w="2rem" /> : tempValue }</span>
          <span className="ml-0.5 align-super text-base font-base font-light text-content-1">{tempUnit}</span>
        </div>
        
        <div className="text-base">
          <span className="text-content-3 font-base font-semibold">{maxValue}</span>
          <span className="text-content-4 font-base font-light text-sm align-middle"> high </span>
        </div>
      </div>
    </div>

  )
})

// ---------- arrangement 3: wind ----------

const WindInfo = memo(function WindInfo({
  windSpeedKph,
  windGustKph,
  windDirDeg,
  units
}: {
  windSpeedKph?: number
  windGustKph?: number
  windDirDeg?: number
  units: 'metric' | 'imperial'
}) {
  const bft = useMemo(() => windSpeedToBeaufort(windSpeedKph ?? 0), [windSpeedKph])

  const windSpeedText = useMemo(() => {
    const unit = units === 'metric' ? 'km/h' : 'mph'
    if (!isNum(windSpeedKph)) return { value: '—', unit: '', sub: '' }

    const conv = (kph: number) => (units === 'metric' ? kph : kphToMph(kph))
    const spd = Math.round(conv(windSpeedKph))
    const gst = isNum(windGustKph) ? Math.round(conv(windGustKph)) : null

    if (gst != null && gst > spd) {
      // show range with single unit
      return { value: `${spd}–${gst}`, unit, sub: 'wind–gusts' }
    }
    // only sustained wind available (or gust ≤ wind)
    return { value: `${spd}`, unit, sub: 'wind' }
  }, [windSpeedKph, windGustKph, units])

  const { value, unit, sub } = windSpeedText

  return (
    <div className="flex flex-col min-w-0 items-center justify-center gap-0">

      {/* Arrow points in direction of wind source, following meteorological convention */}
      <WindIcon
        beaufort={bft}
        deg={windDirDeg ?? 0}
        className="h-13 w-13 text-content-1 mb-3"
        title={`Beaufort ${bft}`}
      />

      <div className="text-base">
        <span className="text-content-3 font-base font-semibold">{value}</span>
        <span className="ml-1 align-baseline text-content-3">{unit}</span>
      </div>
      {sub && <div className="text-content-4 text-sm font-light">{sub}</div>}
      
    </div>
  )
})


// ---------- main card ----------
export const WeatherMiniCard = memo(function WeatherMiniCard() {
  const { atcPlaying } = useAtc()
  const streamId = useAtc((s) => s.currentStreamId) as keyof typeof RESOLVED_ATC_STREAMS | null
  const stream = streamId ? RESOLVED_ATC_STREAMS[streamId] : null
  const airportCode = stream?.airport.code ?? null
  const { data, loading, error } = useWeather(airportCode)

  //const coords = stream ? { lat: stream.airport.latitude, lon: stream.airport.longitude } : null
  //const { data, loading, error } = useWeather(coords)
  const units = useWeatherStore((s) => s.units)
  const setUnits = useWeatherStore((s) => s.setUnits)

  const isNight = useMemo(() => {
    if (!data) return false
    return !data.now.isDay
  }, [data])

  useEffect(() => {
    const base = codeToIconKey(data?.now?.weatherCode ?? 0, isNight)
    const neighbors = ['wi-cloudy','wi-rain','wi-showers'] // cheap safety net
    preloadIcons([base, ...neighbors])
  }, [data?.now?.weatherCode, isNight])

  const unitButton = (
    <button
      onClick={() => setUnits(units === 'metric' ? 'imperial' : 'metric')}
      className="mx-2 rounded-md bg-surface-2 px-3 py-1 text-sm font-base hover:bg-surface-3 transition duration-400 focus-outline"
      aria-pressed={units === 'imperial'}
      title="Toggle units"
    >
      <span className="text-sm">{units === 'metric' ? '°C | km/h' : '°F | mph'}</span>
    </button>
  )

  const TransitionClasses = [
    'transition-all duration-1000 ease-in-out overflow-hidden',
    atcPlaying
      ? 'opacity-100 translate-y-0 sm:max-h-[520px] pointer-events-auto mt-12'
      : 'opacity-0 translate-y-4 max-h-0 pointer-events-none',
    'flex flex-col items-center'
  ].join(' ')

  if (!airportCode) return null
  // className="mt-4 grid w-full grid-cols-1 items-center justify-items-center gap-0 sm:mt-3 sm:grid-cols-5"
  return (
    <div className={TransitionClasses}>

      {/* header */}
      <div className="w-full pb-4">
        <LiveFromInfo
          airportName={stream?.airport.nameCommon ?? airportCode!}
          locationName={stream?.location.name ?? ''}
          region={stream?.location.region ?? null}
          country={stream?.location.country ?? ''}
          elevationMeters={data?.elevation ?? null}
          units={units}/>
      </div>

      {/* four arrangements */}
      <div className="mt-4 sm:mt-3 flex w-full flex-col sm:flex-row gap-6 sm:gap-12 items-center justify-items-center">
        {/* Time */}
        <TimeInfo
          tz={data?.timezone ?? null}
          sunrise={data?.daily?.sunrise ?? null}
          sunset={data?.daily?.sunset ?? null}
        />

        {/* Condiitons */}
        <ConditionInfo
          error={!!error}
          cloudCoverPct={data?.now?.cloudCoverPct}
          code={data?.now?.weatherCode}
          isNight={isNight}
        />

        {/* Temperature */}
        <TempInfo
          loading={!!loading}
          tempC={data?.now?.tempC}
          tempMinC={data?.daily?.tempMinC}
          tempMaxC={data?.daily?.tempMaxC}
        />

        {/* Wind */}
        <WindInfo
          windSpeedKph={data?.now?.windSpeedKph}
          windGustKph={data?.now?.windGustKph}
          windDirDeg={data?.now?.windDirDeg}
          units={units}
        />

         <div className="">{unitButton}</div>

      </div>
    </div>
  )
})
