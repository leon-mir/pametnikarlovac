import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

// Bus · Pametni Karlovac
// Static SPA (Capacitor-kompatibilno: relativni base, bez SSR-a, bez server-only ovisnosti).
// Vozni redovi se importaju iz kanonskog dataseta u ../data/bus preko aliasa @data.
export default defineConfig({
  // relativni base — radi i na poddomeni (web) i u Capacitor webviewu (file://)
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'robots.txt'],
      manifest: {
        name: 'Bus · Pametni Karlovac',
        short_name: 'Bus KA',
        description: 'Kad mi ide bus? Vozni red gradskih autobusa u Karlovcu.',
        lang: 'hr',
        dir: 'ltr',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#FAF7F2',
        theme_color: '#15404A',
        categories: ['travel', 'navigation', 'utilities'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // OpenStreetMap pločice — runtime cache (karta radi offline za nedavno viđene dijelove)
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/[a-z]?\.?tile\.openstreetmap\.org\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'osm-tiles',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@data': fileURLToPath(new URL('../data/bus', import.meta.url)),
    },
  },
  server: {
    // dopusti importe iz ../data (izvan bus/ korijena)
    fs: { allow: ['..'] },
  },
});
