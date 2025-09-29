// src/hooks/useCarbonEstimate.ts
import { useEffect, useState } from "react";

export type CarbonTrace = {
  model: "swd";
  green: boolean;
  bytes: number;
  total: number;
  network: number;
  dataCenter: number;
  device: number;
  production: number;
  // variables?: any; // optional, if you include it from the API
};

export function useCarbonEstimate({ greenHost = false } = {}) {
  const [data, setData] = useState<CarbonTrace | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    let bytes = nav ? (nav.transferSize || nav.encodedBodySize || 0) : 0;
    for (const e of performance.getEntriesByType("resource") as PerformanceResourceTiming[]) {
      bytes += e.transferSize || e.encodedBodySize || 0;
    }
    if (!bytes) {
      setError("Couldn’t measure transfer size (likely cached or cross-origin).");
      return;
    }
    fetch(`/api/carbon?bytes=${bytes}&green=${greenHost ? "1" : "0"}`)
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setError(String(e)));
  }, [greenHost]);

  return { data, error };
}
