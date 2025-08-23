<script setup>
import { ref } from 'vue'
import { Plus } from 'lucide-vue-next'
import { useRoute } from 'vue-router'
const { $supabase } = useNuxtApp()

// Hotspot data
const hotspot = ref({
  adminPick: false,
  name: '',
  location: '',
  type: '',
  longitude: 0.0,
  latitude: 0.0,
  imageFile: null,
})

const route = useRoute()
const emit = defineEmits(['changeView'])

// All reactive variables defined here
const fileInput = ref(null)
const selectedFile = ref(null)
const adminPick = ref(false)
const isLoading = ref(false)
const isUploading = ref(false) // ✅ This was missing in your original code
const imageFile = ref(null)
const tempImageUrl = ref(null)
const tempImagePath = ref(null)

// State for user-facing messages
const message = ref('')
const isSuccess = ref(false)
const showMessage = ref(false)

const triggerFileInput = () => {
  fileInput.value?.click()
}

const onFileChange = async (e) => {
  const file = e.target.files?.[0]
  if (file) {
    console.log('File selected:', file.name, file.size, file.type)
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      message.value = 'Please select a valid image file (JPEG or PNG)'
      isSuccess.value = false
      showMessage.value = true
      return
    }
    
    // Validate file size (20MB = 20 * 1024 * 1024 bytes)
    if (file.size > 20 * 1024 * 1024) {
      message.value = 'File size must be less than 20MB'
      isSuccess.value = false
      showMessage.value = true
      return
    }
    
    selectedFile.value = file
    imageFile.value = file
    
    // Create immediate preview using FileReader
    const reader = new FileReader()
    reader.onload = (e) => {
      tempImageUrl.value = e.target.result
      console.log('Preview created:', tempImageUrl.value)
    }
    reader.readAsDataURL(file)
    
    // Upload to Supabase in background
    await uploadTempImage()
  } else {
    console.error('No file selected')
  }
}

const onDrop = async (e) => {
  e.preventDefault()
  const file = e.dataTransfer.files?.[0]
  if (file) {
    console.log('File dropped:', file.name, file.size, file.type)
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      message.value = 'Please select a valid image file (JPEG or PNG)'
      isSuccess.value = false
      showMessage.value = true
      return
    }
    
    // Validate file size
    if (file.size > 20 * 1024 * 1024) {
      message.value = 'File size must be less than 20MB'
      isSuccess.value = false
      showMessage.value = true
      return
    }
    
    selectedFile.value = file
    imageFile.value = file
    
    // Create immediate preview using FileReader
    const reader = new FileReader()
    reader.onload = (e) => {
      tempImageUrl.value = e.target.result
      console.log('Preview created from drop:', tempImageUrl.value)
    }
    reader.readAsDataURL(file)
    
    // Upload to Supabase in background
    await uploadTempImage()
  }
}

const onDragOver = (e) => {
  e.preventDefault()
}

const uploadTempImage = async () => {
  console.log('uploadTempImage called, imageFile:', imageFile.value?.name)
  
  if (!imageFile.value) {
    console.error('No image file to upload')
    return // Don't show error message since preview is already working
  }

  isUploading.value = true
  
  const fileName = `temp-${Date.now()}_${imageFile.value.name}`
  
  console.log('Uploading to Supabase storage:', fileName)

  try {
    const { data, error } = await $supabase
      .storage
      .from('hotspot-temp')
      .upload(fileName, imageFile.value, {
        cacheControl: '3600',
        upsert: true,
      })

    console.log('Upload result:', { data, error })

    if (error) {
      console.error('Upload error:', error)
      // Don't show error to user since preview still works
      return
    }

    // Store the uploaded file path for later use
    tempImagePath.value = fileName
    
    console.log('Image uploaded to Supabase successfully')

  } catch (err) {
    console.error('Upload exception:', err)
    // Don't show error to user since preview still works
  } finally {
    isUploading.value = false
  }
}

