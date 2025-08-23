<script setup>
import { ref, computed, onMounted } from 'vue'
import { ArrowLeft } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const { $supabase } = useNuxtApp()
const router = useRouter()

const hotspots = ref([])
const activeTab = ref('hottest')
const selectedCategory = ref('All')

onMounted(async () => {
  const { data, error } = await $supabase.from('hotspot').select('*')
  if (!error && data) {
    hotspots.value = data
  }
})

function goToMap(spot) {
  router.push({
    path: '/guests/map',
    query: {
      id: spot.hotspot_ID,
      lat: spot.latitude,
      lng: spot.longitude,
      name: spot.name
    }
  })
}


function switchTab(tab) {
  activeTab.value = tab
}

const categories = computed(() => {
  const types = hotspots.value.map(h => h.type).filter(Boolean)
  return ['All', ...new Set(types)]
})

const filteredHotspots = computed(() => {
  let list = activeTab.value === 'admin'
    ? hotspots.value.filter(h => h.adminPick)
    : [...hotspots.value].sort((a, b) => b.popularity_score - a.popularity_score)

  if (selectedCategory.value !== 'All') {
    list = list.filter(h => h.type === selectedCategory.value)
  }

  return list
})

const tabDescription = computed(() => {
  if (activeTab.value === 'hottest') {
    return "These are the most popular spots right now, based on visitor ratings and activity."
  } else {
    return "Our team's hand-picked recommendations for the best experiences."
  }
})

function goBack() {
  window.history.back()
}

const activeTabClass =
  'px-4 py-5 w-full font-semibold shadow transition bg-[#6C7AC1] text-white rounded-tl-xl'
const inactiveTabClass =
  'px-4 py-5 w-full transition bg-white hover:bg-[#6C7AC1] hover:text-white'
</script>

<template>
  <main class="min-h-screen flex flex-col items-center">
    <div class="max-w-7xl mx-auto px-4 py-8 w-full">
      <div class="flex items-center mb-3">
        <button @click="goBack">
          <ArrowLeft class="text-black w-7 h-7 mr-3" />
        </button>
        <h1 class="text-2xl font-bold text-[#6c7ac1]">Destinations</h1>
      </div>
      <p class="text-gray-500 mb-8">
        Find popular spots and hidden gems across the island.
      </p>

      <div class="mb-6">
        <p class="text-xl font-bold text-gray-800 mb-3">Categories</p>
        <div class="flex flex-wrap gap-3">
          <button v-for="category in categories" :key="category" @click="selectedCategory = category" :class="[
            'px-4 py-2 rounded-full text-sm font-medium border transition',
            selectedCategory === category
              ? 'bg-[#6b79c0] text-white border-[#6b79c0]'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
          ]">
            {{ category }}
          </button>
        </div>
      </div>

      <div class="mb-6">
        <p class="text-xl font-bold text-gray-800 mb-3">Explore Hotspots (Try clicking on one you find interesting!)</p>
        <div class="font-bold bg-white border-gray-300 text-lg max-w-full rounded-xl">
          <div class="w-full flex">
            <button
              @click="switchTab('hottest')"
              :class="[activeTab === 'hottest' ? activeTabClass : inactiveTabClass, 'w-1/2 text-center']"
            >
              Hottest Spots
            </button>
            <button
              @click="switchTab('admin')"
              :class="[activeTab === 'admin' ? activeTabClass : inactiveTabClass, 'w-1/2 text-center']"
            >
              Admin Picks
            </button>
          </div>
        </div>
        <p class="text-gray-500 text-sm mt-2">{{ tabDescription }}</p>
      </div>

      <div v-if="filteredHotspots.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <div
          v-for="spot in filteredHotspots"
          :key="spot.hotspotId"
          class="bg-white rounded-2xl overflow-hidden shadow-lg cursor-pointer hover:border-indigo-300 hover:shadow-xl hover:bg-gray-50 transition-all group"
          @click="goToMap(spot)"
          >
          <img
            :src="spot.image"
            :alt="`Image of ${spot.name}`"
            class="w-full h-44 object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div class="p-4">
            <p class="text-lg font-bold text-gray-800 group-hover:text-[#6C7AC1]">
              {{ spot.name }}
            </p>
            <p class="text-sm text-gray-500">{{ spot.location }}</p>
          </div>
        </div>
      </div>

      <div v-else class="text-gray-500 italic text-center my-8">
        No {{ activeTab === 'admin' ? 'admin picks' : 'hotspots' }} available right now.
      </div>
    </div>
  </main>
</template>