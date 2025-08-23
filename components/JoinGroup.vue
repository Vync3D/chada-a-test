<script setup>
import { ref, onMounted } from 'vue'
import { X, Users, Calendar, ChevronRight } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import MessageModal from '@/components/MessageModal.vue'

const emit = defineEmits(['close'])
const supabase = useNuxtApp().$supabase
const router = useRouter()

const groupCodeInput = ref('')
const guestId = ref(null)
const joinedGroups = ref([])
const showModal = ref(false)
const modalTitle = ref('')
const modalMessage = ref('')
const modalType = ref('info')
let confirmAction = null

function openModal({ type = 'info', title = '', message = '', onConfirm = null }) {
    modalType.value = type
    modalTitle.value = title
    modalMessage.value = message
    confirmAction = onConfirm
    showModal.value = true
}

function confirmModal() {
    if (confirmAction) confirmAction()
    showModal.value = false
}

const submitGroupCode = async () => {
    // ... (rest of the function is unchanged) ...
    if (!groupCodeInput.value) {
        openModal({
            type: 'info',
            title: 'Missing Code',
            message: 'Please enter a group code before submitting.'
        })
        return
    }

    const { data: group, error: groupError } = await supabase
        .from('group')
        .select('group_ID, guest_ID')
        .eq('groupcode', groupCodeInput.value)
        .maybeSingle()

    if (groupError || !group) {
        openModal({
            type: 'info',
            title: 'Invalid Code',
            message: 'No group found with this code.'
        })
        return
    }

    // Check if the user is the owner of the group
    if (group.guest_ID === guestId.value) {
        openModal({
            type: 'info',
            title: 'Group Owner',
            message: 'You are the owner of this group.'
        })
        return
    }

    // Check if request already exists
    const { data: existingRequest } = await supabase
        .from('grouprequest')
        .select('grequest_ID, status')
        .eq('group_ID', group.group_ID)
        .eq('guest_ID', guestId.value)
        .maybeSingle()

    if (existingRequest) {
        if (existingRequest.status === 'kicked') {
            // Re-request by changing status back to pending
            const { error: updateError } = await supabase
                .from('grouprequest')
                .update({ status: 'pending' })
                .eq('grequest_ID', existingRequest.grequest_ID)

            if (updateError) {
                openModal({
                    type: 'info',
                    title: 'Failed',
                    message: 'Could not resend your request.'
                })
            } else {
                openModal({
                    type: 'success',
                    title: 'Request Resent',
                    message: 'Your request has been sent again.'
                })
                await fetchJoinedGroups()
            }
            return
        }

        const statusMessage = existingRequest.status === 'pending'
            ? 'You have already sent a request to this group.'
            : 'You have already joined this group.'

        openModal({
            type: 'info',
            title: 'Already Handled',
            message: statusMessage
        })
        return
    }

    // Get full name of guest sending the request
    const { data: guestProfile, error: guestError } = await supabase
        .from('guest')
        .select('firstName, lastName')
        .eq('guest_ID', guestId.value)
        .maybeSingle()

    if (guestError || !guestProfile) {
        openModal({
            type: 'info',
            title: 'Error',
            message: 'Could not fetch your guest profile'
        })
        return
    }

    // Create the request in grouprequest
    const { error: requestError } = await supabase
        .from('grouprequest')
        .insert({
            group_ID: group.group_ID,
            guest_ID: guestId.value,
            status: 'pending'
        })

    if (requestError) {
        openModal({
            type: 'info',
            title: 'Request Failed',
            message: 'There was a problem sending your request.'
        })

    } else {
        openModal({
            type: 'success',
            title: 'Request Sent',
            message: `Your request was sent to the trip owner successfully.`
        })
        // Refresh the list of joined groups
        await fetchJoinedGroups();
    }
}

const fetchJoinedGroups = async () => {
    if (!guestId.value) return;

    const { data, error } = await supabase
        .from('grouprequest')
        .select(`
            status,
            group:group_ID (
                groupcode,
                itinerary (
                    itinerary_ID,
                    name,
                    date
                )
            )
        `)
        .eq('guest_ID', guestId.value)
        .order('grequest_ID', { ascending: true })

    if (error) {
        console.error('Error fetching joined groups:', error);
        return;
    }

    // Process the fetched data
    joinedGroups.value = data
        .filter(r => r.group?.itinerary && r.group.itinerary.length > 0) // Ensure itinerary array exists and has data
        .map(r => {
            const itinerary = r.group.itinerary[0]; // Get the first itinerary item
            return {
                itinerary_ID: itinerary.itinerary_ID,
                name: itinerary.name || 'Unnamed Trip',
                date: new Date(itinerary.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                }),
                status: r.status
            };
        });
}

