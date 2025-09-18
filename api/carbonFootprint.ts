// api/carbonFootprint.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const bytes = Number(req.query.bytes);
  const green = Number(req.query.green ?? 0); // 0 = not “green hosted”, 1 = green

  if (!Number.isFinite(bytes) || bytes <= 0) {
    return res.status(400).json({ ok: false, reason: "missing-or-bad-bytes" });
  }

  const endpoint = `https://api.websitecarbon.com/data?bytes=${bytes}&green=${green}`;

  try {
    const r = await fetch(endpoint, { headers: { "user-agent": "chill-atc/1.0 (+vercel)" } });
    const data = await r.json();
    if (!r.ok) {
      res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=600");
      return res.status(r.status).json({ ok: false, reason: "upstream", status: r.status, data });
    }
    // cache ~1 week at the edge
    res.setHeader("Cache-Control", "s-maxage=604800, stale-while-revalidate=86400");
    return res.status(200).json({ ok: true, data });
  } catch (err) {
    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=600");
    return res.status(500).json({ ok: false, reason: "fetch-failed" });
  }
}
