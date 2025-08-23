<script setup>
import { ref, onMounted, watch } from 'vue'
import { Plus, Eye, EyeOff, Check, X } from 'lucide-vue-next'
const { $supabase } = useNuxtApp()

const emit = defineEmits(['changeView'])

const employeeAccounts = ref([
  {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    contactNo: '',
    status: 'Active'
  }
])

const passwordChecks = ref({
  length: false,
  lowercase: false,
  uppercase: false,
  digit: false,
  symbol: false
})

const nextEmployeeId = ref(1)

// const employee = ref({ password: '' })
const passwordError = ref('')

const validatePassword = (password) => {
  const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/
  return pattern.test(password)
}

watch(() => employeeAccounts.value[0]?.password, (newVal) => {
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


// New state variables for messages
const showSuccess = ref(false)
const errorMessage = ref('')

const clearMessages = () => {
  showSuccess.value = false
  errorMessage.value = ''
}

// Get the next employee ID on component mount
onMounted(async () => {
  await getNextEmployeeId()
})

const getNextEmployeeId = async () => {
  try {
    const { data, error } = await $supabase
      .from('employee')
      .select('employee_ID')
      .order('employee_ID', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Error fetching max employee_ID:', error)
      nextEmployeeId.value = 1 // Default to 1 if error
    } else if (data && data.length > 0) {
      nextEmployeeId.value = data[0].employee_ID + 1
    } else {
      nextEmployeeId.value = 1 // No employees exist yet
    }
  } catch (err) {
    console.error('Unexpected error:', err)
    nextEmployeeId.value = 1
  }
}

function allowOnlyDigits(event) {
  const invalidKeys = ['e', 'E', '+', '-', '.']
  if (invalidKeys.includes(event.key)) {
    event.preventDefault()
  }
}

function blockNumbers(event) {
  if (/\d/.test(event.key)) {
    event.preventDefault()
  }
}

function isValidEmployee(employee) {
  const { firstName, lastName, email, password, contactNo } = employee
  return (
    firstName.trim() &&
    lastName.trim() &&
    email.trim() &&
    password.trim() &&
    contactNo.trim()
  )
}

function isValidEmail(email) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailPattern.test(email)
}

watch(employeeAccounts, (employees) => {
  employees.forEach((employee) => {
    employee.firstName = capitalizeFirstLetter(employee.firstName)
    employee.lastName = capitalizeFirstLetter(employee.lastName)
  })
}, { deep: true })

function capitalizeFirstLetter(value) {
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1)
}

const handleSubmit = async (event) => {
  event.preventDefault();
  clearMessages(); // Clear any previous messages

  // Validate all employees before submitting
  const invalidEmployees = employeeAccounts.value.filter(employee => !isValidEmployee(employee))
  if (invalidEmployees.length > 0) {
    errorMessage.value = "Please fill in all required fields for employees."
    return
  }

  // Validate email formats
  const invalidEmails = employeeAccounts.value.filter(employee => !isValidEmail(employee.email))
  if (invalidEmails.length > 0) {
    errorMessage.value = "Please enter valid email addresses for employees."
    return
  }

  try {
    let currentEmployeeId = nextEmployeeId.value

    for (const employee of employeeAccounts.value) {
      const { data, error } = await $supabase.from('employee').insert([
        {
          employee_ID: currentEmployeeId,
          firstname: employee.firstName,
          lastname: employee.lastName,
          email: employee.email,
          password: employee.password,
          contactno: employee.contactNo,
          status: employee.status,
        }
      ]);

      if (error) {
        console.error("Supabase insert error:", error);
        errorMessage.value = "Failed to add employee: " + error.message;
        return;
      }

      console.log("Employee added:", data);
      currentEmployeeId++ // Increment for next employee
    }

    showSuccess.value = true;
    setTimeout(clearMessages, 3000);

    // Update nextEmployeeId for future additions
    nextEmployeeId.value = currentEmployeeId

    // Reset form after successful submission
    employeeAccounts.value = [{
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      contactNo: '',
      status: 'Active'
    }]
  } catch (err) {
    console.error("Unexpected error:", err);
    errorMessage.value = "Something went wrong!";
  }
};

const clearForm = () => {
  employeeAccounts.value = [{
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    contactNo: '',
    status: 'Active'
  }]
  clearMessages(); // Clear messages on form reset
}
const showPassword = ref(false)

</script>

