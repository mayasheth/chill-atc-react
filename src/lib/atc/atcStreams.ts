import LOCS from '@/assets/data/locations.json'
import AIRS from '@/assets/data/airports.json'
import STREAMS from '@/assets/data/atcStreams.json'

export type Location = { name: string; region: string | null; country: string }
export type Airport  = { nameCommon: string; nameFull?: string | null; code: string; latitude: number; longitude: number }
export type Channel  = 'Tower' | 'Ground' | 'Approach' | 'Departure' | 'Center' | 'ATIS' | 'Clearance' | null

export const LOCATIONS = LOCS as Record<string, Location>
export type LocationKey = keyof typeof LOCATIONS

export const AIRPORTS = AIRS as Record<string, Airport>
export type AirportCode = keyof typeof AIRPORTS

export type AtcStreamRef = {
  locationKey: LocationKey
  airportCode: AirportCode
  channels?: Channel[] | null
  embedUrl: string
}

export type AtcStreamId = keyof typeof STREAMS

export const ATC_STREAMS = STREAMS as Record<string, AtcStreamRef>

export type AtcStream = {
  location: Location
  airport: Airport
  channels?: Channel[] | null
  embedUrl: string
}

export const resolveAtcStream = (ref: AtcStreamRef): AtcStream => ({
  location: LOCATIONS[ref.locationKey],
  airport:  AIRPORTS[ref.airportCode],
  channels: ref.channels,
  embedUrl: ref.embedUrl
})

export const RESOLVED_ATC_STREAMS: Record<AtcStreamId, AtcStream> =
  Object.fromEntries(Object.entries(ATC_STREAMS).map(([id, ref]) => [id, resolveAtcStream(ref as AtcStreamRef)])) as Record<AtcStreamId, AtcStream>


export type NonNullChannel = Exclude<Channel, null>

export const formatChannels = (ch?: Channel | Channel[] | null) => {
  if (!ch) return ''
  const list = Array.isArray(ch) ? ch : [ch]
  return list
    .filter((c): c is NonNullChannel => c !== null)
    .map((c) => c.toLowerCase())
    .join(' | ')
}