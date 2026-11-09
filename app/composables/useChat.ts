import { CHAT_LIMITS, type ChatAttachment, type ChatMessage, type Conversation } from '~/types/chat'
import { isAbort } from '~/api/chat'

const newId = () => Math.random().toString(36).slice(2, 10)
const now = () => new Date().toISOString()

/**
 * Chat state for the assistant page. Conversations live in memory for this tab
 * (the server keeps the real history via conversationId).
 */
export function useChat() {
  const { $api } = useNuxtApp()
  const conversations = useState<Conversation[]>('chat.conversations', () => [])
  const activeId = useState<string | null>('chat.active', () => null)
  const sending = ref(false)
  let controller: AbortController | null = null

  const active = computed(() => conversations.value.find(c => c.id === activeId.value) ?? null)

  function newConversation() { activeId.value = null }
  function select(id: string) { activeId.value = id }
  function removeConversation(id: string) {
    const c = conversations.value.find(x => x.id === id)
    c?.messages.forEach(m => m.attachments.forEach(a => a.url.startsWith('blob:') && URL.revokeObjectURL(a.url)))
    conversations.value = conversations.value.filter(x => x.id !== id)
    if (activeId.value === id) activeId.value = null
  }

  /** returns an error message, or undefined if the files are acceptable */
  function validateFiles(files: File[], already = 0) {
    if (files.length + already > CHAT_LIMITS.maxImages) return `Up to ${CHAT_LIMITS.maxImages} images per message`
    const bad = files.find(f => !CHAT_LIMITS.accept.includes(f.type))
    if (bad) return `${bad.name}: only PNG, JPG, WEBP or GIF`
    const big = files.find(f => f.size > CHAT_LIMITS.maxImageBytes)
    if (big) return `${big.name} is larger than ${CHAT_LIMITS.maxImageBytes / 1024 / 1024} MB`
  }

  async function send(text: string, images: File[]) {
    const message = text.trim()
    if ((!message && !images.length) || sending.value) return false

    // create the conversation locally on first message
    let conv = active.value
    if (!conv) {
      conv = reactive({ id: `local_${newId()}`, title: message.slice(0, 48) || 'Image question', messages: [], updatedAt: now() }) as Conversation
      conversations.value = [conv, ...conversations.value]
      activeId.value = conv.id
    }
    const attachments: ChatAttachment[] = images.map(f => ({ id: newId(), name: f.name, type: f.type, size: f.size, url: URL.createObjectURL(f) }))
    const userMsg: ChatMessage = reactive({ id: newId(), role: 'user', content: message, attachments, createdAt: now(), status: 'sending' })
    conv.messages.push(userMsg)
    return dispatch(conv, userMsg, images)
  }

  async function dispatch(conv: Conversation, userMsg: ChatMessage, images: File[]) {
    sending.value = true
    controller = new AbortController()
    try {
      const res = await $api.chat.send({
        message: userMsg.content,
        conversationId: conv.id.startsWith('local_') ? undefined : conv.id,
        images
      }, controller.signal)
      userMsg.status = undefined
      userMsg.error = undefined
      // adopt the server's conversation id
      if (conv.id !== res.conversationId) {
        if (activeId.value === conv.id) activeId.value = res.conversationId
        conv.id = res.conversationId
      }
      conv.messages.push({ ...res.message, role: 'assistant', attachments: res.message.attachments ?? [] })
      conv.updatedAt = now()
      return true
    } catch (e) {
      userMsg.status = 'error'
      userMsg.error = isAbort(e) ? 'Stopped' : (e as Error).message
      ;(userMsg as ChatMessage & { _files?: File[] })._files = images // keep for retry
      return false
    } finally {
      sending.value = false
      controller = null
    }
  }

  function retry(msg: ChatMessage) {
    const conv = active.value
    if (!conv || sending.value) return
    msg.status = 'sending'
    dispatch(conv, msg, (msg as ChatMessage & { _files?: File[] })._files ?? [])
  }

  function stop() { controller?.abort() }

  return { conversations, active, activeId, sending, send, retry, stop, select, newConversation, removeConversation, validateFiles }
}
