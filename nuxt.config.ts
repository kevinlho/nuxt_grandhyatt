export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  devtools: { enabled: true },
  ssr: false, // CMS = SPA; tokens live in the browser
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
      meta: [
        { name: 'theme-color', content: '#ffffff', media: '(prefers-color-scheme: light)' },
        { name: 'theme-color', content: '#0f172a', media: '(prefers-color-scheme: dark)' },
        { name: 'mobile-web-app-capable', content: 'yes' }
      ]
    }
  },
  runtimeConfig: {
    public: {
      // overridden by NUXT_PUBLIC_API_BASE_URL
      apiBaseUrl: 'http://localhost:8080/api/v1',
      // overridden by NUXT_PUBLIC_USE_DUMMY (true = dummy data, false = real API)
      useDummy: true,
      // overridden by NUXT_PUBLIC_CHAT_API_URL — base URL of the agentic AI (empty = same as apiBaseUrl)
      chatApiUrl: ''
    }
  }
})
