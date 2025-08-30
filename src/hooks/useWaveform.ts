// src/hooks/useWaveform.ts
import { useEffect, useRef } from "react";
import { clamp01, generateWaveParams, getCssVar, type WaveParams } from "@/lib/waveform";

function useLatest<T>(value: T) {
  const r = useRef(value);
  r.current = value;
  return r;
}

export type UseWaveformProps = {
  // playing flags and volumes (0..1)
  isSpotifyPlaying: boolean;
  isAtcPlaying: boolean;
  spotifyVolume: number;
  atcVolume: number;

  // identifiers that change when the selection changes
  playlistId?: string | number | null;
  atcStreamId?: string | number | null;

  // CSS var names (hex values) to pull colors from
  colors?: {
    cardBg?: string;       // default: --brand-card_background
    spotifyDark?: string;  // default: --brand-spotify_green
    spotifyLight?: string; // default: --brand-light_green
    atcDark?: string;      // default: --brand-tertiary
    atcLight?: string;     // default: --brand-secondary
  };

  lineWidth?: number; // stroke width
  fadeWidth?: number; // side fade width
};

/**
 * useWaveform — returns a canvasRef; draws Spotify + ATC animated waveforms.
 * - DPR-aware
 * - Resizes with ResizeObserver
 * - Smooth transitions when play state changes
 * - Resets parameters when playlist/stream IDs change
 */
export function useWaveform({
  isSpotifyPlaying,
  isAtcPlaying,
  spotifyVolume,
  atcVolume,
  playlistId,
  atcStreamId,
  colors,
  lineWidth = 3,
  fadeWidth = 60,
}: UseWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // latest reactive values (avoid re-creating the animation loop)
  const isSpotifyPlayingRef = useLatest(isSpotifyPlaying);
  const isAtcPlayingRef = useLatest(isAtcPlaying);
  const spotifyVolRef = useLatest(spotifyVolume);
  const atcVolRef = useLatest(atcVolume);

  const colorVars = {
    cardBg: colors?.cardBg ?? "--brand-card_background",
    spotifyDark: colors?.spotifyDark ?? "--brand-spotify_green",
    spotifyLight: colors?.spotifyLight ?? "--brand-light_green",
    atcDark: colors?.atcDark ?? "--brand-tertiary",
    atcLight: colors?.atcLight ?? "--brand-secondary",
  };

  // store current param sets so they persist across frames
  const atcParamsRef = useRef<WaveParams | null>(null);
  const spotifyParamsRef = useRef<WaveParams | null>(null);

  // regenerate params when the underlying source changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const h = Math.max(1, canvas.clientHeight || 1);
    atcParamsRef.current = generateWaveParams(h);
  }, [atcStreamId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const h = Math.max(1, canvas.clientHeight || 1);
    spotifyParamsRef.current = generateWaveParams(h);
  }, [playlistId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 1;
    let height = 1;
    let rafId = 0;
    let ro: ResizeObserver | null = null;

    atcParamsRef.current ??= generateWaveParams(canvas.clientHeight || 120);
    spotifyParamsRef.current ??= generateWaveParams(canvas.clientHeight || 120);

    function sizeToCanvasCSS() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // update amplitudes to current height
      if (atcParamsRef.current) atcParamsRef.current.baseAmplitude = height / 4;
      if (spotifyParamsRef.current) spotifyParamsRef.current.baseAmplitude = height / 4;
    }

    function createStrokeGradient(darkVar: string, lightVar: string) {
      const g = ctx.createLinearGradient(0, height, 0, 0);
      g.addColorStop(0, getCssVar(lightVar));
      g.addColorStop(0.25, getCssVar(darkVar));
      g.addColorStop(0.5, getCssVar(darkVar));
      g.addColorStop(0.75, getCssVar(darkVar));
      g.addColorStop(1, getCssVar(lightVar));
      return g;
    }

    function drawSideFade() {
      const fw = fadeWidth;
      // left
      const left = ctx.createLinearGradient(0, 0, fw, 0);
      left.addColorStop(0, getCssVar(colorVars.cardBg, 1));
      left.addColorStop(1, getCssVar(colorVars.cardBg, 0));
      ctx.fillStyle = left;
      ctx.fillRect(0, 0, fw, height);
      // right
      const right = ctx.createLinearGradient(width - fw, 0, width, 0);
      right.addColorStop(0, getCssVar(colorVars.cardBg, 0));
      right.addColorStop(1, getCssVar(colorVars.cardBg, 1));
      ctx.fillStyle = right;
      ctx.fillRect(width - fw, 0, fw, height);
    }

    function drawWave(
      params: WaveParams,
      t: number,
      darkVar: string,
      lightVar: string,
      isPlaying: boolean,
      vol: number
    ) {
      const centerY = height / 2;

      // smooth animation targets
      params._ampTarget = isPlaying ? 1 : 0.2;
      params._freqTarget = isPlaying ? 1 : 0.3;
      params._ampCurrent ??= params._ampTarget;
      params._freqCurrent ??= params._freqTarget;

      const smoothing = 0.05;
      params._ampCurrent += (params._ampTarget - params._ampCurrent) * smoothing;
      params._freqCurrent += (params._freqTarget - params._freqCurrent) * smoothing;

      const amp = params.baseAmplitude * params._ampCurrent * clamp01(vol);
      const jamp = params.jitterAmplitude * params._ampCurrent * clamp01(vol);
      const freq = params.baseFrequency * params._freqCurrent;
      const jfreq = params.jitterFrequency * params._freqCurrent;

      ctx.beginPath();
      ctx.moveTo(0, centerY);

      for (let x = 0; x < width; x++) {
        const baseY = amp * Math.sin(freq * x + t * 2);
        const jitterY = jamp * Math.sin(jfreq * x + t * params.timeScale);
        ctx.lineTo(x, centerY + baseY + jitterY);
      }

      ctx.strokeStyle = createStrokeGradient(darkVar, lightVar);
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    }

    function frame() {
      const t = performance.now() / 1000;

      // clear
      ctx.fillStyle = getCssVar(colorVars.cardBg, 0.3);
      ctx.fillRect(0, 0, width, height);

      // ATC wave
      if (atcParamsRef.current) {
        drawWave(
          atcParamsRef.current,
          t,
          colorVars.atcDark,
          colorVars.atcLight,
          !!isAtcPlayingRef.current,
          atcVolRef.current ?? 0
        );
      }
      // Spotify wave
      if (spotifyParamsRef.current) {
        drawWave(
          spotifyParamsRef.current,
          t,
          colorVars.spotifyDark,
          colorVars.spotifyLight,
          !!isSpotifyPlayingRef.current,
          spotifyVolRef.current ?? 0
        );
      }

      drawSideFade();
      rafId = requestAnimationFrame(frame);
    }

    // init & observe
    sizeToCanvasCSS();
    rafId = requestAnimationFrame(frame);

    if ("ResizeObserver" in window) {
      ro = new ResizeObserver(sizeToCanvasCSS);
      ro.observe(canvas);
    } else {
      const onResize = () => sizeToCanvasCSS();
      window.addEventListener("resize", onResize);
      // minimal shim for cleanup symmetry
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ro = { disconnect: () => window.removeEventListener("resize", onResize) } as any;
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      ro?.disconnect();
    };
  }, [
    colorVars.cardBg,
    colorVars.spotifyDark,
    colorVars.spotifyLight,
    colorVars.atcDark,
    colorVars.atcLight,
    lineWidth,
    fadeWidth,
  ]);

  return { canvasRef };
}
