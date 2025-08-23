<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Eye, EyeOff, KeyRound, Check } from 'lucide-vue-next'
import MessageModal from '~/components/MessageModal.vue'

const { $supabase } = useNuxtApp()
const route = useRoute()

const guest = ref(null)
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirm = ref(false)

onMounted(async () => {
    const code = route.params.code
    const { data, error } = await $supabase
        .from('guest')
        .select('*')
        .eq('link', code)
        .maybeSingle()

    if (error) {
        console.error('Failed to fetch guest:', error)
        return
    }

    guest.value = data
})

// Real-time validation
const hasMinLength = computed(() => password.value.length >= 8)
const hasUpper = computed(() => /[A-Z]/.test(password.value))
const hasLower = computed(() => /[a-z]/.test(password.value))
const hasSymbol = computed(() => /[\W_]/.test(password.value))
const passwordsMatch = computed(() => password.value === confirmPassword.value)

const isFormValid = computed(() =>
    hasMinLength.value &&
    hasUpper.value &&
    hasLower.value &&
    hasSymbol.value &&
    passwordsMatch.value
)

const showModal = ref(false)
const modalType = ref('info')
const modalTitle = ref('')
const modalMessage = ref('')

function openModal({ type = 'info', title = '', message = '' }) {
    modalType.value = type
    modalTitle.value = title
    modalMessage.value = message
    showModal.value = true
}

const handleSubmit = async () => {
    const { error } = await $supabase
        .from('guest')
        .update({ password: password.value })
        .eq('guest_ID', 1)

    if (error) {
        console.error('Error updating password:', error)
        openModal({
            type: 'error',
            title: 'Update Failed',
            message: 'Failed to update password. Please try again later.'
        })
    } else {
        openModal({
            type: 'success',
            title: 'Password Changed',
            message: 'Your password has been updated successfully.'
        })
 
        setTimeout(() => {
            window.location.href = '/'
        }, 3000) 
    }
}

</script>


<template>
    <div class="relative min-h-screen bg-cover bg-center bg-no-repeat" style="background-image: url('/background.png')">
        <div class="min-h-screen flex flex-col justify-center items-center px-4">
            <div class="w-full max-w-lg bg-white rounded-2xl shadow-lg overflow-hidden">
                <!-- Header -->
                <div class="bg-[#6C7AC1] flex items-center justify-center text-center py-5 px-6">
                    <img src="/logo.png" alt="Logo" title="CHADA-A" class="w-13 h-13 object-contain" />
                    <p class="text-white text-left">
                        Samson's Cozy Homestay Adventure <br />
                        & Destination Assistant App
                    </p>
                </div>

                <!-- Body -->
                <div class="px-6 py-8 text-center m-0">
                    <h1 class="text-2xl font-bold mb-4 flex flex-col items-center">
                        <div class="bg-[#6C7AC1] p-3 rounded-full mb-3">
                            <KeyRound class="w-6 h-6 text-white" />
                        </div>
                        Create New Password
                    </h1>
                    <p class="text-gray-600 mb-6 border-b border-gray-300 pb-4">
                        To make your account secure, please create a new password to replace the temporary password you
                        were given to login.
                    </p>

                    <form class="space-y-4" @submit.prevent="handleSubmit">
                        <div class="relative">
                            <label for="password" class="block text-left text-[#585858] mb-2">New Password <span
                                    class="text-red-500">*</span> </label>
                            <input :type="showPassword ? 'text' : 'password'" v-model="password" id="password"
                                class="w-full border border-gray-300 rounded-md px-4 py-2 pr-10 bg-white" />
                            <button type="button" class="absolute right-3 top-11 text-gray-500"
                                @click="showPassword = !showPassword">
                                <component :is="showPassword ? Eye : EyeOff" class="w-5 h-5" />
                            </button>
                        </div>

                        <div class="relative">
                            <label for="confirmPassword" class="block text-left text-[#585858] mb-2">Confirm
                                Password <span class="text-red-500">*</span> </label>

                            <input :type="showConfirm ? 'text' : 'password'" v-model="confirmPassword"
                                id="confirmPassword"
                                class="w-full border border-gray-300 rounded-md px-4 py-2 pr-10 bg-white" />
                            <button type="button" class="absolute right-3 top-10 text-gray-500"
                                @click="showConfirm = !showConfirm">
                                <component :is="showConfirm ? Eye : EyeOff" class="w-5 h-5" />
                            </button>
                            <p v-if="confirmPassword.length > 0" class="mt-2 text-left text-sm"
                                :class="passwordsMatch ? 'text-green-600' : 'text-red-500'">
                                {{ passwordsMatch ? 'Passwords match' : 'Passwords do not match' }}
                            </p>
                        </div>

                        <!-- Inline Rules -->
                        <p class="text-gray-600 text-sm text-left pt-3 border-t border-gray-300">New password must
                            contain:</p>
                        <ul class="text-left text-sm space-y-2 text-gray-600">
                            <li class="flex items-center gap-2" :class="{ 'text-green-600': hasMinLength }">
                                <Check class="w-4 h-4" v-if="hasMinLength" />
                                <span>At least 8 characters</span>
                            </li>
                            <li class="flex items-center gap-2" :class="{ 'text-green-600': hasUpper }">
                                <Check class="w-4 h-4" v-if="hasUpper" />
                                <span>At least 1 uppercase letter</span>
                            </li>
                            <li class="flex items-center gap-2" :class="{ 'text-green-600': hasLower }">
                                <Check class="w-4 h-4" v-if="hasLower" />
                                <span>At least 1 lowercase letter</span>
                            </li>
                            <li class="flex items-center gap-2" :class="{ 'text-green-600': hasSymbol }">
                                <Check class="w-4 h-4" v-if="hasSymbol" />
                                <span>At least 1 symbol (e.g. !, @, #)</span>
                            </li>
                        </ul>

                        <button type="submit" :disabled="!isFormValid"
                            class="w-full py-3 mt-4 rounded-full font-semibold transition duration-200"
                            :class="isFormValid ? 'bg-[#1E1E1E] text-white hover:bg-[#6C7AC1]' : 'bg-gray-300 text-gray-500 cursor-not-allowed'">
                            Save New Password
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>
    <MessageModal :show="showModal" :type="modalType" :title="modalTitle" :message="modalMessage"
        @close="showModal = false" />

</template>
