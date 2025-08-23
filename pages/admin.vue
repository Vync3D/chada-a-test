<script setup>
// si jhana gapush ani
import { ref, onMounted } from 'vue'
import { useViewStore } from '~/stores/viewStore'
import Sidebar from '~/components/Sidebar.vue'

// Import all necessary components for each view
import Dashboard from '~/components/Dashboard.vue'
import BookingsTable from '~/components/BookingsTable.vue'
import AddBookingForm from '~/components/AddBookingForm.vue'
import GuestsTable from '~/components/GuestsTable.vue'
import GuestAccountForm from '~/components/GuestAccountForm.vue'
import EmployeesTable from '~/components/EmployeesTable.vue'
import EmployeeAccountForm from '~/components/EmployeeAccountForm.vue'
import RentalUnitsTable from '~/components/RentalUnitsTable.vue'
import ReferralsView from '~/components/ReferralsView.vue'
import AddHotspotForm from '~/components/AddHotspotForm.vue'
import HotspotsTable from '~/components/HotspotsTable.vue'
// import ServiceRequests from '~/components/ServiceRequests.vue'
// import EmergencyInfo from '~/components/EmergencyInfo.vue'
// import EmergencyRequests from '~/components/EmergencyRequests.vue'

const viewStore = useViewStore()
const lastViewChange = ref('dashboard')

// Helper function to handle view changes and update the last view
const handleViewChange = (newView) => {
  lastViewChange.value = newView;
  viewStore.setView(newView);
};

// Log the initial view on mount
onMounted(() => {
  console.log(`Initial view is: ${viewStore.currentView}`);
});
</script>

<template>
  <div class="flex min-h-screen bg-gray-50">
    <Sidebar @changeView="handleViewChange" />
    <div class="flex-1 p-6 sm:p-8 space-y-6">
      <div class="fixed top-2 right-2 bg-gray-200 text-gray-800 px-3 py-1 rounded-md text-sm shadow">
        Last View Change: <span class="font-bold text-[#6b79c0]">{{ lastViewChange }}</span>
      </div>

      <Dashboard v-if="viewStore.currentView === 'dashboard'" @changeView="handleViewChange" />
      <ReferralsView v-if="viewStore.currentView === 'referrals'" @changeView="handleViewChange" />
      <RentalUnitsTable v-if="viewStore.currentView === 'rentalUnits'" @changeView="handleViewChange" />
      <AddBookingForm v-if="viewStore.currentView === 'addBookings'" @changeView="handleViewChange" />
      <BookingsTable v-if="viewStore.currentView === 'viewBookings'" @changeView="handleViewChange" />
      <GuestAccountForm v-if="viewStore.currentView === 'guestCreation'" @changeView="handleViewChange" />
      
      <GuestsTable v-if="viewStore.currentView === 'viewGuests'" @changeView="handleViewChange" />
      
      <EmployeeAccountForm v-if="viewStore.currentView === 'employeeCreation'" @changeView="handleViewChange" />
      <EmployeesTable v-if="viewStore.currentView === 'viewEmployees'" @changeView="handleViewChange" />
      <AddHotspotForm v-if="viewStore.currentView === 'addHotspots'" @changeView="handleViewChange" />
      <HotspotsTable v-if="viewStore.currentView === 'viewHotspots'" @changeView="handleViewChange" />
      
      <div v-if="viewStore.currentView === 'addService'" class="p-6 bg-white rounded-xl shadow">
          <h2 class="text-xl font-bold text-[#6b79c0]">Add Service</h2>
      </div>
      <div v-if="viewStore.currentView === 'serviceRequests'" class="p-6 bg-white rounded-xl shadow">
          <h2 class="text-xl font-bold text-[#6b79c0]">Service Requests</h2>
      </div>
      <div v-if="viewStore.currentView === 'emergencyInfo'" class="p-6 bg-white rounded-xl shadow">
          <h2 class="text-xl font-bold text-[#6b79c0]">Emergency Information</h2>
      </div>
      <div v-if="viewStore.currentView === 'emergencyRequests'" class="p-6 bg-white rounded-xl shadow">
          <h2 class="text-xl font-bold text-[#6b79c0]">Emergency Requests</h2>
      </div>
    </div>
  </div>
</template>
