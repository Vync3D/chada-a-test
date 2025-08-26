<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <div class="max-w-7xl mx-auto w-full flex-grow p-4 sm:p-6 md:p-8">
      <!-- Header with offline indicator -->
      <div class="flex items-center mb-4 sm:mb-6">
        <button @click="goBack" aria-label="Go back">
          <ArrowLeft class="text-black w-6 h-6 sm:w-7 sm:h-7 mr-3" />
        </button>
        <h1 class="text-xl sm:text-2xl font-bold text-[#6c7ac1]">Tourist Spot Map</h1>
        <transition name="slide-down">
          <div v-if="showOfflineNotice" class="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white px-4 py-2 text-center">
            <div class="flex items-center justify-center gap-2">
              <WifiOff class="w-4 h-4" />
              <span class="text-sm font-medium">You're offline. Showing cached data.</span>
            </div>
          </div>
        </transition>
      </div>
      
      <!-- Controls -->
      <!-- Online/Offline Status -->
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-2 px-3 py-1 rounded-full text-sm" :class="[
          isOnline 
            ? 'bg-green-100 text-green-700' 
            : 'bg-orange-100 text-orange-700'
        ]">
          <Wifi v-if="isOnline" class="w-4 h-4" />
          <WifiOff v-else class="w-4 h-4" />
          <span>{{ isOnline ? 'Online' : 'Offline' }}</span>
        </div>
      </div>
      <!-- 🔎 Search bar -->
      <div class="mb-4">
        <input
          v-model="query"
          type="text"
          placeholder="Search tourist spot..."
          class="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#6c7ac1]"
        />
      </div>

      <!-- Map -->
      <ClientOnly>
        <LMap
          v-if="LMap"
          ref="mapRef"
          :zoom="initialZoom"
          :center="initialCenter"
          style="height: 70vh; width: 100%; border-radius: 1rem;"
          :use-global-leaflet="false"
          @ready="onMapReady"
        >
          <!-- Offline tile layer -->
          <LTileLayerOffline />

          <!-- Hotspot markers -->
          <LMarker
            v-for="p in filteredPins"
            :key="p.hotspot_ID"
            :lat-lng="[p.latitude, p.longitude]"
          >
            <LTooltip direction="top" offset="[0, -10]">
              {{ p.name || 'Unnamed' }}
            </LTooltip>
          </LMarker>
        </LMap>
        <template #fallback>
          <div class="h-[70vh] grid place-items-center text-gray-500">Loading map…</div>
        </template>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, defineComponent, h } from "vue"
import { ArrowLeft,WifiOff, Wifi } from "lucide-vue-next"
import { useRouter, useNuxtApp } from "#imports"
import { useRoute } from "vue-router"

const router = useRouter()
const goBack = () => router.back()
const { $supabase } = useNuxtApp()

const initialCenter = ref([9.21545, 123.51794])
const initialZoom = ref(14)
const pins = ref([])
const query = ref("")
const isOnline = ref(true) // default, updated onMounted
const mapRef = ref(null)
const showOfflineNotice = ref(false)

const LMap = ref(null)
const LMarker = ref(null)
const LTooltip = ref(null)
const LTileLayerOffline = ref(null)

onMounted(async () => {
  if (typeof navigator !== "undefined") {
    isOnline.value = navigator.onLine
    window.addEventListener("online", () => (isOnline.value = true))
    window.addEventListener("offline", () => (isOnline.value = false))
  }

  const leaflet = await import("leaflet")
  await import("leaflet/dist/leaflet.css")
  await import("leaflet.offline")

  const vueLeaflet = await import("@vue-leaflet/vue-leaflet")
  LMap.value = vueLeaflet.LMap
  LMarker.value = vueLeaflet.LMarker
  LTooltip.value = vueLeaflet.LTooltip

  // Define Offline TileLayer as Vue component
  LTileLayerOffline.value = defineComponent({
    name: "LTileLayerOffline",
    setup() {
      return () =>
        h(vueLeaflet.LTileLayer, {
          url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          subdomains: "abc",
          attribution: "&copy; OpenStreetMap contributors",
          tileLayerClass: leaflet.tileLayer.offline
        })
    }
  })

  // Fix default icons
  const L = leaflet.default
  delete L.Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
  })

  // Load pins depending on connection
  if (typeof window !== "undefined") {
    if (!navigator.onLine) {
      const savedPins = localStorage.getItem("offlinePins")
      if (savedPins) {
        pins.value = JSON.parse(savedPins)
      }
    } else {
      await fetchPins()
    }
  }
})

onUnmounted(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("online", () => {})
    window.removeEventListener("offline", () => {})
  }
})

const fetchPins = async () => {
  try {
    const { data, error } = await $supabase
      .from("hotspot")
      .select("hotspot_ID, name, latitude, longitude")

    if (error) {
      console.error("Failed to load pins:", error)
      return
    }

    const validPins = (data || []).filter(
      (p) => typeof p.latitude === "number" && typeof p.longitude === "number"
    )

    pins.value = validPins

    // ✅ Save pins to localStorage for offline use
    if (typeof window !== "undefined") {
      localStorage.setItem("offlinePins", JSON.stringify(validPins))
    }
  } catch (err) {
    console.error("Error fetching pins:", err)
  }
}

const filteredPins = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return pins.value
  return pins.value.filter((p) => (p.name || "").toLowerCase().includes(q))
})

const onMapReady = () => {
  console.log("Map ready")
}

// === Leaflet Offline API ===
const saveTiles = () => {
  if (typeof window === "undefined") return
  const map = mapRef.value?.leafletObject
  if (!map) return
  const layer = map._layers[Object.keys(map._layers)[0]]
  if (layer?.saveTiles) layer.saveTiles()
}

const removeTiles = () => {
  if (typeof window === "undefined") return
  const map = mapRef.value?.leafletObject
  if (!map) return
  const layer = map._layers[Object.keys(map._layers)[0]]
  if (layer?.clearTiles) layer.clearTiles()
}

const showCacheInfo = async () => {
  if (typeof window === "undefined") return
  const map = mapRef.value?.leafletObject
  if (!map) return

  try {
    const info = await tileLayer.getStorageInfo()
    alert(`Cache Info:\n\nTiles: ${info.length}\nStorage: ${info.byteLength} bytes`)
  } catch (err) {
    console.error("Error fetching cache info:", err)
  }
}

</script>
