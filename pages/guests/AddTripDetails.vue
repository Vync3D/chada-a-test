<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { ChevronLeft, Search, X, ChevronRight, Plus, ArrowLeft, Info } from 'lucide-vue-next';
import { useRouter, useRoute } from 'vue-router';
import { useNuxtApp } from '#app';

// Initialize Nuxt features
const router = useRouter();
const route = useRoute();
const { $supabase } = useNuxtApp();

// State management
const itineraryId = ref(null);
const itineraryDate = ref('');
const hotspots = ref([]);
const locationMode = ref('select'); // 'select' or 'manual'
const selectedCategory = ref('All');
const searchQuery = ref('');
const selectedLocation = ref(null);

// Validation and warnings
const timeError = ref('');
const locationError = ref('');
const saveError = ref('');

// Pagination
const currentPage = ref(0);
const pageSize = 4;

// Time selection
const timeMode = ref('precise'); // 'precise' or 'general'
const selectedHour = ref('');
const selectedMinute = ref('');
const selectedPeriod = ref('AM');
const selectedGeneralTime = ref('');

// Functions
const goBack = () => router.back();

const saveToItineraryItem = async () => {
  // Reset errors
  timeError.value = '';
  locationError.value = '';
  saveError.value = '';

  // Sync selectedLocation before saving
  if (locationMode.value === 'manual') {
    selectedLocation.value = searchQuery.value.trim() || null;
  } else {
    const match = hotspots.value.find(h => h.name.toLowerCase() === searchQuery.value.toLowerCase());
    if (match) selectedLocation.value = match;
  }

  // Resolve location
  const location = typeof selectedLocation.value === 'object'
    ? selectedLocation.value.name || selectedLocation.value.location || ''
    : (selectedLocation.value || '').trim();

  // Determine time to save and validate
  let timeToSave = '';
  if (timeMode.value === 'precise') {
    if (!selectedHour.value || !selectedMinute.value || selectedHour.value < 1 || selectedHour.value > 12 || selectedMinute.value < 0 || selectedMinute.value > 59) {
      timeError.value = 'Please enter a valid specific time.';
      return;
    }
    timeToSave = formattedTime.value;
  } else {
    if (!selectedGeneralTime.value) {
      timeError.value = 'Please select a general time.';
      return;
    }
    timeToSave = selectedGeneralTime.value;
  }

  // Validate location
  if (!location) {
    locationError.value = 'Please select a hotspot or enter a location.';
    return;
  }

  // Fetch guest ID
  const { data: itinerary, error: itineraryError } = await $supabase
    .from('itinerary')
    .select('guest_ID')
    .eq('itinerary_ID', itineraryId.value)
    .single();

  if (itineraryError || !itinerary) {
    console.error('Could not fetch itinerary or guest ID:', itineraryError);
    saveError.value = 'Failed to fetch itinerary.';
    return;
  }

  // Save itinerary item
  const { error } = await $supabase.from('itineraryitem').insert({
    itinerary_ID: itineraryId.value,
    locationname: location,
    time: timeToSave,
  });

  if (error) {
    console.error('Save error:', error);
    saveError.value = 'Failed to save itinerary item.';
  } else {
    // Reset form and go back
    selectedLocation.value = null;
    selectedHour.value = '';
    selectedMinute.value = '';
    selectedPeriod.value = 'AM';
    selectedGeneralTime.value = '';
    searchQuery.value = '';
    router.back();
  }
};

const setTimeMode = (mode) => {
  timeMode.value = mode;
  timeError.value = '';
};

const selectHotspot = (spot) => {
  if (selectedLocation.value && selectedLocation.value.hotspot_id === spot.hotspot_id) {
    selectedLocation.value = null;
    searchQuery.value = '';
  } else {
    selectedLocation.value = spot;
    searchQuery.value = spot.name;
  }
  locationError.value = '';
};

const handleManualInput = () => {
  if (locationMode.value === 'manual') {
    selectedLocation.value = searchQuery.value.trim() || null;
  }
};

