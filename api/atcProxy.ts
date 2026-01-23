// api/atcProxy.ts - Proxy ATC streams to bypass referrer-based hotlink protection
import type { VercelRequest, VercelResponse } from '@vercel/node'

// Allowed stream base URLs (whitelist for security)
const ALLOWED_HOSTS = ['d.liveatc.net']

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { url } = req.query

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing url parameter' })
  }

  // Validate the URL is from an allowed host
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    return res.status(400).json({ error: 'Invalid URL' })
  }

  if (!ALLOWED_HOSTS.includes(parsedUrl.host)) {
    return res.status(403).json({ error: 'Host not allowed' })
  }

  try {
    // Fetch from LiveATC without referrer
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ChillATC/1.0)',
      },
    })

    if (!response.ok) {
      return res.status(response.status).json({ error: `Upstream error: ${response.status}` })
    }

    // Set appropriate headers for audio streaming
    res.setHeader('Content-Type', response.headers.get('content-type') || 'audio/mpeg')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Access-Control-Allow-Origin', '*')

    // Stream the response
    const reader = response.body?.getReader()
    if (!reader) {
      return res.status(500).json({ error: 'No response body' })
    }

    // Pipe the stream
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      res.write(value)
    }

    res.end()
  } catch (err) {
    console.error('ATC proxy error:', err)
    res.status(500).json({ error: 'Proxy failed' })
  }
}
