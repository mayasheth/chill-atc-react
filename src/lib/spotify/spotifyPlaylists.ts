import RAW from '@/assets/data/spotifyPlaylists.json'

export type SpotifyPlaylist = {
  name: string
  uri: string
  embedUrl: string
}

export const spotifyPlaylists = RAW as SpotifyPlaylist[]
