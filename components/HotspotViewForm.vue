<script setup>
import { useRoute } from 'vue-router'
import { onMounted, ref, watch } from 'vue'
import {
    Plus, ClipboardCopy, Trash2, Check, Pencil, ArrowLeft, X
} from 'lucide-vue-next'

const props = defineProps({
    hotspot: {
        type: Object,
        default: null
    }
})

const route = useRoute()
const emit = defineEmits(['changeView', 'hotspotUpdated'])

const { $supabase } = useNuxtApp()

// Initialize hotspot data
const hotspotData = ref({
    name: '',
    location: '',
    type: '',
    longitude: '',
    latitude: '',
    adminPick: false,
    image: '',
})

const tempImageUrl = ref('')
const imageFile = ref(null)
const fileInput = ref(null)
const isEditing = ref(false)
const isLoading = ref(false)

// Modal State
const isModalOpen = ref(false)
const modalTitle = ref('')
const modalMessage = ref('')
const modalIsConfirm = ref(false)
const modalCallback = ref(null)

// Load hotspot data from props
const loadHotspotData = () => {
    // Check if the hotspot prop exists before trying to access its properties.
    if (props.hotspot) {
        hotspotData.value = {
            name: props.hotspot.name || '',
            location: props.hotspot.location || '',
            type: props.hotspot.type || '',
            latitude: props.hotspot.latitude || '',
            longitude: props.hotspot.longitude || '',
            adminPick: props.hotspot.adminPick || false,
            image: props.hotspot.image || '',
        }

        // Set temp image URL if image exists
        if (props.hotspot.image && props.hotspot.image !== 'NULL') {
            tempImageUrl.value = props.hotspot.image
        }
    }
}

// Watch for changes in props
watch(() => props.hotspot, (newHotspot) => {
    if (newHotspot) {
        loadHotspotData()
    }
}, { immediate: true })

onMounted(() => {
    loadHotspotData()
})

const enableEdit = () => {
    isEditing.value = true
}

const cancelEdit = () => {
    isEditing.value = false
    loadHotspotData() // Reset to original dataa
}

const triggerFileInput = () => {
    fileInput.value?.click()
}

const onFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
        imageFile.value = file
        const reader = new FileReader()
        reader.onload = (e) => {
            tempImageUrl.value = e.target.result
        }
        reader.readAsDataURL(file)
    }
}

// FIXED: Updated uploadImage function to use 'hotspot-images' bucket
const uploadImage = async (file) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `hotspots/${fileName}`

    const { data, error } = await $supabase.storage
        .from('hotspot-images')  // Changed from 'images' to 'hotspot-images'
        .upload(filePath, file)

    if (error) {
        console.error('Error uploading image:', error)
        throw error
    }

    const { data: { publicUrl } } = $supabase.storage
        .from('hotspot-images')  // Changed from 'images' to 'hotspot-images'
        .getPublicUrl(filePath)

    return publicUrl
}

const saveHotspot = async () => {
    // A more explicit check to ensure the hotspot object and its ID are available.
    // This is where the "no hotspot id found" error likely originates.
    if (!props.hotspot || !props.hotspot.hotspot_ID) {
        console.error('No hotspot ID found')
        showModal('Error', 'No hotspot ID found. The hotspot object passed to this component is missing the hotspot_ID property.', false)
        return
    }

    isLoading.value = true

    try {
        let imageUrl = hotspotData.value.image

        // Upload new image if one was selected
        if (imageFile.value) {
            imageUrl = await uploadImage(imageFile.value)
        }

        const { error } = await $supabase
            .from('hotspot')
            .update({
                name: hotspotData.value.name,
                location: hotspotData.value.location,
                type: hotspotData.value.type,
                longitude: parseFloat(hotspotData.value.longitude),
                latitude: parseFloat(hotspotData.value.latitude),
                adminPick: hotspotData.value.adminPick,
                image: imageUrl
            })
            .eq('hotspot_ID', props.hotspot.hotspot_ID)

        if (error) {
            console.error('Failed to update hotspot:', error)
            showModal('Error', 'Failed to update hotspot.', false)
        } else {
            isEditing.value = false
            imageFile.value = null
            showModal('Success', 'Hotspot updated successfully!', false)
            emit('hotspotUpdated')
        }
    } catch (error) {
        console.error('Error saving hotspot:', error)
        showModal('Error', 'Error saving hotspot.', false)
    } finally {
        isLoading.value = false
    }
}

