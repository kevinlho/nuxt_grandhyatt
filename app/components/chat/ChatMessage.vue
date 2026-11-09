<script setup lang="ts">
import type { ChatMessage } from '~/types/chat'

const props = defineProps<{ message: ChatMessage }>()
const emit = defineEmits<{ retry: []; preview: [url: string] }>()
const isUser = computed(() => props.message.role === 'user')
const html = computed(() => renderMarkdown(props.message.content))
const time = computed(() => new Date(props.message.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }))
const toast = useToast()
async function copy() {
  try { await navigator.clipboard.writeText(props.message.content); toast.add({ title: 'Copied', color: 'success' }) } catch { /* ignore */ }
}
</script>

<template>
  <div class="flex gap-3" :class="isUser ? 'flex-row-reverse' : ''">
    <UAvatar v-if="!isUser" icon="i-lucide-sparkles" size="sm" class="bg-primary/10 text-primary shrink-0" />
    <div class="min-w-0 max-w-[85%] sm:max-w-[75%] flex flex-col gap-1.5" :class="isUser ? 'items-end' : 'items-start'">
      <div v-if="message.attachments.length" class="flex flex-wrap gap-1.5" :class="isUser ? 'justify-end' : ''">
        <button v-for="a in message.attachments" :key="a.id" type="button" class="rounded-lg overflow-hidden border border-(--ui-border) focus-visible:ring-2 ring-primary" :aria-label="`View ${a.name}`" @click="emit('preview', a.url)">
          <img :src="a.url" :alt="a.name" class="size-24 sm:size-32 object-cover" />
        </button>
      </div>
      <div
        v-if="message.content"
        class="rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words"
        :class="isUser ? 'bg-primary text-(--ui-bg) rounded-br-md whitespace-pre-wrap' : 'bg-(--ui-bg) border border-(--ui-border) rounded-bl-md space-y-1'"
      >
        <template v-if="isUser">{{ message.content }}</template>
        <div v-else v-html="html" />
      </div>
      <div class="flex items-center gap-2 text-xs text-(--ui-text-muted)">
        <span v-if="message.status === 'sending'" class="flex items-center gap-1"><UIcon name="i-lucide-loader-circle" class="animate-spin" /> Sending…</span>
        <template v-else-if="message.status === 'error'">
          <span class="text-(--ui-error)">{{ message.error || 'Failed' }}</span>
          <UButton size="xs" variant="link" color="error" label="Retry" icon="i-lucide-rotate-ccw" class="p-0" @click="emit('retry')" />
        </template>
        <span v-else>{{ time }}</span>
        <UButton v-if="!isUser && message.content" size="xs" variant="ghost" color="neutral" icon="i-lucide-copy" aria-label="Copy reply" @click="copy" />
      </div>
    </div>
  </div>
</template>
