import axios, { type AxiosInstance } from 'axios'
import type { ChatReply, ChatSendInput } from '~/types/chat'

/**
 * Agentic AI client. Uses the CMS http client (bearer token + auto refresh) when the agent
 * lives behind the same API, or its own base URL via NUXT_PUBLIC_CHAT_API_URL.
 */
export const chatApi = (http: AxiosInstance, baseURL?: string) => ({
  async send(input: ChatSendInput, signal?: AbortSignal): Promise<ChatReply> {
    const fd = new FormData()
    fd.append('message', input.message)
    if (input.conversationId) fd.append('conversationId', input.conversationId)
    input.images.forEach(f => fd.append('images', f, f.name))
    const { data } = await http.post<ChatReply>('/chat', fd, {
      ...(baseURL ? { baseURL } : {}),
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000, // agents can take a while
      signal
    })
    return data
  }
})

export type ChatApi = ReturnType<typeof chatApi>
export const isAbort = (e: unknown) => axios.isCancel(e) || (e as Error)?.name === 'AbortError' || (e as Error)?.name === 'CanceledError'
