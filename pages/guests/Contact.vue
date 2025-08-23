<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Plus, Pencil, Calendar, ChevronRight, LogOut, FileText } from 'lucide-vue-next'
import JoinGroup from '~/components/JoinGroup.vue'
const router = useRouter()

const showJoinModal = ref(false)
const guestId = ref(null)
const groupId = ref(null)
const trips = ref([])
const unitName = ref('') // NEW: rental unit name
const bookingDateRange = ref('') // NEW: formatted booking date
const { $supabase } = useNuxtApp()

const goBack = () => {
    router.back()
}

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
const bookingInfo = ref({
    unitName: '',
    dateRange: ''
})

onMounted(async () => {
    const role = localStorage.getItem('user_role')
    const id = localStorage.getItem('user_id')
    guestId.value = parseInt(id)

    if (role !== 'guest') {
        router.push('/')
        return
    }

    // STEP 1: Get the latest booking
    const { data: bookingData, error: bookingError } = await $supabase
        .from('booking')
        .select('startDate, endDate, unit_ID')
        .eq('guest_ID', guestId.value)
        .order('startDate', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (bookingError) {
        console.error('Error fetching booking:', bookingError.message)
        return
    }

    if (!bookingData) {
        console.warn('No booking data found')
        return
    }

    // STEP 2: Get rentalunit name from rentalunit table
    let unitName = 'Unknown Unit'
    if (bookingData.unit_ID) {
        const { data: unitData, error: unitError } = await $supabase
            .from('rentalunit')
            .select('name')
            .eq('unit_ID', bookingData.unit_ID)
            .maybeSingle()

        if (unitError) {
            console.error('Error fetching unit name:', unitError.message)
        } else {
            unitName = unitData?.name || unitName
        }
    }

    // STEP 3: Save booking info to display
    bookingInfo.value = {
        unitName,
        dateRange: formatDateRange(bookingData.startDate, bookingData.endDate)
    }

    console.log('bookingData', bookingData)

    const { data: itineraryData, error: itineraryError } = await $supabase
        .from('itinerary')
        .select('itinerary_ID, name, date') // include ID
        .eq('guest_ID', guestId.value)
        .order('date', { ascending: true })

    if (!itineraryError) {
        trips.value = itineraryData.map((trip) => ({
            itinerary_ID: trip.itinerary_ID, // store ID
            name: trip.name,
            date: new Date(trip.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        }))
    }

})

</script>

<template>
    <div v-if="authUser?.role === 'guest'">
        <!-- guest-only content -->
    </div>

    <div class="min-h-screen bg-gray-50">
        <div class="max-w-7xl mx-auto px-4 py-8">
            <!-- Header -->

            <div class="flex items-center mb-3">
                <button @click="goBack">
                    <ArrowLeft class="text-black w-7 h-7 mr-3" />
                </button>
                <h1 class="text-2xl font-bold text-[#6c7ac1]">Contact Information</h1>
            </div>
            <p class="text-gray-500 mb-8">Need help? Get in touch with us anytime.</p>


            <div class="grid grid-cols-2 lg:grid-cols-6 gap-6 items-start">
                <!-- Left Side -->
                <div class="col-span-2 lg:col-span-3 bg-white p-6 rounded-xl border border-gray-300 space-y-4">
                    <h2 class="text-xl font-bold text-[#6c7ac1]">Cozy Homestay Contact Information</h2>
                    <div class="text-gray-700 space-y-2">
                        <p><span class="font-semibold">Location:</span><br />Samson’s Cosy Hut - Near Siquijor Port</p>
                        <p><span class="font-semibold">Jessa Samson’s Phone Number:</span><br />0915 581 9953</p>
                        <p><span class="font-semibold">Kyle Lao’s Phone Number:</span><br />0936 871 0271</p>
                        <p><span class="font-semibold">Email Address:</span><br />samsonscozyhut@gmail.com</p>
                    </div>
                </div>

                <!-- Right Side -->
                <div class="col-span-2 lg:col-span-3 bg-white p-6 rounded-xl border border-gray-300 space-y-4">
                    <h2 class="text-xl font-bold text-[#6c7ac1]">Siquijor Emergency Contacts</h2>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Select a Location</label>
                    <select class="w-full border border-gray-300 px-4 py-2 rounded text-gray-700">
                        <option disabled selected value="">Select a municipality</option>
                        <option>Enrique</option>
                        <option>Villanueva</option>
                        <option>Larena</option>
                        <option>Lazi</option>
                        <option>Maria</option>
                        <option>San Juan</option>
                        <option>Siquijor</option>
                    </select>

                </div>
            </div>
        </div>
    </div>

    <!-- Modal -->
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
