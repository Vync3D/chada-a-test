<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Check } from 'lucide-vue-next'

const { $supabase } = useNuxtApp()
const route = useRoute()
const guest = ref(null)

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

    console.log('Fetched guest:', data) // <-- check this
    guest.value = data
})

</script>

<template>
    <div class="relative min-h-screen bg-cover bg-center bg-no-repeat" style="background-image: url('/background.png')">
        <div class="min-h-screen flex flex-col justify-center items-center px-4">
            <div class="w-full max-w-lg bg-white rounded-2xl shadow-lg overflow-hidden">
                <!-- Header -->
                <div class="bg-[#6C7AC1] flex  items-center justify-center text-center py-5 px-6">
                    <img src="/logo.png" alt="Logo" title="CHADA-A" class="w-13 h-13 object-contain" />
                    <p class="text-white text-left">
                        Samson's Cozy Homestay Adventure <br />
                        & Destination Assistant App
                    </p>
                </div>


                <!-- Body -->
                <div class="px-6 py-8 text-center m-0">
                    <h1 class="text-2xl font-bold mb-4 flex flex-col items-center">
                        <!-- Centered Check Icon with Background -->
                        <div class="bg-[#6C7AC1] p-3 rounded-full mb-3">
                            <Check class="w-6 h-6 text-white" />
                        </div>

                        Your account has been <br />
                        <span class="text-[#6C7AC1]">successfully activated!</span>
                    </h1>
                    <p class="text-gray-600 mb-6">
                        Looking forward to your stay with us! You may change your password during your first login.
                    </p>

                    <hr class="border-gray-300 mb-6" />

                    <!-- Account Details -->
                    <div class="text-center text-lg text-gray-700 mb-6 space-y-4">
                        <p class="font-bold text-black text-lg">Here are your account details:</p>

                        <div class="flex flex-col items-center gap-1">
                            <label for="username" class="font-medium">Username</label>
                            <input id="username" type="text" :value="guest?.username" readonly
                                class="w-full border border-gray-300 text-center rounded-md px-4 py-2 bg-gray-100 text-[#6C7AC1] font-bold cursor-text" />
                        </div>

                        <div class="flex flex-col items-center gap-1">
                            <label for="password" class="font-medium">Password</label>
                            <input id="password" type="text" :value="guest?.password" readonly
                                class="w-full border border-gray-300 text-center rounded-md px-4 py-2 bg-gray-100 text-[#6C7AC1] font-bold cursor-text" />
                        </div>
                    </div>

                    <!-- Go to Login -->
                    <NuxtLink to="/">
                        <button
                            class="w-full py-4 rounded-full text-white font-semibold bg-[#1E1E1E] hover:bg-[#6C7AC1] transition duration-200">
                            Login Now
                        </button>
                    </NuxtLink>
                </div>
            </div>
        </div>
    </div>
</template>
