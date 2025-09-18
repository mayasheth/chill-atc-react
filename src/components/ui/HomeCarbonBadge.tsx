// src/components/ui/HomeCarbonBadge.tsx
import { useEffect, useState } from 'react';
import { FootprintIcon } from "@/assets/icons/other";
import { InlineLink } from '@/components/ui'


type Parsed = { grams: string | null; cleanerThan: number | null };

function parseResponse(json: any): Parsed {
  const d = json?.data ?? json;
  // The API schema has varied; try common shapes and fall back gracefully.
  const grams =
    // old/simple
    (d && (d.c as number)) ??
    // newer shapes (examples seen in the wild)
    d?.statistics?.co2?.grid?.grams ??
    d?.carbon?.grams ??
    null;

  const cleaner =
    (typeof d?.cleanerThan === 'number' ? d.cleanerThan : null) ??
    (typeof d?.rating?.percent === 'number' ? d.rating.percent : null) ??
    null;

  return {
    grams: grams != null ? Number(grams).toFixed(2) : null,
    cleanerThan: cleaner,
  };
}

export function HomeCarbonBadge({ homeUrl }: { homeUrl?: string }) {
  const [data, setData] = useState<Parsed>({ grams: null, cleanerThan: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = homeUrl ? `?url=${encodeURIComponent(homeUrl)}` : '';
    fetch(`/api/carbonFootprint${q}`)
      .then(r => r.json())
      .then(json => setData(parseResponse(json)))
      .catch(() => setData({ grams: null, cleanerThan: null }))
      .finally(() => setLoading(false));
  }, [homeUrl]);

  const gramsText = loading ? '…' : (data.grams ?? '--');
  const cleanerText =
    data.cleanerThan != null ? `cleaner than ${Math.round(data.cleanerThan * 100)}% of pages` : '';

  return (
      <div className="flex flex-col items-center mt-4 gap-1">
        <div className="inline-flex gap-2 text-base items-center">
          <FootprintIcon className="text-content-3 h-10 w-10 -rotate-30"/>
          <span className="font-mono font-semibold text-xl text-content-1"> {gramsText} </span>
          <span className="font-base font-light text-content-2 align-bottom">g of CO₂/view</span>
          <FootprintIcon className="text-content-3 h-10 w-10 -scale-x-100 rotate-30"/>
        </div>
        <p className="text-content-1"> via <InlineLink href="https://www.websitecarbon.com/"> Website Carbon</InlineLink> </p>
      </div>
      
  );
}
