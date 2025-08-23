<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { User, X, Users, Check } from 'lucide-vue-next'
import MessageModal from '@/components/MessageModal.vue'

const supabase = useNuxtApp().$supabase
const router = useRouter()

const guest_ID = ref(null)
const groupCode = ref('')
const approvedMembers = ref([])
const pendingRequests = ref([])
const error = ref('')
const group_ID = ref(null)
const showModal = ref(false)
const modalType = ref('info')
const modalTitle = ref('')
const modalMessage = ref('')
let confirmAction = null

const props = defineProps({
  itineraryId: Number
})

const emit = defineEmits(['close', 'refresh'])

// --- Modal Functions ---
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

// --- Supabase Utility Functions ---
async function generateUniqueCode() {
  let code;
  let exists = true;
  while (exists) {
    code = Math.floor(1000 + Math.random() * 9000).toString();
    const { data } = await supabase
      .from('group')
      .select('group_ID')
      .eq('groupcode', code)
      .maybeSingle(); // Use maybeSingle to prevent an error on no results
    exists = !!data;
  }
  return code;
}

const groupCreatorId = ref(null)

// --- Main Data Fetching and Logic ---
const fetchGroupData = async () => {
  if (!props.itineraryId) {
    error.value = 'Invalid itinerary ID.'
    return
  }

  try {
    const userId = localStorage.getItem('user_id')
    if (!userId) {
      router.push('/')
      return
    }
    guest_ID.value = parseInt(userId)

    const { data: itineraryData, error: itineraryError } = await supabase
      .from('itinerary')
      .select(`
  itinerary_ID,
  group_ID,
  group (
    group_ID,
    groupcode,
    guest_ID
  )
`)
      .eq('itinerary_ID', props.itineraryId)
      .maybeSingle()

    if (itineraryError) {
      console.error('Failed to fetch itinerary:', itineraryError)
      error.value = 'Could not fetch group details.'
      return
    }

    if (!itineraryData) {
      error.value = 'Itinerary not found.'
      return;
    }

    // Assign group_ID and groupCode directly
    groupCreatorId.value = itineraryData.group?.guest_ID
    group_ID.value = itineraryData.group_ID
    groupCode.value = itineraryData.group?.groupcode || ''

    // If no group exists for this itinerary, create one
    if (!group_ID.value) {
      await createNewGroupAndLink()
      return
    }

    // Fetch members and requests if a group exists
    await fetchMembersAndRequests()

  } catch (err) {
    console.error('Unexpected error:', err)
    error.value = 'Unexpected error occurred.'
  }
}

const createNewGroupAndLink = async () => {
  const newGroupCode = await generateUniqueCode()

  const { data: groupData, error: groupError } = await supabase
    .from('group')
    .insert({
      groupcode: newGroupCode,
      guest_ID: guest_ID.value
    })
    .select('group_ID, groupcode')
    .single()

  if (groupError || !groupData) {
    console.error('Failed to create group:', groupError)
    error.value = 'Failed to create a new group.'
    return
  }

  group_ID.value = groupData.group_ID
  groupCode.value = groupData.groupcode

  const { error: updateError } = await supabase
    .from('itinerary')
    .update({ group_ID: group_ID.value })
    .eq('itinerary_ID', props.itineraryId)

  if (updateError) {
    console.error('Failed to update itinerary with group_ID:', updateError)
    error.value = 'Could not link group to itinerary.'
    return
  }

  const { error: insertError } = await supabase
    .from('grouprequest')
    .insert({
      group_ID: group_ID.value,
      guest_ID: guest_ID.value,
      status: 'approved'
    })

  if (insertError) {
    console.error('Failed to add guest to grouprequest:', insertError)
    error.value = 'Could not add you to the group.'
    return
  }

  // After creation and linking, re-fetch everything
  await fetchGroupData()
}

