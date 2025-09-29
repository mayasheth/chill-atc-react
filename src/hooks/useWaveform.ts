// src/hooks/useWaveform.ts
import { useEffect, useRef } from "react";
import { clamp01, generateWaveParams, getCssVar, type WaveParams } from "@/lib/airtime/waveform";

function useLatest<T>(value: T) {
  const r = useRef(value);
  r.current = value;
  return r;
}

export type UseWaveformProps = {
  isSpotifyPlaying: boolean;
  isAtcPlaying: boolean;
  spotifyVolume: number; // 0..100
  atcVolume: number;     // 0..100
  playlistId?: string | number | null;
  atcStreamId?: string | number | null;
  colors?: {
    cardBg?: string;
    spotifyDark?: string;
    spotifyMed?: string;
    spotifyLight?: string;
    atcDark?: string;
    atcMed?: string;
    atcLight?: string;
  };
  lineWidth?: number;
  fadeWidth?: number;
};

type Teardown = { disconnect(): void };

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

  // latest reactive values without re-binding raf
  const isSpotifyPlayingRef = useLatest(isSpotifyPlaying);
  const isAtcPlayingRef = useLatest(isAtcPlaying);
  const spotifyVolRef = useLatest(spotifyVolume);
  const atcVolRef = useLatest(atcVolume);

  // use your --color-* names
  const colorVars = {
    cardBg: colors?.cardBg ?? "--color-ocean-900",
    spotifyDark: colors?.spotifyDark ?? "--color-spotify-green",
    spotifyMed: colors?.spotifyMed ?? "--color-green-400",
    spotifyLight: colors?.spotifyLight ?? "--color-green-200",
    atcDark: colors?.atcDark ?? "--color-ocean-600",
    atcMed: colors?.atcMed ?? "--color-ocean-500",
    atcLight: colors?.atcLight ?? "--color-ocean-200",
  };

  const atcParamsRef = useRef<WaveParams | null>(null);
  const spotifyParamsRef = useRef<WaveParams | null>(null);

  // regenerate params when sources change
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const h = Math.max(1, el.clientHeight || 1);
    atcParamsRef.current = generateWaveParams(h);
  }, [atcStreamId]);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const h = Math.max(1, el.clientHeight || 1);
    spotifyParamsRef.current = generateWaveParams(h);
  }, [playlistId]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctxMaybe = canvas.getContext("2d") as CanvasRenderingContext2D | null;
    if (!ctxMaybe) return;
    const ctx: CanvasRenderingContext2D = ctxMaybe; // locked non-null for this closure

    let width = 1;
    let height = 1;
    let rafId: number | null = null;
    let handle: Teardown | null = null;

    atcParamsRef.current ??= generateWaveParams(canvas.clientHeight || 120);
    spotifyParamsRef.current ??= generateWaveParams(canvas.clientHeight || 120);

    function sizeToCanvasCSS() {
      if (!canvas) return;
      canvas.style.width = "100%";
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const baseAmp = height / 6;
      if (atcParamsRef.current) atcParamsRef.current.baseAmplitude = baseAmp;
      if (spotifyParamsRef.current) spotifyParamsRef.current.baseAmplitude = baseAmp;
    }

    function createStrokeGradient(darkVar: string, medVar: string, lightVar: string): CanvasGradient {
      const g = ctx.createLinearGradient(0, height, 0, 0);
      g.addColorStop(0.05, getCssVar(lightVar));
      g.addColorStop(0.25, getCssVar(medVar));
      g.addColorStop(0.5, getCssVar(darkVar));
      g.addColorStop(0.75, getCssVar(medVar));
      g.addColorStop(0.95, getCssVar(lightVar));
      return g;
    }

    // Punch out transparency at the sides using an alpha mask
    function applySideFadeMask() {
      const fw = Math.min(fadeWidth, Math.floor(width / 2));
      if (fw <= 0) return;

      const a = fw / Math.max(1, width); // normalized fade width

      // Build a mask that is 0 at edges → 1 in the center → 0 at the other edge.
      const mask = ctx.createLinearGradient(0, 0, width, 0);
      mask.addColorStop(0, "rgba(0,0,0,0)");
      mask.addColorStop(a, "rgba(0,0,0,1)");
      mask.addColorStop(1 - a, "rgba(0,0,0,1)");
      mask.addColorStop(1, "rgba(0,0,0,0)");

      ctx.save();
      ctx.globalCompositeOperation = "destination-in"; // keep only where mask alpha > 0
      ctx.fillStyle = mask;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }


    function drawWave(
      params: WaveParams,
      t: number,
      darkVar: string,
      medVar: string,
      lightVar: string,
      isPlaying: boolean,
      vol: number
    ) {
      const centerY = height / 2;

      params._ampTarget = isPlaying ? 1 : 0.2;
      params._freqTarget = isPlaying ? 1 : 0.3;
      params._ampCurrent ??= params._ampTarget;
      params._freqCurrent ??= params._freqTarget;

      const smoothing = 0.05;
      params._ampCurrent += (params._ampTarget - params._ampCurrent) * smoothing;
      params._freqCurrent += (params._freqTarget - params._freqCurrent) * smoothing;

      const vn = vol > 1 ? vol / 100 : vol;
      const v = clamp01(vn);
      const vEff = Math.pow(v, 0.85); // slightly more range at lower volumes

      const amp  = params.baseAmplitude  * params._ampCurrent  * vEff;
      const jamp = params.jitterAmplitude * params._ampCurrent * vEff;
      const freq = params.baseFrequency  * params._freqCurrent;
      const jfreq= params.jitterFrequency * params._freqCurrent;

      ctx.beginPath();
      ctx.moveTo(0, centerY);

      for (let x = 0; x < width; x++) {
        const baseY = amp * Math.sin(freq * x + t * 2);
        const jitterY = jamp * Math.sin(jfreq * x + t * params.timeScale);
        ctx.lineTo(x, centerY + baseY + jitterY);
      }

      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = createStrokeGradient(darkVar, medVar, lightVar);
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    }

    function frame() {
      const t = performance.now() / 1000;

      ctx.fillStyle = getCssVar(colorVars.cardBg, 0);
      ctx.fillRect(0, 0, width, height);

      if (atcParamsRef.current) {
        drawWave(
          atcParamsRef.current,
          t,
          colorVars.atcDark,
          colorVars.atcMed,
          colorVars.atcLight,
          !!isAtcPlayingRef.current,
          atcVolRef.current ?? 0
        );
      }

      if (spotifyParamsRef.current) {
        drawWave(
          spotifyParamsRef.current,
          t,
          colorVars.spotifyDark,
          colorVars.spotifyMed,
          colorVars.spotifyLight,
          !!isSpotifyPlayingRef.current,
          spotifyVolRef.current ?? 0
        );
      }

      applySideFadeMask();
      rafId = requestAnimationFrame(frame);
    }

    // init + observers
    sizeToCanvasCSS();
    rafId = requestAnimationFrame(frame);

    const onResize = () => sizeToCanvasCSS();
    const ResizeObs =
      (window as any).ResizeObserver as
        | (new (cb: ResizeObserverCallback) => ResizeObserver)
        | undefined;

    if (ResizeObs) {
      const observer = new ResizeObs(() => sizeToCanvasCSS());
      observer.observe(canvas);
      handle = { disconnect: () => observer.disconnect() };
    } else {
      window.addEventListener("resize", onResize);
      handle = { disconnect: () => window.removeEventListener("resize", onResize) };
    }

    return () => {
      if (rafId != null) cancelAnimationFrame(rafId);
      handle?.disconnect();
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