const addHotspot = async () => {
  if (isLoading.value || !hotspot.value.name || !hotspot.value.location || !hotspot.value.type || !imageFile.value) {
    message.value = 'Please fill out all required fields.'
    isSuccess.value = false
    showMessage.value = true
    return
  }
  
  isLoading.value = true
  showMessage.value = false

  try {
    let finalImageUrl = null

    if (tempImagePath.value) {
      const finalPath = `hotspots/${Date.now()}_${imageFile.value.name}`

      // Download from temp storage
      const { data: downloadData, error: downloadError } = await $supabase
        .storage
        .from('hotspot-temp')
        .download(tempImagePath.value)

      if (downloadError) throw downloadError

      // Upload to final storage
      const { data, error: finalUploadError } = await $supabase
        .storage
        .from('hotspot-images')
        .upload(finalPath, downloadData)

      if (finalUploadError) throw finalUploadError

      // Get public URL - FIXED: use 'data.path' instead of 'finalUploadData.path'
      const { data: urlData } = $supabase
        .storage
        .from('hotspot-images')
        .getPublicUrl(data.path)

      finalImageUrl = urlData.publicUrl

      // Optional: Clean up temp file
      try {
        await $supabase
          .storage
          .from('hotspot-temp')
          .remove([tempImagePath.value])
      } catch (cleanupError) {
        console.warn('Failed to cleanup temp file:', cleanupError)
      }
    }

    // Insert hotspot data
    const { error } = await $supabase.from('hotspot').insert([
      {
        adminPick: adminPick.value,
        name: hotspot.value.name,
        location: hotspot.value.location,
        type: hotspot.value.type,
        longitude: parseFloat(hotspot.value.longitude),
        latitude: parseFloat(hotspot.value.latitude),
        image: finalImageUrl,
      }
    ])

    if (error) {
      throw error
    }
    
    clearForm()

    message.value = 'Hotspot added successfully!'
    isSuccess.value = true
    showMessage.value = true

  } catch (err) {
    console.error(err)
    message.value = 'Insert failed: ' + (err.message || 'Unknown error')
    isSuccess.value = false
    showMessage.value = true
  } finally {
    isLoading.value = false
  }
}

const clearForm = () => {
  Object.assign(hotspot.value, {
    adminPick: false,
    name: '',
    location: '',
    type: '',
    longitude: 0.0,
    latitude: 0.0,
    imageFile: null,
  })
  selectedFile.value = null
  tempImageUrl.value = null
  tempImagePath.value = null
  imageFile.value = null
  adminPick.value = false
  showMessage.value = false
  
  // Clear the file input
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}
</script>

