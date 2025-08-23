<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 py-8">

      <!-- Header -->
      <div class="flex items-center mb-3">
        <button @click="goBack">
          <ArrowLeft class="text-black w-7 h-7 mr-3" />
        </button>
        <h1 class="text-2xl font-bold text-[#6c7ac1]">Explore Virtual Tour</h1>
      </div>
      <p class="text-gray-500 mb-8">
      </p>

      <!-- Under Construction Card -->
      <div class="bg-white rounded-2xl p-10 text-center border border-gray-300">
        <Wrench class="w-12 h-12 text-[#6c7ac1] mx-auto mb-4" />
        <h2 class="text-3xl font-bold text-[#6c7ac1] mb-4">Feature Under Construction</h2>
        <p class="text-gray-600 max-w-xl mx-auto mb-6">
          This section is currently under development. Please check back soon!
        </p>
        <NuxtLink
          to="/homepage"
          class="inline-flex items-center px-6 py-3 bg-[#6c7ac1] text-white font-semibold rounded-full hover:bg-[#5a66af] transition"
        >
          <ArrowLeft class="w-4 h-4 mr-2" />
          Back to Home
        </NuxtLink>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ArrowLeft, Wrench } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const router = useRouter()
const goBack = () => router.back()
</script>
