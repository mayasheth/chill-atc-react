// src/config/atcStreams.ts

/* Entities */
export type Location = {
  name: string
  region: string | null
  country: string
}

export type Airport = {
  nameCommon: string
  nameFull?: string | null
  code: string
  latitude: number
  longitude: number
}

export type Channel =
  | 'Tower' | 'Ground' | 'Approach' | 'Departure' | 'Center' | 'ATIS' | 'Clearance'
  | null

// Normalized stream reference
export type AtcStreamRef = {
  locationKey: LocationKey
  airportCode: AirportCode
  channels?: Channel[] | null
  embedUrl: string
}

// Optional: denormalized shape (handy for UI once resolved)
export type AtcStream = {
  location: Location
  airport: Airport
  channels?: Channel[] | null
  embedUrl: string
}

/* Normalized dictionaries (Records and keys) */
export const LOCATIONS = {
  winnipeg: {
    name: 'Winnipeg',
    region: 'Manitoba',
    country: 'Canada',
  },

  ottowa: {
    name: 'Ottowa',
    region: 'Ontario',
    country: 'Canada'
  },

  chicago: {
    name: 'Chicago',
    region: 'Illinois',
    country: 'USA,'
  }
} as const satisfies Record<string, Location>
export type LocationKey = keyof typeof LOCATIONS

export const AIRPORTS = {
  YWG: {
    nameCommon: 'Winnipeg International Airport',
    nameFull: 'Winnipeg James Armstrong Richardson International Airport',
    code: 'YWG',
    latitude: 49.91,
    longitude: -97.24,
  },

  YOW: {
    nameCommon: 'Ottawa International Airport',
    nameFull: 'Ottawa/Macdonald-Cartier International Airport',
    code: 'YOW',
    latitude: 45.32,
    longitude: -75.67,
  },

  ORD: {
    nameCommon: "O'Hare International Airport",
    nameFull: "Chicago O'Hare International Airport",
    code: 'ORD',
    latitude: 41.98,
    longitude: -87.90,
  }

} as const satisfies Record<string, Airport>
export type AirportCode = keyof typeof AIRPORTS

/* Define normalized streams */
export const ATC_STREAMS = {
  ywg_center: {
    locationKey: 'winnipeg',
    airportCode: 'YWG',
    channels: ['Center'],
    embedUrl: 'https://d.liveatc.net/cywg2_misc2',
  },

  yow_all: {
    locationKey: 'ottowa',
    airportCode: 'YOW',
    channels: ['Ground',  'Tower', 'Approach'],
    embedUrl: 'https://d.liveatc.net/cywg2_misc2',
  },

  ord_approach: {
     locationKey: 'chicago',
     airportCode: 'ORD',
     channels: ['Approach'],
     embedUrl: 'http://d.liveatc.net/kord1n2_app_133625',
  }
} as const satisfies Record<string, AtcStreamRef>
export type AtcStreamId = keyof typeof ATC_STREAMS

/* Resolvers to derive denormalized objects */ 
export const resolveAtcStream = (ref: AtcStreamRef): AtcStream => ({
  location: LOCATIONS[ref.locationKey],
  airport: AIRPORTS[ref.airportCode],
  channels: ref.channels,
  embedUrl: ref.embedUrl,
})

export const RESOLVED_ATC_STREAMS: Record<AtcStreamId, AtcStream> =
  Object.fromEntries(
    Object.entries(ATC_STREAMS).map(([id, ref]) => [id, resolveAtcStream(ref)])
  ) as Record<AtcStreamId, AtcStream>
