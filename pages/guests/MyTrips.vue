<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, UserLock, Pencil, Users, Calendar, Clock3, MapPin, Check, WifiOff, Wifi } from 'lucide-vue-next'
import EditGroup from '@/components/EditGroup.vue'

const router = useRouter()
const route = useRoute()
const goBack = () => router.back()
const supabase = useNuxtApp().$supabase
const guest_ID = ref(null)

const itineraryId = ref(null)
const groupId = ref(null)
const ownerId = ref(null)
const itinerary = ref([])
const isPendingMember = ref(false)

const tripName = ref('')
const tripDate = ref('')
const ownerFullname = ref('')
const hasPendingRequests = ref(false)
const approvedMembers = ref([])
const dismissedPending = ref(false)

const showModal = ref(false)
const modalType = ref('info')
const modalTitle = ref('')
const modalMessage = ref('')

const showEditGroup = ref(false)
const selectedItem = ref(null)
const editTime = ref('')
const editLocation = ref('')
const editEntryIndex = ref(null)

// Offline functionality
const isOnline = ref(true)
const showOfflineNotice = ref(false)
const lastSyncTime = ref(null)

// Cache keys for trip data
const CACHE_KEYS = {
  TRIP_DETAILS: 'cached_trip_details_',
  TRIP_MEMBERS: 'cached_trip_members_',
  TRIP_OWNER: 'cached_trip_owner_',
  LAST_SYNC: 'trip_last_sync_'
}

function convertToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [time, period] = timeStr.split(' ');
  const [hour, minute] = time.split(':').map(Number);
  let hours24 = hour % 12;
  if (period === 'PM') hours24 += 12;
  return hours24 * 60 + minute;
}

const sortedItinerary = computed(() =>
  [...itinerary.value].sort((a, b) => convertToMinutes(a.time) - convertToMinutes(b.time))
);

// Online/Offline detection
function updateOnlineStatus() {
  isOnline.value = navigator.onLine
  if (!navigator.onLine) {
    showOfflineNotice.value = true
    setTimeout(() => {
      showOfflineNotice.value = false
    }, 3000)
  } else {
    // When coming back online, sync data
    if (!isOnline.value) {
      syncDataWhenOnline()
    }
  }
}

// Load data from cache
function loadFromCache() {
  if (!itineraryId.value) return
  
  try {
    const cachedTripDetails = localStorage.getItem(CACHE_KEYS.TRIP_DETAILS + itineraryId.value)
    const cachedMembers = localStorage.getItem(CACHE_KEYS.TRIP_MEMBERS + itineraryId.value)
    const cachedOwner = localStorage.getItem(CACHE_KEYS.TRIP_OWNER + itineraryId.value)
    const cachedSync = localStorage.getItem(CACHE_KEYS.LAST_SYNC + itineraryId.value)

    if (cachedTripDetails) {
      const tripData = JSON.parse(cachedTripDetails)
      groupId.value = tripData.groupId
      ownerId.value = tripData.ownerId
      tripName.value = tripData.tripName
      tripDate.value = tripData.tripDate
      itinerary.value = tripData.itinerary
      isPendingMember.value = tripData.isPendingMember
      hasPendingRequests.value = tripData.hasPendingRequests || false
    }
    
    if (cachedMembers) {
      approvedMembers.value = JSON.parse(cachedMembers)
    }
    
    if (cachedOwner) {
      ownerFullname.value = JSON.parse(cachedOwner)
    }
    
    if (cachedSync) {
      lastSyncTime.value = new Date(cachedSync)
    }

    console.log('Trip data loaded from cache for itinerary:', itineraryId.value)
  } catch (error) {
    console.error('Error loading trip data from cache:', error)
  }
}

// Save data to cache
function saveToCache() {
  if (!itineraryId.value) return
  
  try {
    const tripData = {
      groupId: groupId.value,
      ownerId: ownerId.value,
      tripName: tripName.value,
      tripDate: tripDate.value,
      itinerary: itinerary.value,
      isPendingMember: isPendingMember.value,
      hasPendingRequests: hasPendingRequests.value
    }
    
    localStorage.setItem(CACHE_KEYS.TRIP_DETAILS + itineraryId.value, JSON.stringify(tripData))
    localStorage.setItem(CACHE_KEYS.TRIP_MEMBERS + itineraryId.value, JSON.stringify(approvedMembers.value))
    localStorage.setItem(CACHE_KEYS.TRIP_OWNER + itineraryId.value, JSON.stringify(ownerFullname.value))
    localStorage.setItem(CACHE_KEYS.LAST_SYNC + itineraryId.value, new Date().toISOString())
    lastSyncTime.value = new Date()
    
    console.log('Trip data saved to cache for itinerary:', itineraryId.value)
  } catch (error) {
    console.error('Error saving trip data to cache:', error)
  }
}

