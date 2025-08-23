<script setup>
import { Plus, Search, ArrowUp, ArrowDown } from 'lucide-vue-next'
import { onMounted, ref, computed } from 'vue'
import EmployeeViewForm from './EmployeeViewForm.vue'

const { $supabase } = useNuxtApp()
const emit = defineEmits(['changeView'])

const employeeAccounts = ref([])
const selectedEmployee = ref(null)
const searchQuery = ref('')
const sortOrder = ref('desc')
const statusFilter = ref('all')

// Function to fetch all employees from the database
const fetchEmployees = async () => {
    try {
        const { data, error } = await $supabase.from('employee').select('*')
        if (error) {
            console.error('Error fetching employees:', error)
        } else {
            employeeAccounts.value = data
        }
    } catch (err) {
        console.error('An unexpected error occurred:', err)
    }
}

// Fetch employees when the component is mounted
onMounted(() => {
    fetchEmployees()
})

const filteredEmployees = computed(() => {
    let filtered = employeeAccounts.value.filter(employee =>
        `${employee.firstname} ${employee.lastname}`.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        employee.email?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        employee.contactno?.includes(searchQuery.value)
    )

    if (statusFilter.value !== 'all') {
        filtered = filtered.filter(employee => (employee.status || 'Inactive') === statusFilter.value)
    }

    // Sort the filtered list
    filtered = filtered.sort((a, b) => {
        if (sortOrder.value === 'desc') {
            return b.employee_ID - a.employee_ID;
        }
        return a.employee_ID - b.employee_ID;
    });

    return filtered
})

const toggleSortOrder = () => {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}

const toggleStatus = async (employee, event) => {
    // Prevent the click from bubbling up and triggering viewEmployee
    event.stopPropagation()

    const newStatus = employee.status === 'Active' ? 'Inactive' : 'Active'

    try {
        const { error } = await $supabase
            .from('employee')
            .update({ status: newStatus })
            .eq('employee_ID', employee.employee_ID)

        if (error) {
            console.error('Error updating employee status:', error)
            // Revert the local state on error
            employee.status = employee.status === 'Active' ? 'Inactive' : 'Active'
        } else {
            // Update the local state to reflect the change
            employee.status = newStatus
        }
    } catch (err) {
        console.error('An unexpected error occurred:', err)
    }
}

function viewEmployee(employee) {
    selectedEmployee.value = { ...employee }
}

// This function is now correctly triggered by the 'back' event from EmployeeViewForm
function backToTable() {
    selectedEmployee.value = null
}

// Handler for when the child form updates an employee
const onEmployeeUpdated = () => {
    // Instead of updating the local array, we now re-fetch all employees.
    // This ensures the table data is always in sync with the database.
    fetchEmployees();
    // Set the selectedEmployee to null to return to the list view
    selectedEmployee.value = null;
}

// A new, dedicated method to handle and re-emit the 'changeView' event from the child component
const handleChildViewChange = (newView) => {
    emit('changeView', newView);
}
</script>

<template>
    <div class="p-11 space-y-6">
        <div v-if="!selectedEmployee">
            <!-- Breadcrumb -->
            <div class="text-sm text-gray-500">
                <span @click="emit('changeView', 'dashboard')" class="hover:underline cursor-pointer">Dashboard</span> /
                <span class="text-[#6b79c0] font-semibold">View Employee Accounts</span>
            </div>

            <!-- Header -->
            <div
                class="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b mb-4 border-gray-200 pb-4">
                <div class="mb-4 sm:mb-0">
                    <h2 class="text-2xl font-bold text-[#6b79c0] pt-6">View Employee Accounts</h2>
                    <p class="text-gray-600 mt-2">Manage employee accounts and access permissions. Select an employee from
                        the list to edit details.</p>
                </div>
                <button type="button" @click="emit('changeView', 'employeeCreation')"
                    class="flex items-center gap-2 px-6 py-3 bg-black text-white font-semibold rounded-full shadow-md hover:bg-gray-800 transition-colors duration-300">
                    <Plus class="w-5 h-5" /> Add New Employee
                </button>
            </div>

            <!-- Search Bar and Filters -->
            <div
                class="bg-white rounded-xl p-3 flex flex-col border border-gray-200 sm:flex-row sm:items-center sm:justify-between gap-4">
                <div class="relative w-full sm:max-w-md">
                    <input v-model="searchQuery" type="text" placeholder="Search by Name, Email, or Contact..."
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
                class="mt-6 px-5 py-4 uppercase tracking-wider grid grid-cols-5 font-semibold text-sm text-gray-500 border-b border-gray-200">
                <span>Employee Name</span>
                <span>Email Address</span>
                <span>Contact No.</span>
                <span>Employee ID</span>
                <span>Status</span>
            </div>

            <!-- Empty state -->
            <div v-if="filteredEmployees.length === 0"
                class="flex flex-col items-center justify-center gap-2 py-12 text-gray-500">
                <Search class="w-10 h-10 text-gray-300" />
                <p class="text-center text-sm">No results found for "<span class="font-semibold text-[#6b79c0]">{{
                        searchQuery }}</span>"</p>
            </div>

            <div v-for="employee in filteredEmployees" :key="employee.employee_ID" @click="viewEmployee(employee)"
                class="group bg-white rounded-xl my-2 border border-gray-200 hover:shadow-lg grid px-5 grid-cols-5 items-center text-sm text-gray-700 py-4 transition duration-300 cursor-pointer">
                <span class="font-bold text-gray-900 duration-200 group-hover:text-[#6b79c0]">
                    {{ employee.firstname }} {{ employee.lastname }}
                </span>
                <span>{{ employee.email }}</span>
                <span>{{ employee.contactno }}</span>
                <span class="font-medium text-[#6b79c0]">{{ employee.employee_ID }}</span>
                <span>
                    <button @click.stop="toggleStatus(employee, $event)"
                        :class="employee.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'"
                        class="px-3 py-1 rounded-full text-xs font-medium transition-colors duration-300">
                        {{ employee.status || 'Inactive' }}
                    </button>
                </span>
            </div>
        </div>
        <div v-else>
            <EmployeeViewForm :employee="selectedEmployee" @back="backToTable" @employee-updated="onEmployeeUpdated"
                @changeView="handleChildViewChange" />
        </div>
    </div>
</template>
