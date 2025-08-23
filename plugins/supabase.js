import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uqwtvclwrzsntooluzka.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxd3R2Y2x3cnpzbnRvb2x1emthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NTAzMDgsImV4cCI6MjA2NzEyNjMwOH0.L4Tk83SJSXvqajByJiAiPei3xr8TnS71z-N7u8RVALw'
const supabase = createClient(supabaseUrl, supabaseKey)

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.provide('supabase', supabase)
})