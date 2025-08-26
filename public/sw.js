/* global self, caches, fetch, Request, Response */
const CACHE_NAME = "samson-homestay-cache-v1"

// Pages you want to explicitly precache (account, mytrips, etc.)
const ACCOUNT_URLS_TO_CACHE = [
  "/guests/account",
  "/guests/mytrips",
  "/guests/termsconditions",
  "/offline-fallback.html"
]

// Install event: pre-cache account pages and fallback
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ACCOUNT_URLS_TO_CACHE)
    })
  )
})

// Activate event: clean up old caches if needed
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  )
})

// Helper: detect if request is for a static asset (Nuxt, CSS, JS, images)
function isStaticAsset(request) {
  return (
    request.url.includes("/_nuxt/") ||
    request.url.match(/\.(?:js|css|png|jpg|jpeg|svg|ico|woff|woff2)$/)
  )
}

// Fetch event handler
self.addEventListener("fetch", (event) => {
  const req = event.request

  // 1. Handle navigation requests (HTML pages)
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(async () => {
        const cache = await caches.open(CACHE_NAME)
        // Try serving from cache first
        const cachedResponse = await cache.match(req)
        if (cachedResponse) return cachedResponse

        // Fallback to account page if exists
        const accountPage = await cache.match("/guests/account")
        if (accountPage) return accountPage

        // Final fallback: offline-fallback.html
        return cache.match("/offline-fallback.html")
      })
    )
    return
  }

  // 2. Supabase API (NetworkFirst)
  if (/\.supabase\.co\/rest\/v1\//.test(req.url)) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone()
          caches.open("supabase-api").then((cache) => cache.put(req, resClone))
          return res
        })
        .catch(() => caches.match(req))
    )
    return
  }

  // 3. Map tiles (CacheFirst with IndexedDB or cache)
  if (/tile\.openstreetmap\.org/.test(req.url)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached
        return fetch(req).then((res) => {
          const resClone = res.clone()
          caches.open("openstreetmap-tiles").then((cache) =>
            cache.put(req, resClone)
          )
          return res
        })
      })
    )
    return
  }

  // 4. Static assets (StaleWhileRevalidate)
  if (isStaticAsset(req)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetchPromise = fetch(req).then((res) => {
          caches.open("static-assets").then((cache) =>
            cache.put(req, res.clone())
          )
          return res
        })
        return cached || fetchPromise
      })
    )
    return
  }

  // 5. Default: try network, then cache, then offline page
  event.respondWith(
    fetch(req).catch(async () => {
      const cached = await caches.match(req)
      return (
        cached ||
        (req.headers.get("accept")?.includes("text/html")
          ? caches.match("/offline-fallback.html")
          : undefined)
      )
    })
  )
})
