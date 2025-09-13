import { useEffect, useMemo, useState } from 'react'

type Granularity = 'sec' | 'min' | 'hour'

export function useLocalClock(
  tz: string | null,
  granularity: Granularity = 'sec',
  hour12 = false
) {
  const [now, setNow] = useState(() => new Date())

  // tick exactly on the boundary (e.g., 12:34:00, 12:35:00, …)
  useEffect(() => {
    const step =
      granularity === 'sec' ? 1000 : granularity === 'min' ? 60_000 : 3_600_000

    // align first update to the next boundary
    const delay = step - (Date.now() % step)

    let t1: number | undefined
    let t2: number | undefined

    t1 = window.setTimeout(() => {
      setNow(new Date())
      t2 = window.setInterval(() => setNow(new Date()), step)
    }, delay)

    return () => {
      if (t1) clearTimeout(t1)
      if (t2) clearInterval(t2)
    }
  }, [granularity])

  // one formatter that includes time + timeZoneName so we can split parts
  const fmt = useMemo(() => {
    const opts: Intl.DateTimeFormatOptions = {
      timeZone: tz ?? undefined,
      hour: '2-digit',
      minute: '2-digit',
      hour12,
      timeZoneName: 'short'
    }
    if (granularity === 'sec') opts.second = '2-digit'
    // for 'hour' granularity you can drop minute if you prefer; keeping it for readability
    return new Intl.DateTimeFormat(undefined, opts)
  }, [tz, granularity, hour12])

  // split into time string and tz name
  const { time, tzName } = useMemo(() => {
    const parts = fmt.formatToParts(now)
    const tzPart = parts.find(p => p.type === 'timeZoneName')?.value ?? ''
    const timeStr = parts
      .filter(p => p.type !== 'timeZoneName')
      .map(p => p.value)
      .join('')
      .trim()
    return { time: timeStr, tzName: tzPart }
  }, [fmt, now])

  return {
    now,
    iso: now.toISOString(),
    time,                // e.g., "11:44" or "11:44:03"
    tzName,              // e.g., "PDT" / "GMT-7"
    formatted: tzName ? `${time} ${tzName}` : time
  }
}
