/**
 * Chatbot ↔ agentic AI contract.
 *
 * POST {chatApiUrl}/chat   (multipart/form-data)
 *   message         string            the user's question
 *   conversationId  string (optional) omit to start a new conversation
 *   images          File[] (0..n)     repeated field "images"
 * → 200 ChatReply
 */
export interface ChatAttachment {
  id: string
  name: string
  type: string
  size: number
  /** object URL (local preview) or URL returned by the API */
  url: string
}

export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  attachments: ChatAttachment[]
  createdAt: string
  /** client-only states */
  status?: 'sending' | 'error'
  error?: string
}

export interface ChatSendInput {
  message: string
  conversationId?: string
  images: File[]
}

export interface ChatReply {
  conversationId: string
  message: ChatMessage
}

export interface Conversation {
  id: string            // server conversationId (or local id until the first reply)
  title: string
  messages: ChatMessage[]
  updatedAt: string
}

export const CHAT_LIMITS = {
  maxImages: 4,
  maxImageBytes: 5 * 1024 * 1024,
  accept: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
  maxChars: 4000
}
