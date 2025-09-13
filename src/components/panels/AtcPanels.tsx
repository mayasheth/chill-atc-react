// src/components/panels/AtcPanel.tsx

import { useMemo } from 'react'
import { ActionButton, Selector, Slider, type Option } from '@/components/ui'
import { ControlRow, Field } from '@/components/layouts'

import { VolumeIcon, PlayIcon, PauseIcon, StopIcon, RadarIcon} from '@/assets/icons/audio'

import { useAtc } from '@/store/atc'
import { type AtcStreamId, type Channel, RESOLVED_ATC_STREAMS, formatChannels } from '@/lib/atc/atcStreams'

function AtcLabel({
  code,
  city,
  channels,
}: {
  code: string
  city: string
  channels?: Channel | Channel[] | null
}) {
  const ch = formatChannels(channels)
  return (
    <>
      <span className="inline-flex items-baseline justify-center gap-2">
        <span className="opt-code font-header text-base font-bold text-[var(--code)]">
          {code.toLowerCase()}
        </span>
        {<span className="opt-city font-base text-base font-light text-[var(--city)]">
          {city.toLowerCase()}
        </span>}
      </span>

      {ch && (
        <span className="opt-channels text-sm font-base font-light text-[var(--ch)]"> {ch} </span>
      )}
    </>
  )
}

export function StreamingControls() {
  const { atcPlaying: playing, selectedStreamId, setSelectedStream, playPause, stop } = useAtc()
  const { volume, setVolume, setVolumeImmediate } = useAtc()
  const isStopped = useAtc(s => s.currentStreamId === null)

  // Build select options from resolved streams.
  const atcOptions: Option[] = useMemo(
    () =>
      (Object.entries(RESOLVED_ATC_STREAMS) as [
        AtcStreamId,
        (typeof RESOLVED_ATC_STREAMS)[AtcStreamId]
      ][]).map(([id, s]) => ({
        value: id, // AtcStreamId is a string alias
        label: (
          <span className="flex flex-col gap-0">
            <AtcLabel
              code={s.airport.code}
              city={s.location.name}
              channels={s.channels}
            />
          </span>
        ),
      })),
    []
  )

  // renderers
  const renderAtcOption  = (opt?: Option) =>
    opt ? <span className="truncate inline-flex items-baseline text-center">{opt.label}</span> : null

  const StreamSelector = (
    <Selector
      id="atc-stream-selector"
      options={atcOptions}
      value={selectedStreamId ?? undefined}
      onChange={(val) => setSelectedStream((val ?? null) as AtcStreamId)}
      placeholder="Select an ATC stream..."
      renderOption={renderAtcOption}
      renderValue={renderAtcOption}
      // style overrides
      optionStateClasses={{
        idle: [
          '[--code:theme(colors.content.2)] [--city:theme(colors.content.1)] [--ch:theme(colors.content.3)]',
          '[--code-h:theme(colors.content.2)] [--city-h:theme(colors.content.1)] [--ch-h:theme(colors.content.3)]',
        ].join(' '),
        highlighted:
          '[--code:theme(colors.content.2)] [--city:theme(colors.content.1)] [--ch:theme(colors.content.3)]',
        selected: [
          '[--code:theme(colors.surface.3)] [--city:theme(colors.surface.1)] [--ch:theme(colors.surface.4)]',
          '[--code-h:theme(colors.surface.3)] [--city-h:theme(colors.surface.1)] [--ch-h:theme(colors.surface.4)]',
        ].join(' '),
        selectedHighlighted:
          '[--code:theme(colors.surface.3)] [--city:theme(colors.surface.1)] [--ch:theme(colors.surface.4)]',
      }}
    />
  )

  const VolumeSlider = (
    <div className="inline-flex items-center gap-3 w-full">
      <Slider
        id="atc_volume"
        value={volume}
        onChange={(v) => setVolume(v)} // debounced
        onCommit={(v) => setVolumeImmediate(v)}
        icon={<VolumeIcon className="w-8 h-8 text-content-2" aria-hidden="true" />}
      />
    </div>
  )

  const ControlButtons = (
    <div className="inline-flex items-center gap-1/4">
      <ActionButton
        icon={<RadarIcon className="w-9 h-9 opacity-0" aria-hidden="true" />}
        variant="icon"
        onClick={stop}
        disabled={true}
      />
      <ActionButton
        label=""
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
        ariaLabel="Stop stream"
        icon={<StopIcon className="w-9 h-9" aria-hidden="true" />}
        variant="icon"
        onClick={stop}
        disabled={isStopped}
      />
      <ActionButton
        icon={<RadarIcon className="w-9 h-9 opacity-0" aria-hidden="true" />}
        variant="icon"
        onClick={stop}
        disabled={true}
      />

    </div>
    
  )

  // 'w-7/10 md:min-w-xl'
  return (
    <ControlRow className='' leftBasis={1} centerBasis={1} rightBasis={1}  
      center={
        <Field label="control" align="start" widthClass='w-full'>
          {ControlButtons}
        </Field> 
      }
      right={
        <Field label="volume" align="start" widthClass='w-full'>
          {VolumeSlider}
        </Field> 
      }
      left={
        <Field label="select stream" align="start" widthClass="w-full">
          {StreamSelector}
        </Field>
      }
    />
  )
}

export function AtcStreamingPanel() {

  const StreamingSource = (
    <p
      id="streaming-source"
      className="text-content-0 text-base font-base font-light text-center my-6"
    >
      curated from{' '}
      <a
        href="https://www.liveatc.net/"
        target="_blank"
        rel="noopener noreferrer"
        className="font-base font-semibold text-base text-content-3 hover:text-content-2 transition-all duration-400"
      >
        LiveATC.Net
      </a>
    </p>
  )

  return (
    <section className="items-center">
      {StreamingSource}
      <StreamingControls />
    </section>
  )
}
