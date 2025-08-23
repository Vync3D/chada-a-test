<script setup>
import { ref, computed, onMounted } from 'vue'
import { Plus, Search } from 'lucide-vue-next'
import { useRoute } from 'vue-router'
const { $supabase } = useNuxtApp()

const route = useRoute()
const emit = defineEmits(['changeView'])

const rentalUnits = ref([])
const unitName = ref('')
const unitType = ref('')
const searchQuery = ref('')
const successMessage = ref('')
const errorMessage = ref('')

// New state for handling updates
const editingUnitId = ref(null)

onMounted(async () => {
    await fetchRentalUnits()
})

const fetchRentalUnits = async () => {
    const { data, error } = await $supabase
        .from('rentalunit')
        .select('unit_ID, name, type')

    if (error) {
        console.error('Error fetching rental units:', error.message)
        errorMessage.value = `Error fetching rental units: ${error.message}`
        return
    }

    rentalUnits.value = data
}

const filteredUnits = computed(() => {
    return rentalUnits.value.filter(unit =>
        unit.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
})

const clearMessages = () => {
    successMessage.value = ''
    errorMessage.value = ''
}

const populateFormForEdit = (unit) => {
    clearMessages()
    editingUnitId.value = unit.unit_ID
    unitName.value = unit.name
    unitType.value = unit.type
    // You may also want to scroll the user to the top of the form for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

const submitForm = async () => {
    clearMessages() // Clear any previous messages

    if (!unitName.value || !unitType.value) {
        errorMessage.value = 'Please fill in all required fields.'
        return
    }

    if (editingUnitId.value) {
        // Update an existing rental unit
        const { error } = await $supabase
            .from('rentalunit')
            .update({ name: unitName.value, type: unitType.value })
            .eq('unit_ID', editingUnitId.value)

        if (error) {
            errorMessage.value = `Failed to update rental unit: ${error.message}`
            console.error(error)
        } else {
            successMessage.value = 'Rental unit updated successfully!'
            editingUnitId.value = null // Reset the editing state
            unitName.value = ''
            unitType.value = ''
            await fetchRentalUnits()
        }
    } else {
        // Insert a new rental unit
        const { error } = await $supabase.from('rentalunit').insert([
            {
                name: unitName.value,
                type: unitType.value
            }
        ])

        if (error) {
            errorMessage.value = `Failed to add rental unit: ${error.message}`
            console.error(error)
        } else {
            successMessage.value = 'Rental unit added successfully!'
            unitName.value = ''
            unitType.value = ''
            await fetchRentalUnits()
        }
    }
}
</script>

<template>
    <div>
        <main class="flex-1 p-11 space-y-6">
            <div class="text-sm text-gray-500">
                <span @click="emit('changeView', 'dashboard')" class="hover:underline">
                    Dashboard</span> /
                <span class="text-[#6b79c0] font-semibold">Rental Unit</span>
            </div>

            <div class="border-b-1 border-gray-300 pb-3">
                <h2 class="text-2xl mb-1 font-bold text-[#6b79c0]">Rental Units</h2>
                <p class="text-gray-600">Manage rental unit details for current and upcoming listings. Select a rental unit from the list to edit it.</p>
            </div>

            <div v-if="successMessage" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative" role="alert">
                <span class="block sm:inline">{{ successMessage }}</span>
                <span class="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer" @click="clearMessages">
                    <svg class="fill-current h-6 w-6 text-green-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.03a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
                </span>
            </div>
            <div v-if="errorMessage" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
                <span class="block sm:inline">{{ errorMessage }}</span>
                <span class="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer" @click="clearMessages">
                    <svg class="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.03a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
                </span>
            </div>

            <div class="grid grid-cols-1 max-w-7xl md:grid-cols-2 gap-8">
                <div class="bg-white p-6 rounded-lg shadow-sm">
                    <h3 class="text-lg font-bold mb-4">Rental Unit Information</h3>
                    <form class="space-y-4" @submit.prevent="submitForm">
                        <div>
                            <label class="block text-gray-600 pb-2 text-sm">Rental Unit Name <span
                                    class="text-red-500">*</span></label>
                            <input v-model="unitName" type="text"
                                class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Enter rental unit name" />
                        </div>
                        <div>
                            <label class="block text-gray-600 pb-2 text-sm">Type <span
                                    class="text-red-500">*</span></label>
                            <select v-model="unitType"
                                class="w-full border bg-[#f8f8f8] border-gray-300 rounded px-3 py-2 focus:outline-none focus:bg-white duration-300">
                                <option disabled value="">Select a rental unit</option>
                                <option>Hut</option>
                                <option>Duplex</option>
                            </select>
                        </div>
                        <div class="flex justify-end gap-2 pt-4">
                            <button type="reset"
                                class="px-9 py-3 border cursor-pointer rounded-3xl font-semibold text-black hover:bg-gray-100"
                                @click="unitName = ''; unitType = ''; clearMessages(); editingUnitId = null">
                                Clear
                            </button>
                            <button type="submit"
                                class="flex items-center gap-2 px-10 py-3 bg-black cursor-pointer font-semibold text-white rounded-3xl hover:bg-gray-900">
                                <Plus class="w-5 h-5" v-if="!editingUnitId" />
                                <span v-if="editingUnitId">Save</span>
                                <span v-else>Add</span>
                            </button>
                        </div>
                    </form>
                </div>

                <div>
                    <div class="mb-5 pb-3 flex justify-between border-b-1 border-gray-300">
                        <h2 class="text-xl font-bold">Rental Units</h2>
                        <div class="font-bold text-[#6b79c0] mb-2">{{ filteredUnits.length }} Result(s) Found</div>
                    </div>
                    <div
                        class="pr-15 mb-5 uppercase tracking-wider grid grid-cols-2 gap-4 font-semibold text-sm text-gray-500">
                        <span>Rental Unit Name</span>
                        <span class="text-right">Type</span>
                    </div>

                    <div v-for="unit in filteredUnits" :key="unit.name" @click="populateFormForEdit(unit)"
                        class="group bg-white rounded-xl mb-2 border border-gray-200 hover:shadow grid px-5 grid-cols-2 items-center text-sm text-gray-700 py-4 transition duration-200 cursor-pointer">
                        <span class="font-bold text-gray-900 duration-200 group-hover:text-[#6b79c0]">
                            {{ unit.name }}
                        </span>
                        <span class="text-right">{{ unit.type }}</span>
                    </div>
                    <div v-if="filteredUnits.length === 0" class="text-center text-gray-500 py-4">
                        No rental units found.
                    </div>
                </div>
            </div>
        </main>

    </div>
</template>