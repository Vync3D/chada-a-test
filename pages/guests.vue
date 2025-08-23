<script setup>
import { ref } from 'vue'
import NavBar_Website from '~/components/NavBar_Website.vue'
const route = useRoute()

const currentView = ref('mytrips')
const isActivationPage = computed(() => route.path.startsWith('/guests/accountactivation'))

</script>

<template>
    <div class="min-h-screen bg-gray-50">
        <!-- <NavBar_Website @changeView="currentView = $event" /> -->
        <NavBar_Website v-if="!isActivationPage" />

        <main :class="!isActivationPage ? 'flex-1 p-5 space-y-8' : ''">
            <NuxtPage />
        </main>
    </div>
</template>
