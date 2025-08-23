// plugins/offline-map.client.js - Nuxt plugin to initialize offline functionality

import { OfflineMapManager, networkUtils } from '~/utils/offlineUtils'

export default defineNuxtPlugin(async () => {
  // Only run on client side
  if (process.server) return

  const offlineManager = new OfflineMapManager()
  
  // Initialize service worker
  try {
    await offlineManager.initServiceWorker()
    console.log('✅ Offline map functionality initialized')
  } catch (error) {
    console.warn('⚠️ Offline functionality not available:', error.message)
  }

  // Provide offline manager globally
  return {
    provide: {
      offlineMap: offlineManager,
      networkUtils
    }
  }
})