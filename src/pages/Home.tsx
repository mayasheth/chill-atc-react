import { Card, PanelHeader } from '@/components/layouts'
import { LoginPanel, PlaybackPanel, NowPlayingPanel, AtcStreamingPanel, WeatherPanel, WaveformPanel, StatsPanel } from '@/components/panels'

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col items-center bg-surface-0">
      <h1 className="mt-6 text-center text-content-0">chill atc</h1>

      <Card className="mt-6">
        <PanelHeader title="music" />
        <LoginPanel />
        <PlaybackPanel />
        <NowPlayingPanel />
      </Card>

      <Card className="mt-6">
        <PanelHeader title="atc" />
        <AtcStreamingPanel />
        <WeatherPanel />
      </Card>

      <Card className="mt-6">
        <PanelHeader title="airtime" />
        <WaveformPanel />
        <StatsPanel />
      </Card>
    </div>
  )
}