// Sync data when online
async function syncDataWhenOnline() {
  if (!navigator.onLine) return
  
  console.log('Syncing trip data...')
  await fetchAllTripData()
}

// Format last sync time
const formattedLastSync = computed(() => {
  if (!lastSyncTime.value) return ''
  return lastSyncTime.value.toLocaleString()
})

async function checkIfPendingMember() {
  if (!groupId.value || !guest_ID.value) return

  const { data, error } = await supabase
    .from('grouprequest')
    .select('grequest_ID')
    .eq('group_ID', groupId.value)
    .eq('guest_ID', guest_ID.value)
    .eq('status', 'pending')
    .maybeSingle()

  if (error) {
    console.error('Error checking for pending request:', error)
    return
  }

  isPendingMember.value = !!data
}

function openModal({ type = 'info', title = '', message = '' }) {
  modalType.value = type
  modalTitle.value = title
  modalMessage.value = message
  showModal.value = true
}

function dismissPendingNotification() {
  dismissedPending.value = true
}

function openEditGroupModal() {
  if (!isOnline.value) {
    openModal({
      type: 'info',
      title: 'Offline Mode',
      message: 'Group editing is not available while offline. Please connect to the internet and try again.'
    })
    return
  }
  
  if (itineraryId.value) {
    showEditGroup.value = true
  } else {
    openModal({
      type: 'info',
      title: 'Missing Info',
      message: 'No itinerary selected to edit.'
    })
  }
}

const isSelected = (time, locationname) => {
  return (
    selectedItem.value?.time === time &&
    selectedItem.value?.locationname === locationname
  )
}

const toggleSelection = (time, locationname, index) => {
  const currentItem = itinerary.value[index]
  const isSame = selectedItem.value?.item_ID === currentItem.item_ID

  if (isSame) {
    selectedItem.value = null
  } else {
    selectedItem.value = currentItem
    editTime.value = currentItem.time
    editLocation.value = currentItem.locationname
    editEntryIndex.value = index
  }
}

function goToEditPage() {
  if (!selectedItem.value) return
  
  if (!isOnline.value) {
    openModal({
      type: 'info',
      title: 'Offline Mode',
      message: 'Trip editing is not available while offline. Please connect to the internet and try again.'
    })
    return
  }
  
  router.push({
    path: '/guests/edittripdetails',
    query: {
      id: selectedItem.value.item_ID,
      itineraryId: selectedItem.value.itinerary_ID
    }
  })
}

function goToAddItinerary() {
  if (!isOnline.value) {
    openModal({
      type: 'info',
      title: 'Offline Mode',
      message: 'Adding new itinerary items is not available while offline. Please connect to the internet and try again.'
    })
    return
  }
  
  router.push(`/guests/addtripdetails?itineraryId=${itineraryId.value}`)
}

async function fetchOwnerName() {
  if (!ownerId.value) return

  const { data, error } = await supabase
    .from('guest')
    .select('firstName, lastName')
    .eq('guest_ID', ownerId.value)
    .maybeSingle()

  if (error) {
    console.error('Failed to fetch owner name:', error)
  } else if (data) {
    ownerFullname.value = `${data.firstName} ${data.lastName}`
  }
}

