<script setup>
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-vue-next'

const props = defineProps({
  show: Boolean,
  title: String,
  message: String,
  icon: Object, // Icon component override (optional)
  type: {
    type: String,
    default: 'info' // 'success', 'confirm', 'danger', 'warning'
  },
  confirmText: {
    type: String,
    default: 'Confirm'
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  }
})

const emit = defineEmits(['close', 'confirm'])

const typeIcons = {
  success: CheckCircle,
  danger: AlertTriangle,
  warning: AlertTriangle,
  info: Info
}
</script>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
.animate-fadeIn {
  animation: fadeIn 0.25s ease-out;
}
</style>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4"
  >
    <div
      class="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 relative border border-[#6c7ac1]/20 animate-fadeIn transition-transform duration-300 transform"
    >
      <!-- Close -->
      <button
        @click="emit('close')"
        class="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition"
      >
        <X class="w-6 h-6" />
      </button>

      <!-- Icon -->
      <div class="mb-5 text-center">
        <component
          :is="icon || typeIcons[type]"
          class="w-10 h-10 mx-auto"
          :class="{
            'text-green-500': type === 'success',
            'text-red-500': type === 'danger',
            'text-yellow-500': type === 'warning',
            'text-[#6c7ac1]': type === 'info'
          }"
        />
      </div>

      <!-- Title & Message -->
      <h2 class="text-xl text-center font-bold text-gray-800 mb-2">{{ title }}</h2>
      <p class="text-center text-gray-600 mb-6 leading-relaxed">{{ message }}</p>

      <!-- Buttons -->
      <div class="flex justify-center gap-2 mt-4">
        <button
          v-if="type === 'confirm' || type === 'danger' || type === 'warning'"
          @click="emit('close')"
          class="px-6 py-2.5 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition shadow-sm"
        >
          {{ cancelText }}
        </button>
        <button
          @click="emit('confirm')"
          class="px-6 py-2.5 rounded-full text-white font-medium transition shadow-sm"
          :class="{
            'bg-green-500 hover:bg-green-600': type === 'success',
            'bg-red-500 hover:bg-red-600': type === 'danger',
            'bg-yellow-500 hover:bg-yellow-600 text-black': type === 'warning',
            'bg-[#6c7ac1] hover:bg-[#5a66af]': type === 'info' || !type
          }"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