const limitToTwoDigits = (type) => {
  const valRef = type === 'hour' ? selectedHour : selectedMinute;
  const num = parseInt(String(valRef.value).replace(/\D/g, '').slice(0, 2), 10);
  if (!isNaN(num)) {
    valRef.value = (type === 'hour' ? Math.min(Math.max(num, 1), 12) : Math.min(Math.max(num, 0), 59)).toString();
  } else {
    valRef.value = '';
  }
};

// Pagination functions
const nextPage = () => {
  if (currentPage.value < totalPages.value - 1) currentPage.value++;
};
const prevPage = () => {
  if (currentPage.value > 0) currentPage.value--;
};
const goToPage = (page) => {
  if (page >= 0 && page < totalPages.value) {
    currentPage.value = page;
  }
};

// Computed properties
const formattedTime = computed(() => {
  const hour = String(selectedHour.value).padStart(2, '0');
  const minute = String(selectedMinute.value).padStart(2, '0');
  return `${hour}:${minute} ${selectedPeriod.value}`;
});

const categories = computed(() => {
  const types = hotspots.value.map(h => h.type).filter(Boolean);
  return ['All', ...new Set(types)];
});

const filteredHotspots = computed(() => {
  let filtered = hotspots.value;
  if (selectedCategory.value !== 'All') {
    filtered = filtered.filter(h => h.type === selectedCategory.value);
  }
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(h =>
      h.name.toLowerCase().includes(query) ||
      h.location.toLowerCase().includes(query) ||
      h.type.toLowerCase().includes(query)
    );
  }
  return filtered;
});

const pagedHotspots = computed(() => {
  const start = currentPage.value * pageSize;
  return filteredHotspots.value.slice(start, start + pageSize);
});

const totalPages = computed(() => Math.ceil(filteredHotspots.value.length / pageSize));

const pages = computed(() => Array.from({ length: totalPages.value }, (_, i) => i));

const isHotspotListEmpty = computed(() => hotspots.value.length > 0 && pagedHotspots.value.length === 0);

// Watchers
watch([selectedCategory, searchQuery], () => {
  currentPage.value = 0;
  selectedLocation.value = null;
});

