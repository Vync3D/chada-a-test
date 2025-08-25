// Enhanced service worker with account page offline support
const CACHE_NAME = 'siquijor-map-v1'
const API_CACHE_NAME = 'api-data-v1'
const TILE_DB_NAME = 'MapTilesDB'
const TILE_STORE_NAME = 'tiles'

// URLs to cache for offline account functionality
const ACCOUNT_URLS_TO_CACHE = [
  '/guests/account',
  '/guests/mytrips',
  '/guests/termsconditions',
  '/_nuxt/', // Nuxt assets
]

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching account pages...')
        // Cache account-related pages
        return cache.addAll(ACCOUNT_URLS_TO_CACHE.filter(url => !url.includes('_nuxt')))
      })
      .catch(error => {
        console.log('Cache installation failed:', error)
      })
  )
  
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated')
  
  event.waitUntil(
    // Clean up old caches
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      return self.clients.claim()
    })
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  
  // Handle map tile requests (existing functionality)
  if (url.hostname.includes('tile.openstreetmap.org')) {
    event.respondWith(handleTileRequest(event.request))
    return
  }

  // Handle Supabase API requests for account data
  if (isSupabaseApiRequest(event.request)) {
    event.respondWith(handleSupabaseRequest(event.request))
    return
  }

  // Handle navigation requests to account pages
  if (event.request.mode === 'navigate' && isAccountPage(url.pathname)) {
    event.respondWith(handleAccountPageRequest(event.request))
    return
  }

  // Handle static assets (CSS, JS, images)
  if (isStaticAsset(event.request)) {
    event.respondWith(handleStaticAssetRequest(event.request))
    return
  }
})

// Check if request is to Supabase API
function isSupabaseApiRequest(request) {
  const url = new URL(request.url)
  return url.hostname.includes('supabase') && 
         url.pathname.includes('/rest/v1/') &&
         (url.pathname.includes('/guest') || 
          url.pathname.includes('/booking') || 
          url.pathname.includes('/itinerary') || 
          url.pathname.includes('/grouprequest') || 
          url.pathname.includes('/rentalunit'))
}

// Check if URL is an account-related page
function isAccountPage(pathname) {
  return pathname.includes('/guests/account') || 
         pathname.includes('/guests/mytrips') || 
         pathname.includes('/guests/termsconditions')
}

// Check if request is for static assets
function isStaticAsset(request) {
  const url = new URL(request.url)
  return request.destination === 'script' || 
         request.destination === 'style' || 
         request.destination === 'image' ||
         url.pathname.includes('/_nuxt/') ||
         url.pathname.includes('/assets/')
}

// Handle Supabase API requests with cache-first strategy for GET requests
async function handleSupabaseRequest(request) {
  const cacheKey = request.url + (request.method === 'GET' ? '' : '-' + Date.now())
  
  try {
    // For GET requests, try cache first
    if (request.method === 'GET') {
      const cache = await caches.open(API_CACHE_NAME)
      const cachedResponse = await cache.match(request)
      
      if (cachedResponse) {
        console.log('Serving API data from cache:', request.url)
        
        // Try to fetch fresh data in background
        fetch(request).then(async (response) => {
          if (response.ok) {
            await cache.put(request, response.clone())
            console.log('Updated cache with fresh API data:', request.url)
          }
        }).catch(() => {
          console.log('Background fetch failed for:', request.url)
        })
        
        return cachedResponse
      }
    }

    // Try network first
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(API_CACHE_NAME)
      await cache.put(request, networkResponse.clone())
      console.log('Cached fresh API data:', request.url)
    }
    
    return networkResponse

  } catch (error) {
    console.log('Network failed for API request:', request.url, error)
    
    // If network fails, try to serve from cache
    if (request.method === 'GET') {
      const cache = await caches.open(API_CACHE_NAME)
      const cachedResponse = await cache.match(request)
      
      if (cachedResponse) {
        console.log('Serving stale API data from cache:', request.url)
        return cachedResponse
      }
    }

    // Return error response if nothing in cache
    return new Response(
      JSON.stringify({ 
        error: 'Offline - No cached data available',
        offline: true 
      }), 
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Handle account page navigation requests
async function handleAccountPageRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      await cache.put(request, networkResponse.clone())
      return networkResponse
    }
    
    throw new Error('Network response not ok')

  } catch (error) {
    console.log('Network failed for page:', request.url)
    
    // Try to serve from cache
    const cache = await caches.open(CACHE_NAME)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      console.log('Serving page from cache:', request.url)
      return cachedResponse
    }

    // If no cache, return a basic offline page
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Offline - Samson's Cozy Homestay</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 50px; 
            background-color: #f5f5f5;
          }
          .offline-container {
            max-width: 400px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .offline-icon { font-size: 48px; margin-bottom: 20px; }
          h1 { color: #6c7ac1; margin-bottom: 20px; }
          p { color: #666; margin-bottom: 30px; }
          .retry-btn {
            background: #6c7ac1;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
          }
          .retry-btn:hover { background: #5a66af; }
        </style>
      </head>
      <body>
        <div class="offline-container">
          <div class="offline-icon">📱</div>
          <h1>You're Offline</h1>
          <p>This page is not available offline. Please check your internet connection and try again.</p>
          <button class="retry-btn" onclick="window.location.reload()">Try Again</button>
        </div>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    })
  }
}

