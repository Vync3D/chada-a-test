<script setup>
import { ArrowLeft } from 'lucide-vue-next'
</script>

<template>
  <div class="page-container flex items-center justify-center relative min-h-screen bg-cover bg-center bg-no-repeat" style="background-image: url('/background.png');">
    <div class="bg-[#F6F6F6] py-8 max-w-xl">
        <div class="pl-7 text-3xl text-[#6C7AC1] font-bold mb-4 flex items-center gap-2">
        <NuxtLink to="/?from=terms">
            <ArrowLeft class="text-black w-6 h-6 hover:text-[#6C7AC1] transition" />
        </NuxtLink>
        <span>Terms and Conditions</span>
        </div>

        <div class="bg-white px-8 py-8 shadow-lg">
            <h2 class="font-bold text-2xl mb-4">
            By using this app, you're agreeing to the following:
            </h2>
            <!-- Privacy and Data Use -->
            <div class="border-b-1">
                <h3 class="text-[#6C7AC1] text-xl font-bold">Privacy & Data Use</h3>
                <p>We collect limited personal information only to improve your experience in the app. This includes, but is not limited to:</p>
                <ul class="list-disc pl-6">
                    <li>Name</li>
                    <li>Contact Number</li>
                </ul>
                <p class="pt-4">We do <b>NOT</b> sell or share your data with third parties.</p>
            </div>
            <!-- Location -->
            <div class="pt-4 pb-4 border-b-1">
                <h3 class="text-[#6C7AC1] text-xl font-bold">Location (Optional)</h3>
                <p>We may ask for your location to:</p>
                <ul class="list-disc pl-6">
                    <li>Show your position on a map showing the hottest spots here in Siquijor.</li>
                    <li>Help in case of emergencies.</li>
                </ul>
                <p class="pt-4">You can opt out anytime in your settings. The app will still work without it.</p>
            </div>
            <!-- Service Request -->
            <div class="pt-4 pb-4 border-b-1">
                <h3 class="text-[#6C7AC1] text-xl font-bold">Service Request</h3>
                <p>By submitting a service request, you acknowledge and agree to the following:</p>

                <h3 class="pt-4 font-bold">In-House Services</h3>
                <ul class="list-disc pl-6">
                    <li>Provided directly by our employees.</li>
                    <li>We are responsible for the quality and delivery of these services.</li>
                    <li>Services depend on availability.</li>
                </ul>

                <h3 class="pt-4 font-bold">Third-Party Services</h3>
                <ul class="list-disc pl-6">
                    <li>Coordinated by management but provided by external vendors.</li>
                    <li><b>We cannot guarantee</b> the quality or reliability of third-party services.</li>
                    <li>Any issues should be addressed directly with the provider.</li>
                    <li>We are not liable for third-party services.</li>
                </ul>
            </div>
            
            <div class="pt-4">
                <h3 class="text-[#6C7AC1] text-xl font-bold">Your Consent</h3>
                <p>By agreeing to use this app, you agree to:</p>
                <ul class="list-disc pl-6">
                    <li>Let us use your data only within the app.</li>
                    <li>Respect our community rules as a guest.</li>
                </ul>
            </div>
        </div>

        <div class="px-8 pt-8">
            <h3 class="font-bold">Have any questions?</h3>
            <p>Visit our 
                <NuxtLink to="/contacts" class="font-bold text-[#6C7AC1] underline cursor-pointer">contact page</NuxtLink> 
                 to get in touch with us.
            </p>
        </div>

    </div>
  </div>
</template>
