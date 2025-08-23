<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import Datepicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { Plus, X } from 'lucide-vue-next'
const { $supabase } = useNuxtApp()

const route = useRoute()
const emit = defineEmits(['changeView'])

const today = new Date()
today.setHours(0, 0, 0, 0)

const initialBooking = () => ({
  bookingId: '',
  rentalUnit: '',
  guestId: '',
  guestName: '',
  status: 'Inactive',
  dateRange: [new Date(today), new Date(today)],
})


const booking = ref(initialBooking())

const guests = ref([])
const showGuestOverlay = ref(false)

const fetchGuests = async () => {
  const { data, error } = await $supabase.from('guest').select('guest_ID, firstName, lastName')
  if (error) {
    console.error('Failed to load guests:', error)
  } else {
    guests.value = data
  }
}

const guestSearch = ref('')

const filteredGuests = computed(() =>
  guests.value.filter((guest) => {
    const fullName = `${guest.firstName} ${guest.lastName}`.toLowerCase()
    return fullName.includes(guestSearch.value.toLowerCase())
  })
)

const fetchNextBookingId = async () => {
  const { data, error } = await $supabase
    .from('booking')
    .select('booking_ID', { count: 'exact', head: false })
    .order('booking_ID', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Could not fetch latest booking ID:', error)
    booking.value.bookingId = Math.floor(Math.random() * 100000)
  } else {
    const latestId = data?.[0]?.booking_ID || 0
    booking.value.bookingId = latestId + 1
  }
}

const rentalUnits = ref([])

const fetchRentalUnits = async () => {
  const { data, error } = await $supabase.from('rentalunit').select('unit_ID, name')

  if (error) {
    console.error('Failed to load rental units:', error)
  } else {
    rentalUnits.value = data
  }
}

onMounted(() => {
  fetchGuests()
  fetchNextBookingId()
  fetchRentalUnits()
})

const showSuccess = ref(false)

const addBooking = async () => {
  const b = booking.value
  const [checkInDate, checkOutDate] = b.dateRange;

  if (!b.bookingId || !b.rentalUnit || !b.guestId || !checkInDate || !checkOutDate) {
    alert('Please fill-up all fields.')
    return
  }

  if (new Date(b.checkIn) >= new Date(b.checkOut)) {
    alert('Check-out date must be after check-in date.')
    return
  }

  const formattedCheckIn = checkInDate.toISOString().split('T')[0]
  const formattedCheckOut = checkOutDate.toISOString().split('T')[0]

  console.log('Adding booking:', {
    bookingId: b.bookingId,
    rentalUnit: b.rentalUnit,
    guestId: b.guestId,
    startDate: formattedCheckIn,
    endDate: formattedCheckOut,
    status: b.status,
  })

  try {
    const dataToInsert = {
      booking_ID: Number(b.bookingId),
      unit_ID: Number(b.rentalUnit),
      guest_ID: Number(b.guestId),
      startDate: formattedCheckIn,
      endDate: formattedCheckOut,
      status: b.status,
    }

    const { error } = await $supabase.from('booking').insert([dataToInsert])

    if (error) {
      console.error('Insert failed:', error)
      alert('Insert failed: ' + error.message)
    } else {
      showSuccess.value = true
      setTimeout(() => {
        showSuccess.value = false
      }, 3000)
      alert('Booking successfully added!')
      booking.value = initialBooking()
      await fetchNextBookingId()
    }
  } catch (err) {
    console.error(err)
    alert('Unexpected error occurred')
  }
}
</script>