// Lifecycle hooks
onMounted(async () => {
  // Check for valid itineraryId from route query
  if (route.query.itineraryId && !isNaN(parseInt(route.query.itineraryId))) {
    itineraryId.value = parseInt(route.query.itineraryId, 10);
  } else {
    console.warn('Invalid itinerary ID provided in query.');
    router.back();
    return;
  }

  // Fetch hotspots and itinerary date concurrently
  const [{ data: hotspotsData, error: hotspotsError }, { data: itinerary, error: itineraryError }] = await Promise.all([
    $supabase.from('hotspot').select('*'),
    $supabase.from('itinerary').select('date').eq('itinerary_ID', itineraryId.value).single(),
  ]);

  if (!hotspotsError && hotspotsData) hotspots.value = hotspotsData;
  else console.error('Error fetching hotspots:', hotspotsError);

  if (!itineraryError && itinerary) {
    itineraryDate.value = itinerary.date;
  } else {
    console.error('Error fetching itinerary date:', itineraryError);
  }
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex items-center mb-6">
        <button @click="goBack" class="p-2 rounded-full hover:bg-gray-200 transition">
          <ArrowLeft class="text-gray-800 w-7 h-7" />
        </button>
        <h1 class="text-2xl font-bold text-[#6b79c0] ml-3">Add Itinerary Item</h1>
      </div>

      <div class="bg-white p-4 sm:p-6 rounded-xl border border-gray-300 ">
        <!-- Section 1: Select Time -->
        <div class="space-y-4 mb-6">
          <h2 class="text-xl font-bold text-gray-800">1. Select Time</h2>

          <div class="space-y-4">
            <div class="w-full">
              <label class="block text-gray-700 font-medium mb-1">Date</label>
              <input type="date" v-model="itineraryDate" disabled
                class="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-700 cursor-not-allowed " />
            </div>

            <div class="flex flex-wrap gap-2">
              <button @click="setTimeMode('precise')" :class="[
                'px-4 py-2 rounded-full font-medium border transition-colors',
                timeMode === 'precise' ? 'bg-[#222222] text-white border-[#222222]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              ]">Specific Time</button>
              <button @click="setTimeMode('general')" :class="[
                'px-4 py-2 rounded-full font-medium border transition-colors',
                timeMode === 'general' ? 'bg-[#222222] text-white border-[#222222]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              ]">General Time</button>
            </div>

            <div v-if="timeMode === 'precise'" class="flex items-center flex-wrap gap-2 sm:gap-2">
              <div class="flex items-center gap-1">
                <!-- Hour input: w-16 on mobile, w-20 on small screens and up -->
                <input type="number" v-model="selectedHour" min="1" max="12" placeholder="HH"
                  class="w-16 sm:w-20 border rounded-lg px-3 py-2 text-center" @input="limitToTwoDigits('hour')" />
                <!-- Colon: text-lg on mobile, text-xl on small screens and up -->
                <span class="text-lg sm:text-xl font-bold text-gray-500">:</span>
                <!-- Minute input: w-16 on mobile, w-20 on small screens and up -->
                <input type="number" v-model="selectedMinute" min="0" max="59" placeholder="MM"
                  class="w-16 sm:w-20 border rounded-lg px-3 py-2 text-center" @input="limitToTwoDigits('minute')" />
              </div>
              <div class=" gap-2">
                <button @click="selectedPeriod = 'AM'" :class="[
                  'px-3 py-2 rounded-lg font-medium border transition-colors',
                  selectedPeriod === 'AM' ? 'bg-[#6b79c0] text-white border-[#6b79c0]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                ]">AM</button>
                <button @click="selectedPeriod = 'PM'" :class="[
                  'px-3 mx-2 py-2 rounded-lg font-medium border transition-colors',
                  selectedPeriod === 'PM' ? 'bg-[#6b79c0] text-white border-[#6b79c0]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                ]">PM</button>
              </div>
            </div>

            <div v-if="timeMode === 'general'">
              <select v-model="selectedGeneralTime" class="w-full border rounded-lg px-3 py-2 ">
                <option disabled value="">Select a time frame</option>
                <option>Early Morning</option>
                <option>Morning</option>
                <option>Late Morning</option>
                <option>Lunch</option>
                <option>Afternoon</option>
                <option>Late Afternoon</option>
                <option>Dinner</option>
                <option>Evening</option>
                <option>Late Evening</option>
              </select>
            </div>

            <p v-if="timeError" class="text-red-500 text-sm mt-1 flex items-center">
              <Info class="w-4 h-4 mr-1" />
              {{ timeError }}
            </p>
          </div>
        </div>

        <hr class="my-6 border-gray-200" />

        <!-- Section 2: Select Location -->
        <div class="space-y-4">
          <h2 class="text-xl font-bold text-gray-800">2. Select Location</h2>

          <div class="flex flex-wrap gap-2">
            <button @click="() => { locationMode = 'select'; selectedLocation = null; searchQuery = '' }" :class="[
              'px-4 py-2 rounded-full font-medium border transition-colors ',
              locationMode === 'select' ? 'bg-[#6b79c0] text-white border-[#6b79c0]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
            ]">Choose from Hotspots</button>
            <button @click="() => { locationMode = 'manual'; selectedLocation = null; searchQuery = '' }" :class="[
              'px-4 py-2 rounded-full font-medium border transition-colors ',
              locationMode === 'manual' ? 'bg-[#6b79c0] text-white border-[#6b79c0]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
            ]">Add Manually</button>
          </div>

          <div v-if="locationMode === 'manual'">
            <label class="block text-gray-700 font-medium mb-2">Location Name</label>
            <div class="relative">
              <input type="text" v-model="searchQuery" placeholder="Enter location name"
                class="w-full border rounded-lg px-4 py-2 pr-10 focus:ring-2 focus:ring-[#6b79c0] transition "
                @input="handleManualInput" />
              <X v-if="searchQuery" @click="searchQuery = ''; selectedLocation = null"
                class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600 transition" />
            </div>
          </div>

          <div v-if="locationMode === 'select'">
            <div class="mb-4 space-y-2">
              <label class="block text-gray-700 font-medium">Filter by Category</label>
              <div class="flex flex-wrap gap-2">
                <button v-for="category in categories" :key="category"
                  @click="() => { selectedCategory = category; selectedLocation = null; currentPage = 0; }" :class="[
                    'px-4 py-2 rounded-full font-medium border transition-colors ',
                    selectedCategory === category ? 'bg-[#6b79c0] text-white border-[#6b79c0]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                  ]">
                  {{ category }}
                </button>
              </div>
            </div>

            <div class="mb-4">
              <label for="hotspot-search" class="block font-medium text-gray-700 mb-2">Search Hotspots</label>
              <div class="relative">
                <input id="hotspot-search" type="text" v-model="searchQuery"
                  placeholder="Search by name, location, or type..."
                  class="w-full border rounded-lg px-4 py-2 pr-10 focus:ring-2 focus:ring-[#6b79c0] transition " />
                <X v-if="searchQuery" @click="searchQuery = ''; selectedLocation = null"
                  class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600 transition" />
                <Search v-else class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            <div v-if="pagedHotspots.length > 0"
              class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 my-6">
              <div v-for="spot in pagedHotspots" :key="spot.hotspot_id" @click="selectHotspot(spot)" :class="[
                'relative bg-white rounded-xl overflow-hidden cursor-pointer  transition-all duration-200',
                selectedLocation?.hotspot_id === spot.hotspot_id ? 'border-2 border-[#6b79c0] ring-4 ring-[#6b79c0]/20' : 'border border-gray-200 hover:shadow-md'
              ]">
                <div class="h-40 w-full overflow-hidden">
                  <img :src="spot.image" :alt="spot.name" class="w-full h-full object-cover" />
                </div>
                <div class="p-4 space-y-1">
                  <p class="font-bold text-gray-800 text-lg truncate">{{ spot.name }}</p>
                  <p class="text-sm text-gray-500 truncate">{{ spot.location }}</p>
                </div>
              </div>
            </div>

            <div v-if="isHotspotListEmpty" class="text-center text-gray-500 py-12 border-t border-gray-200 mt-6">
              <p class="font-semibold text-lg">No hotspots found.</p>
              <p class="text-sm">Try adjusting your search query or filters.</p>
            </div>

            <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-6">
              <button @click="prevPage" :disabled="currentPage === 0" :class="[
                'p-3 rounded-full border border-gray-300  transition-colors',
                currentPage === 0 ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : 'text-gray-600 bg-white hover:bg-[#6c7ac1] hover:text-white'
              ]" aria-label="Previous Page">
                <ChevronLeft class="w-5 h-5" />
              </button>
              <div class="flex flex-wrap gap-1">
                <button v-for="page in pages" :key="page" @click="goToPage(page)" :class="[
                  'px-4 py-2 rounded-full font-medium transition-colors',
                  page === currentPage ? 'bg-[#6c7ac1] text-white shadow-md' : 'text-gray-600 bg-white hover:bg-gray-100'
                ]">
                  {{ page + 1 }}
                </button>
              </div>
              <button @click="nextPage" :disabled="currentPage >= totalPages - 1" :class="[
                'p-3 rounded-full border border-gray-300  transition-colors',
                currentPage >= totalPages - 1 ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : 'text-gray-600 bg-white hover:bg-[#6c7ac1] hover:text-white'
              ]" aria-label="Next Page">
                <ChevronRight class="w-5 h-5" />
              </button>
            </div>
          </div>
          <p v-if="locationError" class="text-red-500 text-sm mt-1 flex items-center">
            <Info class="w-4 h-4 mr-1" />
            {{ locationError }}
          </p>
        </div>

        <hr class="my-6 border-gray-200" />

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row justify-end items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <p v-if="saveError" class="text-red-500 text-sm flex items-center">
            <Info class="w-4 h-4 mr-1" />
            {{ saveError }}
          </p>
          <button @click="saveToItineraryItem"
            class="w-full sm:w-auto bg-black text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800 transition shadow-md">
            <div class="flex items-center justify-center">
              <Plus class="w-5 h-5 mr-2" />
              Add to Itinerary
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>