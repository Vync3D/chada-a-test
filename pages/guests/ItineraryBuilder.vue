<template>
    <div class="min-h-screen">
        <div class="max-w-7xl mx-auto px-4 py-8">
            <div class="flex items-center mb-3">
                <button @click="goBack">
                    <ArrowLeft class="text-black w-7 h-7 mr-3" />
                </button>
                <h1 class="text-2xl font-bold text-[#6c7ac1]">Itinerary Builder</h1>
            </div>
            <p class="text-gray-500 mb-8">
                Tell us your interests, and we'll help build the perfect itinerary for you by answering a few questions.
            </p>

            <div class="flex flex-col lg:flex-row lg:space-x-8">
                <div class="bg-white p-6 rounded-xl lg:w-2/5 mb-8 lg:mb-0 border border-[#6C7AC1]/40">
                    <h2 class="text-xl font-bold text-black mb-4">1. Name your trip <span class="text-red-500">*</span>
                    </h2>
                    <div class="mb-6">
                        <input type="text" placeholder="Trip name" v-model="tripName" maxlength="80"
                            class="w-full p-3 border border-[#6C7AC1]/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6C7AC1]" />
                    </div>
                    <h2 class="text-xl font-bold mb-6 tracking-tight">
                        2. Add Dates <span class="text-red-500">*</span>
                    </h2>

                    <div class="flex items-center justify-between"
                        :class="{ 'pointer-events-none opacity-50': datesAreSet }">
                        <div class="flex items-center gap-3 bg-[#6b79c0] w-full py-3 justify-center">
                            <button @click="prevMonth"
                                class="p-2 rounded-full bg-white border border-gray-300 hover:bg-[#f0f2f8] transition"
                                aria-label="Previous Month" :disabled="datesAreSet">
                                <ArrowLeft class="w-5 h-5 text-[#6b79c0]" />
                            </button>
                            <select v-model="currentMonth" @change="updateCalendar" :disabled="datesAreSet"
                                class="bg-white border border-gray-300 rounded-md px-3 py-2 text-base font-medium text-[#3b3b3b] focus:ring-2 focus:ring-[#6b79c0] focus:outline-none">
                                <option v-for="(month, index) in months" :key="index" :value="index + 1">
                                    {{ month }}
                                </option>
                            </select>

                            <select v-model="currentYear" @change="updateCalendar" :disabled="datesAreSet"
                                class="bg-white border border-gray-300 rounded-md px-3 py-2 text-base font-medium text-[#3b3b3b] focus:ring-2 focus:ring-[#6b79c0] focus:outline-none">
                                <option v-for="year in years" :key="year" :value="year">
                                    {{ year }}
                                </option>
                            </select>

                            <button @click="nextMonth"
                                class="p-2 rounded-full bg-white border border-gray-300 hover:bg-[#f0f2f8] transition"
                                aria-label="Next Month" :disabled="datesAreSet">
                                <ArrowRight class="w-5 h-5 text-[#6b79c0]" />
                            </button>
                        </div>
                    </div>
                    <div v-if="!datesAreSet">
                    </div>
                    <div class="grid grid-cols-7 gap-1 sm:gap-2 border border-gray-300 rounded-md p-4 text-center  mb-6"
                        :class="{ 'pointer-events-none opacity-50': datesAreSet }">
                        <div v-for="dayName in ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']" :key="dayName"
                            class="font-semibold text-[#6C7AC1] pb-2 sm:pb-3">
                            {{ dayName }}
                        </div>

                        <template v-for="(day, index) in calendarDays" :key="index">
                            <div v-if="day === null" class="h-10 sm:h-12"></div>
                            <div v-else @click="handleDateSelect(day)" :class="[
                                'h-10 sm:h-12 w-full flex items-center justify-center rounded-md cursor-pointer transition-all duration-150',
                                isToday(new Date(currentYear, currentMonth - 1, day)) ? 'border border-blue-500' : '',
                                selectedDates.includes(formatDate(new Date(currentYear, currentMonth - 1, day)))
                                    ? 'bg-[#6C7AC1] text-white font-bold'
                                    : isPastDate(new Date(currentYear, currentMonth - 1, day))
                                        ? 'text-gray-400 cursor-not-allowed'
                                        : 'text-black',
                                datesAreSet ? 'pointer-events-none cursor-not-allowed' : ''
                            ]">
                                {{ day }}
                            </div>
                        </template>
                    </div>

                    <div class="text-black space-y-2 mb-6">
                        <div v-if="!datesAreSet">
                            <div v-if="selectedDates.length > 0" class="mt-4">
                                <p class="text-black font-bold mb-2">Selected Dates:</p>
                                <ul class=" text-gray-700 list-disc list-inside mb-4">
                                    <li v-for="(date, index) in selectedDates" :key="index">
                                        {{ new Date(date).toLocaleDateString('en-US', {
                                            weekday: 'short', month: 'long',
                                            day: 'numeric', year:
                                                'numeric'
                                        })
                                        }}
                                    </li>
                                </ul>
                                <div class="flex justify-end gap-3">
                                    <button @click="selectedDates = []"
                                        class="px-4 py-2 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-100 transition">
                                        Clear Dates
                                    </button>
                                    <button @click="setDates"
                                        class="bg-[#6c7ac1] text-white px-6 py-3 rounded-full font-medium hover:bg-[#5b6cb3] transition">
                                        Set Dates
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div v-if="datesAreSet" class="mt-4">
                            <p class="text-black font-bold mb-2">Selected Dates:</p>
                            <ul class="text-gray-800 list-disc list-inside mb-3">
                                <li v-for="(date, index) in selectedDates" :key="index">
                                    {{ new Date(date).toLocaleDateString('en-US', {
                                        weekday: 'short', month: 'long',
                                        day: 'numeric', year:
                                            'numeric'
                                    })
                                    }}
                                </li>
                            </ul>
                        </div>
                    </div>

                </div>


                <div class="bg-white p-6 rounded-xl lg:w-3/5 border border-[#6C7AC1]/40">
                    <!-- <div v-if="datesAreSet"> -->
                    <div>
                        <h2 class="text-xl font-bold text-black mb-2">
                            3. How do you want to start? <span class="text-red-500">*</span>
                        </h2>
                    </div>

                    <div class="space-y-4">
                        <div class="flex items-center p-5 border rounded-lg transition" :class="[
                            !datesAreSet || !tripName.trim() ? 'pointer-events-none opacity-50 cursor-not-allowed' : 'cursor-pointer',
                            selectedOption === 'help' ? 'bg-[#6C7AC1] text-white border-[#6C7AC1]' : 'bg-[#e8ebfc] text-[#374151] border-[#6C7AC1]/50 hover:bg-[#6C7AC1]/10'
                        ]" @click="selectHelpPlan">
                            <div class="p-3 rounded-full mr-4"
                                :class="selectedOption === 'help' ? 'bg-white text-[#6C7AC1]' : 'bg-[#d5d9f1] text-[#6C7AC1]'">
                                <CalendarCheck class="w-6 h-6" />
                            </div>
                            <div>
                                <h3 class="text-lg font-bold"
                                    :class="selectedOption === 'help' ? 'text-white' : 'text-[#374151]'">Help
                                    Me Plan</h3>
                                <p :class="selectedOption === 'help' ? 'text-white/80' : 'text-[#4b5563]'">
                                    Answer a few questions and we'll create an itinerary for you.
                                </p>
                            </div>
                        </div>

                        <div class="flex items-center p-5 border rounded-lg transition" :class="[
                            !datesAreSet || !tripName.trim() ? 'pointer-events-none opacity-50 cursor-not-allowed' : 'cursor-pointer',
                            selectedOption === 'build' ? 'bg-[#6C7AC1] text-white border-[#6C7AC1]' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-[#6C7AC1]/10'
                        ]" @click="selectBuildItMyself">
                            <div class="p-3 rounded-full mr-4"
                                :class="selectedOption === 'build' ? 'bg-white text-[#6C7AC1]' : 'bg-gray-300 text-gray-600'">
                                <Edit class="w-6 h-6" />
                            </div>
                            <div>
                                <h3 class="text-lg font-bold"
                                    :class="selectedOption === 'build' ? 'text-white' : 'text-gray-800'">Build
                                    It Myself</h3>
                                <p :class="selectedOption === 'build' ? 'text-white/80' : 'text-gray-600'">
                                    Start from scratch and build your itinerary step by step.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div v-if="selectedOption === 'help'" class="mt-6 space-y-12">
                        <div v-if="!hasGenerated">
                            <div v-for="(question, index) in questions" :key="index">
                                <h4 class="text-lg font-bold text-black mb-3">
                                    {{ question.text }}
                                </h4>
                                <div class="flex flex-wrap mb-4 gap-5">
                                    <span v-for="option in question.options" :key="option"
                                        @click="question.model.value = option" :class="[
                                            'px-6 py-3 rounded-full font-medium cursor-pointer border border-gray-300 transition',
                                            question.model.value === option
                                                ? 'bg-[#6C7AC1] text-white border-[#6C7AC1]'
                                                : 'bg-white text-[#3d3d3d] border-[#6C7AC1]/30 hover:bg-[#6C7AC1] hover:text-white',
                                        ]">
                                        {{ option }}
                                    </span>
                                </div>
                            </div>

                            <div v-if="dateError" class="p-4 mb-4 text-red-800 rounded-lg bg-red-50" role="alert">
                                <span class="font-bold">Error:</span> {{ dateError }}
                            </div>

                            <div class="flex gap-3 mt-10">
                                <button @click="clearSelections"
                                    class="w-full justify-center align-center items-center px-5 border py-4 text-black bg-white rounded-full font-medium transition">
                                    Clear
                                </button>
                                <button @click="generateHelpItinerary"
                                    class="w-full flex justify-center align-center items-center px-6 py-4 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition">
                                    <Sparkles class="mr-2 w-4 h-4" />
                                    Generate
                                </button>
                            </div>
                            <div v-if="generateError" class="p-4 mb-4  text-red-800 rounded-lg bg-red-50" role="alert">
                                <span class="font-medium">Error:</span> {{ generateError }}
                            </div>
                        </div>


                        <!-- Help: Generated -->
                        <div v-if="hasGenerated" class="space-y-6">
                            <h3 class="text-xl m-0 font-bold text-black">
                                Preview Itinerary for {{ helpPlanItineraryItems.length }} Day{{
                                    helpPlanItineraryItems.length > 1 ? 's' : ''
                                }}
                            </h3>
                            <p class="text-gray-500 sm:">You can edit this generated itinerary after saving.</p>

                            <div v-for="(day, index) in helpPlanItineraryItems" :key="index" class="space-y-4">
                                <h4
                                    class="flex items-center gap-3 bg-[#6c7ac1] text-lg text-white font-bold px-5 py-5 rounded-t-xl">
                                    <Calendar class="w-5 h-5" />
                                    {{
                                        new Date(day.date).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            month: 'long',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })
                                    }}
                                </h4>

                                <table class="w-full table-fixed">
                                    <thead>
                                        <tr class="text-left text-gray-600 border-b border-gray-200">
                                            <th class="w-4"></th>
                                            <th class="pb-3 w-1/3">Time</th>
                                            <th class="pb-3">Location</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="(entry, i) in day.entries" :key="i"
                                            @click="toggleSelection(entry.time, entry.location, i)" :class="[
                                                'cursor-pointer group transition rounded-2xl',
                                                isSelected(entry.time, entry.location) ? 'bg-[#6c7ac1]/30' : 'hover:bg-gray-200',
                                            ]">
                                            <td></td>
                                            <td class="py-3 text-md text-gray-700 font-medium">
                                                <div class="flex items-center">
                                                    <Clock3 class="w-4 h-4 mr-2 text-[#6c7ac1]" />
                                                    {{ entry.time }}
                                                </div>
                                            </td>
                                            <td class="py-3 text-md font-bold">
                                                <div class="flex items-center">
                                                    <MapPin class="w-4 h-4 mr-2 text-[#6c7ac1]" />
                                                    {{ entry.location }}
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <!-- Help: Buttons -->
                            <div class="flex gap-3 mt-6">
                                <button @click="hasGenerated = false"
                                    class="w-full flex justify-center align-center items-center px-5 border py-4 text-black bg-white rounded-full font-medium transition">
                                    Back
                                </button>
                                <button @click="saveHelpPlannedItinerary"
                                    class="w-full flex justify-center items-center px-6 py-4 bg-black text-white rounded-full font-medium hover:bg-[#5a68b0] transition">
                                    <Check class="mr-2 w-4 h-4" />
                                    Save Itinerary
                                </button>
                            </div>

                            <div v-if="saveError" class="p-4 mb-4  text-red-800 rounded-lg bg-red-50" role="alert">
                                <span class="font-medium">Error:</span> {{ saveError }}
                            </div>
                            <div v-if="saveSuccess" class="p-4 mb-4  text-green-800 rounded-lg bg-green-50"
                                role="alert">
                                <span class="font-bold">Success:</span> {{ saveSuccess }}
                            </div>
                        </div>
                    </div>

                    <div v-if="selectedOption === 'build'" class="mt-3 space-y-6 mb-3">
                        <div class="flex justify-between items-center">
                            <h2 class="text-gray-500 font-medium mb-3">Your Itineraries</h2>
                            <button @click="showAddFields = !showAddFields"
                                class="bg-[#6c7ac1] text-white px-5 py-3 rounded-lg font-medium hover:bg-[#5b6cb3]">
                                <span v-if="!showAddFields">+ Add Itinerary Item</span>
                                <span v-else>Close</span>
                            </button>
                        </div>

                        <div v-if="selectedDates.length > 0 && selectedItineraryItems.length > 0" class="px-4 mt-6">
                        </div>
                    </div>

                    <div v-if="showAddFields"
                        class="bg-white p-4 rounded-lg border border-[#6C7AC1]/40 transition-all duration-300 ease-in-out">
                        <div class="grid grid-cols-1 pt-3 gap-4">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="font-medium text-gray-700 mb-2">Date <span
                                            class="text-red-500">*</span></label>
                                    <select v-model="selectedDateForAdding"
                                        class="w-full mt-2 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6C7AC1]">
                                        <option v-for="day in formattedDates" :key="day.date" :value="day.date">
                                            {{ day.label }}
                                        </option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-gray-700 font-medium mb-2">Time (12-hour format) <span
                                            class="text-red-500">*</span></label>
                                    <div class="flex flex-wrap gap-1 sm:flex-nowrap">
                                        <input type="text" v-model="selectedHour" maxlength="2" placeholder="HH"
                                            class="w-full sm:w-20 border rounded-md px-2 py-2 bg-white text-center"
                                            @input="validateTime('hour')" required />

                                        <input type="text" v-model="selectedMinute" maxlength="2" placeholder="MM"
                                            class="w-full sm:w-20 border rounded-md px-2 py-2 bg-white text-center"
                                            @input="validateTime('minute')" />

                                        <div class="flex gap-2 w-full sm:w-auto">
                                            <button @click="selectedPeriod = 'AM'" :class="[
                                                'w-full sm:w-auto px-4 py-2 rounded-md font-medium border',
                                                selectedPeriod === 'AM'
                                                    ? 'bg-[#6b79c0] text-white border-[#6b79c0]'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                            ]">
                                                AM
                                            </button>

                                            <button @click="selectedPeriod = 'PM'" :class="[
                                                'w-full sm:w-auto px-4 py-2 rounded-md font-medium border',
                                                selectedPeriod === 'PM'
                                                    ? 'bg-[#6b79c0] text-white border-[#6b79c0]'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                            ]">
                                                PM
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label class=" font-medium text-gray-700 mb-2">Location Name <span
                                        class="text-red-500">*</span></label>
                                <input type="text" v-model="newItineraryItem.locationname"
                                    class="w-full p-3 mt-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6C7AC1]"
                                    placeholder="Start typing or enter a location" list="locationSuggestions"
                                    required />
                                <datalist id="locationSuggestions">
                                    <option v-for="loc in hotspotSuggestions" :key="loc.name" :value="loc.name">
                                        {{ loc.name }} <span v-if="loc.type">({{ loc.type }})</span>
                                    </option>
                                </datalist>
                            </div>
                        </div>
                        <div class="mt-4 flex justify-between gap-3">
                            <button @click="clearItineraryFields"
                                class="w-1/2 flex justify-center items-center px-6 py-3 bg-white text-black border border-black rounded-full font-medium hover:bg-gray-100 transition">
                                Clear
                            </button>

                            <button @click="addItineraryItem"
                                class="w-1/2 flex justify-center items-center px-6 py-3 bg-[#6c7ac1] text-white rounded-full font-medium hover:bg-[#5a68b0] transition">
                                <Plus class="mr-2 w-4 h-4" />
                                Add to Itinerary
                            </button>
                        </div>

                        <!-- Build: Error display -->
                        <div v-if="saveError" class="mt-4 p-4 mb-4  text-red-800 rounded-lg bg-red-50" role="alert">
                            <span class="font-medium">Error:</span> {{ saveError }}
                        </div>
                        <div v-if="saveSuccess" class="mt-4 p-4 mb-4  text-green-800 rounded-lg bg-green-50"
                            role="alert">
                            <span class="font-bold">Success:</span> {{ saveSuccess }}
                        </div>
                    </div>

                    <div v-if="selectedDates.length > 0 && selectedItineraryItems.length > 0" class="px-4 mt-6 mb-4">
                        <div v-for="(day, index) in itineraryByDay" :key="index" class="space-y-4">
                            <h4
                                class="flex items-center gap-3 bg-[#6c7ac1] text-lg text-white font-bold px-5 py-5 rounded-t-xl">
                                <Calendar class="w-5 h-5" />
                                {{ new Date(day.date).toLocaleDateString('en-US', {
                                    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                                }) }}
                            </h4>
                            <table class="w-full px-3 mt-4 table-fixed">
                                <thead>
                                    <tr class="text-left text-gray-600 border-b border-gray-200">
                                        <th class="pb-3 w-1/3">Time</th>
                                        <th class="pb-3">Location</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(item, itemIndex) in day.items" :key="itemIndex"
                                        class="cursor-pointer group transition rounded-2xl hover:bg-gray-200">
                                        <td class="py-3 text-md text-gray-700 font-medium">
                                            <div class="flex items-center">
                                                <Clock3 class="w-4 h-4 mr-2 text-[#6c7ac1]" />
                                                {{ item.time }}
                                            </div>
                                        </td>
                                        <td class="py-3 text-md font-bold">
                                            <div class="flex items-center">
                                                <MapPin class="w-4 h-4 mr-2 text-[#6c7ac1]" />
                                                {{ item.locationname }}
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div v-if="canSaveBuildItinerary" class="flex gap-3 mt-6">
                        <button @click="saveBuildItinerary"
                            class="w-full flex justify-center items-center px-6 py-4 bg-[#6c7ac1] text-white rounded-full font-medium hover:bg-[#5a68b0] transition">
                            <Check class="mr-2 w-4 h-4" />
                            Save Itinerary
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ArrowLeft, ArrowRight, Plus, Check, Edit, CalendarCheck, Calendar, Sparkles, Clock3, MapPin } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const router = useRouter()
const goBack = () => {
    router.back()
}

