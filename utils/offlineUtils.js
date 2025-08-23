// utils/offlineUtils.js - Modified for image-based offline maps

export class OfflineMapManager {
  constructor() {
    this.dbName = 'MapImagesDB'
    this.dbVersion = 1
    this.storeName = 'map_images'
  }

  // Initialize service worker
  async initServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        console.log('Service Worker registered:', registration)
        return registration
      } catch (error) {
        console.error('Service Worker registration failed:', error)
        throw error
      }
    } else {
      throw new Error('Service Workers not supported')
    }
  }

  // Open IndexedDB connection
  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' })
          store.createIndex('area', 'area', { unique: false })
          store.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  // Download map images for different areas of Siquijor
  async downloadMapImages(onProgress = null) {
    const mapAreas = [
      {
        id: 'siquijor_full',
        name: 'Full Siquijor Island',
        url: this.generateStaticMapUrl(9.205, 123.52, 11, 800, 600),
        bounds: { north: 9.3, south: 9.1, east: 123.6, west: 123.4 }
      },
      {
        id: 'siquijor_town',
        name: 'Siquijor Town Area',
        url: this.generateStaticMapUrl(9.215, 123.518, 14, 800, 600),
        bounds: { north: 9.23, south: 9.2, east: 123.53, west: 123.506 }
      },
      {
        id: 'maria_area',
        name: 'Maria Area',
        url: this.generateStaticMapUrl(9.155, 123.485, 14, 800, 600),
        bounds: { north: 9.17, south: 9.14, east: 123.5, west: 123.47 }
      },
      {
        id: 'larena_area',
        name: 'Larena Area', 
        url: this.generateStaticMapUrl(9.238, 123.535, 14, 800, 600),
        bounds: { north: 9.25, south: 9.226, east: 123.55, west: 123.52 }
      }
    ]

    console.log(`Downloading ${mapAreas.length} map images...`)
    
    let downloaded = 0
    
    for (const area of mapAreas) {
      try {
        await this.downloadAndStoreMapImage(area)
        downloaded++
        
        if (onProgress) {
          onProgress({
            downloaded,
            total: mapAreas.length,
            percentage: Math.round((downloaded / mapAreas.length) * 100),
            currentArea: area.name
          })
        }
        
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 500))
        
      } catch (error) {
        console.error(`Failed to download map image for ${area.name}:`, error)
      }
    }
    
    return { downloaded, total: mapAreas.length }
  }

  // Generate static map URL using a mapping service
  generateStaticMapUrl(lat, lng, zoom, width, height) {
    // Using MapBox Static API (you'll need an API key)
    // Alternative: you can pre-generate these images and host them yourself
    const mapboxToken = 'your_mapbox_token_here' // Replace with actual token
    
    return `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${lng},${lat},${zoom}/${width}x${height}@2x?access_token=${mapboxToken}&attribution=false&logo=false`
    
    // Alternative: Use your own hosted images
    // return `/static-maps/${area.id}.jpg`
  }

  // Download and store a single map image
  async downloadAndStoreMapImage(area) {
    try {
      const response = await fetch(area.url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const blob = await response.blob()
      await this.storeMapImage(area.id, area.name, blob, area.bounds)
      
    } catch (error) {
      console.error(`Error downloading map image ${area.id}:`, error)
      throw error
    }
  }

  // Store map image in IndexedDB
  async storeMapImage(id, name, blob, bounds) {
    const db = await this.openDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      
      const imageData = {
        id,
        name,
        area: id,
        data: blob,
        bounds,
        timestamp: Date.now()
      }
      
      const request = store.put(imageData)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Get stored map image from IndexedDB
  async getMapImage(areaId) {
    const db = await this.openDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.get(areaId)
      
      request.onsuccess = () => {
        const result = request.result
        resolve(result ? result.data : null)
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Get all cached map areas
  async getCachedMapAreas() {
    const db = await this.openDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAll()
      
      request.onsuccess = () => {
        const results = request.result || []
        resolve(results.map(item => ({
          id: item.id,
          name: item.name,
          bounds: item.bounds,
          timestamp: item.timestamp
        })))
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Find best map image for current view
  async getBestMapImageForView(mapBounds) {
    const cachedAreas = await this.getCachedMapAreas()
    
    // Simple logic: find the area that best contains the current view
    for (const area of cachedAreas) {
      const bounds = area.bounds
      if (
        mapBounds.north <= bounds.north &&
        mapBounds.south >= bounds.south &&
        mapBounds.east <= bounds.east &&
        mapBounds.west >= bounds.west
      ) {
        return await this.getMapImage(area.id)
      }
    }
    
    // If no perfect match, return the full island image
    return await this.getMapImage('siquijor_full')
  }

  // Clear all cached images
  async clearCache() {
    const db = await this.openDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.clear()
      
      request.onsuccess = () => {
        console.log('All map images cleared from cache')
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Get cache statistics
  async getCacheStats() {
    const db = await this.openDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const countRequest = store.count()
      
      countRequest.onsuccess = () => {
        const count = countRequest.result
        
        // Get total size
        const getAllRequest = store.getAll()
        getAllRequest.onsuccess = () => {
          const items = getAllRequest.result || []
          let totalSize = 0
          
          items.forEach(item => {
            if (item.data) {
              totalSize += item.data.size || 0
            }
          })
          
          resolve({
            imageCount: count,
            estimatedSize: totalSize,
            averageImageSize: count > 0 ? Math.round(totalSize / count) : 0,
            sizeFormatted: this.formatBytes(totalSize),
            areas: items.map(item => ({
              id: item.id,
              name: item.name,
              size: this.formatBytes(item.data?.size || 0)
            }))
          })
        }
        getAllRequest.onerror = () => resolve({ imageCount: 0, estimatedSize: 0 })
      }
      
      countRequest.onerror = () => reject(countRequest.error)
    })
  }

  // Format bytes to human readable format
  formatBytes(bytes) {
    if (bytes === 0) return '0 B'
    
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }
}

// Keep existing exports
export const SIQUIJOR_BOUNDS = {
  north: 9.3,
  south: 9.1,
  east: 123.6,
  west: 123.4
}

export const STORAGE_KEYS = {
  HOTSPOTS: 'siquijor-hotspots-cache',
  LAST_UPDATE: 'siquijor-last-update',
  OFFLINE_SETTINGS: 'siquijor-offline-settings'
}

export const localStorageUtils = {
  saveHotspots(hotspots) {
    try {
      localStorage.setItem(STORAGE_KEYS.HOTSPOTS, JSON.stringify(hotspots))
      localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, new Date().toISOString())
      return true
    } catch (error) {
      console.error('Error saving hotspots to localStorage:', error)
      return false
    }
  },

  loadHotspots() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HOTSPOTS)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Error loading hotspots from localStorage:', error)
      return null
    }
  },

  getLastUpdate() {
    const lastUpdate = localStorage.getItem(STORAGE_KEYS.LAST_UPDATE)
    return lastUpdate ? new Date(lastUpdate) : null
  },

  clearAll() {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
  }
}

export const networkUtils = {
  isOnline() {
    return navigator.onLine
  },

  addListeners(onOnline, onOffline) {
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  },

  async testConnectivity(timeout = 5000) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)
      
      const response = await fetch('https://httpbin.org/status/200', {
        method: 'HEAD',
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      return response.ok
    } catch (error) {
      return false
    }
  }
}