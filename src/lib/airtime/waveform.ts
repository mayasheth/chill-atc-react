// src/lib/airtime/waveform.ts

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
  const root = document.documentElement;
  const raw = getComputedStyle(root).getPropertyValue(name).trim();

  // If empty, ask CSS to resolve the var() itself (supports fallbacks in your CSS)
  const colorExpr =
    raw || (name.startsWith("--") ? `var(${name})` : name);

  const probe = document.createElement("span");
  probe.style.color = colorExpr;
  root.appendChild(probe);
  const computed = getComputedStyle(probe).color; // "rgb(r g b / a)" or "rgb(r, g, b)" etc.
  root.removeChild(probe);

  if (alpha == null) return computed;

  // Parse both comma and space-with-slash syntaxes
  const m =
    computed.match(
      /^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s\/]+([0-9.]+))?\s*\)$/i
    );
  if (!m) return computed;

  const r = Number(m[1]);
  const g = Number(m[2]);
  const b = Number(m[3]);
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
