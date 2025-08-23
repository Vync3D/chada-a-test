<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, Plus, Pencil, Check, Trash2, ChevronDown } from 'lucide-vue-next'

const { $supabase } = useNuxtApp()
const route = useRoute()
// Define emits for two events:
// 1. 'changeView' to signal the parent to go back to the table view.
// 2. 'bookingUpdated' to pass the updated booking data back to the parent.
const emit = defineEmits(['changeView', 'bookingUpdated'])

const props = defineProps({
    booking: Object
})

const localBooking = ref({ ...props.booking })
const originalBooking = ref({ ...props.booking }) // Store original data for cancel functionality
const isEditing = ref(false)
const isLoading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

// New refs for dropdowns
const availableUnits = ref([])
const isLoadingUnits = ref(false)
const availableGuests = ref([])
const isLoadingGuests = ref(false)

// More robust bookingId handling
const bookingId = computed(() => {
    // First try to get from route params
    let id = route.params.id

    // If route param exists and is valid, use it
    if (id && !isNaN(Number(id))) {
        return Number(id)
    }

    // Otherwise try to get from props
    if (props.booking?.booking_ID && !isNaN(Number(props.booking.booking_ID))) {
        return Number(props.booking.booking_ID)
    }

    // If we have booking data, try to extract ID from it
    if (localBooking.value?.booking_ID) {
        const extractedId = Number(localBooking.value.booking_ID)
        if (!isNaN(extractedId)) {
            return extractedId
        }
    }

    console.error('Cannot determine valid booking ID from:', {
        routeParam: route.params.id,
        propsBookingId: props.booking?.booking_ID,
        localBookingId: localBooking.value?.booking_ID
    })

    return null
})

watch(
    () => props.booking,
    (newBooking) => {
        if (newBooking) {
            localBooking.value = { ...newBooking }
            originalBooking.value = { ...newBooking } // Store original for cancel
            fetchGuestAndUnitDetails()
        }
    },
    { immediate: true }
)

// Fetch available rental units
async function fetchAvailableUnits() {
    isLoadingUnits.value = true
    try {
        const { data: units, error } = await $supabase
            .from('rentalunit')
            .select('unit_ID, name, type')
            .order('name')

        if (error) {
            console.error('Error fetching units:', error)
        } else {
            availableUnits.value = units || []
        }
    } catch (error) {
        console.error('Error fetching units:', error)
    } finally {
        isLoadingUnits.value = false
    }
}

// Fetch available guests
async function fetchAvailableGuests() {
    isLoadingGuests.value = true
    try {
        const { data: guests, error } = await $supabase
            .from('guest')
            .select('guest_ID, firstName, lastName')
            .order('lastName')

        if (error) {
            console.error('Error fetching guests:', error)
        } else {
            availableGuests.value = guests.map(guest => ({
                ...guest,
                fullName: `${guest.firstName} ${guest.lastName}`
            })) || []
        }
    } catch (error) {
        console.error('Error fetching guests:', error)
    } finally {
        isLoadingGuests.value = false
    }
}

async function fetchGuestAndUnitDetails() {
    if (!localBooking.value.guest_ID || !localBooking.value.unit_ID) return

    // Fetch guest full name
    const { data: guest, error: guestError } = await $supabase
        .from('guest')
        .select('firstName, lastName')
        .eq('guest_ID', localBooking.value.guest_ID)
        .single()

    if (guest && !guestError) {
        localBooking.value.fullName = `${guest.firstName} ${guest.lastName}`
        originalBooking.value.fullName = `${guest.firstName} ${guest.lastName}`
    }

    // Fetch unit name
    const { data: unit, error: unitError } = await $supabase
        .from('rentalunit')
        .select('name')
        .eq('unit_ID', localBooking.value.unit_ID)
        .single()

    if (unit && !unitError) {
        localBooking.value.unitName = unit.name
        originalBooking.value.unitName = unit.name
    }
}

const enableEdit = () => {
    isEditing.value = true
    fetchAvailableUnits() // Load units when entering edit mode
    fetchAvailableGuests() // Load guests when entering edit mode
    successMessage.value = ''
    errorMessage.value = ''
}

const cancelEdit = () => {
    isEditing.value = false
    // Reset data to original values
    localBooking.value = { ...originalBooking.value }
    successMessage.value = ''
    errorMessage.value = ''
}

const clearAllFields = () => {
    // Clear all editable fields
    localBooking.value = {
        ...localBooking.value,
        booking_ID: '',
        unitName: '',
        unit_ID: '',
        fullName: '',
        guest_ID: '',
        startDate: '',
        endDate: ''
    }
}

