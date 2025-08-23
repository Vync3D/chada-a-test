<script setup>
import { useRoute } from 'vue-router'
import { onMounted, ref, watch, computed } from 'vue'
import {
  ClipboardCopy, Trash2, Check, Pencil, ArrowLeft
} from 'lucide-vue-next'

const props = defineProps({
  guest: {
    type: Object,
    default: null
  }
})

const route = useRoute()
// The component now emits a 'back' event to its parent component (GuestsTable)
const emit = defineEmits(['changeView', 'guestUpdated', 'back'])
const { $supabase } = useNuxtApp()

const isEditing = ref(false)
const isLoading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const guest = ref(null)

const guestId = computed(() => {
  const routeId = Number(route.params.id)
  const propId = Number(props.guest?.guest_ID)

  if (!isNaN(routeId) && routeId > 0) {
    return routeId
  }

  if (!isNaN(propId) && propId > 0) {
    return propId
  }

  return null
})

// Function to fetch a single guest's data
const fetchGuestData = async () => {
  const idToFetch = guestId.value
  if (!idToFetch) {
    console.error('No valid guest ID to fetch.')
    guest.value = null
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const { data, error } = await $supabase
      .from('guest')
      .select('*')
      .eq('guest_ID', idToFetch)
      .single()

    if (error) {
      console.error('Failed to load guest:', error)
      errorMessage.value = `Failed to load guest: ${error.message}`
      guest.value = null
    } else {
      guest.value = {
        guest_ID: data.guest_ID,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        contactNumber: data.contactNo || '',
        username: data.username || '',
        link: data.link || '',
      }
    }
  } catch (err) {
    console.error('An unexpected error occurred:', err)
    errorMessage.value = 'An unexpected error occurred while fetching data.'
  } finally {
    isLoading.value = false
  }
}

// Watch for prop changes and update local state
watch(() => props.guest, (newGuest) => {
  if (newGuest) {
    guest.value = {
      guest_ID: newGuest.guest_ID,
      firstName: newGuest.firstName || '',
      lastName: newGuest.lastName || '',
      contactNumber: newGuest.contactNo || newGuest.contactNumber || '',
      username: newGuest.username || '',
      link: newGuest.link || '',
    }
    // Disable editing when a new guest is selected
    isEditing.value = false;
  }
}, { immediate: true })

const enableEdit = () => {
  isEditing.value = true
}

const cancelEdit = () => {
  isEditing.value = false
  // Reset data to original values by re-fetching
  fetchGuestData()
}

const saveGuest = async () => {
  if (!guest.value) return

  errorMessage.value = '' // Clear any previous errors

  // Basic validation
  if (!guest.value.firstName || !guest.value.lastName || !guest.value.contactNumber || !guest.value.username) {
    errorMessage.value = 'Please fill in all required fields.'
    return
  }

  const validGuestId = guestId.value
  if (!validGuestId) {
    errorMessage.value = 'Invalid guest ID. Cannot update guest.'
    return
  }

  const updateData = {
    firstName: guest.value.firstName,
    lastName: guest.value.lastName,
    contactNo: guest.value.contactNumber, // Use the correct database column name
    username: guest.value.username,
  }

  isLoading.value = true
  successMessage.value = ''

  try {
    const { error } = await $supabase
      .from('guest')
      .update(updateData)
      .eq('guest_ID', validGuestId)
      .select()

    if (error) {
      console.error('Supabase error details:', error)
      errorMessage.value = `Failed to update guest: ${error.message}`
    } else {
      isEditing.value = false
      successMessage.value = 'Guest updated successfully!'
      // Clear the message after a delay without navigating back
      setTimeout(() => successMessage.value = '', 3000)
    }
  } catch (error) {
    console.error('Error updating guest:', error)
    errorMessage.value = `An error occurred: ${error.message}`
  } finally {
    isLoading.value = false
  }
}

// Copy link functionality
const copyLink = async () => {
  if (guest.value?.link) {
    try {
      await navigator.clipboard.writeText(guest.value.link)
      successMessage.value = 'Link copied to clipboard!'
      setTimeout(() => successMessage.value = '', 3000)
    } catch (error) {
      console.error('Failed to copy link:', error)
      errorMessage.value = 'Failed to copy link. Please try again.'
    }
  }
}

