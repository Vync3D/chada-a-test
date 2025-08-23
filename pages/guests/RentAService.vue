<script setup>
import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, SearchX } from 'lucide-vue-next'
import MessageModal from '@/components/MessageModal.vue'
import { ref, computed, onMounted } from 'vue'
const { $supabase } = useNuxtApp()
const router = useRouter()
const dateFilter = ref('Sort: Newest First')
const statusFilter = ref('All Statuses')
const serviceFilter = ref('All Services')
const currentPage = ref(1)
const itemsPerPage = ref(5)

const myRequests = ref([])
const allServices = ref([])
const inHouseServices = ref([])
const thirdPartyServices = ref([])

const showModal = ref(false)
const modalType = ref('info')
const modalTitle = ref('')
const modalMessage = ref('')
const modalOnConfirm = ref(null)
watch([statusFilter, serviceFilter, dateFilter], () => {
  currentPage.value = 1
})

const confirmAction = ref(null)

function openModal({ type = 'info', title = '', message = '', onConfirm = null }) {
  modalType.value = type
  modalTitle.value = title
  modalMessage.value = message
  confirmAction.value = onConfirm
  showModal.value = true
}

function confirmModal() {
  if (confirmAction.value) {
    confirmAction.value()
    confirmAction.value = null // clear after use
  }
  showModal.value = false
}



function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function isPast(dateStr) {
  const [mm, dd, yy] = dateStr.split('/')
  const reqDate = new Date(`20${yy}-${mm}-${dd}`)
  const today = new Date()
  return reqDate < today
}

const selectedServiceId = ref(null)
const isExpanded = (service) => selectedServiceId.value === service.service_ID
const selectedService = ref(null)
const guest_ID = ref(null)
const formDetails = ref('')
const agree = ref(false)

const goBack = () => router.back()

const toggleService = (service) => {
  if (isExpanded(service)) {
    selectedService.value = null
    selectedServiceId.value = null
    formDetails.value = ''
    agree.value = false
  } else {
    selectedService.value = service
    selectedServiceId.value = service.service_ID
  }
}

const selectService = (service) => {
  selectedService.value = service
}

async function cancelRequest(requestId) {
  const { data, error } = await $supabase
    .from('servicerequest')
    .update({ status: 'cancelled' })
    .eq('srequest_ID', requestId)

  if (error) {
    console.error('❌ Failed to cancel request:', error)
    openModal({
      type: 'info',
      title: 'Cancellation Failed',
      message: 'There was an error canceling your request. Please try again.',
    })
    return
  }

  openModal({
    type: 'success',
    title: 'Request Canceled',
    message: `Request #${requestId} has been successfully canceled.`,
  })

  await fetchRequests()
}

const submitRequest = async () => {
  if (!selectedService.value || !formDetails.value || !agree.value) return

  const { data, error } = await $supabase.from('servicerequest').insert([
    {
      guest_ID: guest_ID.value,
      service_ID: selectedService.value.service_ID,
      comment: formDetails.value,
      status: 'pending',
    }
  ])

  if (error) {
    console.error('Failed to submit request:', error)
    openModal({
      type: 'danger',
      title: 'Submission Failed',
      message: 'There was an error submitting your request. Please try again.',
    })
    return
  }

  openModal({
    type: 'success',
    title: 'Request Submitted',
    message: 'Your service request has been successfully submitted!',
  })

  await fetchRequests()

  selectedService.value = null
  selectedServiceId.value = null
  formDetails.value = ''
  agree.value = false
}

const filteredRequests = computed(() => {
  let filtered = myRequests.value.filter(req => {
    const statusMatch = statusFilter.value === 'All Statuses' || req.status === statusFilter.value
    const serviceMatch = serviceFilter.value === 'All Services' || req.service === serviceFilter.value
    return statusMatch && serviceMatch
  })

  // Sort
  if (dateFilter.value === 'Sort: Newest First') {
    filtered.sort((a, b) => b.id - a.id)
  } else if (dateFilter.value === 'Sort: Oldest First') {
    filtered.sort((a, b) => a.id - b.id)
  }

  return filtered
})

