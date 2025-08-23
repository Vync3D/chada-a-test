<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Plus, Pencil, Calendar, ChevronLeft, ChevronRight, LogOut, SearchX, FileText } from 'lucide-vue-next'
import JoinGroup from '~/components/JoinGroup.vue'

const router = useRouter()

const showJoinModal = ref(false)
const guestId = ref(null)
const trips = ref([])
const { $supabase } = useNuxtApp()

const goBack = () => {
  router.back()
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const currentYear = new Date().getFullYear();
const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i);

const guestProfile = ref({
  firstName: '',
  lastName: '',
  username: '',
  contactNo: ''
})

function logout() {
  localStorage.removeItem('user_id')
  localStorage.removeItem('user_role')
  router.push('/')
}

function formatDateRange(start, end) {
  const format = (d) => new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  return `${format(start)} - ${format(end)}`
}

const itemsPerPage = ref(5) // default items shown
const currentPage = ref(1)
const filteredTrips = computed(() => {
  return trips.value.filter(trip => {
    const tripDate = new Date(trip.date);
    const monthMatch = selectedMonth.value ? tripDate.getMonth() + 1 === selectedMonth.value : true;
    const yearMatch = selectedYear.value ? tripDate.getFullYear() === selectedYear.value : true;
    return monthMatch && yearMatch;
  });
});

const paginatedTrips = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredTrips.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredTrips.value.length / itemsPerPage.value);
});

const bookingInfo = ref({
  unitName: '',
  dateRange: ''
})
const selectedMonth = ref('')
const selectedYear = ref('')

