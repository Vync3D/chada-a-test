<script setup>
import { Home, MapPin, CarFront, User, Menu, X } from 'lucide-vue-next'
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const mobileMenuOpen = ref(false)
</script>

<template>
  <nav class="w-full bg-white border-b border-gray-300">
    <div class="flex items-center justify-between px-4 sm:px-6 py-5 max-w-7xl mx-auto">
      <NuxtLink to="/homepage" class="flex items-center space-x-5">
        <img src="/logo.png" alt="Logo" class="w-10 h-10 rounded-full" />
        <div>
          <span class="block text-lg font-bold text-[#6b79c0]">Samson’s Cozy Homestay</span>
          <span class="block text-sm text-gray-600 leading-tight">Assistant Application</span>
        </div>
      </NuxtLink>


      <div class="hidden md:flex space-x-2 items-center text-sm">
        <NuxtLink to="/homepage" :class="[
          'flex font-bold items-center px-6 py-3 rounded-lg transition-all duration-200',
          route.path === '/homepage' ? 'text-[#6c7ac1] bg-[#eef1ff] font-bold' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
        ]">
          <Home class="w-5 h-5 mr-2" />
          <span>Home</span>
        </NuxtLink>

        <NuxtLink to="/guests/map" :class="[
          'flex font-bold items-center px-6 py-3 rounded-lg transition-all duration-200',
          route.path === '/guests/map' ? 'text-[#6c7ac1] bg-[#eef1ff] font-bold' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
        ]">
          <MapPin class="w-5 h-5 mr-2" />
          <span>Map</span>
        </NuxtLink>

        <NuxtLink to="/guests/rentaservice" :class="[
          'flex font-bold items-center px-6 py-3 rounded-lg transition-all duration-200',
          route.path === '/guests/rentaservice' ? 'text-[#6c7ac1] bg-[#eef1ff] font-bold' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
        ]">
          <CarFront class="w-5 h-5 mr-2" />
          <span>Services</span>
        </NuxtLink>

        <NuxtLink to="/guests/account" :class="[
          'flex font-bold items-center px-6 py-3 rounded-lg transition-all duration-200',
          route.path === '/guests/account' ? 'text-[#6c7ac1] bg-[#eef1ff] font-bold' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
        ]">
          <User class="w-5 h-5 mr-2" />
          <span>Account</span>
        </NuxtLink>
      </div>

      <button @click="mobileMenuOpen = !mobileMenuOpen" class="md:hidden text-gray-600 hover:text-gray-800 transition">
        <Menu v-if="!mobileMenuOpen" class="w-6 h-6" />
        <X v-else class="w-6 h-6" />
      </button>
    </div>

    <transition name="fade">
      <div v-if="mobileMenuOpen"
        class="md:hidden px-4 pt-2 pb-4 space-y-2 border-t border-gray-100 bg-white transition-all duration-300 ease-in-out">
        <NuxtLink @click="mobileMenuOpen = false" to="/homepage" :class="[
          'flex font-bold items-center p-3 space-x-2 rounded-lg transition-all duration-200',
          route.path === '/homepage' ? 'text-[#6c7ac1] bg-[#eef1ff] font-bold' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
        ]">
          <Home class="w-5 h-5" />
          <span>Home</span>
        </NuxtLink>

        <NuxtLink @click="mobileMenuOpen = false" to="/guests/map" :class="[
          'flex font-bold items-center p-3 space-x-2 rounded-lg transition-all duration-200',
          route.path === '/guests/map' ? 'text-[#6c7ac1] bg-[#eef1ff] font-bold' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
        ]">
          <MapPin class="w-5 h-5" />
          <span>Map</span>
        </NuxtLink>

        <NuxtLink @click="mobileMenuOpen = false" to="/guests/rentaservice" :class="[
          'flex font-bold items-center p-3 space-x-2 rounded-lg transition-all duration-200',
          route.path === '/guests/rentaservice' ? 'text-[#6c7ac1] bg-[#eef1ff] font-bold' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
        ]">
          <CarFront class="w-5 h-5" />
          <span>Services</span>
        </NuxtLink>

        <NuxtLink @click="mobileMenuOpen = false" to="/guests/account" :class="[
          'flex font-bold items-center p-3 space-x-2 rounded-lg transition-all duration-200',
          route.path === '/guests/account' ? 'text-[#6c7ac1] bg-[#eef1ff] font-bold' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
        ]">
          <User class="w-5 h-5" />
          <span>Account</span>
        </NuxtLink>
      </div>
    </transition>
  </nav>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
```