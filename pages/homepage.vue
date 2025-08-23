<template>
  <NavBar_Website />

  <main class="bg-[#F6F6F6] min-h-screen flex flex-col items-center justify-center">
    <div class="w-full max-w-7xl px-4 py-8">
      <header class="px-4 sm:px-8 mb-6">
        <p class="text-gray-600 text-base sm:text-lg">Hello,</p>
        <h1 class="text-2xl sm:text-3xl text-[#6C7AC1] font-bold">{{ guestName }}!</h1>
      </header>

      <section class="relative px-4 sm:px-8 mb-16">
        <img src="/header.jpg" alt="Tropical destination with palm trees"
          class="w-full h-48 sm:h-60 md:h-72 object-cover rounded-t-3xl" />
        <div class="absolute bottom-0 w-full flex justify-center translate-y-1/2">
          <NuxtLink to="/guests/virtualtour"
            class="bg-[#6C7AC1] text-white font-semibold py-3 px-8 rounded-full shadow-lg hover:bg-white hover:text-[#6C7AC1] transition"
            aria-label="Explore virtual tour">
            Explore Virtual Tour
          </NuxtLink>
        </div>
      </section>

      <section class="px-4 sm:px-8 mb-12">
        <h2 class="text-lg sm:text-xl font-bold mb-5">What do you want to do?</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <NuxtLink v-for="action in actions" :key="action.text" :to="action.to"
            class="flex items-center space-x-5 p-4 bg-white border border-gray-300 rounded-xl transition duration-200 ease-in-out hover:bg-[#6C7AC1] hover:text-white group"
            :aria-label="action.text">
            <component :is="action.icon"
              class="w-7 h-7 text-[#6C7AC1] group-hover:text-white transition duration-200" />
            <span class="font-bold text-gray-800 group-hover:text-white transition duration-200">
              {{ action.text }}
            </span>
          </NuxtLink>
        </div>
      </section>

      <section class="px-4 sm:px-8 mb-12">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl sm:text-xl font-bold">Popular Destinations</h2>

          <NuxtLink to="/guests/hotspots"
            class="bg-[#6c7ac1] flex text-white px-8 py-3 items-center rounded-full font-semibold hover:bg-indigo-600 transition"
            aria-label="View more destinations">
            View All Locations
            <ArrowRight class="w-5 h-5 ml-2" />
          </NuxtLink>
        </div>

        <div class="bg-white py-8 border border-gray-300 rounded-2xl flex items-center justify-between gap-4">
          <button @click="prevHotspot" :disabled="hotspotPage === 0"
            class="hidden sm:block p-2 rounded-full hover:bg-gray-200 disabled:opacity-50 transition shrink-0">
            <ChevronLeft class="w-5 h-5 text-gray-600" />
          </button>

          <div class="flex gap-5 overflow-x-auto sm:overflow-x-hidden flex-nowrap px-1 snap-x snap-mandatory"
            aria-label="Popular destinations list">

            <div v-for="spot in pagedHotspots" :key="spot.hotspotId" @click="viewDestination(spot)"
              class="relative min-w-[20%] sm:w-[200px] md:w-[200px] bg-white rounded-2xl overflow-hidden cursor-pointer border-gray-200 hover:border-indigo-300 hover:bg-gray-100 transition-all duration-200 ease-in-out snap-start group">
              <img :src="spot.image" :alt="`Image of ${spot.name}`"
                class="w-full h-44 object-cover transition-transform duration-300 group-hover:scale-105" />
              <div class="p-4">
                <p class="text-lg font-bold text-gray-800 group-hover:text-[#6C7AC1]">
                  {{ spot.name }}
                </p>
                <p class="text-sm text-gray-500">
                  {{ spot.location }}
                </p>
              </div>
            </div>
          </div>

          <button @click="nextHotspot" :disabled="hotspotPage >= maxHotspotPages - 1"
            class="p-2 rounded-full hover:bg-gray-200 disabled:opacity-50 transition shrink-0">
            <ChevronRight class="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div class="flex justify-center mt-3 space-x-2">
          <span v-for="i in maxHotspotPages" :key="i" @click="hotspotPage = i - 1"
            class="w-2.5 h-2.5 rounded-full cursor-pointer transition"
            :class="hotspotPage === i - 1 ? 'bg-[#6C7AC1] scale-110' : 'bg-gray-300 hover:bg-gray-400'" />
        </div>


      </section>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '~/composables/useAuth.js'

import {
  CalendarDays,
  Car,
  Phone,
  ClipboardList,
  Heart,
  Map,
  ChevronRight,
  ArrowRight,
  ChevronLeft,
} from 'lucide-vue-next'

import NavBar_Website from '~/components/NavBar_Website.vue'
const hotspotPage = ref(0)
const hotspots = ref([])
const hotspotsPerPage = 4

const hotspotsPerPageResponsive = computed(() => {
  if (process.client) {
    if (window.innerWidth >= 1024) return 4
    if (window.innerWidth >= 640) return 3
    return 1
  }
  return 1;
});


const pagedHotspots = computed(() => {
  const start = hotspotPage.value * hotspotsPerPageResponsive.value;
  return hotspots.value.slice(start, start + hotspotsPerPageResponsive.value);
});

const maxHotspotPages = computed(() =>
  Math.ceil(hotspots.value.length / hotspotsPerPageResponsive.value)
);

function nextHotspot() {
  if (hotspotPage.value < maxHotspotPages.value - 1) hotspotPage.value++;
}

function prevHotspot() {
  if (hotspotPage.value > 0) hotspotPage.value--;
}

const { authUser, logout } = useAuth()
const { $supabase } = useNuxtApp()

const guestName = ref('')

const actions = [
  { icon: CalendarDays, text: 'Set My Schedule', to: '/guests/itinerarybuilder' },
  { icon: Car, text: 'Rent or Avail Service', to: '/guests/rentaservice' },
  { icon: Phone, text: 'Contact Admin', to: '/guests/contact' },
  { icon: ClipboardList, text: 'View Booking Details', to: '/guests/account' },
  { icon: Heart, text: 'Explore Admin Picks', to: '/guests/hotspots' },
  { icon: Map, text: 'Explore Map', to: '/guests/map' },
]

onMounted(async () => {
  if (process.client) {
    const userId = localStorage.getItem('user_id')
    if (userId) {
      const { data, error } = await $supabase
        .from('guest')
        .select('firstName, lastName')
        .eq('guest_ID', userId)
        .single()

      if (!error && data) {
        guestName.value = `${data.firstName || ''} ${data.lastName || ''}`.trim()
      }
    }
  }

  const { data, error } = await $supabase.from('hotspot').select('*')
  if (!error) hotspots.value = data
})
</script>