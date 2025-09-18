// api/carbonFootprint.ts

import type { VercelRequest, VercelResponse } from '@vercel/node';

const HOME_URL = process.env.PUBLIC_SITE_URL || 'https://your-domain.example/';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = (req.query.url as string) || HOME_URL; // allow override via ?url=
  const endpoint = `https://api.websitecarbon.com/site?url=${encodeURIComponent(url)}`;

  try {
    const r = await fetch(endpoint, { headers: { 'user-agent': 'chill-atc/1.0 (+vercel)' } });
    if (!r.ok) {
      res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=600');
      return res.status(r.status).json({ ok: false, reason: 'upstream', status: r.status });
    }
    const data = await r.json();

    // cache at the edge ~1 week (tune as you like)
    res.setHeader('Cache-Control', 's-maxage=604800, stale-while-revalidate=86400');
    return res.status(200).json({ ok: true, data });
  } catch (err) {
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=600');
    return res.status(500).json({ ok: false, reason: 'fetch-failed' });
  }
}
