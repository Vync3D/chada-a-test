<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, UserLock, Pencil, Users, Calendar, Clock3, MapPin, Check } from 'lucide-vue-next'
import EditGroup from '@/components/EditGroup.vue'

const router = useRouter()
const route = useRoute()
const goBack = () => router.back()
const supabase = useNuxtApp().$supabase
const guest_ID = ref(null)

const itineraryId = ref(null)
const groupId = ref(null)
const ownerId = ref(null) // NEW: To store the itinerary owner's ID
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
  router.push({
    path: '/guests/edittripdetails',
    query: {
      id: selectedItem.value.item_ID,
      itineraryId: selectedItem.value.itinerary_ID
    }
  })
}

// function handleSave() {
//   openModal({
//     type: 'success',
//     title: 'Saved!',
//     message: 'Your itinerary changes have been successfully saved.'
//   })
// }

// NEW: Function to fetch the owner's name
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
    ownerId.value = data.guest_ID // NEW: Set the owner's ID
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
    .neq('guest_ID', ownerId.value) // THIS IS THE KEY CHANGE

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


onMounted(async () => {
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
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 animate-fadeIn">
    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="flex items-center mb-6 animate-slideIn">
        <button @click="goBack">
          <ArrowLeft class="text-black w-7 h-7 mr-3" />
        </button>
        <h1 class="ml-4 text-2xl font-bold text-[#6c7ac1]">My trips</h1>
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
                class="flex items-center bg-[#6c7ac1] text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-[#5b6cb3]">
                <Users class="mr-2 w-4 h-4" />
                Edit group
              </button>
            </div>


            <MessageModal :show="showModal" :title="modalTitle" :message="modalMessage" :type="modalType"
              @close="showModal = false" />

            <div class="mb-4 pt-5">
              <div v-if="hasPendingRequests && !dismissedPending"
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
                <!-- <button class="text-[#6c7ac1] font-medium hover:underline" @click="clearAllItinerary">
                Clear All
              </button> -->
                <NuxtLink :to="`/guests/addtripdetails?itineraryId=${itineraryId}`"
                  class="bg-[#6c7ac1] text-white px-5 py-3 rounded-lg font-semibold hover:bg-[#5b6cb3]">
                  + Add Itinerary Item
                </NuxtLink>
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
                    <button @click="goToEditPage" :disabled="!selectedItem" class="flex items-center px-10 py-3 rounded-full border font-medium transition
              disabled:opacity-50 disabled:cursor-not-allowed disabled:border-gray-300">
                      <Pencil class="mr-2 w-4 h-5" />
                      Edit
                    </button>

                    <div v-if="!selectedItem"
                      class="w-full absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-xs px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                      Select an itinerary item first to edit.
                    </div>
                  </div>

                  <!-- <button @click="handleSave"
                  class="flex items-center px-10 py-3 rounded-full bg-black text-white font-medium hover:bg-gray-800">
                  <Check class="mr-2 w-4 h-5" />
                  Save
                </button> -->
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