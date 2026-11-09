import { createHttpClient } from '~/api/http'
import { createApi } from '~/api'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const http = createHttpClient({
    baseURL: config.public.apiBaseUrl,
    onSessionExpired: () => {
      useState('auth.user').value = null
      navigateTo('/login')
    }
  })
  return { provide: { api: createApi(http, String(config.public.useDummy) !== 'false', config.public.chatApiUrl as string) } }
})
