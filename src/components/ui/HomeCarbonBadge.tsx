// src/components/ui/HomeCarbonBadge.tsx
import { useEffect, useState } from "react";
import { FootprintIcon } from "@/assets/icons/other";
import { InlineLink } from "@/components/ui";

type Parsed = { grams: string | null; cleanerThan: number | null };

function parseResponse(json: any): Parsed {
  const d = json?.data ?? json;
  const grams =
    (typeof d?.gco2e === "number" ? d.gco2e : null) ??
    (d?.statistics?.co2?.grid?.grams ?? d?.statistics?.co2?.renewable?.grams ?? null);

  const cleaner =
    (typeof d?.cleanerThan === "number" ? d.cleanerThan : null) ??
    (typeof d?.rating?.percent === "number" ? d.rating.percent : null);

  return {
    grams: grams != null ? grams.toFixed(2) : null,
    cleanerThan: cleaner,
  };
}

export function HomeCarbonBadge({ green = 0 }: { green?: 0 | 1 }) {
  const [data, setData] = useState<Parsed>({ grams: null, cleanerThan: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = Number(localStorage.getItem("home-transfer-bytes"));
    if (!Number.isFinite(saved) || saved <= 0) {
      setLoading(false);
      return; // no measurement yet → show "--"
    }

    fetch(`/api/carbonFootprint?bytes=${saved}&green=${green}`)
      .then((r) => r.json())
      .then((json) => {
        if (!json?.ok) console.warn("carbon endpoint error:", json);
        setData(parseResponse(json));
      })
      .catch((err) => {
        console.warn("carbon endpoint fetch failed:", err);
        setData({ grams: null, cleanerThan: null });
      })
      .finally(() => setLoading(false));
  }, [green]);

  const gramsText = loading ? "…" : data.grams ?? "--";

  return (
    <div className="flex flex-col items-center mt-4 gap-1">
      <div className="inline-flex gap-2 text-base items-center">
        <FootprintIcon className="text-content-3 h-10 w-10 -rotate-30" />
        <span className="font-mono font-semibold text-xl text-content-1">{gramsText}</span>
        <span className="font-base font-light text-content-2">g of CO₂/view</span>
        <FootprintIcon className="text-content-3 h-10 w-10 -scale-x-100 rotate-30" />
      </div>
      <p className="text-content-1">
        via <InlineLink href="https://www.websitecarbon.com/">Website Carbon</InlineLink>
      </p>
    </div>
  );
}
