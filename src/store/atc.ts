// src/store/atc.ts
import { create } from "zustand"
import type { AtcStreamId } from '@/lib/atc/atcStreams'
import { ATC_STREAMS } from '@/lib/atc/atcStreams'

const DEBOUNCE_MS = 200
const SLIDER_DEBOUNCE_MS = 120

type AtcState = {
  audio: HTMLAudioElement | null
  atcPlaying: boolean
  volume: number // 0..100

  selectedStreamId: AtcStreamId | null
  currentStreamId: AtcStreamId | null

  _selectDebounce?: number
  _sliderDebounce?: number

  // wiring
  setAudio: (el: HTMLAudioElement | null) => void

  // controls
  setSelectedStream: (streamId: AtcStreamId) => void
  playPause: () => Promise<void>
  setVolumeImmediate: (pct: number) => Promise<void> // apply immediately
  setVolume: (pct: number) => void                   // debounced for sliders
  stop: () => Promise<void>

  // helper
  playStream: (streamId: AtcStreamId) => Promise<void>
}

export const useAtc = create<AtcState>((set, get) => ({
  audio: null,
  atcPlaying: false,
  volume: 70,

  selectedStreamId: null,
  currentStreamId: null,

  _selectDebounce: undefined,
  _sliderDebounce: undefined,

  setAudio: (el) => {
    set({ audio: el })
    if (el) {
      // initial volume
      el.volume = Math.max(0, Math.min(1, get().volume / 100))

      // sync events → store
      el.addEventListener("play", () => {
        console.log("[ATC] play event fired")
        set({ atcPlaying: true })
      })
      el.addEventListener("pause", () => {
        console.log("[ATC] pause event fired")
        set({ atcPlaying: false })
      })
      el.addEventListener("ended", () => {
        console.log("[ATC] ended event fired")
        set({ atcPlaying: false })
      })
      el.addEventListener("error", (e) => {
        console.log("[ATC] error event fired", el.error, e)
        set({ atcPlaying: false })
      })
    }
  },

  // Centralized way to start a stream and remember the loaded context
  playStream: async (streamId: AtcStreamId) => {
    const audio = get().audio
    console.log("[ATC] playStream called", { streamId, hasAudio: !!audio })
    if (!audio) return

    // set streaming url
    const url = ATC_STREAMS[streamId].embedUrl
    console.log("[ATC] setting src to", url)
    audio.src = url
    audio.load()
    try {
      await audio.play()
      console.log("[ATC] play() resolved successfully")
    } catch (err) {
      console.log("[ATC] play() rejected", err)
    }

    set({ currentStreamId: streamId })
  },

  setSelectedStream: (streamId) => {
    const { selectedStreamId, _selectDebounce, atcPlaying: playing, playStream } = get()

    // 1) reflect selection in UI
    set({ selectedStreamId: streamId })

    // 2) only auto-switch if selection changed AND we're playing
    if (!playing || streamId === selectedStreamId) return

    if (_selectDebounce !== undefined) clearTimeout(_selectDebounce)
    const handle = window.setTimeout(() => {
      void playStream(streamId)
      set({ _selectDebounce: undefined })
    }, DEBOUNCE_MS)

    set({ _selectDebounce: handle })
  },

  playPause: async () => {
    const { audio, atcPlaying: playing, selectedStreamId, currentStreamId, playStream } = get()
    console.log("[ATC] playPause called", { hasAudio: !!audio, playing, selectedStreamId, currentStreamId })
    if (!audio) return

    // cancel any pending auto-switch when user explicitly toggles
    const pending = get()._selectDebounce
    if (pending !== undefined) {
      clearTimeout(pending)
      set({ _selectDebounce: undefined })
    }

    if (playing) {
      console.log("[ATC] pausing...")
      await audio.pause()
      return
    }

    // if a different stream is selected than what's loaded, switch to it
    if (selectedStreamId && selectedStreamId !== currentStreamId) {
      console.log("[ATC] switching to different stream")
      await playStream(selectedStreamId)
      return
    }

    // if nothing loaded yet but we have a selection, start it
    if (!currentStreamId && selectedStreamId) {
      console.log("[ATC] starting fresh stream")
      await playStream(selectedStreamId)
      return
    }

    // otherwise resume current context if any
    if (currentStreamId) {
      console.log("[ATC] resuming current stream")
      await audio.play()
    }
  },

  setVolumeImmediate: async (pct) => {
    const audio = get().audio
    const vol = Math.max(0, Math.min(100, Math.round(pct)))
    set({ volume: vol })
    if (audio) audio.volume = vol / 100
  },

  // Debounced for slider change
  setVolume: async (pct) => {
    const vol = Math.max(0, Math.min(100, Math.round(pct)))
    set({ volume: vol })

    const pending = get()._sliderDebounce
    if (pending !== undefined) clearTimeout(pending)

    const handle = window.setTimeout(() => {
      void get().setVolumeImmediate(vol)
      set({ _sliderDebounce: undefined })
    }, SLIDER_DEBOUNCE_MS)

    set({ _sliderDebounce: handle })
  },

  stop: async () => {
    const audio = get().audio
    if (audio) {
      audio.pause()
      audio.removeAttribute("src")
      audio.load()
    }
    set({ atcPlaying: false, currentStreamId: null })
  },
}))
