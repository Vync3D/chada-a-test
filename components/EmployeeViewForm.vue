<script setup>
import { useRoute } from 'vue-router'
import { onMounted, ref, watch, computed } from 'vue'
import { Trash2, Check, X, Eye, EyeOff, Pencil, ArrowLeft } from 'lucide-vue-next'

const props = defineProps({
  employee: {
    type: Object,
    default: null
  }
})

const route = useRoute()
const emit = defineEmits(['changeView', 'back', 'employeeUpdated'])
const { $supabase } = useNuxtApp()
const showPassword = ref(false)
const isEditing = ref(false)
const isLoading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const employee = ref(null)
const passwordChecks = ref({
  length: false,
  lowercase: false,
  uppercase: false,
  digit: false,
  symbol: false
})

watch(() => employee.value?.password, (newVal) => {
  if (!newVal) {
    passwordChecks.value = {
      length: false,
      lowercase: false,
      uppercase: false,
      digit: false,
      symbol: false
    }
    return
  }

  const lengthValid = newVal.length >= 8

  passwordChecks.value = {
    length: lengthValid,
    lowercase: lengthValid ? /[a-z]/.test(newVal) : false,
    uppercase: lengthValid ? /[A-Z]/.test(newVal) : false,
    digit: lengthValid ? /\d/.test(newVal) : false,
    symbol: lengthValid ? /[\W_]/.test(newVal) : false
  }
})

const employeeId = computed(() => {
  const routeId = Number(route.params.id)
  const propId = Number(props.employee?.employee_ID)

  if (!isNaN(routeId) && routeId > 0) {
    return routeId
  }

  if (!isNaN(propId) && propId > 0) {
    return propId
  }

  return null
})

// Function to fetch a single employee's data
const fetchEmployeeData = async () => {
  const idToFetch = employeeId.value
  if (!idToFetch) {
    console.error('No valid employee ID to fetch.')
    employee.value = null
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const { data, error } = await $supabase
      .from('employee')
      .select('*')
      .eq('employee_ID', idToFetch)
      .single()

    if (error) {
      console.error('Failed to load employee:', error)
      errorMessage.value = `Failed to load employee: ${error.message}`
      employee.value = null
    } else {
      employee.value = {
        employee_ID: data.employee_ID,
        firstName: data.firstname || '',
        lastName: data.lastname || '',
        email: data.email || '',
        password: data.password || '',
        contactNo: data.contactno || data.contactNo || '',
        status: data.status || 'Active',
      }
    }
  } catch (err) {
    console.error('An unexpected error occurred:', err)
    errorMessage.value = 'An unexpected error occurred while fetching data.'
  } finally {
    isLoading.value = false
  }
}


// Watch for prop changes and update local state
watch(() => props.employee, (newEmployee) => {
  if (newEmployee) {
    employee.value = {
      employee_ID: newEmployee.employee_ID,
      firstName: newEmployee.firstname || '',
      lastName: newEmployee.lastname || '',
      email: newEmployee.email || '',
      password: newEmployee.password || '',
      contactNo: newEmployee.contactno || '',
      status: newEmployee.status || 'Active',
    }
    // Disable editing when a new employee is selected
    isEditing.value = false;
  }
}, { immediate: true })

const enableEdit = () => {
  isEditing.value = true
}

const cancelEdit = () => {
  isEditing.value = false
  // Reset data to original values by re-fetching
  fetchEmployeeData()
}

const saveEmployee = async () => {
  if (!employee.value) return

  errorMessage.value = '' // Clear any previous errors

  // Basic validation
  if (!employee.value.firstName || !employee.value.lastName || !employee.value.email || !employee.value.contactNo) {
    errorMessage.value = 'Please fill in all required fields.'
    return
  }

  const validEmployeeId = employeeId.value
  if (!validEmployeeId) {
    errorMessage.value = 'Invalid employee ID. Cannot update employee.'
    return
  }

  const allValid = Object.values(passwordChecks.value).every(Boolean)

  if (!allValid) {
    errorMessage.value = 'Password does not meet the strength requirements.'
    return
  }

  const updateData = {
    firstname: employee.value.firstName,
    lastname: employee.value.lastName,
    email: employee.value.email,
    password: employee.value.password,
    contactno: employee.value.contactNo,
    status: employee.value.status,
  }

  isLoading.value = true
  successMessage.value = ''

  try {
    const { error } = await $supabase
      .from('employee')
      .update(updateData)
      .eq('employee_ID', validEmployeeId)
      .select()

    if (error) {
      console.error('Supabase error details:', error)
      errorMessage.value = `Failed to update employee: ${error.message}`
    } else {
      isEditing.value = false
      successMessage.value = 'Employee updated successfully!'
      // Clear the message after a delay without navigating back
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    }
  } catch (error) {
    console.error('Error updating employee:', error)
    errorMessage.value = `An error occurred: ${error.message}`
  } finally {
    isLoading.value = false
  }
}

