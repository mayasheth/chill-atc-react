// src/pages/Colophon.tsx
import { Link } from "react-router-dom";
import { Card, PanelHeader } from '@/components/layouts'
import { InlineLink, ColorSwatchesGrid, CarbonBadge } from "@/components/ui";
import { FootprintIcon } from "@/assets/icons/other";

export default function Colophon() {
  const sha = import.meta.env.VITE_GIT_SHA ?? "dev";
  const built = import.meta.env.VITE_BUILD_TIME ?? "";
  const version = import.meta.env.VITE_APP_VERSION ?? "0.1.0";

  const COLOR_TOKENS = [
    { name: "surface-0", varName: "--color-surface-0" },
    { name: "surface-1", varName: "--color-surface-1" },
    { name: "surface-2", varName: "--color-surface-2" },
    { name: "surface-3", varName: "--color-surface-3" },
    { name: "surface-4", varName: "--color-surface-4" },
    { name: "content-4", varName: "--color-content-4" },
    { name: "content-3", varName: "--color-content-3" },
    { name: "content-2", varName: "--color-content-2" },
    { name: "content-1", varName: "--color-content-1" },
    { name: "content-0", varName: "--color-content-0" },
    { name: "spotify-green", varName: "--color-spotify-green" },
    { name: "green-400", varName: "--color-green-400" },
    { name: "green-200", varName: "--color-green-200" },
  ];


  const IntroCard = (
    <Card variant="row" className="px-8 sm:px-12">
      <PanelHeader title="welcome" />
      <p className="text-content-1 text-center">
          chill atc is a personal project inspired by a fleeting website i encountered a few months back. 
          when the site disappeared, i began the deep dive into recreating the unique hyperfocus soundtrack of live atc + music.
          the project has grown into a playground for me to learn and explore aspects of web design.
          it is built from the ground up by me with coding guidance from several LLMs.
      </p>

      <p className="mt-4 text-content-2 text-center">
        the site is built from the ground up by me with coding guidance from several LLMs.
        all code is open source and available on <InlineLink href="https://github.com/mayasheth/chill-atc-react">GitHub</InlineLink>.
        all mistakes are my own; any feedback is welcome. 
      </p>

      <p className="mt-4 text-content-3 text-center">
        i hope you discover something unexpected & perhaps serendipitous here, as i did while creating it.
      </p>
    </Card>
  )

  const DesignCard = (
    <Card variant="row" className="px-8 sm:px-12">
      <PanelHeader title="design" />
      <h3 className=""> typography </h3>
      <p className="text-content-1 text-center"> headers are set in <InlineLink href="https://schibsted.com/about/schibsteds-visual-design/our-typeface/">Schibsted Grotesk</InlineLink>,
        interface text in <InlineLink href="https://github.com/JulietaUla/Montserrat">Montserrat</InlineLink>, and
        monospace text in <InlineLink href="https://levien.com/type/myfonts/inconsolata.html">Inconsolata</InlineLink>,
        all served by <InlineLink href="https://fonts.google.com/">Google Fonts</InlineLink>. lowercase everything (except proper nouns + acronyms) because it fits the vibe.
      </p>

      <h3 className="mt-4"> icons </h3>
      <p className="text-content-1 text-center"> 
        weather condition icons were sourced from <InlineLink href="https://github.com/erikflowers/weather-icons/">Weather Icons</InlineLink>;
        wind speed icons from <InlineLink href="https://visualpharm.com/free-icons/wind%20speed%2098-102-595b40b85ba036ed117de9f5">Visual Pharm</InlineLink>;
        and all others from <InlineLink href="https://fonts.google.com/icons">Google Material Icons</InlineLink>.
      </p>

      <h3 className="mt-4"> color </h3>
      <p className="text-content-1 text-center mb-2"> 
        the color palette was developed by me using OKLCH tokens and rendered to sRGB at runtime,
        with some help from the <InlineLink href="https://www.tints.dev/palette/v1:Y29yYWx8MjA0Yjg5fDgwMHxwfDB8MHwwfDEwMHxh">tints.dev</InlineLink> palette generator:
      </p>
      <ColorSwatchesGrid colors={COLOR_TOKENS} />
      <p className="text-sm text-content-2 text-center">click to copy OKLCH</p>

    </Card>
  )

  const TechCard = (
    <Card variant="row" className="px-8 sm:px-12">
      <PanelHeader title="tech" />      
      <p className="text-content-1 text-center">
        chill atc is built with <InlineLink href="https://vitejs.dev/">Vite</InlineLink>, React 18, & TypeScript;
      </p>
      <p className="text-content-1 text-center">
        styling is implemented with <InlineLink href="https://tailwindcss.com/">Tailwind CSS</InlineLink>;
      </p>
      <p className="text-content-1 text-center">
         routing with <InlineLink href="https://reactrouter.com/">React Router</InlineLink>.
      </p>

      <p className="text-content-2 text-center mt-4">
        local state is managed with <InlineLink href="https://github.com/pmndrs/zustand">Zustand</InlineLink>;
      </p>
      <p className="text-content-2 text-center">
        server state is managed with <InlineLink href="https://tanstack.com/query/latest">React Query</InlineLink>.
      </p>

      <p className="text-content-3 text-center mt-4">
        chill atc is hosted on <InlineLink href="https://vercel.com/">Vercel</InlineLink>.
      </p>      

    </Card>
  )

  const ServicesCard = (
    <Card variant="row" className="px-8 sm:px-12">
      <PanelHeader title="data + services" />
      <p className="text-content-1 text-center">
        music streams via <InlineLink href="https://developer.spotify.com/documentation/web-playback-sdk/"> Spotify Web Playback SDK </InlineLink>;
      </p>
      <p className="text-content-1 text-center"> login managed via Spotify OAuth with PKCE; </p>
      <p className="text-content-1 text-center"> playlists curated by yours truly. </p>

      <p className="text-content-2 text-center mt-4">
        atc audio is courtesy of <InlineLink href="https://www.liveatc.net/">LiveATC</InlineLink>;
      </p>
      <p className="text-content-2 text-center">
         airport and radio channels selected by me.
      </p>
      <p className="text-content-2 text-center">
        local weather is provided by <InlineLink href="https://open-meteo.com/">Open-Meteo</InlineLink>.
      </p>

      <p className="text-content-3 text-center mt-4">
        session tracking is managed via <InlineLink href="https://www.google.com/sheets/about/">Google Sheets</InlineLink>.
      </p>
    </Card>
  )

const EnvCard = (
  <Card variant="row" className="mt-6 px-8 sm:px-16">
    <PanelHeader title="environmental impact" />
    <div className="mt-4 inline-flex gap-2 items-center">
      <FootprintIcon className="text-content-2 h-8 w-8 -rotate-30"/>
      <CarbonBadge dark className=""/>
    </div>
    <p className="text-content-1 mt-2"> via <InlineLink href="https://www.websitecarbon.com/"> Website Carbon</InlineLink> </p>
  </Card>
);

  return (
    <div className="flex min-h-dvh flex-col items-center bg-surface-0">
      <main className="mx-auto my-10 w-full max-w-screen-lg px-4">
        {/* Simple header: brand link back to Home + page title */}
        <header className="mb-6">
          <Link
            to="/"
            className="text-sm sm:text-base font-header font-light hover:font-semibold text-content-2 hover:text-content-0 focus-outline-rounded transition-all duration-400"
            aria-label="Home"
          >
            chill atc
          </Link>
          <h1>colophon</h1>
        </header>

        <section className="mt-6 mx-auto w-full max-w-screen-lg grid grid-cols-1 gap-6 lg:grid-cols-2 items-stretch">
          {/* LEFT column = vertical stack of two cards */}
          <div className="flex flex-col gap-0 h-full">
            {IntroCard}
            {EnvCard}
          </div>
          {/* RIGHT column = single tall card */}
          {DesignCard}
        </section>
        
        <section className="mt-6 mx-auto w-full max-w-screen-lg grid grid-cols-1 gap-6 lg:grid-cols-2 items-stretch">
          {TechCard}
          {ServicesCard}
        </section>
        
      </main>
    </div>
  );
}
