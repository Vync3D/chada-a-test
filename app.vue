<script setup>
useHead({
  title: "Samson's Cozy Homestay",
  meta: [
    {
      name: 'description',
      content: "Manage referrals and track bookings at Samson's Cozy Homestay."
    },
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1'
    }
  ]
})

import {
  Home,
  Star,
  Box,
  Plus,
  FileText,
  User,
  Users,
  MapPin,
  Map,
  StickyNote,
  Phone,
  AlarmCheck,
} from 'lucide-vue-next'
</script>

<template>
  <div class="page-container min-h-screen bg-gray-50 font-inter">
    <main>
      <NuxtPage />
    </main>
  </div>
</template>