// Generate link functionality (placeholder)
const generateLink = async () => {
  if (!guest.value) {
    errorMessage.value = 'Cannot generate link for an empty guest.'
    return
  }
  
  const generatedLink = `https://chada-a.vercel.com/activate/${guest.value.guest_ID}/${Date.now()}`

  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const { data, error } = await $supabase
      .from('guest')
      .update({ link: generatedLink })
      .eq('guest_ID', guest.value.guest_ID)
      .select('link')
      .single()

    if (error) {
      throw error
    }

    guest.value.link = data.link
    successMessage.value = 'Link generated successfully!'
    setTimeout(() => successMessage.value = '', 3000)
  } catch (error) {
    console.error('Failed to save generated link:', error)
    errorMessage.value = `Failed to generate link: ${error.message}`
  } finally {
    isLoading.value = false
  }
}

const clearAllFields = () => {
  if (!guest.value) return
  // Clear all input fields but keep the guest_ID
  guest.value = {
    guest_ID: guest.value.guest_ID,
    firstName: '',
    lastName: '',
    contactNumber: '',
    username: '',
    link: '',
  }
}

// Fetch data on component mount if a valid ID exists
onMounted(() => {
  if (guestId.value) {
    fetchGuestData()
  }
})
</script>

<template>
  <div class="min-h-screen">
    <div class="max-w-6xl">
      <div class="p-11 space-y-6">
        <!-- Breadcrumb -->
        <div class="text-sm text-gray-500">
          <span @click="emit('changeView', 'dashboard')" class="hover:underline cursor-pointer">
            Dashboard</span> /
          <!-- The breadcrumb now correctly emits the 'back' event to return to the parent component's view -->
          <span @click="emit('back')" class="hover:underline cursor-pointer">
            View Guest Accounts</span> /
          <span class="text-[#6b79c0] font-semibold">Account Details</span>
        </div>

        <!-- Header -->
        <div class="border-b border-gray-300 pb-3">
          <div class="flex items-center text-2xl font-bold text-[#6b79c0]">
            <!-- The back button now correctly emits the 'back' event -->
            <button @click="emit('back')" class="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
              <ArrowLeft class="text-gray-600 w-7 h-7" />
            </button>
            <h2 class="mb-1 pl-3">Guest Account Details</h2>
          </div>
          <p class="text-gray-600 mt-2">Handle guest account activations and management.</p>
        </div>

        <!-- Main Panel -->
        <div class="bg-white p-6 rounded-lg shadow-sm">
          <div v-if="isLoading" class="text-center p-8 text-gray-500">
            Loading guest details...
          </div>
          <div v-else-if="!guest" class="text-center p-8 text-gray-500">
            No guest data found.
          </div>
          <form v-else @submit.prevent="saveGuest" class="space-y-8">
            <!-- Inline Success Message -->
            <div v-if="successMessage" class="bg-green-100 border-l-4 border-green-500 text-green-800 p-4 rounded-lg shadow-md" role="alert">
              <div class="flex items-center">
                <Check class="w-6 h-6 mr-2" />
                <p class="font-medium">{{ successMessage }}</p>
              </div>
            </div>

            <!-- Inline Error Message -->
            <div v-if="errorMessage" class="bg-red-100 border-l-4 border-red-500 text-red-800 p-4 rounded-lg shadow-md" role="alert">
              <div class="flex items-center">
                <svg class="w-6 h-6 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                </svg>
                <p class="font-medium">{{ errorMessage }}</p>
              </div>
            </div>

            <div class="space-y-5 rounded-lg bg-white">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Left Column -->
                <div class="space-y-4">
                  <div>
                    <label class="block text-gray-600 pb-2 text-sm">First Name <span class="text-red-500">*</span></label>
                    <input
                      v-model="guest.firstName"
                      type="text"
                      :disabled="!isEditing"
                      placeholder="Enter first name"
                      :class="[
                        'w-full border border-gray-300 rounded px-3 py-2 focus:outline-none transition-colors duration-300',
                        isEditing ? 'bg-white focus:border-[#6b79c0]' : 'bg-gray-100'
                      ]"
                    />
                  </div>
                  <div>
                    <label class="block text-gray-600 pb-2 text-sm">Last Name <span class="text-red-500">*</span></label>
                    <input
                      v-model="guest.lastName"
                      type="text"
                      :disabled="!isEditing"
                      placeholder="Enter last name"
                      :class="[
                        'w-full border border-gray-300 rounded px-3 py-2 focus:outline-none transition-colors duration-300',
                        isEditing ? 'bg-white focus:border-[#6b79c0]' : 'bg-gray-100'
                      ]"
                    />
                  </div>
                </div>

                <!-- Right Column -->
                <div class="space-y-4">
                  <div>
                    <label class="block text-gray-600 pb-2 text-sm">Contact Number <span class="text-red-500">*</span></label>
                    <input
                      v-model="guest.contactNumber"
                      type="text"
                      :disabled="!isEditing"
                      placeholder="Enter contact number"
                      :class="[
                        'w-full border border-gray-300 rounded px-3 py-2 focus:outline-none transition-colors duration-300',
                        isEditing ? 'bg-white focus:border-[#6b79c0]' : 'bg-gray-100'
                      ]"
                    />
                  </div>
                  <div>
                    <label class="block text-gray-600 pb-2 text-sm">Username <span class="text-red-500">*</span></label>
                    <input
                      v-model="guest.username"
                      type="text"
                      :disabled="!isEditing"
                      placeholder="Enter username"
                      :class="[
                        'w-full border border-gray-300 rounded px-3 py-2 focus:outline-none transition-colors duration-300',
                        isEditing ? 'bg-white focus:border-[#6b79c0]' : 'bg-gray-100'
                      ]"
                    />
                  </div>
                </div>
              </div>

              <div class="border-t pt-4 border-gray-200">
                <label class="block text-gray-600 pb-2 text-sm">
                  Link (Send this to the guest to activate their account)
                </label>
                <div class="flex space-x-2">
                  <div class="relative flex-1">
                    <input
                      v-model="guest.link"
                      type="text"
                      placeholder="Link here..."
                      disabled
                      class="w-full pr-10 border bg-gray-100 border-gray-300 rounded px-3 py-2 focus:outline-none"
                    />
                    <button
                      type="button"
                      title="Copy to clipboard"
                      @click="copyLink"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b79c0] hover:text-[#5a6bb8]"
                      :disabled="!guest.link"
                    >
                      <ClipboardCopy class="w-5 h-5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    @click="generateLink"
                    class="px-4 py-2 bg-[#6b79c0] hover:bg-[#5a6bb8] cursor-pointer rounded-full font-semibold text-white transition-colors text-sm"
                  >
                    Generate Link
                  </button>
                </div>
              </div>
            </div>

            <!-- Submit Buttons -->
            <div class="flex justify-end gap-2 pt-4">
              <!-- Edit Button - Only show when not editing -->
              <button
                type="button"
                @click="enableEdit"
                class="flex items-center gap-2 px-6 py-3 bg-black cursor-pointer rounded-full font-semibold text-white hover:bg-gray-900 transition-colors"
                v-if="!isEditing"
              >
                <Pencil class="w-5 h-5" />Edit
              </button>

              <!-- Clear Button - Only show when editing -->
              <button
                type="button"
                @click="clearAllFields"
                class="flex items-center gap-2 px-6 py-3 bg-red-600 cursor-pointer rounded-full font-semibold text-white hover:bg-red-700 transition-colors"
                v-if="isEditing"
              >
                <Trash2 class="w-5 h-5" />Clear
              </button>

              <!-- Cancel Button - Only show when editing -->
              <button
                type="button"
                @click="cancelEdit"
                class="flex items-center gap-2 px-6 py-3 border cursor-pointer rounded-full font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                v-if="isEditing"
              >
                Cancel
              </button>

              <!-- Save Button - Only show when editing -->
              <button
                type="submit"
                :disabled="isLoading"
                class="flex items-center gap-2 px-6 py-3 bg-green-600 cursor-pointer font-semibold text-white rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                v-if="isEditing"
              >
                <Check class="w-5 h-5" />
                {{ isLoading ? 'Saving...' : 'Save' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
