// Simplified service worker
const CACHE_NAME = 'siquijor-map-v1'
const TILE_DB_NAME = 'MapTilesDB'
const TILE_STORE_NAME = 'tiles'

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated')
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  
  // Handle tile requests only
  if (url.hostname.includes('tile.openstreetmap.org')) {
    event.respondWith(handleTileRequest(event.request))
  }
})

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