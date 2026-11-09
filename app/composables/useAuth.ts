import type { AuthUser, LoginCredentials } from '~/types/auth'
import { tokenStorage } from '~/utils/tokenStorage'

export function useAuth() {
  const { $api } = useNuxtApp()
  const user = useState<AuthUser | null>('auth.user', () => tokenStorage.getUser())
  const isLoggedIn = computed(() => !!user.value && !!tokenStorage.getAccessToken())

  async function login(c: LoginCredentials) {
    if (!c.email || !c.password) throw new Error('Email and password are required')
    const res = await $api.auth.login(c)
    tokenStorage.setTokens(res.tokens)
    tokenStorage.setUser(res.user)
    user.value = res.user
  }

  async function logout() {
    try { await $api.auth.logout() } catch { /* ignore */ }
    tokenStorage.clear()
    user.value = null
    await navigateTo('/login')
  }

  return { user, isLoggedIn, login, logout }
}