const supabase = useNuxtApp().$supabase
const tripName = ref('')
const selectedDates = ref([])
const selectedOption = ref('')
const hasGenerated = ref(false)
const dateError = ref(null)
const saveError = ref(null)
const generateError = ref(null)
const saveSuccess = ref(null)
const datesAreSet = ref(false)
const helpPlanItineraryItems = ref([])

const setDates = () => {
    if (selectedDates.value.length > 0) {
        datesAreSet.value = true;
    }
}

const selectBuildItMyself = () => {
    if (!datesAreSet.value || !tripName.value.trim()) {
        return;
    }
    selectedOption.value = 'build';
    showAddFields.value = true; 
};

const selectHelpPlan = () => {
    if (!datesAreSet.value || !tripName.value.trim()) {
        return;
    }
    selectedOption.value = 'help';
    showAddFields.value = false;
};

function clearItineraryFields() {
    selectedDateForAdding.value = ''
    selectedHour.value = ''
    selectedMinute.value = ''
    selectedPeriod.value = 'AM'
    newItineraryItem.value.locationname = ''
}


const formattedDates = computed(() => {
    return selectedDates.value.map((dateStr, index) => {
        const date = new Date(dateStr);
        const options = { weekday: 'long', month: 'long', day: 'numeric' };
        const formatted = date.toLocaleDateString('en-US', options);
        return {
            date: dateStr,
            label: `Day ${index + 1}: ${formatted}`
        };
    });
});