// Handle static asset requests
async function handleStaticAssetRequest(request) {
  try {
    const cache = await caches.open(CACHE_NAME)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      // Serve from cache and update in background
      fetch(request).then(async (response) => {
        if (response.ok) {
          await cache.put(request, response.clone())
        }
      }).catch(() => {})
      
      return cachedResponse
    }

    // Try network
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone())
    }
    
    return networkResponse

  } catch (error) {
    console.log('Failed to load static asset:', request.url)
    
    // Try one more time from cache
    const cache = await caches.open(CACHE_NAME)
    const cachedResponse = await cache.match(request)
    
    return cachedResponse || new Response('', { status: 404 })
  }
}

// Existing tile handling functions (keeping your original functionality)
async function handleTileRequest(request) {
  const url = new URL(request.url)
  const pathParts = url.pathname.split('/')
  const z = parseInt(pathParts[1])
  const x = parseInt(pathParts[2])
  const y = parseInt(pathParts[3].replace('.png', ''))

  if (isNaN(z) || isNaN(x) || isNaN(y)) {
    return fetch(request)
  }

  try {
    // Try IndexedDB first
    const cachedTile = await getTileFromIndexedDB(z, x, y)
    if (cachedTile) {
      return new Response(cachedTile, {
        headers: { 'Content-Type': 'image/png' }
      })
    }

    // Try network
    const response = await fetch(request)
    if (response.ok) {
      const blob = await response.clone().blob()
      storeTileInIndexedDB(z, x, y, blob).catch(console.error)
    }
    return response

  } catch (error) {
    // Return fallback tile
    const svg = `<svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
      <rect width="256" height="256" fill="#f0f0f0"/>
      <text x="128" y="128" text-anchor="middle" font-size="14" fill="#999">Offline ${z}/${x}/${y}</text>
    </svg>`
    
    return new Response(svg, {
      headers: { 'Content-Type': 'image/svg+xml' }
    })
  }
}

function getTileFromIndexedDB(z, x, y) {
  return new Promise((resolve) => {
    const request = indexedDB.open(TILE_DB_NAME, 1)
    request.onerror = () => resolve(null)
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(TILE_STORE_NAME)) {
        db.createObjectStore(TILE_STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => {
      try {
        const db = request.result
        const transaction = db.transaction([TILE_STORE_NAME], 'readonly')
        const store = transaction.objectStore(TILE_STORE_NAME)
        const getRequest = store.get(`${z}-${x}-${y}`)
        getRequest.onsuccess = () => {
          resolve(getRequest.result ? getRequest.result.data : null)
        }
        getRequest.onerror = () => resolve(null)
      } catch (err) {
        resolve(null)
      }
    }
  })
}

function storeTileInIndexedDB(z, x, y, blob) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(TILE_DB_NAME, 1)
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(TILE_STORE_NAME)) {
        db.createObjectStore(TILE_STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction([TILE_STORE_NAME], 'readwrite')
      const store = transaction.objectStore(TILE_STORE_NAME)
      const tileData = {
        id: `${z}-${x}-${y}`,
        z, x, y,
        data: blob,
        timestamp: Date.now()
      }
      const putRequest = store.put(tileData)
      putRequest.onsuccess = () => resolve()
      putRequest.onerror = () => reject(putRequest.error)
    }
    request.onerror = () => reject(request.error)
  })
}