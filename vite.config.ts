import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

import fs from 'fs'

// Get current timestamp as app version
const appVersion = Date.now().toString()

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  plugins: [
    tailwindcss(),
    react(),
    {
      name: 'generate-version-json',
      writeBundle() {
        // Automatically generate version.json during build for client polling
        const versionPath = path.resolve(__dirname, 'dist', 'version.json');
        fs.writeFileSync(versionPath, JSON.stringify({ version: appVersion }));
        console.log(`[PWA] Generated version.json with version ${appVersion}`);
      }
    },
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['audio/bgm.mp3'],
      manifest: false, // Use existing public/manifest.json
      workbox: {
        globPatterns: ['**/*.{js,css,ico,png,svg,woff,woff2}'],
        // We explicitly remove html from globPatterns so it is not precached with CacheFirst.
        // We will define runtimeCaching for index.html as NetworkFirst.
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          // 1. Force NetworkFirst for index.html so we always get the latest version
          {
            urlPattern: ({ request, url }) => request.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html',
            handler: 'NetworkFirst',
            options: {
              cacheName: `html-cache-${appVersion}`,
              expiration: {
                maxEntries: 1,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // 2. StaleWhileRevalidate for JS/CSS assets
          {
            urlPattern: /\.(?:js|css)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: `assets-cache-${appVersion}`,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 Days
              },
            },
          },
          // 3. CacheFirst for Images and Fonts
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|woff|woff2|eot|ttf|otf)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: `media-cache-${appVersion}`,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 60, // 60 Days
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 4,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
