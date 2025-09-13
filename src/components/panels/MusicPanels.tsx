import { useState }    from 'react'
import { ActionButton, LoginButton, Selector, Slider } from '@/components/ui'
import { ControlRow, Field } from '@/components/layouts'

import { SpotifyIcon, MusicNoteIcon, VolumeIcon, ReplayIcon, PlayIcon, PauseIcon, NextIcon, PreviousIcon } from '@/assets/icons/audio'

import { startSpotifyLogin } from '@/api/spotifyAuth'
import { formatTime } from '@/lib/format'
import { useAuth } from '@/store/auth'
import { usePlayback } from '@/store/playback'
import { useNowPlayingProgress } from '@/hooks/useNowPlayingProgress'
import { spotifyPlaylists } from '@/lib/spotify/spotifyPlaylists'

export function LoginPanel() {
  const { isLoggedIn, userEmail } = useAuth()

  const loginMessage = (
    <div id="login-message" className="my-4 inline-flex items-center gap-2">
      <SpotifyIcon className="h-5 w-5 text-spotify-green" aria-hidden="true"/>
      <p className="text-spotify-green font-semibold"> logged in as: </p>
      <p> {userEmail} </p>
    </div>
  )

  const loginPrompt = (
    <div className="mt-6"><LoginButton onClick={startSpotifyLogin} /></div>
  )

  if (!isLoggedIn) {
    return (loginPrompt)
  }

  return (loginMessage)

}

export function PlaybackPanel() {
  const { isLoggedIn } = useAuth()
  const { musicPlaying: playing, setSelectedPlaylist, playPause, next, previous, restartPlaylist } = usePlayback()
  const { volume, setVolume, setVolumeImmediate } = usePlayback()
  const [playlist, setPlaylist] = useState<string>('') // holds a spotify:playlist:... uri; optional local mirror

  if (!isLoggedIn) return null

  const PlaylistSelector = (
    <Selector
      id="playlist-selector"
      options={spotifyPlaylists.map(p => ({ label: p.name.toLowerCase(), value: p.uri }))}
      value={playlist}
      onChange={(v) => {
        console.log('PlaylistSelector.onChange value:', v) 
        setPlaylist(v)
        setSelectedPlaylist(v)}}
      placeholder="Select a playlist…"
    />
  )

  const ControlButtons = (
    <div className="inline-flex items-center gap-1/4">
      <ActionButton
        ariaLabel="Previous song"
        icon={<PreviousIcon className="w-9 h-9" aria-hidden="true" />}
        variant="icon"
        onClick={previous}
      />
      <ActionButton
        ariaLabel={playing ? "Pause" : "Play"}
        icon={
          playing ? (
            <PauseIcon className="w-18 h-18" aria-hidden="true" />
          ) : (
            <PlayIcon className="w-18 h-18" aria-hidden="true" />
          )
        }
        variant="icon"
        onClick={playPause}
      />
      <ActionButton
        ariaLabel="Next song"
        icon={<NextIcon className="w-9 h-9" aria-hidden="true" />}
        variant="icon"
        onClick={next}
      />
      <ActionButton
        ariaLabel="Restart playlist"
        icon={<ReplayIcon className="w-9 h-9" aria-hidden="true" />}
        variant="icon"
        onClick={() => {
          console.log('Restart clicked with playlist=', playlist)
          restartPlaylist(playlist)
        }}   
      /> 
    </div>
  )

  const VolumeSlider = (
    <div className="inline-flex items-center gap-3 w-full">
      <Slider
        id="spotify-volume"
        value={volume}
        onChange={(v) => setVolume(v)} // debounced
        onCommit={(v) => setVolumeImmediate(v)}
        icon={<VolumeIcon className="w-8 h-8 text-content-2" aria-hidden="true" />}
    />
    </div>
  )

  return (
    <section className="items-center">
      <ControlRow leftBasis={1} centerBasis={1} rightBasis={1}   
        left={
          <Field label="select playlist" align="start" widthClass="w-full">
            {PlaylistSelector}
          </Field>
        }
        center={
          <Field label="playback" align="start" widthClass="w-full">
            {ControlButtons}
          </Field>
        }
        right={
          <Field label="volume" align="start" widthClass="w-full">
            {VolumeSlider}
          </Field>   
        }
      />
    </section>
  )
}

export function NowPlayingPanel() {
  const musicPlaying = usePlayback(s => s.musicPlaying)
  const track = usePlayback(s => s.track) // { id, name, artists[], album, image }
  const { uiPos, duration } = useNowPlayingProgress()

  const artistLine = track?.artists?.join(", ") ?? ""
  const timerStr = `${formatTime(uiPos)} / ${formatTime(duration)}`


  const TransitionClasses = (
    [
      "overflow-hidden transition-all duration-1000 ease-in-out",
      // visible state
      musicPlaying
        ? "opacity-100 translate-y-0 max-h-[480px] pointer-events-auto mt-12"
        // hidden state
        : "opacity-0 translate-y-4 max-h-0 pointer-events-none",
      // layout
      "flex flex-col sm:flex-row gap-10 items-center",
    ].join(" ")
  )

  const AlbumArt = (
    <div id="album-art" className="w-28 rounded-sm overflow-hidden">
      {track?.image ? (
        <img
          src={track.image}
          alt={track?.name ? `${track.name} album art` : "Album art"}
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="flex flex-col items-center justify-center">
          <MusicNoteIcon className="w-10 h-10 text-content-2" aria-hidden="true" />
          <p className="text-content-1 font-semibold truncate">{track?.album ?? ""}</p>
        </div>
      )}
    </div>
  )

  const TrackText = (
    <div id="track-text" className="flex flex-col items-center">
      <p className="text-content-0 text-lg font-semibold truncate mb-2">now playing:</p>
      <p className="text-content-1 text-base font-light truncate">
        {track?.name ?? "nothing playing"}
      </p>
      <p className="text-content-2 text-base font-light truncate">{artistLine}</p>
      <p className="text-surface-4 font-mono text-lg mt-2">{timerStr}</p>
    </div>
  )

  return (
    <section
      id="now-playing"
      aria-hidden={!musicPlaying}
      className={ TransitionClasses }
    >
      {/* Album art */ AlbumArt } 
      {/* Track text */ TrackText}
    </section>
  )
}

