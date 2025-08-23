<script setup>
import { Plus, Search, ArrowUp, ArrowDown } from 'lucide-vue-next';
import { onMounted, ref, computed } from 'vue';
import GuestViewForm from './GuestViewForm.vue';

const { $supabase } = useNuxtApp();
// The GuestsTable now also needs to emit the 'changeView' event to its parent (admin.vue)
const emit = defineEmits(['changeView']);

// State variables for guest data and selected guest
const guestAccounts = ref([]);
const selectedGuest = ref(null);

// Search and filter state
const searchQuery = ref('');
const sortOrder = ref('desc');
const statusFilter = ref('all');

// Function to fetch all guests from the database
const fetchGuests = async () => {
  try {
    const { data, error } = await $supabase.from('guest').select('*');
    if (error) {
      console.error('Error fetching guests:', error);
    } else {
      guestAccounts.value = data;
    }
  } catch (err) {
    console.error('An unexpected error occurred:', err);
  }
};

// Fetch guests when the component is mounted
onMounted(() => {
  fetchGuests();
});

// Computed property for filtering and sorting the guest list
const filteredGuests = computed(() => {
  let filtered = guestAccounts.value.filter(guest => {
    const guestName = `${guest.firstName} ${guest.lastName}`.toLowerCase();
    return guestName.includes(searchQuery.value.toLowerCase());
  });

  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(guest => (guest.status || 'Inactive') === statusFilter.value);
  }

  // Sort the filtered list based on sortOrder
  filtered = filtered.sort((a, b) => {
    if (sortOrder.value === 'desc') {
      return b.guest_ID - a.guest_ID;
    }
    return a.guest_ID - b.guest_ID;
  });

  return filtered;
});

// Function to toggle the sort order
const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
};

// Function to toggle a guest's status and update the database
const toggleStatus = async (guest, event) => {
  // Prevent the click from bubbling up and triggering viewGuest
  event.stopPropagation();

  const newStatus = guest.status === 'Active' ? 'Inactive' : 'Active';

  try {
    // Update the record in the Supabase database
    const { error } = await $supabase
      .from('guest')
      .update({ status: newStatus })
      .eq('guest_ID', guest.guest_ID);

    if (error) {
      console.error('Error updating guest status:', error);
      // Revert the local state on error
      guest.status = guest.status === 'Active' ? 'Inactive' : 'Active';
    } else {
      // Update the local state to reflect the change
      guest.status = newStatus;
    }
  } catch (err) {
    console.error('An unexpected error occurred:', err);
  }
};

// Function to handle viewing a specific guest's details
const viewGuest = (guest) => {
  selectedGuest.value = { ...guest };
};

// Function to return to the guest list table and automatically re-fetch data
const backToTable = () => {
  selectedGuest.value = null;
  // Re-fetch data to ensure the list is up-to-date with any changes
  fetchGuests();
};

// A new, dedicated method to handle and re-emit the 'changeView' event from the child component
const handleChildViewChange = (newView) => {
  emit('changeView', newView);
};
</script>

<template>
  <!-- Main content container -->
  <div>
    <div v-if="!selectedGuest" class="p-11 space-y-6">
      <!-- Breadcrumb navigation -->
      <div class="text-sm text-gray-500">
        <span @click="emit('changeView', 'dashboard')" class="hover:underline cursor-pointer">Dashboard</span> /
        <span class="text-[#6b79c0] font-semibold">View Guest Accounts</span>
      </div>

      <!-- Header and Add New Guest button -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200 pb-4">
        <div class="mb-4 sm:mb-0">
          <h2 class="text-2xl font-bold text-[#6b79c0]">View Guest Accounts</h2>
          <p class="text-gray-600">Handle guest account activations and management. Select a guest from the list to edit
            details.</p>
        </div>
        <button type="button" @click="emit('changeView', 'guestCreation')"
          class="flex items-center gap-2 px-6 py-3 bg-black text-white font-semibold rounded-full shadow-md hover:bg-gray-800 transition-colors duration-300">
          <Plus class="w-5 h-5" /> Add New Guest
        </button>
      </div>

      <!-- Search Bar and Filters -->
      <div
        class="bg-white rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-gray-200">
        <div class="relative w-full sm:max-w-md">
          <input v-model="searchQuery" type="text" placeholder="Search by Guest Name..."
            class="search pl-10 pr-8 py-2 w-full border border-gray-300 bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-[#6b79c0]" />
          <Search class="absolute right-5 top-5 -translate-y-1/2 text-gray-800 w-5 h-5" />
        </div>

        <div class="flex flex-wrap items-center gap-2 sm:gap-4">
          <button @click="toggleSortOrder"
            class="flex items-center gap-1 border border-gray-300 bg-white rounded-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition duration-300 focus:outline-none focus:ring-2 focus:ring-[#6b79c0]">
            Sort: {{ sortOrder === 'asc' ? 'Oldest First' : 'Newest First' }}
            <ArrowDown v-if="sortOrder === 'asc'" class="w-4 h-4" />
            <ArrowUp v-else class="w-4 h-4" />
          </button>

          <select v-model="statusFilter"
            class="filter border border-gray-300 bg-white rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-[#6b79c0] focus:outline-none transition duration-300">
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      <!-- Table Header -->
      <div
        class="mt-6 px-5 py-4 uppercase tracking-wider grid grid-cols-4 font-semibold text-sm text-gray-500 border-b border-gray-200">
        <span>Guest Name</span>
        <span>Username</span>
        <span>Contact No.</span>
        <span>Status</span>
      </div>

      <!-- Empty state -->
      <div v-if="filteredGuests.length === 0"
        class="flex flex-col items-center justify-center gap-2 py-12 text-gray-500">
        <Search class="w-10 h-10 text-gray-300" />
        <p class="text-center text-sm">No results found for "<span class="font-semibold text-[#6b79c0]">{{ searchQuery
            }}</span>"</p>
      </div>

      <!-- Guest rows -->
      <div v-for="guest in filteredGuests" :key="guest.guest_ID" @click="viewGuest(guest)"
        class="group bg-white rounded-xl my-2 border border-gray-200 hover:shadow-lg grid px-5 grid-cols-4 items-center text-sm text-gray-700 py-4 transition duration-300 cursor-pointer">
        <span class="font-bold text-gray-900 duration-200 group-hover:text-[#6b79c0]">
          {{ guest.firstName }} {{ guest.lastName }}
        </span>
        <span>{{ guest.username }}</span>
        <span>{{ guest.contactNo }}</span>
        <span>
          <button @click.stop="toggleStatus(guest, $event)"
            :class="guest.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'"
            class="px-3 py-1 rounded-full text-xs font-medium transition-colors duration-300">
            {{ guest.status || 'Inactive' }}
          </button>
        </span>
      </div>
    </div>

    <!-- Guest View Form component -->
    <div v-else>
      <GuestViewForm :guest="selectedGuest" @back="backToTable" @changeView="handleChildViewChange" />
    </div>
  </div>
</template>