// Handle unit selection change
const handleUnitChange = (event) => {
    const selectedUnitId = event.target.value
    const selectedUnit = availableUnits.value.find(unit => unit.unit_ID == selectedUnitId)

    if (selectedUnit) {
        localBooking.value.unit_ID = selectedUnit.unit_ID
        localBooking.value.unitName = selectedUnit.name
    }
}

// Handle guest selection change
const handleGuestChange = (event) => {
    const selectedGuestId = event.target.value
    const selectedGuest = availableGuests.value.find(guest => guest.guest_ID == selectedGuestId)

    if (selectedGuest) {
        localBooking.value.guest_ID = selectedGuest.guest_ID
        localBooking.value.fullName = selectedGuest.fullName
    }
}

const saveBooking = async () => {
    // Clear any previous messages
    successMessage.value = ''
    errorMessage.value = ''

    // Basic validation
    if (!localBooking.value.startDate || !localBooking.value.endDate || !localBooking.value.guest_ID || !localBooking.value.unit_ID) {
        errorMessage.value = 'Please fill in all required fields.'
        return
    }

    // Validate dates
    const startDate = new Date(localBooking.value.startDate)
    const endDate = new Date(localBooking.value.endDate)

    if (startDate >= endDate) {
        errorMessage.value = 'Check-out date must be after check-in date.'
        return
    }

    // Handle bookingId - make sure it's a valid number
    const validBookingId = bookingId.value && !isNaN(bookingId.value) ? Number(bookingId.value) : null
    if (!validBookingId) {
        errorMessage.value = 'Invalid booking ID. Cannot update booking.'
        console.error('Invalid bookingId:', bookingId.value)
        return
    }

    isLoading.value = true

    try {
        const updateData = {
            guest_ID: localBooking.value.guest_ID,
            unit_ID: localBooking.value.unit_ID,
            startDate: localBooking.value.startDate,
            endDate: localBooking.value.endDate
        }

        console.log('Updating booking with ID:', validBookingId)
        console.log('Update data:', updateData)

        const { data, error } = await $supabase
            .from('booking')
            .update(updateData)
            .eq('booking_ID', validBookingId)
            .select()

        if (error) {
            console.error('Supabase error details:', error)
            errorMessage.value = `Failed to update booking: ${error.message}`
        } else {
            console.log('Update successful:', data)

            isEditing.value = false
            // Update original data to new values
            originalBooking.value = { ...localBooking.value }
            successMessage.value = 'Booking updated successfully!'

            // The original issue was likely caused by this line. Removing it will prevent navigation.
            // If you wish to navigate back, you can add `emit('changeView', 'viewBookings')` here.
            // emit('bookingUpdated', data[0])

            // Automatically clear the success message after 5 seconds
            setTimeout(() => {
                successMessage.value = ''
            }, 5000)
        }
    } catch (error) {
        console.error('Error updating booking:', error)
        errorMessage.value = `An error occurred: ${error.message}`
    } finally {
        isLoading.value = false
    }
}

onMounted(() => {
    fetchGuestAndUnitDetails()
})
</script>

