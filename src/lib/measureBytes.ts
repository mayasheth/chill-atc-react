// src/lib/measureBytes.ts
export function measureAndStoreHomeBytes() {
  const prefer = (a?: number, b?: number, c?: number) =>
    (a && a > 0 ? a : b && b > 0 ? b : c && c > 0 ? c : 0);

  const go = () => {
    try {
      let total = 0;

      const add = (e: PerformanceResourceTiming | PerformanceNavigationTiming) => {
        total += prefer(e.transferSize, (e as any).encodedBodySize, (e as any).decodedBodySize);
      };

      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      if (nav) add(nav);

      (performance.getEntriesByType("resource") as PerformanceResourceTiming[]).forEach(add);

      const po = new PerformanceObserver((list) => {
        (list.getEntries() as PerformanceResourceTiming[]).forEach(add);
      });
      po.observe({ type: "resource", buffered: true });

      setTimeout(() => {
        po.disconnect();
        if (total > 0) {
          localStorage.setItem("home-transfer-bytes", String(Math.round(total)));
          localStorage.setItem("home-bytes-ts", String(Date.now()));
        }
      }, 3000); // give late resources time to land
    } catch {/* noop */}
  };

  if (document.readyState === "complete") go();
  else window.addEventListener("load", go, { once: true });
}