const deleteHotspot = () => {
    // A more explicit check for the hotspot object and its ID.
    if (!props.hotspot || !props.hotspot.hotspot_ID) {
        console.error('No hotspot ID found')
        showModal('Error', 'No hotspot ID found. The hotspot object passed to this component is missing the hotspot_ID property.', false)
        return
    }

    showModal(
        'Confirm Deletion',
        'Are you sure you want to delete this hotspot? This action cannot be undone.',
        true,
        async () => {
            isLoading.value = true
            const { error } = await $supabase
                .from('hotspot')
                .delete()
                .eq('hotspot_ID', props.hotspot.hotspot_ID)

            if (error) {
                console.error('Failed to delete hotspot:', error)
                showModal('Error', 'Failed to delete hotspot.', false)
            } else {
                showModal('Success', 'Hotspot deleted successfully!', false, () => {
                    emit('hotspotUpdated') // Navigate back after confirming deletion
                    goBack()
                })
            }
            isLoading.value = false
        }
    )
}

const showModal = (title, message, isConfirm = false, callback = null) => {
    modalTitle.value = title
    modalMessage.value = message
    modalIsConfirm.value = isConfirm
    modalCallback.value = callback
    isModalOpen.value = true
}

const closeModal = (confirmed = false) => {
    isModalOpen.value = false
    if (confirmed && modalCallback.value) {
        modalCallback.value()
    }
    modalCallback.value = null
}

const goBack = () => {
    emit('changeView', 'viewHotspots')
}
</script>

