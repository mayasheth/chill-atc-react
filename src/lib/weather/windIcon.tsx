// src/lib/weather/windIcons.tsx
import type { ComponentType, SVGProps } from 'react'

// Eagerly import wind_*.svg as React components (SVGR required)
const mods = import.meta.glob('/src/assets/icons/wind/wind_*.svg', {
  eager: true,
  query: '?react'
}) as Record<string, { default: ComponentType<SVGProps<SVGSVGElement>> }>

// Index → component map (0..12)
export const WIND_ICONS: ComponentType<SVGProps<SVGSVGElement>>[] = Array(13)
for (const [path, mod] of Object.entries(mods)) {
  const m = path.match(/wind_(\d+)\.svg$/)
  if (m) WIND_ICONS[Number(m[1])] = mod.default
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

/**
 * WindIcon
 * - `beaufort`: 0..12 (0 is valid)
 * - `deg`: wind direction **FROM** (meteorological), degrees clockwise from North
 *
 * Your base SVG points LEFT (i.e., 270°). To show meteorological "FROM",
 * rotation = deg - 270.
 */
export function WindIcon({
  beaufort,
  deg = 0,
  className,
  title
}: {
  beaufort: number | null | undefined
  deg?: number | null
  className?: string
  title?: string
}) {
  const idx = clamp(
    Math.round(Number.isFinite(beaufort as number) ? (beaufort as number) : 0),
    0,
    12
  )
  const Comp = WIND_ICONS[idx]
  if (!Comp) return null

  const d = typeof deg === 'number' && Number.isFinite(deg) ? deg : 0
  // Base icon = 270° (left). Meteorological vane (FROM) should point to `deg`.
  // Rotate by (deg - 270) so 0° → up, 90° → right, 180° → down, 270° → left.
  const rotation = d - 270

  return (
    <Comp
      className={[
        'origin-center transform [transform-box:fill-box]',
        // Style via text-*; keep lines constant width at any scale
        '[&_*]:stroke-current [&_*]:fill-current [&_*]:[vector-effect:non-scaling-stroke]',
        className ?? ''
      ].join(' ')}
      style={{ transform: `rotate(${rotation}deg)` }}
      role="img"
      aria-label={title ?? `Beaufort ${idx} (from ${Math.round(d)}°)`}
    />
  )
}
