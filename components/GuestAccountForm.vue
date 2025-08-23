<script setup>
import { ref, watch } from 'vue'
import { Plus, ClipboardCopy, ArrowLeft } from 'lucide-vue-next'
import { useRoute } from 'vue-router'
const { $supabase } = useNuxtApp()

const route = useRoute()
const emit = defineEmits(['changeView'])

const guestAccounts = ref([
  {
    firstName: '',
    lastName: '',
    contactNumber: '',
    username: '',
    link: '',
  }
])

const successMessage = ref('')
const errorMessage = ref('')

function allowOnlyDigits(event) {
  const invalidKeys = ['e', 'E', '+', '-', '.']
  if (invalidKeys.includes(event.key)) {
    event.preventDefault()
  }
}

function blockNumbers(event) {
  if (/\d/.test(event.key)) {
    event.preventDefault()
  }
}

function generateRandomCode(length = 10) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

const generateLink = (index) => {
  const randomCode = generateRandomCode()
  const baseURL = 'https://chadaa.com/' // Replace with your actual base URL
  guestAccounts.value[index].link = `${baseURL}${randomCode}`
}

function isValidGuest(guest) {
  const { firstName, lastName, contactNumber, username, link } = guest
  return (
    firstName.trim() &&
    lastName.trim() &&
    username.trim() &&
    contactNumber.trim() &&
    link.trim()
  )
}

watch(guestAccounts, (guests) => {
  guests.forEach((guest) => {
    guest.firstName = capitalizeFirstLetter(guest.firstName)
    guest.lastName = capitalizeFirstLetter(guest.lastName)
  })
}, { deep: true })

function capitalizeFirstLetter(value) {
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1)
}

const handleSubmit = async (event) => {
  event.preventDefault();

  try {
    // Clear previous messages
    successMessage.value = '';
    errorMessage.value = '';
    
    // Validate each guest before submission
    for (const guest of guestAccounts.value) {
      if (!isValidGuest(guest)) {
        errorMessage.value = "Please fill in all required fields for each guest.";
        setTimeout(() => errorMessage.value = '', 5000);
        return;
      }
    }

    for (const guest of guestAccounts.value) {
      const { data, error } = await $supabase.from('guest').insert([
        {
          firstName: guest.firstName,
          lastName: guest.lastName,
          username: guest.username,
          password: '12345678', // This should be a securely generated password
          contactNo: guest.contactNumber,
          link: guest.link,
        }
      ]);

      if (error) {
        console.error("Supabase insert error:", error);
        errorMessage.value = `Failed to add guest: ${error.message}`;
        setTimeout(() => errorMessage.value = '', 5000);
        return;
      }
    }

    successMessage.value = "Guest added successfully!";
    setTimeout(() => {
      successMessage.value = '';
      // FIX: Emit the changeView event to go back to the guests table
      emit('changeView', 'viewGuests');
    }, 3000);

  } catch (err) {
    console.error("Unexpected error:", err);
    errorMessage.value = "Something went wrong!";
    setTimeout(() => errorMessage.value = '', 5000);
  }
};

const copyLink = (index) => {
  const link = guestAccounts.value[index].link
  navigator.clipboard.writeText(link)
    .then(() => {
      successMessage.value = '🔗 Link copied to clipboard!';
      setTimeout(() => successMessage.value = '', 3000);
    })
    .catch(() => {
      errorMessage.value = '❌ Failed to copy link.';
      setTimeout(() => errorMessage.value = '', 3000);
    })
}
</script>