const clearAllFields = () => {
  if (!employee.value) return
  // Clear all input fields but keep the employee_ID
  employee.value = {
    employee_ID: employee.value.employee_ID, // Keep the ID
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    contactNo: '',
    status: 'Active',
  }
}

// Fetch data on component mount if a valid ID exists
onMounted(() => {
  if (employeeId.value) {
    fetchEmployeeData()
  }
})
</script>

<template>
  <div class="min-h-screen">
    <div class="max-w-6xl">
      <div class="space-y-6 ">
        <!-- Breadcrumb -->
        <div class="text-sm text-gray-500">
          <span @click="emit('changeView', 'dashboard')" class="hover:underline cursor-pointer">
            Dashboard</span> /
          <!-- The breadcrumb now correctly emits the 'back' event to return to the parent component's view -->
          <span @click="emit('back')" class="hover:underline cursor-pointer">
            View Employee Accounts</span> /
          <span class="text-[#6b79c0] font-semibold">Account Details</span>
        </div>

        <!-- Header -->
        <div class="border-b border-gray-300 pb-3">
          <div class="flex items-center text-2xl font-bold text-[#6b79c0]">
            <!-- The back button now correctly emits the 'back' event -->
            <button @click="emit('back')" class="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
              <ArrowLeft class="text-gray-600 w-7 h-7" />
            </button>
            <h2 class="mb-1 pl-3">Employee Account Details</h2>
          </div>
          <p class="text-gray-600 mt-1">Manage employee account information and access permissions.</p>
        </div>

        <!-- Main Panel -->
        <div class="bg-white p-6 rounded-lg shadow-sm">
          <div v-if="isLoading" class="text-center p-8 text-gray-500">
            Loading employee details...
          </div>
          <div v-else-if="!employee" class="text-center p-8 text-gray-500">
            No employee data found.
          </div>
          <form v-else @submit.prevent="saveEmployee" class="space-y-8">
            <!-- Inline Success Message -->
            <div v-if="successMessage"
              class="bg-green-100 border-l-4 border-green-500 text-green-800 p-4 rounded-lg shadow-md" role="alert">
              <div class="flex items-center">
                <Check class="w-6 h-6 mr-2" />
                <p class="font-medium">{{ successMessage }}</p>
              </div>
            </div>

            <!-- Inline Error Message -->
            <div v-if="errorMessage" class="bg-red-100 border-l-4 border-red-500 text-red-800 p-4 rounded-lg shadow-md"
              role="alert">
              <div class="flex items-center">
                <svg class="w-6 h-6 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg">
                  <path fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clip-rule="evenodd"></path>
                </svg>
                <p class="font-medium">{{ errorMessage }}</p>
              </div>
            </div>

            <div class="space-y-5 rounded-lg bg-white">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Left Column -->
                <div class="space-y-4">
                  <div>
                    <label class="block text-gray-600 pb-2 text-sm">First Name <span
                        class="text-red-500">*</span></label>
                    <input v-model="employee.firstName" type="text" :disabled="!isEditing"
                      placeholder="Enter first name" :class="[
                        'w-full border border-gray-300 rounded px-3 py-2 focus:outline-none transition-colors duration-300',
                        isEditing ? 'bg-white focus:border-[#6b79c0]' : 'bg-gray-100'
                      ]" />
                  </div>
                  <div>
                    <label class="block text-gray-600 pb-2 text-sm">Last Name <span
                        class="text-red-500">*</span></label>
                    <input v-model="employee.lastName" type="text" :disabled="!isEditing" placeholder="Enter last name"
                      :class="[
                        'w-full border border-gray-300 rounded px-3 py-2 focus:outline-none transition-colors duration-300',
                        isEditing ? 'bg-white focus:border-[#6b79c0]' : 'bg-gray-100'
                      ]" />
                  </div>
                  <div>
                    <label class="block text-gray-600 pb-2 text-sm">Contact Number <span
                        class="text-red-500">*</span></label>
                    <input v-model="employee.contactNo" type="text" :disabled="!isEditing"
                      placeholder="Enter contact number" :class="[
                        'w-full border border-gray-300 rounded px-3 py-2 focus:outline-none transition-colors duration-300',
                        isEditing ? 'bg-white focus:border-[#6b79c0]' : 'bg-gray-100'
                      ]" />
                  </div>
                </div>

                <!-- Right Column -->
                <div class="space-y-4">
                  <div>
                    <label class="block text-gray-600 pb-2 text-sm">Email Address <span
                        class="text-red-500">*</span></label>
                    <input v-model="employee.email" type="email" :disabled="!isEditing"
                      placeholder="Enter email address" :class="[
                        'w-full border border-gray-300 rounded px-3 py-2 focus:outline-none transition-colors duration-300',
                        isEditing ? 'bg-white focus:border-[#6b79c0]' : 'bg-gray-100'
                      ]" />
                  </div>
                  <div class="relative">
                    <label class="block text-gray-600 pb-2 text-sm">
                      Password <span class="text-red-500">*</span>
                    </label>
                    <input v-model="employee.password" :type="showPassword ? 'text' : 'password'" :disabled="!isEditing"
                      placeholder="Enter password" :class="[
                        'w-full border border-gray-300 rounded px-3 py-2 pr-10 focus:outline-none transition-colors duration-300',
                        isEditing ? 'bg-white focus:border-[#6b79c0]' : 'bg-gray-100'
                      ]" />
                    <button type="button" v-if="isEditing" @click="showPassword = !showPassword"
                      class="absolute top-10 right-4 text-gray-500 hover:text-gray-700">
                      <component :is="showPassword ? Eye : EyeOff" class="w-5 h-5" />
                    </button>
                  </div>

                  <ul v-if="isEditing" class="text-sm mt-2 space-y-1 text-gray-600">
                    <li class="flex items-center gap-2">
                      <span :class="passwordChecks.length ? 'text-green-600' : 'text-gray-400'">
                        <component :is="passwordChecks.length ? Check : X" class="w-4 h-4" />
                      </span>
                      At least 8 characters
                    </li>
                    <li class="flex items-center gap-2">
                      <span :class="passwordChecks.lowercase ? 'text-green-600' : 'text-gray-400'">
                        <component :is="passwordChecks.lowercase ? Check : X" class="w-4 h-4" />
                      </span>
                      Contains lowercase letter
                    </li>
                    <li class="flex items-center gap-2">
                      <span :class="passwordChecks.uppercase ? 'text-green-600' : 'text-gray-400'">
                        <component :is="passwordChecks.uppercase ? Check : X" class="w-4 h-4" />
                      </span>
                      Contains uppercase letter
                    </li>
                    <li class="flex items-center gap-2">
                      <span :class="passwordChecks.digit ? 'text-green-600' : 'text-gray-400'">
                        <component :is="passwordChecks.digit ? Check : X" class="w-4 h-4" />
                      </span>
                      Contains a number
                    </li>
                    <li class="flex items-center gap-2">
                      <span :class="passwordChecks.symbol ? 'text-green-600' : 'text-gray-400'">
                        <component :is="passwordChecks.symbol ? Check : X" class="w-4 h-4" />
                      </span>
                      Contains a symbol (e.g. ! @ # $ %)
                    </li>
                  </ul>

                  <div>
                    <label class="block text-gray-600 pb-2 text-sm">Status</label>
                    <select v-model="employee.status" :disabled="!isEditing" :class="[
                      'w-full border border-gray-300 rounded px-3 py-2 focus:outline-none transition-colors duration-300',
                      isEditing ? 'bg-white focus:border-[#6b79c0]' : 'bg-gray-100'
                    ]">
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <!-- Submit Buttons -->
            <div class="flex justify-end gap-2 pt-4">
              <!-- Edit Button - Only show when not editing -->
              <button type="button" @click="enableEdit"
                class="flex items-center gap-2 px-6 py-3 bg-black cursor-pointer rounded-full font-semibold text-white hover:bg-gray-900 transition-colors"
                v-if="!isEditing">
                <Pencil class="w-5 h-5" />Edit
              </button>

              <!-- Clear Button - Only show when editing -->
              <button type="button" @click="clearAllFields"
                class="flex items-center gap-2 px-6 py-3 bg-red-600 cursor-pointer rounded-full font-semibold text-white hover:bg-red-700 transition-colors"
                v-if="isEditing">
                <Trash2 class="w-5 h-5" />Clear
              </button>

              <!-- Cancel Button - Only show when editing -->
              <button type="button" @click="cancelEdit"
                class="flex items-center gap-2 px-6 py-3 border cursor-pointer rounded-full font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                v-if="isEditing">
                Cancel
              </button>

              <!-- Save Button - Only show when editing -->
              <button type="submit" :disabled="isLoading"
                class="flex items-center gap-2 px-6 py-3 bg-green-600 cursor-pointer font-semibold text-white rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                v-if="isEditing">
                <Check class="w-5 h-5" />
                {{ isLoading ? 'Saving...' : 'Save' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