const fetchMembersAndRequests = async () => {
  // Fetch approved members
  const { data: approvedMembersData, error: approvedMembersError } = await supabase
    .from('grouprequest')
    .select(`
            grequest_ID,
            guest_ID,
            guest:guest_ID ( firstName, lastName )
        `)
    .eq('group_ID', group_ID.value)
    .eq('status', 'approved')

  if (approvedMembersError) {
    console.error('Failed to fetch approved group members:', approvedMembersError)
  } else {
    approvedMembers.value = approvedMembersData.map(r => ({
      ...r,
      fullname: `${r.guest.firstName} ${r.guest.lastName}`,
    }))
  }

  // Fetch pending requests
  const { data: pendingRequestsData, error: pendingRequestsError } = await supabase
    .from('grouprequest')
    .select(`
            grequest_ID,
            guest_ID,
            guest:guest_ID ( firstName, lastName )
        `)
    .eq('group_ID', group_ID.value)
    .eq('status', 'pending')

  if (pendingRequestsError) {
    console.error('Failed to fetch pending requests:', pendingRequestsError)
  } else {
    pendingRequests.value = pendingRequestsData.map(r => ({
      ...r,
      fullname: `${r.guest.firstName} ${r.guest.lastName}`,
    }))
  }
}


// --- Actions ---
const approveRequest = async (grequest_ID) => {
  const { error: updateError } = await supabase
    .from('grouprequest')
    .update({ status: 'approved' })
    .eq('grequest_ID', grequest_ID)

  if (updateError) {
    openModal({ type: 'error', title: 'Failed', message: 'Could not approve the request.' })
  } else {
    openModal({ type: 'success', title: 'Approved', message: 'The request has been approved and the member added.' })
    fetchGroupData()
  }
}

const rejectRequest = async (grequest_ID) => {
  const { error: deleteError } = await supabase
    .from('grouprequest')
    .delete()
    .eq('grequest_ID', grequest_ID)

  if (deleteError) {
    openModal({ type: 'error', title: 'Failed', message: 'Could not reject the request.' })
  } else {
    openModal({ type: 'success', title: 'Rejected', message: 'The request has been rejected.' })
    fetchGroupData()
  }
}

const removeMember = async (memberGuestId) => {
  if (memberGuestId === groupCreatorId.value) {
    openModal({
      type: 'info',
      title: 'Not Allowed',
      message: 'The group owner cannot be removed from the group.'
    })
    return
  }

  const { error: updateError } = await supabase
    .from('grouprequest')
    .update({ status: 'kicked' })
    .eq('guest_ID', memberGuestId)
    .eq('group_ID', group_ID.value)

  if (updateError) {
    openModal({ type: 'error', title: 'Failed', message: 'Could not remove member.' })
  } else {
    openModal({ type: 'success', title: 'Removed', message: 'The member has been removed from the group.' })
    fetchGroupData()
  }
}

const generateNewGroupCode = async () => {
  // This is now just a user-facing wrapper for creating a new group
  if (group_ID.value) {
    openModal({
      type: 'info',
      title: 'Group Code Already Exists',
      message: `This trip already has a group code (${groupCode.value}). It cannot be changed once set.`
    })
    return
  }

  await createNewGroupAndLink();
  if (!error.value) {
    openModal({
      type: 'success',
      title: 'Code Generated!',
      message: `A new group code has been created: ${groupCode.value}`
    })
  }
}

// --- Lifecycle and Watchers ---
watch(() => props.itineraryId, (newId) => {
  if (newId) {
    fetchGroupData()
  }
}, { immediate: true })
</script>