<template>
    <div class="flex min-h-screen bg-gray-50">
        <main class="flex-1 space-y-6">
            <div class="text-sm text-gray-500">
                <!-- Emits a 'changeView' event with 'dashboard' payload for top-level navigation -->
                <span @click="emit('changeView', 'dashboard')" class="hover:underline cursor-pointer">Dashboard</span> /
                <!-- Emits a simple 'changeView' event to tell the parent to go back to the table -->
                <span @click="emit('changeView')" class="hover:underline cursor-pointer">View Bookings</span> /
                <span class="text-[#6b79c0] font-semibold">Booking Details</span>
            </div>

            <div class="border-b border-gray-300 pb-3">
                <div class="flex items-center text-2xl font-bold text-[#6b79c0]">
                    <!-- Emits a simple 'changeView' event to tell the parent to go back to the table -->
                    <span class="hover:underline cursor-pointer">
                        <ArrowLeft @click="emit('changeView')" class="text-black w-7 h-7" />
                    </span>
                    <h2 class="pl-5">Booking Details</h2>
                </div>
                <p class="text-gray-600 mt-1">Provide booking information and access management options.</p>
            </div>

            <div class="bg-white p-6 rounded-lg shadow-sm max-w-6xl space-y-10">
                <form @submit.prevent="saveBooking" class="space-y-8">
                    <div class="space-y-5">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-gray-600 pb-2 text-sm">Booking ID <span class="text-red-500">*</span></label>
                                <input
                                    v-model="localBooking.booking_ID"
                                    type="number"
                                    disabled
                                    placeholder="Enter booking ID"
                                    class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none duration-300 bg-[#f8f8f8]"
                                />
                            </div>
                            <div>
                                <label class="block text-gray-600 pb-2 text-sm">Rental Unit <span class="text-red-500">*</span></label>
                                <div v-if="isEditing" class="relative">
                                    <select
                                        :value="localBooking.unit_ID"
                                        @change="handleUnitChange"
                                        :disabled="isLoadingUnits"
                                        class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#6b79c0] bg-white appearance-none pr-10"
                                    >
                                        <option value="">Select a rental unit</option>
                                        <option
                                            v-for="unit in availableUnits"
                                            :key="unit.unit_ID"
                                            :value="unit.unit_ID"
                                        >
                                            {{ unit.name }} ({{ unit.type }})
                                        </option>
                                    </select>
                                    <ChevronDown class="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    <div v-if="isLoadingUnits" class="absolute right-8 top-1/2 transform -translate-y-1/2">
                                        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-[#6b79c0]"></div>
                                    </div>
                                </div>
                                <input
                                    v-else
                                    v-model="localBooking.unitName"
                                    type="text"
                                    disabled
                                    placeholder="Rental unit name"
                                    class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none duration-300 bg-[#f8f8f8]"
                                />
                            </div>
                        </div>

                        <div>
                            <label class="block text-gray-600 pb-2 text-sm">Guest Name <span class="text-red-500">*</span></label>
                            <div v-if="isEditing" class="relative">
                                    <select
                                        :value="localBooking.guest_ID"
                                        @change="handleGuestChange"
                                        :disabled="isLoadingGuests"
                                        class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#6b79c0] bg-white appearance-none pr-10"
                                    >
                                        <option value="">Select a guest</option>
                                        <option
                                            v-for="guest in availableGuests"
                                            :key="guest.guest_ID"
                                            :value="guest.guest_ID"
                                        >
                                            {{ guest.fullName }}
                                        </option>
                                    </select>
                                    <ChevronDown class="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    <div v-if="isLoadingGuests" class="absolute right-8 top-1/2 transform -translate-y-1/2">
                                        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-[#6b79c0]"></div>
                                    </div>
                            </div>
                            <input
                                v-else
                                v-model="localBooking.fullName"
                                type="text"
                                disabled
                                placeholder="Guest full name"
                                class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none duration-300 bg-[#f8f8f8]"
                            />
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-gray-600 pb-2 text-sm">Check-in Date <span class="text-red-500">*</span></label>
                                <input
                                    type="date"
                                    v-model="localBooking.startDate"
                                    :disabled="!isEditing"
                                    :class="[
                                        'w-full border border-gray-300 rounded px-3 py-2 focus:outline-none duration-300',
                                        isEditing ? 'bg-white focus:border-[#6b79c0]' : 'bg-[#f8f8f8]'
                                    ]"
                                />
                            </div>
                            <div>
                                <label class="block text-gray-600 pb-2 text-sm">Check-out Date <span class="text-red-500">*</span></label>
                                <input
                                    type="date"
                                    v-model="localBooking.endDate"
                                    :disabled="!isEditing"
                                    :class="[
                                        'w-full border border-gray-300 rounded px-3 py-2 focus:outline-none duration-300',
                                        isEditing ? 'bg-white focus:border-[#6b79c0]' : 'bg-[#f8f8f8]'
                                    ]"
                                />
                            </div>
                        </div>
                    </div>

                    <div v-if="successMessage || errorMessage" class="pt-4">
                        <div v-if="successMessage" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                            <span class="block sm:inline">{{ successMessage }}</span>
                        </div>
                        <div v-if="errorMessage" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                            <span class="block sm:inline">{{ errorMessage }}</span>
                        </div>
                    </div>

                    <div class="flex justify-end gap-2 pt-4">
                        <button
                            type="button"
                            @click="enableEdit"
                            class="flex items-center gap-2 px-10 py-3 bg-black cursor-pointer rounded-3xl font-semibold text-white hover:bg-gray-900 transition-colors"
                            v-if="!isEditing"
                        >
                            <Pencil class="w-5 h-5" />Edit
                        </button>

                        <button
                            type="button"
                            @click="clearAllFields"
                            class="flex items-center gap-2 px-10 py-3 bg-yellow-600 cursor-pointer rounded-3xl font-semibold text-white hover:bg-yellow-700 transition-colors"
                            v-if="isEditing"
                        >
                            <Trash2 class="w-5 h-5" />Clear
                        </button>

                        <button
                            type="button"
                            @click="cancelEdit"
                            class="flex items-center gap-2 px-10 py-3 border cursor-pointer rounded-3xl font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                            v-if="isEditing"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            :disabled="isLoading"
                            class="flex items-center gap-2 px-10 py-3 bg-black cursor-pointer font-semibold text-white rounded-3xl hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            v-if="isEditing"
                        >
                            <Check class="w-5 h-5" />
                            {{ isLoading ? 'Saving...' : 'Save' }}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    </div>
</template>