<template>
  <div>
    <main class="flex-1 p-11 space-y-6">
      <div class="text-sm text-gray-500">
        <span @click="emit('changeView', 'dashboard')" class="hover:underline cursor-pointer">
          Dashboard</span> /
        <span @click="emit('changeView', 'viewGuests')" class="hover:underline cursor-pointer">
          View Guest Accounts</span> /
        <span class="text-[#6b79c0] font-semibold">Add Guest Account</span>
      </div>

      <div class="border-b-1 border-gray-300 pb-3">
        <div class="flex items-center text-2xl font-bold text-[#6b79c0]">
          <button @click="emit('changeView', 'viewGuests')">
            <ArrowLeft class="text-black w-7 h-7" />
          </button>
          <h2 class="mb-1 pl-5">Add Guest Account</h2>
        </div>
        <p class="text-gray-600">Handle guest account activations and management.</p>
      </div>

      <div class="bg-white p-6 rounded-lg shadow-sm max-w-3xl">
        <form class="space-y-8" @submit="handleSubmit">
          <Transition name="fade">
            <div v-if="successMessage" class="p-4 rounded-lg bg-green-100 text-green-700">
              {{ successMessage }}
            </div>
            <div v-else-if="errorMessage" class="p-4 rounded-lg bg-red-100 text-red-700">
              {{ errorMessage }}
            </div>
          </Transition>

          <div v-for="(guest, index) in guestAccounts" :key="index" class="space-y-5 rounded-lg bg-white">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-4">
                <div>
                  <label class="block text-gray-600 pb-2 text-sm">First Name <span class="text-red-500">*</span></label>
                  <input v-model="guest.firstName" type="text" placeholder="Enter first name" @keydown="blockNumbers"
                    class="w-full border bg-[#f8f8f8] border-gray-300 rounded px-3 py-2 focus:outline-none focus:bg-white duration-300" />
                </div>
                <div>
                  <label class="block text-gray-600 pb-2 text-sm">Last Name <span class="text-red-500">*</span></label>
                  <input v-model="guest.lastName" type="text" placeholder="Enter last name" @keydown="blockNumbers"
                    class="w-full border bg-[#f8f8f8] border-gray-300 rounded px-3 py-2 focus:outline-none focus:bg-white duration-300" />
                </div>
              </div>

              <div class="space-y-4">
                <div>
                  <label class="block text-gray-600 pb-2 text-sm">Contact Number <span class="text-red-500">*</span></label>
                  <input v-model="guest.contactNumber" type="text" pattern="[0-9]*"
                    @keydown="allowOnlyDigits" placeholder="Enter contact number"
                    class="w-full border bg-[#f8f8f8] border-gray-300 rounded px-3 py-2 focus:outline-none focus:bg-white duration-300" />
                </div>
                <div>
                  <label class="block text-gray-600 pb-2 text-sm">Username <span class="text-red-500">*</span></label>
                  <input v-model="guest.username" type="text" placeholder="Enter username"
                    class="w-full border bg-[#f8f8f8] border-gray-300 rounded px-3 py-2 focus:outline-none focus:bg-white duration-300" />
                </div>
              </div>
            </div>

            <div class="border-t pt-4 border-gray-200">
              <label class="block text-gray-600 pb-2 text-sm">
                Link (Send this to the guest to activate their account)
              </label>
              <div class="flex space-x-2">
                <div class="relative flex-1">
                  <input type="text" :value="guest.link" placeholder="Link here..." disabled
                    class="text-gray-500 w-full pr-10 border bg-[#f8f8f8] border-gray-300 rounded px-3 py-2 focus:outline-none focus:bg-white duration-300" />
                  <button type="button" title="Copy to clipboard" @click="copyLink(index)"
                    class="bg-[#f1f1f8] absolute right-3 top-1/2 cursor-pointer -translate-y-1/2 text-[#6b79c0]">
                    <ClipboardCopy class="w-5 h-5" />
                  </button>
                </div>

                <button type="button"
                  class="w-40 px-4 py-2 bg-[#6b79c0] cursor-pointer rounded-lg font-semibold text-white"
                  @click="generateLink(index)">
                  Generate Link
                </button>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-4">
            <button type="reset"
              class="px-9 py-3 border cursor-pointer rounded-3xl font-semibold text-black hover:bg-gray-100">Clear</button>
            <button type="submit"
              class="flex items-center gap-2 px-10 py-3 bg-black cursor-pointer font-semibold text-white rounded-3xl hover:bg-gray-900">
              <Plus class="w-5 h-5" />Add
            </button>
          </div>
        </form>
      </div>
    </main>
  </div>
</template>

<style>
/* CSS for the fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