const selectedHour = ref('')
const selectedMinute = ref('')
const selectedPeriod = ref('AM')
function validateTime(type) {
    if (type === 'hour') {
        selectedHour.value = selectedHour.value.replace(/\D/g, '').slice(0, 2)
        let num = parseInt(selectedHour.value)
        if (isNaN(num)) {
            selectedHour.value = ''
        } else if (num > 12) {
            selectedHour.value = '12'
        } else if (num < 0) {
            selectedHour.value = '0'
        }
    } else if (type === 'minute') {
        selectedMinute.value = selectedMinute.value.replace(/\D/g, '').slice(0, 2)
        let num = parseInt(selectedMinute.value)
        if (isNaN(num)) {
            selectedMinute.value = ''
        } else if (num > 59) {
            selectedMinute.value = '59'
        } else if (num < 0) {
            selectedMinute.value = '0'
        }
    }
}

const canSaveBuildItinerary = computed(() => {
    return selectedDates.value.length > 0 && selectedDates.value.length === itineraryByDay.value.length;
});

const formattedTime = computed(() => {
    const hour = selectedHour.value.toString().padStart(2, '0');
    const minute = selectedMinute.value.toString().padStart(2, '0');
    return `${hour}:${minute} ${selectedPeriod.value}`;
});

const selectedDateForAdding = ref(null);

