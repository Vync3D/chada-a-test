<script setup>
import { ArrowLeft, Mail, Lock, MapPin, FileText, Home, Handshake, Check } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { ref } from 'vue'

const router = useRouter()
const goBack = () => {
  router.back()
}
</script>
<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8">
      <!-- Header -->
      <div class="flex items-center flex-wrap gap-2 mb-6 sm:mb-8 animate-fade-in-down">
        <button @click="goBack">
          <ArrowLeft class="text-black w-6 h-6 sm:w-7 sm:h-7 mr-2 sm:mr-3" />
        </button>
        <h1 class="text-xl sm:text-2xl font-bold text-[#6c7ac1]">Terms and Conditions</h1>
      </div>

      <!-- Terms Card -->
      <div class="bg-white p-4 sm:p-6 md:p-8 rounded-2xl border border-[#6C7AC1]/20 text-sm animate-fade-in-down space-y-4 shadow-sm">
        <!-- Intro -->
        <div>
          <p class="text-base font-semibold text-gray-800">
            By using this app, you're agreeing to the following:
          </p>
        </div>

        <!-- Privacy -->
        <div>
          <div class="flex items-center flex-wrap mb-2">
            <Lock class="w-5 h-5 text-[#6c7ac1] mr-2" />
            <h2 class="text-lg sm:text-xl font-bold text-[#6c7ac1]">Privacy & Data Use</h2>
          </div>
          <p class="text-gray-700">We collect limited personal information only to improve your experience. This includes:</p>
          <ul class="list-disc pl-6 mt-2 text-gray-700 space-y-1">
            <li>Name</li>
            <li>Contact Number</li>
            <li>Email Address</li>
          </ul>
          <p class="text-gray-700 mt-2">
            We <strong>do not</strong> sell or share your data with third parties.
          </p>
        </div>

        <!-- Location -->
        <div>
          <div class="flex items-center flex-wrap mb-2">
            <MapPin class="w-5 h-5 text-[#6c7ac1] mr-2" />
            <h2 class="text-lg sm:text-xl font-bold text-[#6c7ac1]">Location (Optional)</h2>
          </div>
          <p class="text-gray-700">We may request location access to:</p>
          <ul class="list-disc pl-6 mt-2 text-gray-700 space-y-1">
            <li>Show your position on our hotspot map</li>
            <li>Assist in emergencies</li>
          </ul>
          <p class="text-gray-700 mt-2">You may opt out anytime in settings — app functionality remains unaffected.</p>
        </div>

        <!-- Service Request -->
        <div>
          <div class="flex items-center flex-wrap mb-2">
            <FileText class="w-5 h-5 text-[#6c7ac1] mr-2" />
            <h2 class="text-lg sm:text-xl font-bold text-[#6c7ac1]">Service Request</h2>
          </div>
          <p class="text-gray-700">By submitting service requests, you agree to:</p>
          <ul class="list-disc pl-6 mt-2 text-gray-700 space-y-1">
            <li>Let us use your request data within the app.</li>
            <li>Respect community rules and guidelines.</li>
          </ul>
        </div>

        <!-- In-House Services -->
        <div>
          <div class="flex items-center flex-wrap mb-2">
            <Home class="w-5 h-5 text-gray-700 mr-2" />
            <h3 class="text-base sm:text-lg font-bold text-gray-900">In-House Services</h3>
          </div>
          <ul class="list-disc pl-6 text-gray-700 space-y-1">
            <li>Provided directly by our team.</li>
            <li>We ensure quality and timely delivery.</li>
            <li>Availability may vary.</li>
          </ul>
        </div>

        <!-- Third-Party Services -->
        <div>
          <div class="flex items-center flex-wrap mb-2">
            <Handshake class="w-5 h-5 text-gray-700 mr-2" />
            <h3 class="text-base sm:text-lg font-bold text-gray-900">Third-Party Services</h3>
          </div>
          <ul class="list-disc pl-6 text-gray-700 space-y-1">
            <li>Offered by external vendors via our coordination.</li>
            <li>We do not guarantee third-party service quality.</li>
            <li>Issues should be directed to the vendor.</li>
            <li>We are not liable for third-party outcomes.</li>
          </ul>
        </div>

        <!-- Consent -->
        <div>
          <div class="flex items-center flex-wrap mb-2">
            <Check class="w-5 h-5 text-[#6c7ac1] mr-2" />
            <h2 class="text-lg sm:text-xl font-bold text-[#6c7ac1]">Your Consent</h2>
          </div>
          <ul class="list-disc pl-6 text-gray-700 space-y-1">
            <li>Your data is used only to support your experience inside the app.</li>
            <li>You agree to follow respectful behavior as a guest user.</li>
          </ul>
        </div>
      </div>

      <!-- Contact CTA -->
      <div class="mt-10 sm:mt-12 text-center">
        <h2 class="text-lg sm:text-xl font-semibold text-gray-700 mb-2">Have any questions?</h2>
        <p class="text-gray-500 mb-4">Visit our contact page to get in touch with us.</p>
        <NuxtLink
          to="/guests/contact"
          class="inline-flex items-center px-5 sm:px-6 py-2.5 sm:py-3 bg-[#6c7ac1] text-white font-semibold rounded-full hover:bg-[#5a66af] transition shadow-sm"
        >
          <Mail class="w-5 h-5 mr-2" /> Contact Us
        </NuxtLink>
      </div>
    </div>

    <!-- Modal -->
    <transition name="fade">
      <JoinGroup v-if="showJoinModal" @close="showJoinModal = false" />
    </transition>
  </div>
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

.animate-fade-in-down {
  animation: fade-in-down 0.5s ease-out;
}
</style>