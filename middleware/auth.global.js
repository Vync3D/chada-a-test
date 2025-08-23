export default defineNuxtRouteMiddleware((to) => {
    const { authUser } = useAuth()
  
    if (to.path === '/homepage' && authUser.value?.role !== 'guest') {
      return navigateTo('/')
    }
  
    if (to.path === '/admin' && authUser.value?.role !== 'employee') {
      return navigateTo('/')
    }
})