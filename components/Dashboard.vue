<template>
    <div class="p-6 md:p-8 lg:p-10 bg-gray-50 min-h-screen">
        <div class="border-b-1 border-gray-300 pb-3">
            <h2 class="text-2xl mb-1 font-bold text-[#6b79c0]">Dashboard</h2>
            <p class="text-gray-600">Get a comprehensive view of your travel business performance.</p>
        </div>

        <div class="bg-white max-w-2xl rounded-2xl shadow-lg p-6 mt-4 mb-8 border border-gray-200">
            <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h2 class="text-xl md:text-2xl font-semibold text-gray-800">Seasonal Booking Trends</h2>
                <div class="flex flex-wrap gap-4">
                    <select v-model="selectedMonth"
                        class="bg-white border border-gray-300 px-4 py-2 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#6c7ac1] transition-all">
                        <option value="">All Months</option>
                        <option v-for="m in months" :key="m" :value="m">{{ m }}</option>
                    </select>
                    <select v-model="selectedYear"
                        class="bg-white border border-gray-300 px-4 py-2 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#6c7ac1] transition-all">
                        <option value="">All Years</option>
                        <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
                    </select>
                </div>
            </div>
            <div class="w-full max-w-2xl max-h-[400px]">
                <Bar v-if="bookingChartData" :data="bookingChartData" :options="chartOptions" />
            </div>
        </div>

        <div class="bg-white max-w-2xl rounded-2xl shadow-lg p-6 mb-8 border border-gray-200">
            <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h2 class="text-xl md:text-2xl font-semibold text-gray-800">Occupancy per Rental Unit</h2>
                <select v-model="selectedUnit"
                    class="bg-white border border-gray-300 px-4 py-2 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#6c7ac1] transition-all">
                    <option value="">All Units</option>
                    <option v-for="u in rentalUnits" :key="u" :value="u">{{ u }}</option>
                </select>
            </div>
            <div class="w-full max-w-2xl max-h-[400px]">
                <Bar v-if="occupancyChartData" :data="occupancyChartData" :options="chartOptions" />
            </div>
        </div>

        <div class="bg-white max-w-2xl rounded-2xl shadow-lg p-6 mb-8 border border-gray-200">
            <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h2 class="text-xl md:text-2xl font-semibold text-gray-800">Services Availed</h2>
                <select v-model="selectedService"
                    class="bg-white border border-gray-300 px-4 py-2 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#6c7ac1] transition-all">
                    <option value="">All Services</option>
                    <option v-for="s in serviceNames" :key="s" :value="s">{{ s }}</option>
                </select>
            </div>
            <div class="w-full max-w-2xl max-h-[400px]">
                <Bar v-if="serviceChartData" :data="serviceChartData" :options="chartOptions" />
            </div>
        </div>
    </div>
</template>
 
<script setup>
import { ref, onMounted, watch } from 'vue'
import { Bar } from 'vue-chartjs'
import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    BarElement,
    CategoryScale,
    LinearScale
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const { $supabase } = useNuxtApp()

const bookingChartData = ref(null)
const occupancyChartData = ref(null)
const serviceChartData = ref(null)

const selectedMonth = ref('')
const selectedYear = ref('')
const selectedUnit = ref('')
const selectedService = ref('')

const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]
const years = ref([])
const rentalUnits = ref([])
const serviceNames = ref([])

const refreshCharts = async () => {
    const { data: bookings } = await $supabase
        .from('booking')
        .select('startDate, rentalunit(name)')
        .order('startDate')

    const monthlyBookings = {}
    const unitOccupancy = {}

    const seenYears = new Set()
    const seenUnits = new Set()

    bookings.forEach(({ startDate, rentalunit }) => {
        const date = new Date(startDate)
        const month = date.toLocaleString('default', { month: 'short' })
        const year = date.getFullYear()
        const unitName = rentalunit?.name

        seenYears.add(year)
        if (unitName) seenUnits.add(unitName)

        if (
            (!selectedMonth.value || selectedMonth.value === month) &&
            (!selectedYear.value || parseInt(selectedYear.value) === year)
        ) {
            const key = `${month} ${year}`
            monthlyBookings[key] = (monthlyBookings[key] || 0) + 1
        }

        if (!selectedUnit.value || selectedUnit.value === unitName) {
            if (unitName) {
                unitOccupancy[unitName] = (unitOccupancy[unitName] || 0) + 1
            }
        }
    })

    years.value = Array.from(seenYears).sort()
    rentalUnits.value = Array.from(seenUnits).sort()

    bookingChartData.value = {
        labels: Object.keys(monthlyBookings),
        datasets: [
            {
                label: 'Bookings',
                data: Object.values(monthlyBookings),
                backgroundColor: '#6C7AC1'
            }
        ]
    }

    occupancyChartData.value = {
        labels: Object.keys(unitOccupancy),
        datasets: [
            {
                label: 'Occupancy Count',
                data: Object.values(unitOccupancy),
                backgroundColor: '#FFA07A'
            }
        ]
    }
}

const chartOptions = {
    responsive: true,
    aspectRatio: 1
}

const refreshServices = async () => {
    const { data: services } = await $supabase
        .from('servicerequest')
        .select('service(servicename)')

    const serviceCounts = {}
    const allServiceNames = new Set()

    services.forEach(({ service }) => {
        const name = service?.servicename
        if (name) {
            allServiceNames.add(name)
            if (!selectedService.value || selectedService.value === name) {
                serviceCounts[name] = (serviceCounts[name] || 0) + 1
            }
        }
    })

    serviceNames.value = Array.from(allServiceNames).sort()

    serviceChartData.value = {
        labels: Object.keys(serviceCounts),
        datasets: [
            {
                label: 'Total Availed',
                data: Object.values(serviceCounts),
                backgroundColor: ['#6C7AC1', '#FFA07A', '#90EE90', '#9370DB']
            }
        ]
    }
}

// Refresh charts on mount and when filters change
onMounted(() => {
    refreshCharts()
    refreshServices()
})

watch([selectedMonth, selectedYear, selectedUnit], refreshCharts)
watch([selectedService], refreshServices)
</script>