async function fetchItinerary() {
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
    .eq('itinerary_ID', itineraryId.value)
    .maybeSingle()

  if (error) {
    console.error('Error fetching itinerary:', error)
    return
  }

  if (data) {
    groupId.value = data.group_ID
    ownerId.value = data.guest_ID
    tripName.value = data.name
    tripDate.value = new Date(data.date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
    itinerary.value = (data.itineraryitem || []).map((item) => ({
      item_ID: item.item_ID,
      time: item.time,
      locationname: item.locationname,
      itinerary_ID: data.itinerary_ID
    }))
  }
}

async function fetchApprovedMembers() {
  if (!groupId.value || !ownerId.value) return

  const { data, error } = await supabase
    .from('grouprequest')
    .select(`
      guest_ID,
      guest:guest_ID (
        firstName,
        lastName
      )
    `)
    .eq('group_ID', groupId.value)
    .eq('status', 'approved')
    .neq('guest_ID', ownerId.value)

  if (error) {
    console.error('Failed to fetch approved members:', error)
    return
  }

  approvedMembers.value = data.map(r => ({
    ...r,
    fullname: `${r.guest.firstName} ${r.guest.lastName}`
  }))
}

async function checkPendingRequests() {
  if (!groupId.value) return

  const { data, error } = await supabase
    .from('grouprequest')
    .select('grequest_ID')
    .eq('group_ID', groupId.value)
    .eq('status', 'pending')

  if (error) {
    console.error('Error fetching pending requests:', error)
    return
  }

  hasPendingRequests.value = data.length > 0
}

// Fetch all trip data from server
async function fetchAllTripData() {
  try {
    await fetchItinerary()

    if (groupId.value && guest_ID.value && ownerId.value !== guest_ID.value) {
      // If the current user is not the owner, check if their request is pending
      await checkIfPendingMember()
    }

    // Only fetch other details if the user is the owner or an approved member
    if (!isPendingMember.value) {
      await fetchOwnerName()
      await fetchApprovedMembers()
      await checkPendingRequests()
    }

    // Save to cache after successful fetch
    saveToCache()
    
  } catch (error) {
    console.error('Error fetching trip data:', error)
  }
}

onMounted(async () => {
  // Set up online/offline listeners
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
  
  // Initial online status
  updateOnlineStatus()
  
  const storedGuestId = localStorage.getItem('user_id')
  guest_ID.value = storedGuestId ? parseInt(storedGuestId) : null

  const routeItineraryId = route.query.id
  if (routeItineraryId) {
    itineraryId.value = parseInt(routeItineraryId)
  }

  if (!guest_ID.value) {
    console.error('Guest ID not found in localStorage')
    return
  }

  if (!itineraryId.value) {
    console.error('Itinerary ID not found in route query.')
    return
  }

  // Load data - offline first approach
  loadFromCache()
  
  // If online, fetch fresh data
  if (navigator.onLine) {
    await fetchAllTripData()
  } else {
    console.log('Offline: Using cached trip data')
  }
})

// Cleanup event listeners
onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 animate-fadeIn">
    <!-- Offline Notice -->
    <transition name="slide-down">
      <div v-if="showOfflineNotice" class="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white px-4 py-2 text-center">
        <div class="flex items-center justify-center gap-2">
          <WifiOff class="w-4 h-4" />
          <span class="text-sm font-medium">You're offline. Showing cached data.</span>
        </div>
      </div>
    </transition>

    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- Header with online status -->
      <div class="flex items-center justify-between mb-6 animate-slideIn">
        <div class="flex items-center">
          <button @click="goBack">
            <ArrowLeft class="text-black w-7 h-7 mr-3" />
          </button>
          <h1 class="ml-4 text-2xl font-bold text-[#6c7ac1]">My trips</h1>
        </div>
        
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
      </div>

      <!-- Last Sync Info -->
      <div v-if="!isOnline && formattedLastSync" class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p class="text-sm text-blue-700">
          <span class="font-medium">Last synced:</span> {{ formattedLastSync }}
        </p>
      </div>

      <div v-if="isPendingMember" class="p-8 bg-white rounded-xl border border-gray-300">
        <div class="">
          <h2 class="flex text-center flex-col justify-center text-2xl font-bold text-[#6c7ac1]">
            <UserLock class="text-[#6c7ac1] w-8 h-8 mx-auto" />
            Request Pending
          </h2>
        </div>
        <p class="mt-4 text-center text-gray-600">Your request to join this group is still pending approval. You will be able to see
          the trip details once you are approved in Accounts section.</p>
        <p class="mt-2 text-center text-gray-500">Thank you for your patience!</p>
      </div>

      <div v-else>
        <p class="font-bold mb-3 animate-fadeIn">Trip Information</p>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="bg-white p-6 rounded-xl border border-[#6C7AC1]/40 col-span-1 animate-fadeInUp">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <h2 class="text-2xl text-[#6c7ac1] font-bold">{{ tripName }}</h2>

              <button @click="openEditGroupModal"
                :disabled="!isOnline"
                :class="[
                  'flex items-center px-4 py-3 rounded-lg text-sm font-medium transition',
                  isOnline 
                    ? 'bg-[#6c7ac1] text-white hover:bg-[#5b6cb3]' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                ]">
                <Users class="mr-2 w-4 h-4" />
                Edit group
              </button>
            </div>

            <MessageModal :show="showModal" :title="modalTitle" :message="modalMessage" :type="modalType"
              @close="showModal = false" />

            <div class="mb-4 pt-5">
              <div v-if="hasPendingRequests && !dismissedPending && isOnline"
                class="mb-4 p-3 bg-gray-100 text-gray-800 border border-gray-300 rounded-lg text-sm font-medium flex justify-between items-center">
                <span>You have pending group join requests. Please review them.</span>
                <button @click="dismissPendingNotification" class="text-gray-700 hover:underline ml-4 text-xs">
                  Dismiss
                </button>
              </div>

              <p class="text-gray-500 font-medium">Trip Members</p>
              <ul class="mt-2 text-black">
                <li class="font-bold">
                  {{ ownerFullname }} <span class="text-sm text-gray-500 italic">(Owner)</span>
                </li>

                <li v-for="member in approvedMembers" :key="member.guest_ID" class="font-medium">
                  {{ member.fullname }}
                </li>
              </ul>

              <p class="mt-5 space-y-1  text-gray-500 font-medium">Trip Date</p>
              <p class="font-bold text-black">{{ tripDate }}</p>
            </div>
          </div>

          <div class="lg:col-span-2 space-y-4">
            <div class="flex justify-between items-center">
              <h2 class="font-bold">Your Itineraries</h2>

              <div class="flex space-x-6 text-sm">
                <button @click="goToAddItinerary"
                  :disabled="!isOnline"
                  :class="[
                    'px-5 py-3 rounded-lg font-semibold transition',
                    isOnline 
                      ? 'bg-[#6c7ac1] text-white hover:bg-[#5b6cb3]' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  ]">
                  + Add Itinerary Item
                </button>
              </div>
            </div>

            <div class="bg-white rounded-xl border border-[#6C7AC1]/40 animate-fadeInUp">
              <div class="flex items-center gap-3 bg-[#6c7ac1] text-lg text-white font-bold px-5 py-5 rounded-t-xl">
                <Calendar class="w-5 h-5" />
                {{ tripDate }}
              </div>

              <div class="p-4">
                <table class="w-full text-sm table-fixed">
                  <thead>
                    <tr class="text-left text-gray-600 border-b border-gray-200">
                      <th class="w-4"></th>
                      <th class="pb-3 w-1/3">Time</th>
                      <th class="pb-3">Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(entry, index) in sortedItinerary" :key="entry.item_ID"
                      @click="toggleSelection(entry.time, entry.locationname, index)" :class="[
                        'cursor-pointer group transition rounded-2xl',
                        isSelected(entry.time, entry.locationname) ? 'bg-[#6c7ac1]/30' : 'hover:bg-gray-200'
                      ]">
                      <td></td>
                      <td class="py-3 text-md text-gray-700 font-medium">
                        <div class="flex items-center">
                          <Clock3 class="w-4 h-4 mr-2 text-[#6c7ac1]" />
                          {{ entry.time }}
                        </div>
                      </td>
                      <td class="py-3 text-md font-bold">
                        <div class="flex items-center">
                          <MapPin class="w-4 h-4 mr-2 text-[#6c7ac1]" />
                          {{ entry.locationname }}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div class="flex justify-end mt-6 gap-2">
                  <div class="relative group inline-block">
                    <button @click="goToEditPage" 
                      :disabled="!selectedItem || !isOnline" 
                      :class="[
                        'flex items-center px-10 py-3 rounded-full border font-medium transition',
                        (!selectedItem || !isOnline)
                          ? 'opacity-50 cursor-not-allowed border-gray-300 text-gray-400'
                          : 'border-gray-300 text-gray-700 hover:border-[#6c7ac1] hover:text-[#6c7ac1]'
                      ]">
                      <Pencil class="mr-2 w-4 h-5" />
                      Edit
                    </button>

                    <div v-if="!selectedItem || !isOnline"
                      class="w-full absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-xs px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                      {{ !isOnline ? 'Editing is not available offline.' : 'Select an itinerary item first to edit.' }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <EditGroup v-if="showEditGroup" :itineraryId="itineraryId" @close="showEditGroup = false" />
</template>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { transform: translateX(-20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes fadeInUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.animate-fadeIn { animation: fadeIn 0.5s ease-out; }
.animate-slideIn { animation: slideIn 0.5s ease-out; }
.animate-fadeInUp { animation: fadeInUp 0.5s ease-out; }

.slide-down-enter-active,
.slide-down-leave-active {
  transition: transform 0.3s ease-out;
}

.slide-down-enter-from {
  transform: translateY(-100%);
}

.slide-down-leave-to {
  transform: translateY(-100%);
}
</style>