<template>
  <div>
    <main class="flex-1 p-11 space-y-6">
      <!-- Breadcrumb -->
      <div class="text-sm text-gray-500">
        <span @click="emit('changeView', 'dashboard')" class="cursor-pointer hover:underline">Dashboard</span>
        /
        <span class="text-[#6b79c0] font-semibold">Add Booking Information</span>
      </div>

      <!-- Header -->
      <div class="border-b-1 border-gray-300 pb-3">
        <h2 class="text-2xl mb-1 font-bold text-[#6b79c0]">Add Booking Information</h2>
        <p class="text-gray-600">Provide booking information and access management options.</p>
      </div>

      <!-- Form Section -->
      <div class="bg-white p-6 rounded-lg shadow-sm max-w-6xl space-y-10">
        <transition name="fade">
          <div
            v-if="showSuccess"
            class="bg-green-100 border border-green-300 text-green-800 text-sm px-4 py-3 rounded-lg mb-6"
          >
            ✅ Booking successfully added!
          </div>
        </transition>
        <form class="space-y-8" @submit.prevent="addBooking">
          <div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Booking ID -->
              <div>
                <label class="block text-gray-600 pb-2 text-sm">
                  Booking ID <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="booking.bookingId"
                  type="number"
                  disabled
                  class="w-full border bg-[#f8f8f8] border-gray-300 rounded px-3 py-2 focus:outline-none focus:bg-white duration-300"
                />
              </div>

              <!-- Rental Unit -->
              <div>
                <label class="block text-gray-600 pb-2 text-sm">
                  Rental Unit <span class="text-red-500">*</span>
                </label>
                <select
                  v-model="booking.rentalUnit"
                  class="w-full border bg-[#f8f8f8] border-gray-300 rounded px-3 py-2 focus:outline-none focus:bg-white duration-300"
                >
                  <option disabled value="">Select a rental unit</option>
                  <option v-for="unit in rentalUnits" :key="unit.unit_ID" :value="unit.unit_ID">
                    {{ unit.name }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Guest Name + Show Guests Button -->
            <div>
              <label class="block text-gray-600 py-2 text-sm">Guest Name <span class="text-red-500">*</span></label>
              <div class="flex gap-2">
                <input v-model="booking.guestName" readonly class="w-full border bg-[#f8f8f8] border-gray-300 rounded px-3 py-2" />
                <button type="button" @click="showGuestOverlay = true" class="w-1/2 bg-black text-white px-10 py-2 rounded">Select from guests</button>
              </div>
            </div>

            <!-- Status -->
            <div> 
              <label class="block text-gray-600 py-2 text-sm">Status</label>
              <select v-model="booking.status" class="w-[300px] border bg-white border-gray-300 rounded px-3 py-2">
                <option>Inactive</option>
                <option>Active</option>
              </select>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-gray-600 py-2 text-sm">
                  Check-in & Check-out Dates <span class="text-red-500">*</span>
                </label>
                <Datepicker
                  v-model="booking.dateRange"
                  range
                  :min-date="new Date()"
                  :start-date="new Date()"
                  placeholder="Select check-in and check-out dates"
                  class="w-full"
                />
              </div>
            </div>
          </div>

          <!-- Buttons -->
          <div class="flex justify-end gap-2 pt-4">
            <button
              type="reset"
              class="px-9 py-3 border cursor-pointer rounded-3xl font-semibold text-black hover:bg-gray-100"
            >
              Clear
            </button>
            <button
              type="submit"
              class="flex items-center gap-2 px-10 py-3 bg-black cursor-pointer font-semibold text-white rounded-3xl hover:bg-gray-900"
            >
              <Plus class="w-5 h-5" />Add
            </button>
          </div>
        </form>
      </div>

      <!-- Guest Selector Overlay -->
      <div v-if="showGuestOverlay" class="fixed inset-0 bg-opacity-90 backdrop-blur-sm z-50 flex justify-center items-center">
        <div class="bg-white p-6 rounded-lg shadow-xl max-w-md w-full space-y-4">
          <div class="flex justify-between items-center mb-2">
            <h3 class="text-xl font-semibold text-[#6b79c0]">Select Guest</h3>
            <button @click="showGuestOverlay = false"><X class="w-5 h-5" /></button>
          </div>

          <input
            v-model="guestSearch"
            type="text"
            placeholder="Search guest..."
            class="w-full px-3 py-2 mb-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <ul class="divide-y max-h-60 overflow-y-auto">
            <li
              v-for="guest in filteredGuests"
              :key="guest.guest_ID"
              class="py-2 px-3 hover:bg-gray-100 cursor-pointer"
              @click="() => {
                booking.guestName = guest.firstName + ' ' + guest.lastName
                booking.guestId = guest.guest_ID
                showGuestOverlay = false
              }"
            >
              {{ guest.firstName }} {{ guest.lastName }}
            </li>
            <li v-if="filteredGuests.length === 0" class="py-2 px-3 text-gray-500 italic">
              No results found
            </li>
          </ul>
        </div>
      </div>
    </main>
  </div>
</template>