onMounted(async () => {
    const storedGuestId = localStorage.getItem('user_id')
    if (!storedGuestId) {
        router.push('/')
        return
    }

    guestId.value = parseInt(storedGuestId)
    await fetchJoinedGroups();
})

const isOwner = computed(() => {
    return groupCodeInput.value && lastCheckedGroup?.guest_ID === guestId.value;
});

const lastCheckedGroup = ref(null);
</script>

<template>
    <div class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
        <div class="bg-white w-full max-w-xl rounded-2xl shadow-xl p-8 relative border border-[#6c7ac1]/20">
            <button @click="emit('close')" class="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition">
                <X class="w-6 h-6" />
            </button>

            <h2 class=" text-3xl font-bold text-center text-[#6c7ac1] mb-6">Join a group</h2>

            <div class="bg-gray-50 p-6 rounded-xl mb-8 text-center border border-dashed border-[#6c7ac1]/20">
                <Users class="w-10 h-10 text-[#6c7ac1] mx-auto mb-3" />
                <h3 class="text-xl font-bold text-[#6c7ac1]">Become a trip collaborator</h3>
                <p class="text-gray-500 mt-2 mb-4">Input Trip Code</p>

                <div class="flex items-center justify-center gap-2">
                    <input v-model="groupCodeInput" type="text" inputmode="numeric" maxlength="4"
                        placeholder="Enter code" @input="groupCodeInput = groupCodeInput.replace(/\D/g, '').slice(0, 4)"
                        class="w-1/2 px-4 py-2 border border-gray-300 rounded-md focus:ring-[#6c7ac1] focus:border-[#6c7ac1]" />
                    <button :disabled="isOwner" @click="submitGroupCode"
                        class="bg-black text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800 transition disabled:opacity-50">
                        Submit
                    </button>
                </div>


                <p class=" text-gray-500 mt-4 max-w-md mx-auto">
                    Ask your friend for their group code to join them! Just input the code and you’ll be able to view or
                    follow their travel plans.
                </p>
            </div>

            <div class="mt-6">
                <p class="font-bold mb-4">Join Requests</p>
                <div class="space-y-4">
                    <div v-for="trip in joinedGroups" :key="trip.itinerary_ID" class="relative">
                        <NuxtLink :to="`/guests/mytrips?id=${trip.itinerary_ID}`"
                            class="w-full text-left bg-white rounded-xl border border-[#6C7AC1]/40 p-4 flex justify-between items-center group hover:bg-[#6c7ac1] transition">
                            <div>
                                <h1 class="text-md font-bold text-[#6c7ac1] group-hover:text-white">
                                    {{ trip.name }}
                                </h1>
                                <div class="flex items-center gap-2 mt-1 text-gray-500 group-hover:text-white">
                                    <Calendar class="w-4 h-4" />
                                    <p class="text-sm font-medium">{{ trip.date }}</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-3">
                                <span :class="[
                                    'px-3 py-2 rounded-full text-xs font-semibold',
                                    trip.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                ]">
                                    {{ trip.status === 'approved' ? 'Joined' : 'Pending' }}
                                </span>
                                <ChevronRight class="w-5 h-5 text-gray-400 group-hover:text-white" />
                            </div>
                        </NuxtLink>
                        <button v-if="trip.status === 'approved'"
                            class="absolute top-6.5 right-30 z-10 rounded-3xl bg-red-100 text-red-600 px-3 py-2 text-xs font-semibold hover:bg-red-200 transition">
                            Leave group
                        </button>
                    </div>
                    <div v-if="joinedGroups.length === 0" class=" text-gray-500 italic mt-4">
                        You have not joined any groups yet.
                    </div>
                </div>
            </div>
        </div>
        <MessageModal :show="showModal" :title="modalTitle" :message="modalMessage" :type="modalType"
            @confirm="confirmModal" @close="showModal = false" />
    </div>
</template>