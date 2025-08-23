<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Plus, Search } from 'lucide-vue-next'
const route = useRoute()
const emit = defineEmits(['changeView'])
const { $supabase } = useNuxtApp()

const bookingList = ref([])
const showBookingOverlay = ref(false)
const selectedBooking = ref(null)
const referrerNameInput = ref('')
const referralList = ref([])
const successMessage = ref('')
const errorMessage = ref('')

const groupedReferrals = computed(() => {
  const counts = {}
  referralList.value.forEach(ref => {
    if (!counts[ref.referrerName]) {
      counts[ref.referrerName] = 0
    }
    counts[ref.referrerName]++
  })
  return Object.entries(counts).map(([referrerName, count]) => ({
    referrerName,
    count
  }))
})

const fetchBookings = async () => {
  const { data: bookingsData, error: bookingsError } = await $supabase
    .from('booking')
    .select('booking_ID,startDate,endDate,guest(firstName, lastName)')

  if (bookingsError) {
    console.error('Error fetching bookings:', bookingsError.message)
    errorMessage.value = `Error fetching bookings: ${bookingsError.message}`
    return
  }

  const { data: referralsData, error: referralsError } = await $supabase
    .from('referral')
    .select('booking_ID')

  if (referralsError) {
    console.error('Error fetching referrals:', referralsError.message)
    errorMessage.value = `Error fetching referrals: ${referralsError.message}`
    return
  }

  const referredBookingIds = referralsData.map(ref => ref.booking_ID)

  const unreferredBookings = bookingsData.filter(booking =>
    !referredBookingIds.includes(booking.booking_ID)
  )

  bookingList.value = unreferredBookings
}

const selectBooking = (booking) => {
  selectedBooking.value = {
    id: booking.booking_ID,
    name: `${booking.guest.firstName} ${booking.guest.lastName}`
  }
  showBookingOverlay.value = false
}

const fetchReferrals = async () => {
  const { data, error } = await $supabase.from('referral').select('*')
  if (error) {
    console.error('Error fetching referrals:', error.message)
    errorMessage.value = `Error fetching referrals: ${error.message}`
  } else {
    referralList.value = data
  }
}

const formatDate = (dateStr) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' }
  return new Date(dateStr).toLocaleDateString(undefined, options)
}

const clearMessages = () => {
  successMessage.value = ''
  errorMessage.value = ''
}

const submitReferral = async (e) => {
  e.preventDefault()
  clearMessages()

  if (!referrerNameInput.value || !selectedBooking.value) {
    errorMessage.value = 'Please enter a referrer name and select a booking.'
    return
  }

  const { error: insertError } = await $supabase.from('referral').insert([
    {
      referrerName: referrerNameInput.value,
      booking_ID: selectedBooking.value.id
    }
  ])

  if (insertError) {
    console.error('Failed to save referral:', insertError)
    errorMessage.value = `Failed to save referral: ${insertError.message}`
  } else {
    successMessage.value = 'Referral saved successfully!'
    referrerNameInput.value = ''
    selectedBooking.value = null
    fetchReferrals()
    fetchBookings()
  }
}

