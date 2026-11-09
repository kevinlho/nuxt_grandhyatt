import type { ChatApi } from '../chat'
import { uid } from './db'

const wait = (ms: number, signal?: AbortSignal) => new Promise<void>((res, rej) => {
  const t = setTimeout(res, ms)
  signal?.addEventListener('abort', () => { clearTimeout(t); const e = new Error('canceled'); e.name = 'CanceledError'; rej(e) })
})

const imageSize = (f: File) => new Promise<string>((res) => {
  const url = URL.createObjectURL(f)
  const img = new Image()
  img.onload = () => { res(`${img.naturalWidth}×${img.naturalHeight}`); URL.revokeObjectURL(url) }
  img.onerror = () => { res('unknown size'); URL.revokeObjectURL(url) }
  img.src = url
})

/** Simulated agent — no network. Replace with the real endpoint by setting NUXT_PUBLIC_USE_DUMMY=false. */
export const mockChatApi: ChatApi = {
  async send(input, signal) {
    await wait(900 + Math.random() * 900, signal)
    const q = input.message.trim()
    if (/error|gagal/i.test(q)) throw new Error('The agent could not process this request (simulated error).')

    const parts: string[] = []
    if (input.images.length) {
      const sizes = await Promise.all(input.images.map(imageSize))
      parts.push(`I received **${input.images.length} image${input.images.length > 1 ? 's' : ''}**:`)
      input.images.forEach((f, i) => parts.push(`- ${f.name} — ${sizes[i]}, ${(f.size / 1024).toFixed(0)} KB`))
      parts.push('')
    }
    if (q) {
      parts.push(`You asked: “${q.length > 160 ? q.slice(0, 160) + '…' : q}”`)
      parts.push('')
      parts.push('This is a **dummy reply**. Once the agent endpoint is connected, its answer will appear here — including steps the agent took and any results it produced.')
    } else {
      parts.push('Ask me something about these images and I will analyse them.')
    }
    return {
      conversationId: input.conversationId ?? `conv_${uid()}`,
      message: { id: uid(), role: 'assistant', content: parts.join('\n'), attachments: [], createdAt: new Date().toISOString() }
    }
  }
}