async function filterItineraries() {
  if (!selectedMonth.value || !selectedYear.value) return

  const monthStr = String(selectedMonth.value).padStart(2, '0')
  const startDate = `${selectedYear.value}-${monthStr}-01`
  const endDate = new Date(selectedYear.value, selectedMonth.value, 0).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('itinerary')
    .select(`
      itinerary_ID,
      name,
      date,
      group_ID,
      guest_ID,
      itineraryitem (
        item_ID,
        time,
        locationname
      )
    `)
    .eq('guest_ID', guest_ID.value)
    .gte('date', startDate)
    .lte('date', endDate)

  if (error) {
    console.error('Error filtering itineraries:', error)
    return
  }

  itinerary.value = []
  if (data.length > 0) {
    // Only show matching itinerary if one was already selected
    const matched = data.find(item => item.itinerary_ID === itineraryId.value)
    if (matched) {
      tripName.value = matched.name
      tripDate.value = new Date(matched.date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
      itinerary.value = matched.itineraryitem || []
    }
  }
}

onMounted(async () => {
  const role = localStorage.getItem('user_role')
  const id = localStorage.getItem('user_id')
  guestId.value = parseInt(id)

  if (role !== 'guest') {
    router.push('/')
    return
  }


  const { data: userData, error: userError } = await $supabase
    .from('guest')
    .select('firstName, lastName, username, contactNo')
    .eq('guest_ID', guestId.value)
    .maybeSingle()

  if (userError) {
    console.error('Error fetching user info:', userError.message)
  } else if (userData) {
    guestProfile.value = userData
  }


  // Fetch the latest booking
  const { data: bookingData, error: bookingError } = await $supabase
    .from('booking')
    .select('startDate, endDate, unit_ID')
    .eq('guest_ID', guestId.value)
    .order('startDate', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (bookingError) {
    console.error('Error fetching booking:', bookingError.message)
  }

  if (bookingData && bookingData.unit_ID) {
    const { data: unitData, error: unitError } = await $supabase
      .from('rentalunit')
      .select('name')
      .eq('unit_ID', bookingData.unit_ID)
      .maybeSingle()

    if (unitError) {
      console.error('Error fetching unit name:', unitError.message)
    }

    bookingInfo.value = {
      unitName: unitData?.name || 'Unknown Unit',
      dateRange: formatDateRange(bookingData.startDate, bookingData.endDate)
    }
  } else {
    bookingInfo.value = {
      unitName: 'No recent booking',
      dateRange: ''
    }
  }
  let allTrips = [];

  // 1. Fetch personal itineraries (owned by the guest)
  const { data: personalItineraries, error: personalError } = await $supabase
    .from('itinerary')
    .select('itinerary_ID, name, date')
    .eq('guest_ID', guestId.value)
    .order('date', { ascending: true });

  if (personalError) {
    console.error('Error fetching personal itineraries:', personalError.message);
  } else {
    allTrips = allTrips.concat(personalItineraries.map(trip => ({
      itinerary_ID: trip.itinerary_ID,
      name: trip.name,
      date: new Date(trip.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      isOwner: true // Flag to identify as a personal trip
    })));
  }

  // 2. Fetch itineraries from approved groups
  const { data: groupRequests, error: groupError } = await $supabase
    .from('grouprequest')
    .select(`
            group:group_ID (
                itinerary (
                    itinerary_ID,
                    name,
                    date
                )
            )
        `)
    .eq('guest_ID', guestId.value)
    .eq('status', 'approved');

  if (groupError) {
    console.error('Error fetching joined group itineraries:', groupError.message);
  } else {
    const joinedItineraries = groupRequests
      .filter(request => request.group?.itinerary && request.group.itinerary.length > 0)
      .map(request => {
        const itinerary = request.group.itinerary[0]; // Assuming one itinerary per group
        return {
          itinerary_ID: itinerary.itinerary_ID,
          name: itinerary.name,
          date: new Date(itinerary.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          isOwner: false // Flag to identify as a joined group trip
        };
      });

    // Combine with personal trips, avoiding duplicates based on itinerary_ID
    const existingIds = new Set(allTrips.map(t => t.itinerary_ID));
    const newTrips = joinedItineraries.filter(t => !existingIds.has(t.itinerary_ID));
    allTrips = allTrips.concat(newTrips);
  }

  // 3. Sort the combined list by date
  allTrips.sort((a, b) => new Date(a.date) - new Date(b.date));

  // 4. Update the trips ref
  trips.value = allTrips;

})
</script>

<template>
  <div v-if="authUser?.role === 'guest'">
  </div>

  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="flex items-center mb-6 animate-fade-in-down">
        <button @click="goBack">
          <ArrowLeft class="text-black w-7 h-7 mr-3" />
        </button>
        <h1 class="ml-0 sm:ml-4 text-2xl font-bold text-[#6c7ac1]">Account</h1>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div class="space-y-6">
          <div class="bg-white p-6 rounded-xl border border-[#6C7AC1]/20  space-y-6 animate-fade-in-down">
            <div class="space-y-5">
              <!-- Account Information -->
              <div>
                <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <!-- <UserIcon class="w-5 h-5 text-[#6c7ac1]" /> -->
                  Account Information
                </h2>
                <div class="grid grid-cols-1 pt-4 sm:grid-cols-2 gap-6">
                  <div>
                    <label class="block text-gray-500  font-medium">First Name</label>
                    <input type="text" :value="guestProfile.firstName" disabled
                      class="mt-1 w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2  text-gray-700" />
                  </div>
                  <div>
                    <label class="block text-gray-500  font-medium">Last Name</label>
                    <input type="text" :value="guestProfile.lastName" disabled
                      class="mt-1 w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2  text-gray-700" />
                  </div>
                  <div>
                    <label class="block text-gray-500  font-medium">Username</label>
                    <input type="text" :value="guestProfile.username" disabled
                      class="mt-1 w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2  text-gray-700" />
                  </div>
                  <div>
                    <label class="block text-gray-500  font-medium">Contact Number</label>
                    <input type="text" :value="guestProfile.contactNo" disabled
                      class="mt-1 w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2  text-gray-700" />
                  </div>
                </div>
              </div>

              <!-- Divider -->
              <div class="border-t mb-3 border-gray-200"></div>
              <!-- Booking Information -->
              <div>
                <h2 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <!-- <CalendarIcon class="w-5 h-5 text-[#6c7ac1]" /> -->
                  Booking Information
                </h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label class="block text-gray-500  font-medium">Unit Name</label>
                    <input type="text" :value="bookingInfo.unitName" disabled
                      class="mt-1 w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2  text-gray-700" />
                  </div>
                  <div>
                    <label class="block text-gray-500  font-medium">Date of Booking</label>
                    <input type="text" :value="bookingInfo.dateRange" disabled
                      class="mt-1 w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2  text-gray-700" />
                  </div>
                </div>
              </div>
            </div>

            <div class="space-y-3 mt-6">
              <NuxtLink to="/guests/termsconditions"
                class="flex items-center w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200">
                <FileText class="mr-3 w-5 h-5 text-gray-500" />
                Terms & Conditions
              </NuxtLink>

              <button @click="logout"
                class="flex items-center w-full px-6 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600">
                <LogOut class="mr-3 w-5 h-5 text-white" />
                Logout
              </button>
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-wrap">
            <p class="text-lg font-bold">Your Trips</p>
            <div class="flex flex-col sm:flex-row gap-2 w-full">
              <!-- Join a group -->
              <button @click="showJoinModal = true"
                class="w-full flex items-center justify-center px-4 py-3 text-white bg-[#6c7ac1] rounded-full font-medium hover:bg-[#5a66af] transition">
                <Pencil class="mr-2 w-4 h-4" />
                Join group
              </button>

              <!-- Create an itinerary -->
              <NuxtLink to="/guests/itinerarybuilder"
                class="w-full flex items-center justify-center px-4 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition">
                <Plus class="mr-2 w-4 h-4" />
                Create itinerary
              </NuxtLink>
            </div>
          </div>
          <div class="flex flex-col sm:flex-row sm:flex-wrap items-start gap-4 mb-4">
            <!-- Month -->
            <div class="flex items-center gap-2">
              <select id="month" v-model="selectedMonth" @change="filterItineraries"
                class="filter border border-gray-300 rounded-md px-2 py-1 text-gray-700 bg-white">
                <option value="">All Months</option>
                <option v-for="(m, index) in months" :key="index" :value="index + 1">
                  {{ m }}
                </option>
              </select>
            </div>

            <!-- Year -->
            <div class="flex items-center gap-2">
              <select id="year" v-model="selectedYear" @change="filterItineraries"
                class="filter border border-gray-300 rounded-md px-2 py-1 text-gray-700 bg-white">
                <option value="">All Years</option>
                <option v-for="year in availableYears" :key="year" :value="year">
                  {{ year }}
                </option>
              </select>
            </div>

            <!-- Show per page -->
            <div class="flex items-center gap-2">
              <label for="perPage" class="text-sm text-gray-700">Show</label>
              <select id="perPage" v-model.number="itemsPerPage"
                class="filter border border-gray-300 rounded-md px-2 py-1 text-gray-700 bg-white">
                <option :value="5">5</option>
                <option :value="10">10</option>
                <option :value="20">20</option>
              </select>
              <span class="text-sm text-gray-700">per page</span>
            </div>
          </div>


          <NuxtLink v-for="(trip, index) in paginatedTrips" :key="trip.itinerary_ID"
            :to="`/guests/mytrips?id=${trip.itinerary_ID}`"
            class="w-full text-left bg-white rounded-xl border border-[#6C7AC1]/40 p-5 flex justify-between items-center group hover:bg-[#6c7ac1] transition duration-300">
            <div>
              <h1 class=" font-bold text-[#6c7ac1] group-hover:text-white truncate">
                {{ trip.name }}
              </h1>
              <div class="flex items-center gap-2 mt-1 text-gray-500 group-hover:text-white">
                <Calendar class="w-4 h-4" />
                <p class="text-sm font-medium">{{ trip.date }}</p>
                <p v-if="!trip.isOwner"
                  class="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700">Group Trip</p>
              </div>
            </div>
            <ChevronRight class="w-5 h-5 text-gray-400 group-hover:text-white" />
          </NuxtLink>

          <div v-if="filteredTrips.length === 0"
            class="flex flex-col items-center justify-center text-center text-gray-500 py-12">
            <SearchX class="w-10 h-10 mb-3 text-gray-500" />
            <p class="font-semibold">No itineraries found</p>
            <p class="text-gray-500">Try adjusting your filters or check back later.</p>
          </div>

          <div v-if="totalPages > 1" class="flex justify-center mt-4 space-x-2">
            <button @click="currentPage--" :disabled="currentPage === 1" :class="[
              'p-3 rounded-full border border-gray-300 shadow-sm transition-all duration-300 ease-in-out',
              currentPage === 1
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                : 'text-gray-600 bg-white hover:bg-[#6c7ac1] hover:text-white hover:border-[#6c7ac1] hover:shadow-md'
            ]" aria-label="Previous Page">
              <ChevronLeft class="w-4 h-4" />
            </button>

            <div class="flex flex-wrap gap-1 sm:gap-2">
              <button v-for="page in totalPages" :key="page" @click="currentPage = page" :class="[
                'px-4 py-2 rounded-full font-medium transition-colors duration-200',
                page === currentPage
                  ? 'bg-[#6c7ac1] text-white shadow-md'
                  : 'text-gray-600 bg-white hover:bg-gray-100 hover:text-gray-800'
              ]">
                {{ page }}
              </button>
            </div>

            <!-- Next button -->
            <button @click="currentPage++" :disabled="currentPage === totalPages" :class="[
              'p-3 rounded-full border border-gray-300 shadow-sm transition-all duration-300 ease-in-out',
              currentPage === totalPages
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                : 'text-gray-600 bg-white hover:bg-[#6c7ac1] hover:text-white hover:border-[#6c7ac1] hover:shadow-md'
            ]" aria-label="Next Page">
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <transition name="fade">
    <JoinGroup v-if="showJoinModal" @close="showJoinModal = false" />
  </transition>
</template>

<style scoped>
@keyframes fade-in-down {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-down {
  animation: fade-in-down 0.5s ease-out;
}

.animate-fade-in-up {
  animation: fade-in-up 0.5s ease-out;
}
</style>