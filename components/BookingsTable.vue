<script setup>
import { Plus, Search } from 'lucide-vue-next'
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import BookingsViewForm from './BookingsViewForm.vue'

const { $supabase } = useNuxtApp()
const bookingInfo = ref([])
const selectedBooking = ref(null)

const route = useRoute()
const emit = defineEmits(['changeView'])

/**
 * Fetches all bookings and their related guest and rental unit information from Supabase.
 */
const fetchBookings = async () => {
    const { data, error } = await $supabase.from('booking').select(`
        *,
        guest (
        firstName,
        lastName
        ),
        rentalunit (
        name
        )
    `)
    if (error) {
        console.error('Error fetching bookings:', error)
    } else {
        bookingInfo.value = data
    }
}

// Initial fetch when the component is first mounted
onMounted(() => {
    fetchBookings()
})

const searchQuery = ref('')
const statusFilter = ref('all')

const filteredBooking = computed(() => {
    const query = searchQuery.value.trim().toLowerCase()

    let filtered = bookingInfo.value.filter(booking => {
        const guestName = `${booking.guest?.firstName ?? ''} ${booking.guest?.lastName ?? ''}`.toLowerCase()
        const bookingId = booking.booking_ID?.toString().toLowerCase() ?? ''
        const unitName = booking.rentalunit?.name?.toLowerCase() ?? ''

        if (!query) return true

        return (
            guestName.includes(query) ||
            bookingId.includes(query) ||
            unitName.includes(query)
        )
    })

    if (statusFilter.value !== 'all') {
        filtered = filtered.filter(booking =>
            (booking.status ?? 'Inactive') === statusFilter.value
        )
    }

    return filtered
})

/**
 * Toggles the status of a booking and updates it in the database.
 * @param {object} booking The booking object to update.
 */
const toggleStatus = async (booking) => {
    // Optimistically update the UI
    const newStatus = booking.status === 'Active' ? 'Inactive' : 'Active'
    booking.status = newStatus

    const { error } = await $supabase
        .from('booking')
        .update({ status: newStatus })
        .eq('booking_ID', booking.booking_ID)

    if (error) {
        console.error('Error updating booking status:', error)
        // Revert the UI on error
        booking.status = newStatus === 'Active' ? 'Inactive' : 'Active'
    }
}

/**
 * Sets the selected booking to a new object, which triggers the display of the form.
 * @param {object} booking The booking object to view.
 */
function viewBooking (booking) {
    selectedBooking.value = { ...booking }
}

/**
 * Clears the selected booking and re-fetches the data, which returns the view to the bookings table.
 */
async function backToTable() {
    selectedBooking.value = null
    await fetchBookings()
}

/**
 * Handles the update of a booking in the list after a successful save in the form.
 */
function handleBookingUpdated() {
    backToTable() // Return to the table view and refresh data
}
</script>

<template>
    <div>
        <main class="flex-1 p-11 space-y-6">
            <div v-if="!selectedBooking">
                <!-- Breadcrumb -->
                <div class="text-sm text-gray-500">
                    <span @click="emit('changeView', 'dashboard')" class="hover:underline cursor-pointer">Dashboard</span> /
                    <span class="text-[#6b79c0] font-semibold">View Bookings</span>
                </div>

                <!-- Header -->
                <div class="pb-3 pt-6">
                    <h2 class="text-2xl mb-1 font-bold text-[#6b79c0]">View Bookings</h2>
                    <p class="text-gray-600">Manage and review all bookings.</p>
                </div>

                <!-- 🔍 Search Bar and Filters -->
                <div
                    class="bg-white rounded-xl p-3 flex flex-col border border-gray-200 sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div class="relative w-full max-w-md">
                        <input v-model="searchQuery" type="text" placeholder="Search by Booking ID or Guest Name..."
                            class="search pl-10 pr-8 py-2 w-full border border-gray-300 bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-[#6b79c0]" />
                        <button v-if="searchQuery" @click="searchQuery = ''"
                            class="absolute right-12 top-5 text-xl -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            &times;
                        </button>
                        <Search class="absolute right-5 top-5 -translate-y-1/2 text-gray-800 w-5 h-5" />
                    </div>

                    <!-- Filters -->
                    <div class="justify-center items-center flex gap-2">
                        <select v-model="statusFilter"
                            class="filter border border-gray-300 bg-white rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-[#6b79c0]">
                            <option value="all">All Statuses</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                <!-- Table Header -->
                <div class="px-5 border-t-1 pt-4 border-gray-300 my-5 uppercase tracking-wider grid grid-cols-6 font-semibold text-sm text-gray-500">
                    <span>Booking ID</span>
                    <span>Guest</span>
                    <span>Unit</span>
                    <span>Check-in</span>
                    <span>Check-out</span>
                    <span>Status</span>
                </div>

                <div v-if="filteredBooking.length === 0"
                    class="flex flex-col items-center justify-center gap-2 py-5 text-gray-500">
                    <Search class="w-10 h-10 text-gray-300" />
                    <p class="text-center text-sm">No results found for "<span class="font-semibold text-[#6b79c0]">{{
                        searchQuery }}</span>"</p>
                </div>

                <div
                    v-for="booking in filteredBooking"
                    :key="booking.booking_ID"
                    @click="viewBooking(booking)"
                    class="group bg-white rounded-xl mb-2 border border-gray-200 hover:shadow grid px-5 grid-cols-6 items-center text-sm text-gray-700 py-4 transition duration-200 cursor-pointer"
                >
                    <span class="font-bold text-gray-900 duration-200 group-hover:text-[#6b79c0]">
                        {{ booking.booking_ID }}
                    </span>
                    <span class="font-bold text-gray-900 duration-200 group-hover:text-[#6b79c0]">
                        {{ booking.guest?.firstName }} {{ booking.guest?.lastName }}
                    </span>
                    <span class="font-bold text-gray-900 duration-200 group-hover:text-[#6b79c0]">
                        {{ booking.rentalunit?.name }}
                    </span>
                    <span>{{ booking.startDate }}</span>
                    <span>{{ booking.endDate }}</span>
                    <span>
                        <button @click.stop="toggleStatus(booking)"
                            :class="booking.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'"
                            class="px-2 py-1 rounded text-xs font-medium">
                            {{ booking.status || 'Inactive' }}
                        </button>
                    </span>

                </div>
            </div>
            <div v-else>
                <BookingsViewForm
                    :booking="selectedBooking"
                    @changeView="backToTable"
                    @bookingUpdated="handleBookingUpdated"
                />
            </div>
        </main>
    </div>
</template>
