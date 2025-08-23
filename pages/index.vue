<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLoginStore } from '~/stores/loginStore'
import { useAuth } from '@/composables/useAuth'
import { User, UserCog, Eye, EyeOff } from 'lucide-vue-next'

const { setAuthUser } = useAuth()
const loginStore = useLoginStore()

const role = ref(loginStore.role)
const identifier = ref(loginStore.identifier)
const password = ref(loginStore.password)
const agreed = ref(loginStore.agreed)

const error = ref(null)
const isLoading = ref(false)
const hydrated = ref(false)
const showPassword = ref(false)

const { $supabase } = useNuxtApp()
const route = useRoute()
const router = useRouter()

const activeRoleClass = 'bg-[#6C7AC1] text-white border-[#6C7AC1]'
const inactiveRoleClass = 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'

function saveLoginState() {
  loginStore.saveState({
    role: role.value,
    identifier: identifier.value,
    password: password.value,
    agreed: agreed.value
  })
}

onMounted(() => {
  hydrated.value = true
  if (route.query.from === 'terms') {
    agreed.value = true
    saveLoginState()
  }
})

async function login() {
  error.value = null
  isLoading.value = true

  try {
    const query = role.value === 'employee'
      ? $supabase.from('employee').select('employee_ID,email,password').eq('email', identifier.value).single()
      : $supabase.from('guest').select('guest_ID,username,password').eq('username', identifier.value).single()

    const { data, error: dbError } = await query

    if (dbError || !data) {
      error.value = 'User not found'
      return
    }

    if (data.password !== password.value) {
      error.value = 'Invalid password'
      return
    }

    const userId = role.value === 'employee' ? data.employee_ID : data.guest_ID
    localStorage.setItem('user_id', userId)
    localStorage.setItem('user_role', role.value)
    setAuthUser({ role: role.value, id: userId })

    const destination = role.value === 'employee' ? '/admin' : '/homepage'
    await nextTick()
    router.push(destination)
  } catch (err) {
    console.error(err)
    error.value = 'Something went wrong.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div
    class="relative min-h-screen bg-cover bg-center bg-no-repeat"
    style="background-image: url('/background.png');"
  >
    <div class="flex flex-col items-center justify-center min-h-screen px-4 py-8 sm:p-6 md:p-8">
      <div
        class="w-full max-w-sm sm:max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        <div class="bg-[#6C7AC1] flex items-center justify-center px-4 py-6 sm:px-6 md:px-8">
          <img src="/logo.png" alt="Logo" class="w-12 h-12 mr-3 object-contain sm:w-14 sm:h-14" />
          <p class="text-white text-sm sm:text-base text-center font-medium">
            Samson's Cozy Homestay Adventure <br />
            & Destination Assistant App
          </p>
        </div>

        <div class="flex flex-col px-6 py-8 sm:px-8 sm:py-10">
          <div class="text-center border-b border-gray-300 pb-5">
            <h2 class="text-2xl font-bold">
              Welcome to <span class="text-[#6C7AC1]">CHADA-A</span>!
            </h2>
            <p class="text-[#585858] text-sm sm:text-base">Login to your account and continue your journey.</p>
          </div>

          <div class="mt-6">
            <p class="text-[#585858] mb-2 text-sm">Login as <span class="text-red-500">*</span></p>
            <div class="grid grid-cols-2 gap-3">
              <button
                @click="role = 'employee'"
                :class="role === 'employee' ? activeRoleClass : inactiveRoleClass"
                class="flex items-center justify-center px-2 py-3 rounded-lg font-medium border transition-colors duration-200"
              >
                <UserCog class="w-4 h-4 mr-2" />
                <span class="text-sm">Employee</span>
              </button>
              <button
                @click="role = 'guest'"
                :class="role === 'guest' ? activeRoleClass : inactiveRoleClass"
                class="flex items-center justify-center px-2 py-3 rounded-lg font-medium border transition-colors duration-200"
              >
                <User class="w-4 h-4 mr-2" />
                <span class="text-sm">Guest</span>
              </button>
            </div>
          </div>

          <label for="identifier" class="block text-[#585858] mt-6 text-sm">
            {{ role === 'employee' ? 'Email' : 'Username' }} <span class="text-red-500">*</span>
          </label>
          <input
            id="identifier"
            v-model="identifier"
            :placeholder="role === 'employee' ? 'Enter your email' : 'Enter your username'"
            class="border mt-2 p-3 w-full rounded-lg mb-4 text-sm"
          />

          <label for="password" class="block text-[#585858] text-sm">Password <span class="text-red-500">*</span></label>
          <div class="relative">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Enter your password"
              class="border mt-2 p-3 w-full rounded-lg mb-4 pr-10 text-sm"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
              <EyeOff v-if="!showPassword" class="w-5 h-5" />
              <Eye v-else class="w-5 h-5" />
            </button>
          </div>

          <div class="flex items-start space-x-2 mb-4">
            <input id="terms" type="checkbox" v-model="agreed" class="mt-1" />
            <label for="terms" class="text-xs sm:text-sm">
              I have read and agree to the
              <NuxtLink to="/terms" @click="saveLoginState" class="text-[#6C7AC1] underline cursor-pointer">
                Terms and Conditions.
              </NuxtLink>
            </label>
          </div>

          <button
            v-if="hydrated"
            @click="login"
            :disabled="!agreed || isLoading"
            class="w-full py-3 rounded-lg text-white font-medium"
            :class="agreed ? 'bg-[#1E1E1E] hover:bg-[#6C7AC1]' : 'bg-gray-400 cursor-not-allowed'"
          >
            {{ isLoading ? 'Logging in...' : 'Login' }}
          </button>

          <p v-if="error" class="text-red-500 mt-2 text-center text-sm">{{ error }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