<template>
  <div class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
    <div class="bg-white w-full max-w-2xl rounded-2xl shadow-xl p-8 relative border border-[#6c7ac1]/20">
      <button @click="$emit('close')" class="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition">
        <X class="w-6 h-6" />
      </button>

      <h2 class="text-3xl font-bold text-center text-[#6c7ac1] mb-6">Edit Group</h2>

      <!-- Group Code Section -->
      <div class="bg-[#f9fafb] p-6 rounded-xl shadow-sm mb-8 border border-dashed border-[#6c7ac1]/20 text-center">
        <Users class="w-12 h-12 text-[#6c7ac1] mx-auto mb-3" />
        <h3 class="text-xl font-bold  text-[#6c7ac1]">Invite Collaborators</h3>
        <p class="  text-gray-500">Trip Code</p>
        <div class="flex items-center justify-center gap-3 mt-1">
          <div
            class="bg-[#edf0fc] px-5 py-3 rounded-full text-lg font-semibold tracking-wider text-[#6c7ac1] border border-[#6c7ac1]/10">
            {{ error ? error : (groupCode ? groupCode : 'No group code yet') }}
          </div>
          <button @click="generateNewGroupCode" :disabled="groupCode"
            class="text-sm px-4 py-2 rounded-full transition font-medium"
            :class="groupCode ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#6c7ac1] text-white hover:bg-[#5a68b0]'">
            Generate Code
          </button>
        </div>

        <p class="  text-gray-500 mt-4 max-w-sm mx-auto">
          Share this code to invite others. They’ll be able to edit or delete the trip. You can remove them anytime.
        </p>
      </div>

      <!-- Members Section -->
      <div class="grid gap-8">
        <!-- Approved Members -->
        <div>
          <h4 class="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-4">
            Approved Members ({{ approvedMembers.length }})
          </h4>
          <div v-if="approvedMembers.length" class="space-y-3">
            <div v-for="member in approvedMembers" :key="member.guest_ID"
              class="flex items-center justify-between bg-white border border-gray-300 rounded-lg p-2 transition">
              <div class="flex items-center p-2 gap-3">
                <User class="text-[#6c7ac1]" />
                <span class="font-bold text-gray-800">{{ member.fullname }}</span>
              </div>
              <button v-if="member.guest_ID !== groupCreatorId" @click="openModal({
                type: 'warning',
                title: 'Remove Member',
                message: `Are you sure you want to remove ${member.fullname}?`,
                onConfirm: () => removeMember(member.guest_ID)
              })" class="flex items-center gap-1 font-semibold text-red-500 hover:bg-red-50 px-4 py-2 rounded-full transition">
                <X class="w-4 h-4" /> Remove
              </button>
              <span v-else class="text-sm text-gray-400 italic pr-3">Group Owner</span>
            </div>
          </div>
          <p v-else class="  text-gray-400">No approved members yet.</p>
        </div>

        <!-- Pending Requests -->
        <div>
          <h4 class="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-4">
            Pending Requests ({{ pendingRequests.length }})
          </h4>
          <div v-if="pendingRequests.length" class="space-y-3">
            <div v-for="request in pendingRequests" :key="request.grequest_ID"
              class="flex items-center justify-between bg-white border border-gray-300 rounded-lg p-4">
              <div class="flex items-center gap-2">
                <User class="text-[#6c7ac1]" />
                <span class="font-bold text-gray-800">{{ request.fullname }}</span>
              </div>
              <div class="flex gap-2">
                <button @click="openModal({
                  type: 'info',
                  title: 'Approve Request?',
                  message: `${request.fullname} will be added to your group with full access. They will be able to edit this trip. You can always remove them later if needed.`,
                  onConfirm: () => approveRequest(request.grequest_ID)
                })"
                  class="flex items-center gap-1 bg-green-100 text-green-700 hover:bg-green-200 px-4 py-1.5 rounded-full   font-medium transition">
                  <Check class="w-4 h-4" /> Approve
                </button>
                <button @click="openModal({
                  type: 'info',
                  title: 'Reject Request',
                  message: `Are you sure you want to reject ${request.fullname}'s request to join the group? This action cannot be undone.`,
                  onConfirm: () => rejectRequest(request.grequest_ID)
                })"
                  class="flex items-center gap-1 bg-red-100 text-red-700 hover:bg-red-200 px-4 py-1.5 rounded-full   font-medium transition">
                  <X class="w-4 h-4" /> Reject
                </button>
              </div>
            </div>
          </div>
          <p v-else class="  text-gray-400">No pending join requests.</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Confirmation Modal -->
  <MessageModal :show="showModal" :title="modalTitle" :message="modalMessage" :type="modalType" @confirm="confirmModal"
    @close="showModal = false" />
</template>
