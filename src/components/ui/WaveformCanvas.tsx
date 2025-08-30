// src/components/ui/WaveformCanvas.tsx
import React from "react";
import { useWaveform, type UseWaveformProps } from "@/hooks/useWaveform";

type Props = UseWaveformProps & {
  className?: string; // e.g., "w-full h-28 rounded-2xl"
};

/** Canvas element that renders the dual-stream waveform via the hook. */
export default function WaveformCanvas({ className, ...waveProps }: Props) {
  const { canvasRef } = useWaveform(waveProps);
  return <canvas ref={canvasRef} className={className} />;
}