<template>
  <div>
    <!-- Main Content -->
    <main class="flex-1 p-11 space-y-6">
      <!-- Breadcrumb -->
      <div class="text-sm text-gray-500">
        <span @click="emit('changeView', 'dashboard')" class="hover:underline cursor-pointer">
          Dashboard</span> /
        <span class="text-[#6b79c0] font-semibold">Add Employee Account</span>
      </div>

      <!-- Header -->
      <div class="border-b-1 border-gray-300 pb-3">
        <h2 class="text-2xl mb-1 font-bold text-[#6b79c0]">Add Employee Account</h2>
        <p class="text-gray-600">Create and manage employee accounts for system access.</p>
      </div>

      <transition name="fade">
        <div v-if="showSuccess"
          class="bg-green-100 border border-green-300 text-green-800 text-sm px-4 py-3 rounded-lg mb-6 max-w-3xl">
          ✅ Employee added successfully!
        </div>
      </transition>

      <transition name="fade">
        <div v-if="errorMessage"
          class="bg-red-100 border border-red-300 text-red-800 text-sm px-4 py-3 rounded-lg mb-6 max-w-3xl">
          ❌ {{ errorMessage }}
        </div>
      </transition>

      <!-- Main Panel -->
      <div class="bg-white p-6 rounded-lg shadow-sm max-w-3xl">
        <form class="space-y-8" @submit.prevent="handleSubmit">
          <div v-for="(employee, index) in employeeAccounts" :key="index" class="space-y-5 rounded-lg bg-white">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Left Column -->
              <div class="space-y-4">
                <div>
                  <label class="block text-gray-600 pb-2 text-sm">First Name <span class="text-red-500">*</span></label>
                  <input v-model="employee.firstName" type="text" placeholder="Enter first name" @keydown="blockNumbers"
                    class="w-full border bg-[#f8f8f8] border-gray-300 rounded px-3 py-2 focus:outline-none focus:bg-white duration-300" />
                </div>
                <div>
                  <label class="block text-gray-600 pb-2 text-sm">Last Name <span class="text-red-500">*</span></label>
                  <input v-model="employee.lastName" type="text" placeholder="Enter last name" @keydown="blockNumbers"
                    class="w-full border bg-[#f8f8f8] border-gray-300 rounded px-3 py-2 focus:outline-none focus:bg-white duration-300" />
                </div>
              </div>

              <!-- Right Column -->
              <div class="space-y-4">
                <div>
                  <label class="block text-gray-600 pb-2 text-sm">Contact Number <span
                      class="text-red-500">*</span></label>
                  <input v-model="employee.contactNo" type="text" pattern="[0-9]*" @keydown="allowOnlyDigits"
                    placeholder="Enter contact number"
                    class="w-full border bg-[#f8f8f8] border-gray-300 rounded px-3 py-2 focus:outline-none focus:bg-white duration-300" />
                </div>
                <div>
                  <label class="block text-gray-600 pb-2 text-sm">Email Address <span
                      class="text-red-500">*</span></label>
                  <input v-model="employee.email" type="email" placeholder="Enter email address"
                    class="w-full border bg-[#f8f8f8] border-gray-300 rounded px-3 py-2 focus:outline-none focus:bg-white duration-300" />
                </div>
              </div>
            </div>

            <div class="border-t pt-4 border-gray-200">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="relative">
                  <label class="block text-gray-600 pb-2 text-sm">
                    Password <span class="text-red-500">*</span>
                  </label>
                  <input v-model="employee.password" :type="showPassword ? 'text' : 'password'"
                    placeholder="Enter password"
                    class="w-full border bg-[#f8f8f8] border-gray-300 rounded px-3 py-2 pr-10 focus:outline-none focus:bg-white duration-300" />
                  <button type="button" @click="showPassword = !showPassword"
                    class="absolute right-3 top-[42px] text-gray-500 hover:text-gray-700">
                    <component :is="showPassword ? Eye : EyeOff" class="w-5 h-5" />
                  </button>
                  <!-- <p v-if="passwordError" class="text-sm text-red-500 mt-1">{{ passwordError }}</p> -->

                  <ul class="text-sm mt-2 space-y-1 text-gray-600">
                    <li class="flex items-center gap-2">
                      <span :class="passwordChecks.length ? 'text-green-600' : 'text-red-400'">
                        <component :is="passwordChecks.length ? Check : X" class="w-4 h-4" />
                      </span>
                      At least 8 characters
                    </li>
                    <li class="flex items-center gap-2">
                      <span :class="passwordChecks.lowercase ? 'text-green-600' : 'text-red-400'">
                        <component :is="passwordChecks.lowercase ? Check : X" class="w-4 h-4" />
                      </span>
                      Contains a lowercase letter
                    </li>
                    <li class="flex items-center gap-2">
                      <span :class="passwordChecks.uppercase ? 'text-green-600' : 'text-red-400'">
                        <component :is="passwordChecks.uppercase ? Check : X" class="w-4 h-4" />
                      </span>
                      Contains an uppercase letter
                    </li>
                    <li class="flex items-center gap-2">
                      <span :class="passwordChecks.digit ? 'text-green-600' : 'text-red-400'">
                        <component :is="passwordChecks.digit ? Check : X" class="w-4 h-4" />
                      </span>
                      Contains a number
                    </li>
                    <li class="flex items-center gap-2">
                      <span :class="passwordChecks.symbol ? 'text-green-600' : 'text-red-400'">
                        <component :is="passwordChecks.symbol ? Check : X" class="w-4 h-4" />
                      </span>
                      Contains a symbol (e.g. ! @ # $ %)
                    </li>
                  </ul>
                </div>

                <div>
                  <label class="block text-gray-600 pb-2 text-sm">Status</label>
                  <select v-model="employee.status"
                    class="w-full border bg-[#f8f8f8] border-gray-300 rounded px-3 py-2 focus:outline-none focus:bg-white duration-300">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Submit Buttons -->
          <div class="flex justify-end gap-2 pt-4">
            <button type="button" @click="clearForm"
              class="px-9 py-3 border cursor-pointer rounded-3xl font-semibold text-black hover:bg-gray-100">
              Clear
            </button>
            <button type="submit"
              class="flex items-center gap-2 px-10 py-3 bg-black cursor-pointer font-semibold text-white rounded-3xl hover:bg-gray-900">
              <Plus class="w-5 h-5" />Add
            </button>
          </div>
        </form>
      </div>
    </main>
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