<template>
  <div>
    <main class="flex-1 p-11 space-y-6">
      <!-- Breadcrumb -->
      <div class="text-sm text-gray-500">
        <span @click="emit('changeView', 'dashboard')" class="hover:underline cursor-pointer">Dashboard</span>
        /
        <span class="text-[#6b79c0] font-semibold">Add Hotspot</span>
      </div>

      <!-- Header -->
      <div class="border-b-1 border-gray-300 pb-3">
        <h2 class="text-2xl mb-1 font-bold text-[#6b79c0]">Add Hotspot</h2>
        <p class="text-gray-600">Mark and label a specific location on the map for users to explore.</p>
      </div>

      <!-- Form Section -->
      <div class="bg-white p-6 rounded-lg shadow-sm max-w-6xl space-y-10">
        <!-- Message box -->
        <div v-if="showMessage" :class="[
          isSuccess ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700', 
          'border px-4 py-3 rounded relative'
        ]" role="alert">
          <span class="block sm:inline">{{ message }}</span>
        </div>
        
        <form class="space-y-8" @submit.prevent="addHotspot">
          <div class="space-y-6">
            <div class="flex gap-10">
              <!-- Left Column -->
              <div class="flex flex-col space-y-4">
                <!-- Name -->
                <div>
                  <label class="block text-gray-600 pb-2 text-sm">
                    Hotspot Name <span class="text-red-500">*</span>
                  </label>
                  <input 
                    v-model="hotspot.name" 
                    type="text" 
                    placeholder="Enter hotspot name"
                    class="w-full border bg-[#f8f8f8] border-gray-300 rounded px-3 py-2 focus:outline-none focus:bg-white duration-300"
                  />
                </div>

                <!-- Location -->
                <div>
                  <label class="block text-gray-600 pb-2 text-sm">
                    Location Name<span class="text-red-500">*</span>
                  </label>
                  <select
                    v-model="hotspot.location"
                    class="w-full border bg-[#f8f8f8] border-gray-300 rounded px-3 py-2 focus:outline-none focus:bg-white duration-300"
                  >
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
                  <select
                    v-model="hotspot.type"
                    class="w-full border bg-[#f8f8f8] border-gray-300 rounded px-3 py-2 focus:outline-none focus:bg-white duration-300"
                  >
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
                  <input
                    v-model="hotspot.latitude"
                    type="number"
                    step="any"
                    placeholder="Enter latitude"
                    class="w-full border bg-[#f8f8f8] border-gray-300 rounded px-3 py-2 focus:outline-none focus:bg-white duration-300"
                  />
                </div>
                
                <!-- Longitude -->
                <div>
                  <label class="block text-gray-600 pb-2 text-sm">
                    Longitude <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="hotspot.longitude"
                    type="number"
                    step="any"
                    placeholder="Enter longitude"
                    class="w-full border bg-[#f8f8f8] border-gray-300 rounded px-3 py-2 focus:outline-none focus:bg-white duration-300"
                  />
                </div>
              </div>

              <!-- Right Column -->
              <div class="space-y-6">
                <!-- Image Upload -->
                <div class="space-y-2">
                  <label class="block text-sm font-medium text-gray-700">
                    Upload Image Here <span class="text-red-500">*</span>
                  </label>

                  <!-- Upload Loading State -->
                  <div v-if="isUploading" class="text-center py-4">
                    <div class="inline-flex items-center">
                      <svg class="w-4 h-4 animate-spin mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span class="text-gray-600">Uploading image...</span>
                    </div>
                  </div>

                  <!-- Drop Zone -->
                  <div
                    @drop="onDrop"
                    @dragover="onDragOver"
                    class="border-2 border-dashed border-gray-300 rounded-md p-4 text-center cursor-pointer hover:border-indigo-500 transition-colors"
                    :class="{ 'opacity-50 pointer-events-none': isUploading }"
                  >
                    <p class="text-sm text-gray-400 mb-2">JPEG and PNG formats, up to 20MB</p>
                    
                    <input
                      type="file"
                      class="hidden"
                      ref="fileInput"
                      @change="onFileChange"
                      accept="image/jpeg,image/png,image/jpg"
                    />
                    
                    <button
                      type="button"
                      @click.prevent="triggerFileInput"
                      :disabled="isUploading"
                      class="mt-2 px-4 py-2 rounded border text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Browse Files
                    </button>

                    <!-- Selected file name - only show if no preview yet -->
                    <div v-if="selectedFile && !tempImageUrl" class="mt-2 text-sm text-gray-600">
                      Selected: {{ selectedFile.name }}
                    </div>

                    <!-- Image preview - always show if tempImageUrl exists -->
                    <div v-if="tempImageUrl" class="mt-4">
                      <p class="font-semibold text-gray-700 mb-2">Image Preview:</p>
                      <img 
                        :src="tempImageUrl" 
                        alt="Preview" 
                        class="w-64 h-auto mt-2 rounded-lg shadow mx-auto border max-h-64 object-cover" 
                      />
                      <p class="text-sm text-green-600 mt-2">
                        ✅ {{ isUploading ? 'Uploading to server...' : 'Image ready!' }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Admin Pick -->
                <div class="space-y-2">
                  <label class="block text-sm font-medium text-gray-700">
                    Set as Admin's Pick? <span class="text-red-500">*</span>
                  </label>
                  <div class="flex items-center gap-4">
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        :value="true"
                        v-model="adminPick"
                        class="accent-indigo-500"
                        name="adminPick"
                      />
                      <span>Yes</span>
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        :value="false"
                        v-model="adminPick"
                        class="accent-indigo-500"
                        name="adminPick"
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex gap-4">
                  <button 
                    type="button" 
                    @click="clearForm" 
                    :disabled="isLoading || isUploading"
                    class="px-9 py-3 border cursor-pointer rounded-3xl font-semibold text-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Clear
                  </button>
                  <button 
                    type="submit" 
                    :disabled="isLoading || isUploading || !imageFile" 
                    class="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <svg v-if="isLoading" class="w-4 h-4 animate-spin mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>{{ isLoading ? 'Saving...' : 'Save Hotspot' }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Add any custom styles if needed */
</style>