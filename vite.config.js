import { readFileSync } from 'node:fs';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { seoPlugin } from './scripts/seo.mjs';

const site = JSON.parse(readFileSync(new URL('./src/data/site.json', import.meta.url), 'utf8'));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const isPreview = env.VITE_PREVIEW === '1' || process.env.VITE_PREVIEW === '1';

  return {
    plugins: [
      seoPlugin(env),
      VitePWA({
        // En la vista previa de Claude no hay service workers: se desactiva.
        disable: isPreview,
        registerType: 'autoUpdate',
        injectRegister: 'script-defer',
        includeAssets: ['favicon.png', 'apple-touch-icon.png', 'og-image.jpg'],
        manifest: {
          name: site.name,
          short_name: site.shortName,
          description: site.description,
          lang: 'es-PE',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          theme_color: site.colors.brand,
          background_color: site.colors.dark,
          icons: [
            { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
          shortcuts: [
            { name: 'Separa tu puesto', url: '/#separa', icons: [{ src: '/pwa-192.png', sizes: '192x192' }] },
            { name: 'Contacto', url: '/#contacto', icons: [{ src: '/pwa-192.png', sizes: '192x192' }] },
          ],
        },
        workbox: {
          // Se guarda lo liviano; fotos y videos se cachean al verlos.
          globPatterns: ['**/*.{js,css,html,woff2,png,svg,ico}'],
          runtimeCaching: [
            {
              // Cuadros del mapa (OpenStreetMap): sirven sin conexión la zona ya vista.
              urlPattern: ({ url }) => url.hostname.endsWith('tile.openstreetmap.org'),
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'mapa',
                cacheableResponse: { statuses: [0, 200] },
                expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 14 },
              },
            },
            {
              urlPattern: ({ request, sameOrigin }) => sameOrigin && request.destination === 'image',
              handler: 'CacheFirst',
              options: { cacheName: 'fotos', expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 } },
            },
          ],
        },
      }),
    ],
  };
});
