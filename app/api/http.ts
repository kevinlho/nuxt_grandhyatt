import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import type { AuthTokens } from '~/types/auth'
import { tokenStorage } from '~/utils/tokenStorage'

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean; skipAuth?: boolean }

interface Options {
  baseURL: string
  onSessionExpired: () => void
}

/**
 * Axios client with:
 *  - Bearer token injection (request interceptor)
 *  - Auto refresh on 401 with a single in-flight refresh;
 *    concurrent 401s are queued and replayed with the new token.
 */
export function createHttpClient({ baseURL, onSessionExpired }: Options): AxiosInstance {
  const http = axios.create({ baseURL, timeout: 15000, headers: { 'Content-Type': 'application/json' } })
  // separate bare instance for refresh so it never hits the interceptors
  const refreshHttp = axios.create({ baseURL, timeout: 15000 })

  let refreshPromise: Promise<string> | null = null

  async function refreshAccessToken(): Promise<string> {
    const refreshToken = tokenStorage.getRefreshToken()
    if (!refreshToken) throw new Error('No refresh token')
    const { data } = await refreshHttp.post<AuthTokens>('/auth/refresh', { refreshToken })
    tokenStorage.setTokens(data)
    return data.accessToken
  }

  http.interceptors.request.use((config: RetryConfig) => {
    if (!config.skipAuth) {
      const token = tokenStorage.getAccessToken()
      if (token) config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  http.interceptors.response.use(
    res => res,
    async (error: AxiosError) => {
      const original = error.config as RetryConfig | undefined
      const status = error.response?.status

      if (!original || status !== 401 || original._retry || original.skipAuth) {
        return Promise.reject(normalizeError(error))
      }
      original._retry = true

      try {
        // reuse the same refresh for every request that 401s at the same time
        refreshPromise ??= refreshAccessToken().finally(() => { refreshPromise = null })
        const newToken = await refreshPromise
        original.headers.Authorization = `Bearer ${newToken}`
        return http(original)
      } catch (e) {
        tokenStorage.clear()
        onSessionExpired()
        return Promise.reject(normalizeError(e as AxiosError))
      }
    }
  )

  return http
}

export class ApiError extends Error {
  constructor(message: string, public status?: number, public data?: unknown) { super(message) }
}

function normalizeError(error: AxiosError | Error): ApiError {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined
    return new ApiError(data?.message ?? error.message, error.response?.status, data)
  }
  return new ApiError(error.message)
}

declare module 'axios' {
  interface AxiosRequestConfig { skipAuth?: boolean }
}