const paginatedRequests = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredRequests.value.slice(start, end)
})

const totalPages = computed(() => Math.ceil(filteredRequests.value.length / itemsPerPage.value))

const fetchRequests = async () => {
  const { data: requests, error: requestError } = await $supabase
    .from('servicerequest')
    .select(`
      srequest_ID,
      guest_ID,
      service_ID,
      comment,
      status,
      rejectcomment,
      service:service_ID(servicename, provider)
    `)
    .eq('guest_ID', guest_ID.value)

  if (requestError) {
    console.error('❌ Failed to fetch requests:', requestError)
    return
  }

  myRequests.value = requests.map(req => ({
    id: req.srequest_ID, // Use the srequest_ID for sorting
    service: req.service?.servicename ?? 'Unknown Service',
    type: req.service?.provider === 'self' ? 'In-House Service' :
      req.service?.provider === 'other' ? 'Third-party Service' : 'Unknown Provider',
    status: capitalize(req.status),
    details: req.comment,
    expanded: false,
  }))
}

onMounted(async () => {
  const storedGuestId = localStorage.getItem('user_id')
  const guestId = storedGuestId ? parseInt(storedGuestId) : null

  if (!guestId || isNaN(guestId)) {
    console.error('Invalid guest_ID:', storedGuestId)
    return
  }

  guest_ID.value = guestId

  const { data: services, error: serviceError } = await $supabase.from('service').select('*')
  if (serviceError) {
    console.error('Failed to fetch services:', serviceError)
    return
  }
  allServices.value = services
  inHouseServices.value = services.filter(service => service.provider === 'self')
  thirdPartyServices.value = services.filter(service => service.provider === 'other')

  await fetchRequests()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <!-- Header -->
      <div class="flex items-center mb-2 sm:mb-8">
        <button @click="goBack" class="mr-3 p-2 rounded-full hover:bg-gray-200 transition" aria-label="Go Back">
          <ArrowLeft class="text-black w-6 h-6 sm:w-7 sm:h-7" />
        </button>
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-[#6b79c0]">Rent A Service</h1>
        </div>
      </div>

      <div class="grid md:grid-cols-2 gap-8 md:gap-9">
        <!-- LEFT COLUMN: Services -->
        <div>
          <h2 class="text-lg font-bold">Choose a service to request</h2>

          <!-- SERVICE GROUPS -->
          <div v-for="(group, idx) in [
            { label: 'In-House Services', desc: 'Services offered directly by the management.', services: inHouseServices },
            { label: 'Third-party Services', desc: 'Service is provided by a third party, but the management can help coordinate it for your convenience.', services: thirdPartyServices }
          ]" :key="idx">
            <p class="font-bold text-gray-800 mt-3 mb-1">{{ group.label }}</p>
            <p class="text-gray-500 mb-5">{{ group.desc }}</p>

            <div v-for="service in group.services" :key="service.service_ID" class="mb-4">
              <label @click="toggleService(service)"
                class="w-full px-4 py-3 rounded-xl border cursor-pointer transition flex items-center justify-between hover:shadow-md hover:border-[#6c7ac1]/70 hover:ring-1 hover:ring-[#6c7ac1]/50"
                :class="{
                  'border-[#6c7ac1] ring-2 ring-[#6c7ac1]  bg-[#f9faff]': isExpanded(service),
                  'border-gray-300 bg-white': !isExpanded(service),
                }">
                <div class="flex items-center gap-3">
                  <span class="h-4 w-4 rounded-full border border-gray-400 flex items-center justify-center transition"
                    :class="{
                      'bg-[#6c7ac1] border-[#6c7ac1]': isExpanded(service),
                    }"></span>
                  <span class="font-bold transition" :class="{
                    'text-[#6c7ac1]': isExpanded(service),
                    'text-[#6c7ac1] ': !isExpanded(service),
                  }">
                    {{ service.servicename }}
                  </span>
                </div>
                <ChevronDown :class="{ 'rotate-180': isExpanded(service) }"
                  class="w-4 h-4 transition-transform text-gray-400" />
              </label>

              <!-- Animated Request Form -->
              <Transition name="fade-slide">
                <div v-if="isExpanded(service)"
                  class="mt-3 bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow space-y-4">
                  <h3 class="text-md font-bold text-gray-700">
                    Request Details for {{ service.servicename }}
                  </h3>

                  <div>
                    <label class="block  font-bold text-gray-700 mb-2">
                      Details <span class="text-red-500">*</span>
                    </label>
                    <textarea v-model="formDetails" rows="4"
                      class="w-full border border-gray-300 rounded-lg p-3  resize-none"
                      placeholder="Write your request details..." />
                  </div>

                  <div class="flex items-start gap-2 ">
                    <input type="checkbox" id="agree" v-model="agree" class="accent-[#6c7ac1] mt-1" />
                    <label for="agree">
                      I have read and agree to the
                      <NuxtLink to="/guests/termsconditions" class="text-[#6c7ac1] underline">
                        service request terms and conditions
                      </NuxtLink>.
                    </label>
                  </div>

                  <button @click="submitRequest" :disabled="!agree || !formDetails"
                    class="w-full bg-[#6c7ac1] text-white rounded-full py-3 font-medium transition disabled:opacity-50 hover:bg-[#5a66af]">
                    Submit Request
                  </button>
                </div>
              </Transition>
            </div>
          </div>
        </div>

        <!-- RIGHT: My Requests -->
        <div class="mt-2 md:mt-0">
          <h2 class="text-lg font-bold mb-2 sm:mb-4">My Requests</h2>

          <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
            <div class="flex sm:flex-row items-end sm:items-center gap-2">
              <select v-model="dateFilter"
                class="filter border border-gray-300 rounded-md px-3 py-2  text-gray-700 w-full sm:w-auto">
                <option>Sort: Newest First</option>
                <option>Sort: Oldest First</option>
              </select>
              <select v-model="statusFilter"
                class="filter border border-gray-300 rounded-md px-3 py-2  text-gray-700 w-full sm:w-auto">
                <option>All Statuses</option>
                <option>Approved</option>
                <option>Rejected</option>
                <option>Pending</option>
                <option>Cancelled</option>
              </select>
              <select v-model="serviceFilter"
                class="filter border border-gray-300 rounded-md px-3 py-2  text-gray-700 w-full sm:w-auto">
                <option>All Services</option>
                <option v-for="service in allServices" :key="service.service_ID">
                  {{ service.servicename }}
                </option>
              </select>
            </div>
          </div>
              <div class="flex items-center mb-3 gap-2">
                <label for="perPage">Show</label>
                <select id="perPage" v-model.number="itemsPerPage"
                  class="filter border border-gray-300 rounded-md px-2 py-1  text-gray-700">
                  <option :value="5">5</option>
                  <option :value="10">10</option>
                  <option :value="20">20</option>
                  <option :value="50">50</option>
                </select>
                <span>per page</span>
              </div>

          <div class="space-y-2"> <!-- smaller vertical spacing -->
            <div v-if="paginatedRequests.length">
              <div v-for="(req, index) in paginatedRequests" :key="index" @click="req.expanded = !req.expanded"
                class="rounded-lg border transition cursor-pointer mb-2 p-2 sm:p-4" :class="{
                  'border-[#6c7ac1] ring-2 ring-[#6c7ac1] bg-white': req.expanded,
                  'border-gray-300 bg-white hover:shadow-sm hover:border-[#6c7ac1]/60 hover:ring-1 hover:ring-[#6c7ac1]/30':
                    !req.expanded,
                }">
                <!-- Header -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                  <div class="w-full">
                    <!-- Top: Status + ID -->
                    <div class="flex justify-between items-center mb-1">
                      <p class="text-xs font-medium px-2 py-0.5 rounded-md" :class="{
                        'text-green-600 bg-green-50': req.status === 'Approved',
                        'text-red-500 bg-red-50': req.status === 'Rejected',
                        'text-gray-500 bg-gray-50': req.status === 'Pending',
                        'text-gray-500 bg-gray-200': req.status === 'Cancelled',

                      }">
                        {{ req.status }}
                      </p>
                      <p class="text-xs text-gray-400 font-medium">
                        Request #{{ req.id }}
                      </p>
                    </div>

                    <!-- Service + Type -->
                    <div class="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                      <p class="text-[#6c7ac1] font-bold  sm:text-base">
                        {{ req.service }}
                      </p>
                      <p class="text-xs text-gray-500">{{ req.type }}</p>
                    </div>
                  </div>

                  <!-- Chevron -->
                  <ChevronDown :class="{ 'rotate-180': req.expanded }"
                    class="w-4 h-4 text-gray-400 transition-transform" />
                </div>

                <!-- Expanded -->
                <div v-if="req.expanded" class="mt-3 pt-2 border-t border-gray-200  space-y-2">
                  <p class="text-gray-500 text-sm font-bold">Your Request Details</p>
                  <p class="text-sm text-gray-700">
                    {{ req.details ? `"${req.details}"` : 'No additional details provided.' }}
                  </p>
                  <button v-if="req.status === 'Pending'" @click.stop="openModal({
                    type: 'danger',
                    title: 'Cancel Request?',
                    message: `Are you sure you want to cancel Request #${req.id}? This action cannot be undone.`,
                    onConfirm: () => cancelRequest(req.id)
                  })" class="bg-gray-100 text-gray-600 px-3 py-2 rounded text-xs hover:bg-gray-200 transition">
                    Cancel Request
                  </button>
                </div>

              </div>
            </div>
            <!-- No Results Message -->
            <div v-else class="flex flex-col items-center justify-center text-center text-gray-500 py-12">
              <SearchX class="w-10 h-10 mb-3 text-gray-500" />
              <p class="font-semibold">No service requests found</p>
              <p class=" text-gray-500">Try adjusting your filters or check back later.</p>
            </div>
          </div>

          <!-- Pagination Controls -->
          <div class="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 sm:gap-4 mt-6">
              <!-- Previous button -->
              <button @click="currentPage--" :disabled="currentPage === 1" :class="[
                'p-3 rounded-full border border-gray-300 shadow-sm transition-all duration-300 ease-in-out',
                currentPage === 1
                  ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                  : 'text-gray-600 bg-white hover:bg-[#6c7ac1] hover:text-white hover:border-[#6c7ac1] hover:shadow-md'
              ]" aria-label="Previous Page">
                <ChevronLeft class="w-4 h-4" />
              </button>
              <div class="flex flex-wrap gap-1 sm:gap-2">
                <button v-for="page in totalPages" :key="page" @click="currentPage = page" :class="[
                  'px-4 py-2 rounded-full font-medium transition-colors duration-200',
                  page === currentPage
                    ? 'bg-[#6c7ac1] text-white shadow-md'
                    : 'text-gray-600 bg-white hover:bg-gray-100 hover:text-gray-800'
                ]">
                  {{ page }}
                </button>
              </div>

              <!-- Next button -->
              <button @click="currentPage++" :disabled="currentPage === totalPages" :class="[
                'p-3 rounded-full border border-gray-300 shadow-sm transition-all duration-300 ease-in-out',
                currentPage === totalPages
                  ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                  : 'text-gray-600 bg-white hover:bg-[#6c7ac1] hover:text-white hover:border-[#6c7ac1] hover:shadow-md'
              ]" aria-label="Next Page">
                <ChevronRight class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <MessageModal v-if="showModal" :show="showModal" :type="modalType" :title="modalTitle" :message="modalMessage"
      @confirm="confirmModal" @close="showModal = false" />
  </div>
</template>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>