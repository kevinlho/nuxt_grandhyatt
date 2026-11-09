import { createHttpClient } from '~/infrastructure/http/httpClient'
import { createContainer } from '~/di/container'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const http = createHttpClient({
    baseURL: config.public.apiBaseUrl,
    onSessionExpired: () => {
      useState('auth.user').value = null
      navigateTo('/login')
    }
  })
  return { provide: { di: createContainer(http, config.public.useDummy) } }
})