const searchQuery = ref('')
const filteredReferrals = computed(() => {
  return groupedReferrals.value.filter(ref =>
    ref.referrerName.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

onMounted(() => {
  fetchBookings()
  fetchReferrals()
})
</script>

<template>
  <div class="flex min-h-screen bg-gray-50 font-inter">
    <main class="flex-1 p-8 space-y-6">
      <div class="text-sm text-gray-500">
        <span @click="emit('changeView', 'dashboard')" class="hover:underline">Dashboard </span> / <span
          class="text-[#6b79c0] font-semibold">Referrals</span>
      </div>

      <div class="border-b-1 border-gray-300 pb-3">
        <h2 class="text-2xl mb-1 font-bold text-[#6b79c0]">Referrals</h2>
        <p class="text-gray-600">Track the referrers and number of bookings referred.</p>
      </div>

      <div v-if="successMessage"
        class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative" role="alert">
        <span class="block sm:inline">{{ successMessage }}</span>
        <span class="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer" @click="successMessage = ''">
          <svg class="fill-current h-6 w-6 text-green-500" role="button" xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20">
            <title>Close</title>
            <path
              d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.03a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
          </svg>
        </span>
      </div>
      <div v-if="errorMessage" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative"
        role="alert">
        <span class="block sm:inline">{{ errorMessage }}</span>
        <span class="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer" @click="errorMessage = ''">
          <svg class="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20">
            <title>Close</title>
            <path
              d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.03a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
          </svg>
        </span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div class="bg-white p-6 rounded-lg border border-gray-300">
          <h3 class="text-lg font-bold mb-4">Add referral information</h3>
          <form class="space-y-4" @submit.prevent="submitReferral">
            <div>
              <label class="block text-sm font-medium py-2">Referrer Name <span class="text-red-500">*</span></label>
              <input v-model="referrerNameInput" type="text"
                class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter referrer name" />
            </div>
            <div>
              <label class="block text-sm font-medium py-2">Select Booking <span class="text-red-500">*</span></label>
              <button type="button" @click="showBookingOverlay = true"
                class="w-full border rounded px-3 py-2 text-left bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {{ selectedBooking ? selectedBooking.name + ' (ID: ' + selectedBooking.id + ')' : 'Click to select a booking' }}
              </button>
            </div>
            <div class="flex justify-end gap-2 pt-2">
              <button type="reset"
                class="px-9 py-3 border cursor-pointer rounded-3xl font-semibold text-black hover:bg-gray-100"
                @click="referrerNameInput = ''; selectedBooking = null; clearMessages()">Clear</button>
              <button type="submit"
                class="flex items-center gap-2 px-10 py-3 bg-black cursor-pointer font-semibold text-white rounded-3xl hover:bg-gray-900">
                <Plus class="w-5 h-5" />Add
              </button>
            </div>
          </form>
        </div>

        <div v-if="showBookingOverlay" class="fixed inset-0 z-50 flex items-center justify-center bg-white">
          <div class="bg-white rounded-lg shadow-lg max-h-[80vh] overflow-y-auto w-full max-w-md p-6">
            <h3 class="text-lg font-bold">Select a Booking</h3>
            <ul v-if="bookingList.length > 0">
              <li v-for="booking in bookingList" :key="booking.booking_ID" @click="selectBooking(booking)"
                class="p-2 py-4 border-b cursor-pointer hover:bg-gray-100">
                {{ booking.guest?.firstName }} {{ booking.guest?.lastName }} ({{ formatDate(booking.startDate) }} - {{
                  formatDate(booking.endDate) }})
              </li>
            </ul>
            <div v-else class="text-center text-gray-500 py-4">
              No bookings available for referral.
            </div>
            <button @click="showBookingOverlay = false"
              class="mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded">Cancel</button>
          </div>
        </div>

        <div>
          <div class="relative w-full flex justify-between items-center mb-4">
            <input type="text" v-model="searchQuery" placeholder="Search for a name"
              class="search w-full md:max-w-full border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <Search class="absolute right-5 top-5 -translate-y-1/2 text-gray-800 w-5 h-5" />

            </div>

          <div class="text-[#6b79c0] font-bold mb-2">{{ filteredReferrals.length }} Results Found</div>
          <div class="space-y-2">
            <div
              class="justify-between pr-15 mb-5 uppercase tracking-wider grid grid-cols-2 gap-4 font-semibold text-sm text-gray-500">
              <span>Referrer</span>
              <span class="text-right m-0">No. of Referrals</span>
            </div>
            <div v-if="filteredReferrals.length === 0" class="text-gray-500 text-center py-4">
              No referrals found.
            </div>

            <div v-else>
              <div v-for="referrer in filteredReferrals" :key="referrer.referrerName"
                class="bg-white p-4 mb-3 text-bold group-hover:text-[#6b79c0] rounded-lg border border-gray-200 cursor-pointer hover:shadow flex justify-between items-center">
                <span class="font-bold ">{{ referrer.referrerName }}</span>
                <span class="text-gray-700 mr-10">{{ referrer.count }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>