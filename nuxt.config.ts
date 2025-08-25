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
  
  // Enhanced PWA configuration for offline account functionality
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Samson\'s Cozy Homestay',
      short_name: 'SamsonHomestay',
      description: 'Explore Siquijor tourism and manage your homestay bookings offline',
      theme_color: '#6c7ac1',
      background_color: '#ffffff',
      display: 'standalone',
      start_url: '/',
      scope: '/',
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
      // Runtime caching strategies
      runtimeCaching: [
        // OpenStreetMap tiles (existing functionality)
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
        },
        
        // Supabase API calls for account data
        {
          urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/(guest|booking|itinerary|grouprequest|rentalunit).*/,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'supabase-api',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
            },
            networkTimeoutSeconds: 10
          }
        },
        
        // Account pages
        {
          urlPattern: /\/guests\/(account|mytrips|termsconditions)/,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'account-pages',
            expiration: {
              maxEntries: 20,
              maxAgeSeconds: 60 * 60 * 24 * 3 // 3 days
            },
            networkTimeoutSeconds: 5
          }
        },
        
        // Static assets (JS, CSS, images)
        {
          urlPattern: /^https:\/\/.*\.(js|css|png|jpg|jpeg|svg|ico|woff|woff2)$/,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'static-assets',
            expiration: {
              maxEntries: 200,
              maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
            }
          }
        }
      ],
      
      // Offline fallback page
      navigateFallback: '/offline-fallback.html',
      
      // Files to precache
      globPatterns: [
        '**/*.{js,css,html,png,svg,ico}'
      ],
      
      // Exclude from precaching
      globIgnores: [
        '**/node_modules/**/*',
        'sw.js',
        'workbox-*.js'
      ]
    },
    
    // Development options
    devOptions: {
      enabled: false  // Keep disabled in development
    }
  }
})