// Reactive state for the calendar
const currentDate = new Date()
const currentMonth = ref(currentDate.getMonth() + 1)
const currentYear = ref(currentDate.getFullYear())
const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
]
const years = computed(() => {
    const yearArray = []
    const startYear = currentDate.getFullYear() - 5
    const endYear = currentDate.getFullYear() + 5
    for (let year = startYear; year <= endYear; year++) {
        yearArray.push(year)
    }
    return yearArray
})

// Calendar logic
const daysInMonth = (year, month) => new Date(year, month, 0).getDate()
const firstDayOfMonth = (year, month) => new Date(year, month - 1, 1).getDay()

const isToday = (day) => {
    const today = new Date()
    return today.getFullYear() === currentYear.value &&
        (today.getMonth() + 1) === currentMonth.value &&
        today.getDate() === day
}

function isSelected(time, location) {
    return selectedItems.value.some(
        (item) => item.time === time && item.location === location
    )
}
const selectedItems = ref([])

function toggleSelection(time, location, index) {
    const exists = isSelected(time, location)
    if (exists) {
        selectedItems.value = selectedItems.value.filter(
            (item) => item.time !== time || item.location !== location
        )
    } else {
        selectedItems.value.push({ time, location })
    }
}

const handleDateSelect = (day) => {
    const date = new Date(currentYear.value, currentMonth.value - 1, day)
    if (isPastDate(date)) return
    const formatted = formatDate(date)

    if (selectedDates.value.includes(formatted)) {
        selectedDates.value = selectedDates.value.filter(d => d !== formatted)
    } else {
        selectedDates.value.push(formatted)
        selectedDates.value.sort((a, b) => new Date(a) - new Date(b))
    }
}

