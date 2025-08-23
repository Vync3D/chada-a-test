// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: [
    "nuxt-lucide-icons", 
    '@pinia/nuxt',
    '@vite-pwa/nuxt'
  ],
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  plugins: [
    '~/plugins/motion.ts',
    '~/plugins/offline-map.client.js'
  ],
  vite: {
    server: {
      watch: {
        usePolling: true,
      },
    },
    plugins: [
      tailwindcss(),
    ],
  },
  pages: true,
  
  // Simplified PWA configuration
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Siquijor Tourism Map',
      short_name: 'SiquijorMap',
      description: 'Explore Siquijor tourism spots offline',
      theme_color: '#6c7ac1',
      background_color: '#ffffff',
      display: 'standalone',
      start_url: '/',
      icons: [
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    },
    workbox: {
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/.*\.tile\.openstreetmap\.org\/.*/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'openstreetmap-tiles',
            expiration: {
              maxEntries: 500,
              maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
            }
          }
        }
      ],
      navigateFallback: '/offline-fallback.html',
      globPatterns: [
        '**/*.{js,css,html,png,svg,ico}',
      ]
    },
    devOptions: {
      enabled: false  // Disable in development to avoid conflicts
    }
  }
})