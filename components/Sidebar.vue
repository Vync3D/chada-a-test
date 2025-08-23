<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import {
    ChartNoAxesCombined, Star, MapPinHouse, HousePlus, CarFront, CalendarDays, UserPlus,
    Users, MapPinPlus, MapPinned, Mails, Phone, Siren, PanelRightClose, PanelRightOpen,
    UserSearch, LogOut
} from 'lucide-vue-next'
import { useAuth } from '~/composables/useAuth.js'

const { logout } = useAuth()
const isCollapsed = ref(false)
const route = useRoute()
const router = useRouter()
const emit = defineEmits(['changeView'])

</script>

<template>
    <div>
        <!-- Sidebar -->
        <aside
            :class="['bg-white shadow-sm p-4 min-h-full space-y-4 transition-all duration-300', isCollapsed ? 'w-25' : 'w-77 pl-5']">

            <!-- Logo & Toggle -->
            <div class="flex items-left justify-center border-b pb-4 border-gray-200">
                <div class="flex items-center space-x-5">
                    <button @click="emit('changeView', 'dashboard')" type="button"
                        class="bg-transparent border-none cursor-pointer flex items-center">
                        <img src="/logo.png" alt="Logo" title="CHADA-A" class="w-11 h-11 object-contain" />
                    </button>

                    <div v-if="!isCollapsed" class="mr-3">
                        <p class="text-sm text-[#6b79c0]">Samson’s Cozy Homestay</p>
                        <h1 class="text-xl font-bold text-[#6b79c0]">Management</h1>

                    </div>
                </div>
                <button @click="isCollapsed = !isCollapsed"
                    class="text-gray-400 ml-2 cursor-pointer hover:text-[#6b79c0] transition">
                    <component :is="isCollapsed ? PanelRightClose : PanelRightOpen" class="gap-2 w-5 h-5" />
                </button>
            </div>

            <!-- Menu -->
            <nav class="space-y-2 text-sm ">
                <!-- Dashboard -->
                <ul class="space-y-1 pb-2 border-gray-200" :class="isCollapsed ? 'border-b' : ''">
                    <li class="text-xs uppercase  text-gray-400 tracking-widest pl-[2px]" v-if="!isCollapsed">
                        Dashboard
                    </li>
                    <li>
                        <button @click="emit('changeView', 'dashboard')" type="button" :class="[
                            'flex items-center hover:text-[#6b79c0] font-semibold px-2 py-3 hover:rounded-lg hover:bg-[#f1f1f8] duration-200 w-full text-left',
                            isCollapsed ? 'justify-center' : 'space-x-2'
                        ]">
                            <ChartNoAxesCombined class="w-5 h-5" />
                            <span v-if="!isCollapsed">Dashboard</span>
                        </button>
                    </li>
                    <li>
                        <button @click="emit('changeView', 'referrals')" type="button" :class="[
                            'flex items-center hover:text-[#6b79c0] font-semibold px-2 py-3 hover:rounded-lg hover:bg-[#f1f1f8] duration-200 w-full text-left',
                            isCollapsed ? 'justify-center' : 'space-x-2'
                        ]">
                            <Star class="w-5 h-5" />
                            <span v-if="!isCollapsed">Referrals</span>
                        </button>
                    </li>
                </ul>

                <!-- Bookings -->
                <ul class="space-y-1 pb-2 border-gray-200" :class="isCollapsed ? 'border-b' : ''">
                    <li class="text-xs uppercase text-gray-400 tracking-widest pl-[2px]" v-if="!isCollapsed">Bookings
                    </li>
                    <li>
                        <button @click="emit('changeView', 'rentalUnits')" type="button" :class="[
                            'flex items-center hover:text-[#6b79c0] font-semibold px-2 py-3 hover:rounded-lg hover:bg-[#f1f1f8] duration-200 w-full text-left',
                            isCollapsed ? 'justify-center' : 'space-x-2'
                        ]">
                            <MapPinHouse class="w-5 h-5" />
                            <span v-if="!isCollapsed">Rental Units</span>
                        </button>
                    </li>
                    <li>
                        <button @click="emit('changeView', 'addBookings')" type="button" :class="[
                            'flex items-center hover:text-[#6b79c0] font-semibold px-2 py-3 hover:rounded-lg hover:bg-[#f1f1f8] duration-200 w-full text-left',
                            isCollapsed ? 'justify-center' : 'space-x-2'
                        ]">
                            <HousePlus class="w-5 h-5" />
                            <span v-if="!isCollapsed">Add Booking Information</span>
                        </button>
                    </li>
                    <li>
                        <button @click="emit('changeView', 'viewBookings')" type="button" :class="[
                            'flex items-center hover:text-[#6b79c0] font-semibold px-2 py-3 hover:rounded-lg hover:bg-[#f1f1f8] duration-200 w-full text-left',
                            isCollapsed ? 'justify-center' : 'space-x-2'
                        ]">
                            <CalendarDays class="w-5 h-5" />
                            <span v-if="!isCollapsed">View Bookings</span>
                        </button>
                    </li>
                </ul>

                <!-- Guests -->
                <ul class="space-y-1 pb-2 border-gray-200" :class="isCollapsed ? 'border-b' : ''">
                    <li class="text-xs uppercase  text-gray-400 tracking-widest pl-[2px]" v-if="!isCollapsed">Guests
                    </li>
                    <li>
                        <button @click="emit('changeView', 'guestCreation')" type="button" :class="[
                            'flex items-center hover:text-[#6b79c0] font-semibold px-2 py-3 hover:rounded-lg hover:bg-[#f1f1f8] duration-200 w-full text-left',
                            isCollapsed ? 'justify-center' : 'space-x-2'
                        ]">
                            <UserPlus class="w-5 h-5" />
                            <span v-if="!isCollapsed">Add Guest Account</span>
                        </button>
                    </li>
                    <li>
                        <button @click="emit('changeView', 'viewGuests')" type="button" :class="[
                            'flex items-center hover:text-[#6b79c0] font-semibold px-2 py-3 hover:rounded-lg hover:bg-[#f1f1f8] duration-200 w-full text-left',
                            isCollapsed ? 'justify-center' : 'space-x-2'
                        ]">
                            <UserSearch class="w-5 h-5" />
                            <span v-if="!isCollapsed">View Guest Accounts</span>
                        </button>
                    </li>
                </ul>

                <!-- Employees -->
                <ul class="space-y-1 pb-2 border-gray-200" :class="isCollapsed ? 'border-b' : ''">
                    <li class="text-xs uppercase  text-gray-400 tracking-widest pl-[2px]" v-if="!isCollapsed">Employees
                    </li>
                    <li>
                        <button @click="emit('changeView', 'employeeCreation')" type="button" :class="[
                            'flex items-center hover:text-[#6b79c0] font-semibold px-2 py-3 hover:rounded-lg hover:bg-[#f1f1f8] duration-200 w-full text-left',
                            isCollapsed ? 'justify-center' : 'space-x-2'
                        ]">
                            <UserPlus class="w-5 h-5" />
                            <span v-if="!isCollapsed">Add Employee Account</span>
                        </button>
                    </li>
                    <li>
                        <button @click="emit('changeView', 'viewEmployees')" type="button" :class="[
                            'flex items-center hover:text-[#6b79c0] font-semibold px-2 py-3 hover:rounded-lg hover:bg-[#f1f1f8] duration-200 w-full text-left',
                            isCollapsed ? 'justify-center' : 'space-x-2'
                        ]">
                            <UserSearch class="w-5 h-5" />
                            <span v-if="!isCollapsed">View Employee Accounts</span>
                        </button>
                    </li>
                </ul>

                <!-- Hotspots -->
                <ul class="space-y-1 pb-2 border-gray-200" :class="isCollapsed ? 'border-b' : ''">
                    <li class="text-xs uppercase  text-gray-400 tracking-widest pl-[2px]" v-if="!isCollapsed">Hotspots
                    </li>
                    <li>
                        <button @click="emit('changeView', 'addHotspots')" type="button" :class="[
                            'flex items-center hover:text-[#6b79c0] font-semibold px-2 py-3 hover:rounded-lg hover:bg-[#f1f1f8] duration-200 w-full text-left',
                            isCollapsed ? 'justify-center' : 'space-x-2'
                        ]">
                            <MapPinPlus class="w-5 h-5" />
                            <span v-if="!isCollapsed">Add Hotspot</span>
                        </button>
                    </li>
                    <li>
                        <button @click="emit('changeView', 'viewHotspots')" type="button" :class="[
                            'flex items-center hover:text-[#6b79c0] font-semibold px-2 py-3 hover:rounded-lg hover:bg-[#f1f1f8] duration-200 w-full text-left',
                            isCollapsed ? 'justify-center' : 'space-x-2'
                        ]">
                            <MapPinned class="w-5 h-5" />
                            <span v-if="!isCollapsed">View Hotspots</span>
                        </button>
                    </li>
                </ul>

                <!-- Services -->
                <ul class="space-y-1 pb-2 border-gray-200" :class="isCollapsed ? 'border-b' : ''">
                    <li class="text-xs uppercase  text-gray-400 tracking-widest pl-[2px]" v-if="!isCollapsed">Services
                    </li>
                    <li>
                        <button @click="emit('changeView', 'addService')" type="button" :class="[
                            'flex items-center hover:text-[#6b79c0] font-semibold px-2 py-3 hover:rounded-lg hover:bg-[#f1f1f8] duration-200 w-full text-left',
                            isCollapsed ? 'justify-center' : 'space-x-2'
                        ]">
                            <CarFront class="w-5 h-5" />
                            <span v-if="!isCollapsed">Add Service</span>
                        </button>
                    </li>
                    <li>
                        <button @click="emit('changeView', 'serviceRequests')" type="button" :class="[
                            'flex items-center hover:text-[#6b79c0] font-semibold px-2 py-3 hover:rounded-lg hover:bg-[#f1f1f8] duration-200 w-full text-left',
                            isCollapsed ? 'justify-center' : 'space-x-2'
                        ]">
                            <Mails class="w-5 h-5" />
                            <span v-if="!isCollapsed">Service Requests</span>
                        </button>
                    </li>
                </ul>

                <!-- Emergency -->
                <ul class="space-y-1 pb-2 border-gray-200" :class="isCollapsed ? 'border-b' : ''">
                    <li class="text-xs uppercase  text-gray-400 tracking-widest pl-[2px]" v-if="!isCollapsed">Emergency
                    </li>
                    <li>
                        <button @click="emit('changeView', 'emergencyInfo')" type="button" :class="[
                            'flex items-center hover:text-[#6b79c0] font-semibold px-2 py-3 hover:rounded-lg hover:bg-[#f1f1f8] duration-200 w-full text-left',
                            isCollapsed ? 'justify-center' : 'space-x-2'
                        ]">
                            <Phone class="w-5 h-5" />
                            <span v-if="!isCollapsed">Emergency Information</span>
                        </button>
                    </li>
                    <li>
                        <button @click="emit('changeView', 'emergencyRequests')" type="button" :class="[
                            'flex items-center hover:text-[#6b79c0] font-semibold px-2 py-3 hover:rounded-lg hover:bg-[#f1f1f8] duration-200 w-full text-left',
                            isCollapsed ? 'justify-center' : 'space-x-2'
                        ]">
                            <Siren class="w-5 h-5" />
                            <span v-if="!isCollapsed">Emergency Requests</span>
                        </button>
                    </li>
                </ul>
                <!-- Emergency -->
                <ul class="space-y-1 pb-2 border-gray-200" :class="isCollapsed ? 'border-b' : ''">
                    <li class="text-xs uppercase  text-gray-400 tracking-widest pl-[2px]" v-if="!isCollapsed">Account
                    </li>
                    <li>
                        <button @click="logout" type="button"
                            class="flex items-center hover:text-[#6b79c0] font-semibold px-2 py-3 hover:rounded-lg hover:bg-[#f1f1f8] duration-200 w-full text-left"
                            :class="isCollapsed ? 'justify-center' : 'space-x-2'">
                            <LogOut class="text-red-600 w-5 h-5" />
                            <span v-if="!isCollapsed" class="text-red-600">Log Out</span>
                        </button>
                    </li>
                </ul>

            </nav>
        </aside>
    </div>
</template>
