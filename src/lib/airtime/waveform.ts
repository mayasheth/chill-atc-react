// src/lib/waveform.ts

export type WaveParams = {
  baseFrequency: number;
  jitterFrequency: number;
  baseAmplitude: number;
  jitterAmplitude: number;
  timeScale: number;
  // internal smoothing fields (set at runtime)
  _ampTarget?: number;
  _freqTarget?: number;
  _ampCurrent?: number;
  _freqCurrent?: number;
};

// Resolve a CSS custom property (which may be oklch(), hsl(), color-mix, etc.)
// to a computed rgb/rgba string and optionally force an alpha.
// Works across modern browsers and color spaces.
export function getCssVar(name: string, alpha?: number): string {
  const val = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();

  // Fallback to plain value if var is empty
  const colorInput = val || name;

  // Use the CSS engine to resolve into sRGB
  const probe = document.createElement("span");
  probe.style.color = colorInput;            // can be oklch()/color-mix()/etc.
  document.body.appendChild(probe);
  const computed = getComputedStyle(probe).color; // typically "rgb(r, g, b)" or "rgba(r, g, b, a)"
  document.body.removeChild(probe);

  if (alpha == null) return computed;

  // Force alpha
  const m = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/);
  if (!m) return computed; // unexpected format; just return what we have
  const r = parseInt(m[1], 10);
  const g = parseInt(m[2], 10);
  const b = parseInt(m[3], 10);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}


/** Fresh randomized waveform parameters for a given canvas height. */
export function generateWaveParams(height: number): WaveParams {
  return {
    baseFrequency: Math.random() * (0.15 - 0.1) + 0.1,
    jitterFrequency: Math.random() * (0.2 - 0.1) + 0.1,
    baseAmplitude: height / 4,
    jitterAmplitude: Math.random() * (12 - 2) + 2,
    timeScale: Math.random() * (10 - 4) + 4,
  };
}

/** Clamp a value to [0, 1]. */
export function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}
