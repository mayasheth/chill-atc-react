import React from 'react'

type IconModule = { default: React.ComponentType<React.SVGProps<SVGSVGElement>> }
type IconComp = React.ComponentType<React.SVGProps<SVGSVGElement>>

// Absolute-from-root pattern + recursive, query added via options
const modMap = import.meta.glob('/src/assets/icons/weather/**/*.svg', {
  eager: false,
  query: '?react'
}) as Record<string, () => Promise<IconModule>>

// Build loader map and export keys
const loaders: Record<string, () => Promise<IconModule>> = {}
for (const [path, loader] of Object.entries(modMap)) {
  const filename = path.split('/').pop()! // e.g. "wi-day-sunny.svg"
  const base = filename.replace(/\.svg$/i, '') // → "wi-day-sunny"
  loaders[base] = loader
}

export const AVAILABLE_WEATHER_ICON_KEYS = Object.freeze(Object.keys(loaders).sort())

const cache = new Map<string, IconComp>()
export function preloadIcons(keys: string[]) {
  keys.forEach((k) => {
    if (!cache.has(k) && loaders[k]) {
      loaders[k]().then((m) => cache.set(k, m.default)).catch(() => {})
    }
  })
}


// Normalize incoming names (handles ".svg", ".svg?react", accidental path, whitespace)
function normalizeKey(name: string) {
  const last = name.split('/').pop()!.trim()
  return last.replace(/\.svg(\?react)?$/i, '')
}

function useIcon(name: string | null | undefined) {
  const [Comp, setComp] = React.useState<IconComp | null>(null)

  React.useEffect(() => {
    if (!name) { setComp(null); return }

    const key = normalizeKey(name)

    const cached = cache.get(key)
    if (cached) { setComp(() => cached); return }

    const loader = loaders[key]
    if (!loader) {
      if (import.meta.env.DEV) {
        console.warn(
          `[WeatherIcon] No loader for "${key}". ` +
          `Ensure /src/assets/icons/weather/${key}.svg exists.\n` +
          `Available (first 20): ${AVAILABLE_WEATHER_ICON_KEYS.slice(0,20).join(', ')} … ` +
          `(total ${AVAILABLE_WEATHER_ICON_KEYS.length})`
        )
      }
      setComp(null)
      return
    }

    let cancelled = false
    loader()
      .then((m) => { if (!cancelled) { cache.set(key, m.default); setComp(() => m.default) } })
      .catch((err) => { if (!cancelled) { console.error(`[WeatherIcon] Failed to load "${key}"`, err); setComp(null) } })
    return () => { cancelled = true }
  }, [name])

  return Comp
}

export function WeatherIcon({
  name,
  className,
  title
}: {
  name: string | null | undefined // pass just "wi-day-sunny" (no extension)
  className?: string
  title?: string
}) {
  const Comp = useIcon(name)
  if (Comp) {
    return (
      <Comp className={className} role="img" aria-label={title ?? undefined}>
        {title ? <title>{title}</title> : null}
      </Comp>
    )
  }
  return (
    <span className={className} role="img" aria-label={title ?? 'weather'}>
      ☁️
    </span>
  )
}
