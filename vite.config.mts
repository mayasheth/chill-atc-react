// vite.config.mts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svgr({
      svgrOptions: {
        icon: true, // sets width/height to 1em
        titleProp: true, // allow <Icon title="..."/>
        ref: true,
        svgProps: { fill: 'currentColor', xmlns: 'http://www.w3.org/2000/svg' },
        svgo: true, // cleans SVGs
        svgoConfig: {
          plugins: [
            { "name": "removeViewBox", "active": false },
            { "name": "removeDimensions", "active": true },
            { "name": "convertColors", "params": { "currentColor": true } }
          ],
        },
      },
    }),
    react({
      // Keeps React Fast Refresh + good TS stack traces
      jsxImportSource: 'react',
      babel: {
        // You can add plugin-proposal decorators, etc. later if needed
      },
    }),
    tailwindcss()
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  server: {
    host: '127.0.0.1',
    port: 8111,
    open: true, // optional: auto-open browser
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },

  // Useful for debugging in dev; Vercel will strip these in production builds
  build: {
    target: 'es2022',
    sourcemap: process.env.SOURCEMAP === 'true',
    outDir: 'dist',
    assetsDir: 'assets',
  },

  // Vitest config lives here so you don’t need a separate file
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'], // create if/when you need it
    css: true,
    include: ['**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      enabled: false,                    // flip to true later if you want coverage
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
    },
    // alias for tests too
    alias: [{ find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) }],
  },
})