const formatDayNumberToDate = (day) => {
    const monthStr = String(currentMonth.value).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${currentYear.value}-${monthStr}-${dayStr}`;
};

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function isStartDate(date) {
    return selectedDates.value.length > 0 &&
        formatDate(date) === selectedDates.value[0]
}

function isEndDate(date) {
    return selectedDates.value.length > 1 &&
        formatDate(date) === selectedDates.value[selectedDates.value.length - 1]
}

const isPastDate = (date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
}

const calendarDays = computed(() => {
    const year = currentYear.value
    const month = currentMonth.value
    const totalDays = daysInMonth(year, month)

    const firstDay = new Date(year, month - 1, 1).getDay() // 0 = Sunday
    const firstDayIndex = firstDay === 0 ? 6 : firstDay - 1 // Make Monday = 0

    const days = []

    // Fill initial empty slots
    for (let i = 0; i < firstDayIndex; i++) {
        days.push(null)
    }

    // Fill actual days
    for (let day = 1; day <= totalDays; day++) {
        days.push(day)
    }

    return days
})

const prevMonth = () => {
    if (currentMonth.value === 1) {
        currentMonth.value = 12
        currentYear.value--
    } else {
        currentMonth.value--
    }
}

const nextMonth = () => {
    if (currentMonth.value === 12) {
        currentMonth.value = 1
        currentYear.value++
    } else {
        currentMonth.value++
    }
}

const updateCalendar = () => {
}

const morning = ref('')
const lunch = ref('')
const dessert = ref('')
const afternoon = ref('')
const party = ref('')

const questions = [
    { text: '1. What do you want to do in the morning?', options: ['Go swimming', 'Visit a historical site', 'Adventure', 'Have a walk with nature'], model: morning },
    { text: '2. What do you feel like eating for lunch?', options: ['Something light', 'Something heavy'], model: lunch },
    { text: '3. Do you want to get a dessert or snacks?', options: ['Yes', 'No'], model: dessert },
    { text: '4. What do you want to do in the afternoon?', options: ['Go cafe-hopping', 'Go swimming', 'Watch the sunset on the mountains', 'Visit more historical sites', 'Walk with nature'], model: afternoon },
    { text: '5. Do you want to party in the evening?', options: ['Yes', 'No'], model: party },
]

const clearSelections = () => {
    morning.value = ''
    lunch.value = ''
    dessert.value = ''
    afternoon.value = ''
    party.value = ''
}

const generateHelpItinerary = async () => {
    dateError.value = null
    if (selectedDates.value.length === 0) {
        dateError.value = 'Please select one or more dates.';
        return
    }

    if (morning.value === '' &&
    lunch.value === ''
    && dessert.value === ''
    && afternoon.value === ''
    && party.value === '')
    {
        generateError.value = 'Please answer at least one question.';
        return;
    }

    const dateWiseItineraries = []
    for (const dateStr of selectedDates.value) {
        const mappings = [
            { time: 'Morning', value: morning.value, typeMap: { 'Go swimming': 'Beach', 'Visit a historical site': 'Historical Site', 'Adventure': 'Any', 'Have a walk with nature': 'Nature' } },
            { time: 'Lunch', value: lunch.value, typeMap: { 'Something light': 'Cafe', 'Something heavy': 'Restaurant' } },
            { time: 'Afternoon', value: dessert.value, typeMap: { 'Yes': 'Cafe', 'No': null } },
            { time: 'Afternoon', value: afternoon.value, typeMap: { 'Go cafe-hopping': 'Cafe', 'Go swimming': 'Beach', 'Watch the sunset on the mountains': 'Nature', 'Visit more historical sites': 'Historical Site', 'Walk with nature': 'Nature' } },
            { time: 'Evening', value: party.value, typeMap: { 'Yes': 'Nightlife', 'No': null } }
        ]

        const dayEntries = []
        for (const m of mappings) {
            const type = m.typeMap[m.value]
            if (!type) continue
            const location = await getRandomHotspotByType(type)
            if (location) {
                dayEntries.push({ time: m.time, location })
            }
        }

        dateWiseItineraries.push({ date: dateStr, entries: dayEntries })
    }

    helpPlanItineraryItems.value = dateWiseItineraries
    hasGenerated.value = true
}

const getRandomHotspotByType = async (type) => {
    try {
        const query = type === 'Any'
            ? supabase.from('hotspot').select('*')
            : supabase.from('hotspot').select('*').eq('type', type);

        const { data, error } = await query;

        if (error) throw error;
        if (!data || data.length === 0) return null;

        const randomIndex = Math.floor(Math.random() * data.length);
        return data[randomIndex].name;
    } catch (err) {
        console.error(`Error fetching hotspot of type "${type}":`, err);
        return null;
    }
};

const saveHelpPlannedItinerary = async () => {
    saveError.value = null;
    saveSuccess.value = null;

    const guestId = localStorage.getItem('user_id');

    if (!tripName.value.trim()) {
        saveError.value = 'Please name your trip.';
        return;
    }

    if (!guestId || helpPlanItineraryItems.value.length === 0) {
        saveError.value = 'Please generate your itinerary first.';
        return;
    }

    try {
        let lastItineraryId = null;

        for (const day of helpPlanItineraryItems.value) {
            const { data: itineraryData, error: itineraryError } = await supabase
                .from('itinerary')
                .insert({
                    guest_ID: guestId,
                    name: `${tripName.value} - ${new Date(day.date).toLocaleDateString()}`,
                    date: day.date,
                })
                .select()
                .single();

            if (itineraryError) throw itineraryError;

            const itinerary_ID = itineraryData.itinerary_ID;
            lastItineraryId = itinerary_ID;

            const items = day.entries.map(entry => ({
                itinerary_ID,
                time: entry.time,
                locationname: entry.location,
            }));

            const { error: insertError } = await supabase
                .from('itineraryitem')
                .insert(items);

            if (insertError) throw insertError;
        }

        saveSuccess.value = 'Generated itineraries saved!';
        router.push(`/guests/mytrips?id=${lastItineraryId}`);
    } catch (err) {
        console.error('Error saving generated itineraries:', err.message || err);
        saveError.value = 'Failed to save itinerary.';
    }
};

const showAddFields = ref(false);
const newItineraryItem = ref({ time: '', locationname: '' });
const selectedItineraryItems = ref([]);

newItineraryItem.value.time = formattedTime.value;

function addItineraryItem() {
    if (!selectedDateForAdding.value || !selectedHour.value || !selectedMinute.value || !newItineraryItem.value.locationname) {
        saveError.value = 'Please fill out all required fields (Date, Time, Location Name).';
        return;
    }

    const hour = parseInt(selectedHour.value);
    let hour_24hr = selectedPeriod.value === 'PM' && hour !== 12 ? hour + 12 : hour;
    if (selectedPeriod.value === 'AM' && hour === 12) {
        hour_24hr = 0;
    }
    const time_24hr = `${hour_24hr.toString().padStart(2, '0')}:${selectedMinute.value.padStart(2, '0')}`;

    selectedItineraryItems.value.push({
        date: selectedDateForAdding.value,
        time: formattedTime.value,
        time_24hr: time_24hr,
        locationname: newItineraryItem.value.locationname
    });

    clearItineraryFields();
    saveSuccess.value = 'Item added to itinerary!';
    setTimeout(() => {
        saveSuccess.value = null;
    }, 3000);
}

const hotspotSuggestions = ref([])

onMounted(async () => {
    const { data, error } = await supabase.from('hotspot').select('name')
    if (!error) {
        hotspotSuggestions.value = data
    }
})


const saveBuildItinerary = async () => {
    saveError.value = null;
    saveSuccess.value = null;

    const guestId = localStorage.getItem('user_id');

    if (!tripName.value.trim()) {
        saveError.value = 'Please name your trip.';
        return;
    }

    if (!guestId) {
        saveError.value = 'You must be logged in to save the itinerary.';
        return;
    }

    const missingDates = Array.isArray(itineraryByDay.value)
        ? selectedDates.value.filter(date => {
            const entry = itineraryByDay.value.find(d => d.date === date);
            return !entry || !entry.items || entry.items.length === 0;
        })
        : selectedDates.value;

    if (missingDates.length > 0) {
        const formattedMissing = missingDates.map(d =>
            new Date(d).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            })
        ).join(', ');
        saveError.value = `Please add at least one itinerary item for the following date(s): ${formattedMissing}`;
        return;
    }

    try {
        let lastItineraryId = null;

        for (const day of itineraryByDay.value) {
            const { data: itineraryData, error: itineraryError } = await supabase
                .from('itinerary')
                .insert({
                    guest_ID: guestId,
                    name: `${tripName.value} - ${new Date(day.date).toLocaleDateString()}`,
                    date: day.date,
                })
                .select()
                .single();

            if (itineraryError) throw itineraryError;

            const itinerary_ID = itineraryData.itinerary_ID;
            lastItineraryId = itinerary_ID;

            const items = day.items.map(entry => ({
                itinerary_ID,
                time: entry.time,
                locationname: entry.locationname,
            }));

            const { error: insertError } = await supabase
                .from('itineraryitem')
                .insert(items);

            if (insertError) throw insertError;
        }

        saveSuccess.value = 'Itinerary successfully saved!';
        router.push(`/guests/mytrips?id=${lastItineraryId}`);
    } catch (err) {
        console.error('Error saving itinerary:', err.message || err);
        saveError.value = 'Failed to save itinerary.';
    }
};

const sortedSelectedItems = computed(() => {
    // Sort items by a combined date and time string
    return [...selectedItineraryItems.value].sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time_24hr}`);
        const dateB = new Date(`${b.date}T${b.time_24hr}`);
        return dateA - dateB;
    });
});

const itineraryByDay = computed(() => {
    const itineraryMap = new Map();
    sortedSelectedItems.value.forEach(item => {
        if (!itineraryMap.has(item.date)) {
            itineraryMap.set(item.date, []);
        }
        itineraryMap.get(item.date).push(item);
    });

    return Array.from(itineraryMap, ([date, items]) => ({
        date,
        items
    }));
});
</script>