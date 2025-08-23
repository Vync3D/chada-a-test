<script setup>
import { Plus, Search } from 'lucide-vue-next'
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import HotspotViewForm from './HotspotViewForm.vue'
const { $supabase } = useNuxtApp()

const hotspotInfo = ref([])
const selectedHotspot = ref(null)

const route = useRoute()
const emit = defineEmits(['changeView'])

/**
 * Fetches all hotspots from the database.
 */
const fetchHotspots = async () => {
    const { data, error } = await $supabase.from('hotspot').select(`*`)
    if (error) {
        console.error('Error fetching hotspots:', error)
    } else {
        hotspotInfo.value = data
    }
}

onMounted(async () => {
    await fetchHotspots()
})

const searchQuery = ref('')
const locationFilter = ref('all')

const filteredHotspot = computed(() => {
    const query = searchQuery.value.trim().toLowerCase()

    let filtered = hotspotInfo.value.filter(hotspot => {
        const hotspotName = hotspot.name?.toLowerCase() ?? ''
        const hotspotLocation = hotspot.location?.toLowerCase() ?? ''

        if (!query) return true

        return hotspotName.includes(query) || hotspotLocation.includes(query)
    })

    if (locationFilter.value !== 'all') {
        filtered = filtered.filter(hotspot =>
            hotspot.location && hotspot.location === locationFilter.value
        )
    }

    return filtered
})

/**
 * Sets the selected hotspot to the provided object, which triggers the display of the form.
 * @param {object} hotspot The hotspot object to view.
 */
function viewHotspot(hotspot) {
    selectedHotspot.value = { ...hotspot }
}

/**
 * Clears the selected hotspot and re-fetches the data, which returns the view to the hotspots table.
 */
async function backToTable() {
    selectedHotspot.value = null
    await fetchHotspots()
}

/**
 * Handles the event when a hotspot is updated or deleted, triggering a data refresh.
 */
function handleHotspotUpdated() {
    backToTable()
}
</script>

<template>
    <div>
        <main class="flex-1 p-11 space-y-6">
            <div v-if="!selectedHotspot">
                <!-- Breadcrumb -->
                <div class="text-sm text-gray-500">
                    <span @click="emit('changeView', 'dashboard')" class="hover:underline">Dashboard</span> /
                    <span class="text-[#6b79c0] font-semibold">View Hotspots</span>
                </div>

                <!-- Header -->
                <div class="pb-3">
                    <h2 class="text-2xl mb-1 font-bold text-[#6b79c0] pt-6">View Hotspots</h2>
                    <p class="text-gray-600">Manage and review all pinned hotspots. Select a hotspot from the list to
                        edit it.</p>
                </div>

                <!-- 🔍 Search Bar and Filters -->
                <div
                    class="bg-white rounded-xl p-3 flex flex-col border border-gray-200 sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div class="relative w-full max-w-md">
                        <input v-model="searchQuery" type="text" placeholder="Search for a location name"
                            class="search pl-10 pr-8 py-2 w-full border border-gray-300 bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-[#6b79c0]" />
                        <button v-if="searchQuery" @click="searchQuery = ''"
                            class="absolute right-12 top-5 text-xl -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            &times;
                        </button>
                        <Search class="absolute right-5 top-5 -translate-y-1/2 text-gray-800 w-5 h-5" />
                    </div>

                    <!-- Filters -->
                    <div class="justify-center items-center flex gap-2">
                        <select v-model="locationFilter"
                            class="filter border border-gray-300 bg-white rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-[#6b79c0]">
                            <option value="all">All Locations</option>
                            <option value="Enrique">Enrique</option>
                            <option value="Villanueva">Villanueva</option>
                            <option value="Larena">Larena</option>
                            <option value="Lazi">Lazi</option>
                            <option value="Maria">Maria</option>
                            <option value="San Juan">San Juan</option>
                            <option value="Siquijor">Siquijor</option>
                        </select>
                    </div>
                </div>

                <!-- Table Header -->
                <div
                    class="px-5 border-t-1 pt-4 border-gray-300 my-5 uppercase tracking-wider grid grid-cols-6 font-semibold text-sm text-gray-500">
                    <span>Hotspot Name</span>
                    <span>Location</span>
                    <span>Type</span>
                    <span>Latitude</span>
                    <span>Longitude</span>
                    <span>Admin's Pick</span>
                </div>

                <div v-if="filteredHotspot.length === 0"
                    class="flex flex-col items-center justify-center gap-2 py-5 text-gray-500">
                    <Search class="w-10 h-10 text-gray-300" />
                    <p class="text-center text-sm">No results found for "<span class="font-semibold text-[#6b79c0]">{{
                        searchQuery }}</span>"</p>
                </div>

                <div v-for="hotspot in filteredHotspot" :key="hotspot.hotspot_ID" @click="viewHotspot(hotspot)"
                    class="group bg-white rounded-xl mb-2 border border-gray-200 hover:shadow grid px-5 grid-cols-6 items-center text-sm text-gray-700 py-4 transition duration-200 cursor-pointer">
                    <span class="font-bold text-gray-900 duration-200 group-hover:text-[#6b79c0]">
                        {{ hotspot.name }}
                    </span>
                    <span class="font-bold text-gray-900 duration-200 group-hover:text-[#6b79c0]">
                        {{ hotspot.location }}
                    </span>
                    <span class="font-bold text-gray-900 duration-200 group-hover:text-[#6b79c0]">
                        {{ hotspot.type }}
                    </span>
                    <span>{{ parseFloat(hotspot.latitude).toFixed(2) }}</span>
                    <span>{{ parseFloat(hotspot.longitude).toFixed(2) }}</span>
                    <span>{{ hotspot.adminPick === true ? 'Yes' : 'No' }}</span>
                </div>
            </div>
            <div v-else>
                <HotspotViewForm :hotspot="selectedHotspot" :hotspot_ID="selectedHotspot.hotspot_ID"
                    @changeView="backToTable" @hotspotUpdated="handleHotspotUpdated" />
            </div>
        </main>
    </div>
</template>