<template>
    <div>
        <!-- Main Content -->
        <main class="flex-1 space-y-6">
            <!-- Breadcrumb -->
            <div class="text-sm text-gray-500">
                <span @click="emit('changeView', 'dashboard')" class="hover:underline cursor-pointer">
                    Dashboard</span> /
                <span @click="emit('changeView', 'viewHotspots')" class="hover:underline cursor-pointer">
                    View Hotspots</span> /
                <span class="text-[#6b79c0] font-semibold">Hotspot Details</span>
            </div>

            <!-- Header -->
            <div class="border-b-1 border-gray-300 pb-3">
                <div class="flex items-center text-2xl font-bold text-[#6b79c0]">
                    <button @click="goBack" class="hover:bg-gray-100 p-2 rounded-full duration-150">
                        <ArrowLeft class="text-black w-7 h-7" />
                    </button>
                    <h2 class="mb-1 pl-5">Hotspot Details</h2>
                </div>
                <p class="text-gray-600 mt-1">Handle hotspot information.</p>
            </div>

            <!-- Main Panel -->
            <div class="bg-white p-6 rounded-lg shadow-sm max-w-6xl space-y-10">
                <form class="space-y-8" @submit.prevent="isEditing ? saveHotspot() : null">
                    <div class="space-y-6">
                        <div class="flex gap-10">
                            <!-- Left -->
                            <div class="flex flex-col space-y-4 flex-1">
                                <!-- Name -->
                                <div>
                                    <label class="block text-gray-600 pb-2 text-sm">
                                        Hotspot Name <span class="text-red-500">*</span>
                                    </label>
                                    <input v-model="hotspotData.name" type="text" placeholder="Enter hotspot name"
                                        :disabled="!isEditing"
                                        class="w-full border bg-[#f8f8f8] border-gray-300 rounded px-3 py-2 focus:outline-none focus:bg-white duration-300 disabled:bg-gray-100" />
                                </div>

                                <!-- Location -->
                                <div>
                                    <label class="block text-gray-600 pb-2 text-sm">
                                        Location Name<span class="text-red-500">*</span>
                                    </label>
                                    <select v-model="hotspotData.location" :disabled="!isEditing"
                                        class="w-full border bg-[#f8f8f8] border-gray-300 rounded px-3 py-2 focus:outline-none focus:bg-white duration-300 disabled:bg-gray-100">
                                        <option disabled value="">Select a municipality</option>
                                        <option>Enrique</option>
                                        <option>Villanueva</option>
                                        <option>Larena</option>
                                        <option>Lazi</option>
                                        <option>Maria</option>
                                        <option>San Juan</option>
                                        <option>Siquijor</option>
                                    </select>
                                </div>

                                <!-- Type -->
                                <div>
                                    <label class="block text-gray-600 pb-2 text-sm">
                                        Type<span class="text-red-500">*</span>
                                    </label>
                                    <select v-model="hotspotData.type" :disabled="!isEditing"
                                        class="w-full border bg-[#f8f8f8] border-gray-300 rounded px-3 py-2 focus:outline-none focus:bg-white duration-300 disabled:bg-gray-100">
                                        <option disabled value="">Select type</option>
                                        <option>Beach</option>
                                        <option>Cafe</option>
                                        <option>Historical Site</option>
                                        <option>Nature</option>
                                        <option>Nightlife</option>
                                        <option>Restaurant</option>
                                    </select>
                                </div>

                                <!-- Latitude -->
                                <div>
                                    <label class="block text-gray-600 pb-2 text-sm">
                                        Latitude <span class="text-red-500">*</span>
                                    </label>
                                    <input v-model="hotspotData.latitude" type="number" step="any"
                                        placeholder="Enter latitude" :disabled="!isEditing"
                                        class="w-full border bg-[#f8f8f8] border-gray-300 rounded px-3 py-2 focus:outline-none focus:bg-white duration-300 disabled:bg-gray-100" />
                                </div>

                                <!-- Longitude -->
                                <div>
                                    <label class="block text-gray-600 pb-2 text-sm">
                                        Longitude <span class="text-red-500">*</span>
                                    </label>
                                    <input v-model="hotspotData.longitude" type="number" step="any"
                                        placeholder="Enter longitude" :disabled="!isEditing"
                                        class="w-full border bg-[#f8f8f8] border-gray-300 rounded px-3 py-2 focus:outline-none focus:bg-white duration-300 disabled:bg-gray-100" />
                                </div>

                            </div>

                            <!-- Right -->
                            <div class="space-y-6 flex-1">
                                <!-- Current Image Display -->
                                <div v-if="hotspotData.image && !isEditing" class="space-y-2">
                                    <label class="block text-sm font-medium text-gray-700">
                                        Current Image
                                    </label>
                                    <div class="border rounded-md overflow-hidden shadow">
                                        <img :src="hotspotData.image" alt="Hotspot Image" class="w-full h-auto" />
                                    </div>
                                </div>

                                <!-- Image Upload (only in edit mode) -->
                                <div v-if="isEditing" class="space-y-2">
                                    <label class="block text-sm font-medium text-gray-700">
                                        Upload New Image (Optional)
                                    </label>
                                    <div
                                        class="border-2 border-dashed border-gray-300 rounded-md p-4 text-center cursor-pointer hover:border-indigo-500 duration-150">
                                        <p class="text-sm text-gray-400 mb-2">JPEG and PNG formats, up to 20MB</p>
                                        <input type="file" class="hidden" ref="fileInput" @change="onFileChange"
                                            accept="image/jpeg, image/png" />
                                        <button type="button" @click.prevent="triggerFileInput"
                                            class="mt-2 px-4 py-2 rounded-full border text-sm font-medium text-gray-700 hover:bg-gray-100 duration-150">
                                            Browse
                                        </button>
                                    </div>

                                    <div v-if="tempImageUrl" class="mt-4">
                                        <p class="font-semibold text-gray-700">Image Preview:</p>
                                        <img :src="tempImageUrl" alt="Preview"
                                            class="w-full h-auto mt-2 rounded-lg shadow-md" />
                                    </div>
                                </div>

                                <!-- Admin Pick -->
                                <div class="flex items-center gap-9">
                                    <label class="text-sm font-medium text-gray-700">
                                        Set as Admin's Pick? <span class="text-red-500">*</span>
                                    </label>
                                    <div class="flex items-center gap-4">
                                        <label class="flex items-center gap-2">
                                            <input type="radio" :value="true" v-model="hotspotData.adminPick"
                                                :disabled="!isEditing" class="accent-indigo-500" name="adminPick" />
                                            <span>Yes</span>
                                        </label>
                                        <label class="flex items-center gap-2">
                                            <input type="radio" :value="false" v-model="hotspotData.adminPick"
                                                :disabled="!isEditing" class="accent-indigo-500" name="adminPick" />
                                            <span>No</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>

                <!-- Action Buttons -->
                <div class="flex gap-4 border-t pt-6 mt-6 border-gray-200">
                    <button v-if="!isEditing" @click="deleteHotspot" type="button"
                        class="bg-red-700 hover:bg-red-800 text-white rounded-full px-6 py-3 flex items-center justify-center space-x-2 transition-all duration-150">
                        <Trash2 class="w-4 h-4" />
                        <span>Delete</span>
                    </button>

                    <button v-if="!isEditing" @click="enableEdit" type="button"
                        class="border border-gray-300 px-6 py-3 rounded-full hover:bg-gray-100 flex items-center justify-center space-x-2 transition-all duration-150">
                        <Pencil class="w-4 h-4" />
                        <span>Edit</span>
                    </button>

                    <template v-if="isEditing">
                        <button @click="cancelEdit" type="button"
                            class="border border-gray-300 px-6 py-3 rounded-full hover:bg-gray-100 flex items-center justify-center space-x-2 transition-all duration-150">
                            <span>Cancel</span>
                        </button>

                        <button @click="saveHotspot" type="submit" :disabled="isLoading"
                            class="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center space-x-2 transition-all duration-150">
                            <svg v-if="isLoading" class="w-4 h-4 animate-spin text-white"
                                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                    stroke-width="4" />
                                <path class="opacity-75" fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            <Check v-else class="w-4 h-4" />
                            <span>{{ isLoading ? 'Saving...' : 'Save' }}</span>
                        </button>
                    </template>
                </div>
            </div>
        </main>

        <!-- Custom Modal Component -->
        <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div class="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-6">
                <div class="flex justify-between items-center pb-3">
                    <h3 class="text-xl font-semibold text-gray-900">{{ modalTitle }}</h3>
                    <button @click="closeModal()"
                        class="text-gray-400 hover:text-gray-600 transition-colors duration-150">
                        <X class="w-6 h-6" />
                    </button>
                </div>
                <div class="py-4 text-gray-700">
                    <p>{{ modalMessage }}</p>
                </div>
                <div class="flex justify-end pt-4 space-x-2 border-t border-gray-200">
                    <button v-if="modalIsConfirm" @click="closeModal(false)"
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors duration-150">
                        Cancel
                    </button>
                    <button @click="closeModal(true)"
                        :class="{ 'bg-red-600 hover:bg-red-700 text-white': modalIsConfirm, 'bg-blue-600 hover:bg-blue-700 text-white': !modalIsConfirm }"
                        class="px-4 py-2 text-sm font-medium rounded-full transition-colors duration-150">
                        {{ modalIsConfirm ? 'Delete' : 'OK' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>