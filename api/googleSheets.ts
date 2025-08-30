// /api/google-sheets.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { google } from 'googleapis'

const READ_SCOPES  = ['https://www.googleapis.com/auth/spreadsheets.readonly']
const WRITE_SCOPES = ['https://www.googleapis.com/auth/spreadsheets']

// Expected header row in the sheet, in this order:
const COLS = [
  'sessionId',
  'userId',
  'loginId',
  'atcStreamId',
  'playlistId',
  'durationSeconds',
  'updatedAt',
  'event',
] as const

function readServiceAccountJson(): string {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (raw && raw.trim()) return raw;

  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_B64;
  if (b64 && b64.trim()) return Buffer.from(b64, 'base64').toString('utf8');

  throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_JSON');
}

/* ---------- shared auth ---------- */
export async function getSheets(scopes: string[]) {
  const credentials = JSON.parse(readServiceAccountJson()) as {
    client_email: string; private_key: string;
  };
  const auth = new google.auth.GoogleAuth({ credentials, scopes });
  return google.sheets({ version: 'v4', auth });
}

/* ---------- actions ---------- */
export async function upsertSession(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const spreadsheetId = process.env.SESSION_SHEET_ID!
  const tab = process.env.SESSION_SHEET_TAB || 'Sessions'
  if (!spreadsheetId) return res.status(500).json({ error: 'Missing SESSION_SHEET_ID' })

  const {
    sessionId,
    userId,
    loginId,
    atcStreamId,
    playlistId,
    durationSeconds,
    event,
  } = req.body || {}

  if (!sessionId || !event) return res.status(400).json({ error: 'sessionId and event are required' })

  try {
    // 1) read to find existing row for this sessionId
    const sheetsR = await getSheets(READ_SCOPES)
    const { data } = await sheetsR.spreadsheets.values.get({
      spreadsheetId,
      range: `${tab}!A1:H`, // 8 columns (A..H) to match COLS
      valueRenderOption: 'UNFORMATTED_VALUE',
      dateTimeRenderOption: 'FORMATTED_STRING',
    })

    const rows = data.values ?? []
    if (rows.length === 0) return res.status(400).json({ error: 'Sheet has no header row' })

    const header = rows[0].map(String)
    // map header -> index (fallback to COLS order if not found)
    const idx: Record<string, number> = {}
    COLS.forEach((name, i) => {
      const j = header.findIndex(h => h.trim() === name)
      idx[name] = j >= 0 ? j : i
    })

    const nowIso = new Date().toISOString()

    // find row with sessionId
    let rowIndex: number | null = null // 1-based including header
    for (let r = 1; r < rows.length; r++) {
      if ((rows[r]?.[idx.sessionId] ?? '') === sessionId) { rowIndex = r + 1; break }
    }

    if (!rowIndex) {
      // create new row only on 'start'
      if (event !== 'start') return res.status(404).json({ error: 'Session not found for upsert' })

      const sheetsW = await getSheets(WRITE_SCOPES)
      const width = header.length || COLS.length
      const newRow: any[] = Array(width).fill('')

      newRow[idx.sessionId]       = sessionId
      newRow[idx.userId]          = userId ?? ''
      newRow[idx.loginId]         = loginId ?? ''
      newRow[idx.atcStreamId]     = atcStreamId ?? ''
      newRow[idx.playlistId]      = playlistId ?? ''
      newRow[idx.durationSeconds] = Number.isFinite(+durationSeconds) ? +durationSeconds : 0
      newRow[idx.updatedAt]       = nowIso
      newRow[idx.event]           = event

      await sheetsW.spreadsheets.values.append({
        spreadsheetId,
        range: `${tab}!A1`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [newRow] },
      })
      res.setHeader('Access-Control-Allow-Origin', '*')
      return res.status(200).json({ ok: true, created: true })
    }

    // 2) update existing row (heartbeat/stop/etc.)
    const existing = rows[rowIndex - 1] || []
    const width = header.length || COLS.length
    const updated: any[] = Array(width).fill('')

    // copy existing values first
    for (let i = 0; i < width; i++) updated[i] = existing[i] ?? ''

    // overwrite fields
    updated[idx.updatedAt]       = nowIso
    updated[idx.event]           = event
    if (durationSeconds != null) {
      updated[idx.durationSeconds] = Number.isFinite(+durationSeconds) ? +durationSeconds : 0
    }
    if (userId      != null) updated[idx.userId]      = userId
    if (loginId     != null) updated[idx.loginId]     = loginId
    if (atcStreamId != null) updated[idx.atcStreamId] = atcStreamId
    if (playlistId  != null) updated[idx.playlistId]  = playlistId

    const sheetsW = await getSheets(WRITE_SCOPES)
    const range = `${tab}!A${rowIndex}:H${rowIndex}` // update only the row (A..H)
    await sheetsW.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [updated] },
    })

    res.setHeader('Access-Control-Allow-Origin', '*')
    return res.status(200).json({ ok: true, updated: true, row: rowIndex })
  } catch (e: any) {
    console.error(e)
    return res.status(500).json({ error: 'Upsert failed' })
  }
}

export async function sessionTotals(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const sheets = await getSheets(READ_SCOPES)
    const spreadsheetId = process.env.SESSION_SHEET_ID!
    const tab = process.env.SESSION_SHEET_TAB || 'Sessions'

    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${tab}!A1:H`,
      valueRenderOption: 'UNFORMATTED_VALUE',
      dateTimeRenderOption: 'FORMATTED_STRING',
    })

    const rows = data.values ?? []
    if (rows.length < 2) {
      res.setHeader('Access-Control-Allow-Origin', '*')
      return res.status(200).json({ globalTotalSeconds: 0, userTotalSeconds: 0 })
    }

    const headers = rows[0].map(String)
    const idx = (name: string) => headers.findIndex(h => h.trim() === name)

    const userIdIdx = idx('userId')
    const durIdx    = idx('durationSeconds')

    if (userIdIdx === -1 || durIdx === -1) {
      return res.status(500).json({ error: 'Sheet headers must include userId and durationSeconds' })
    }

    const userId = typeof req.query.userId === 'string' ? req.query.userId : null

    let globalTotal = 0
    let userTotal = 0

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r] || []
      const dur = Number(row[durIdx] ?? 0)
      if (!Number.isFinite(dur)) continue
      globalTotal += dur
      if (userId && row[userIdIdx] === userId) userTotal += dur
    }

    res.setHeader('Access-Control-Allow-Origin', '*')
    return res.status(200).json({
      globalTotalSeconds: Math.round(globalTotal),
      userTotalSeconds: Math.round(userTotal),
      row_count: rows.length - 1,
    })
  } catch (e: any) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to compute totals' })
  }
}

/* ---------- router ---------- */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return res.status(204).end()
  }

  const action = (req.query.action as string) || ''

  if (action === 'upsertSession') {
    return upsertSession(req, res)
  }
  if (action === 'sessionTotals') {
    return sessionTotals(req, res)
  }

  return res.status(400).json({ error: 'Unknown or missing ?action=' })
}
