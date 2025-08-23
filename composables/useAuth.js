export function useAuth() {
  const router = useRouter()
  const authUser = useCookie('authUser', {
    default: () => null,
    watch: true,
    maxAge: 60 * 60 * 24 * 7,
  })

  const setAuthUser = (user) => {
    authUser.value = user
  }

  const logout = () => {
    authUser.value = null
    router.push('/')
  }

  const isGuest = computed(() => authUser.value?.role === 'guest')
  const isEmployee = computed(() => authUser.value?.role === 'employee')

  return {
    authUser,
    setAuthUser,
    logout,
    isGuest,
    isEmployee,
  }
}
