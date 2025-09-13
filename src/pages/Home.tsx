import { Card, PanelHeader } from '@/components/layouts'
import { LoginPanel, PlaybackPanel, NowPlayingPanel } from '@/components/panels/MusicPanels'
import { AtcStreamingPanel } from '@/components/panels/AtcPanels'
import { WeatherMiniCard } from '@/components/panels/WeatherPanels'
import { WaveformPanel, StatsPanel } from '@/components/panels/AirtimePanels'


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
        <WeatherMiniCard />
      </Card>

      <Card className="mt-6">
        <PanelHeader title="airtime" />
        <WaveformPanel />
        <StatsPanel />
      </Card>
    </div>
  )
}