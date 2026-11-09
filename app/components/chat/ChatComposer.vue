<script setup lang="ts">
import { CHAT_LIMITS } from '~/types/chat'

const props = defineProps<{ sending: boolean; validate: (files: File[], already: number) => string | undefined }>()
const emit = defineEmits<{ send: [text: string, images: File[]]; stop: [] }>()
const toast = useToast()

const text = ref('')
const files = ref<{ file: File; url: string }[]>([])
const fileInput = ref<HTMLInputElement>()
const dragging = ref(false)
const textarea = ref()

function add(list: FileList | File[] | null | undefined) {
  const incoming = Array.from(list ?? []).filter(f => f.type.startsWith('image/'))
  if (!incoming.length) return
  const err = props.validate(incoming, files.value.length)
  if (err) return toast.add({ title: 'Cannot attach', description: err, color: 'error' })
  files.value.push(...incoming.map(file => ({ file, url: URL.createObjectURL(file) })))
}
function removeAt(i: number) { URL.revokeObjectURL(files.value[i]!.url); files.value.splice(i, 1) }

function onPaste(e: ClipboardEvent) {
  const imgs = Array.from(e.clipboardData?.files ?? []).filter(f => f.type.startsWith('image/'))
  if (imgs.length) { e.preventDefault(); add(imgs) }
}
function onDrop(e: DragEvent) { dragging.value = false; add(e.dataTransfer?.files) }

const canSend = computed(() => !props.sending && (text.value.trim().length > 0 || files.value.length > 0))
function submit() {
  if (!canSend.value) return
  emit('send', text.value, files.value.map(f => f.file))
  // previews stay alive in the message bubble (useChat makes its own URLs), so release ours
  files.value.forEach(f => URL.revokeObjectURL(f.url))
  text.value = ''
  files.value = []
}
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); submit() }
}
defineExpose({ focus: () => textarea.value?.textareaRef?.focus?.() })
</script>

<template>
  <div
    class="relative rounded-2xl border bg-(--ui-bg) shadow-sm transition-colors"
    :class="dragging ? 'border-primary ring-2 ring-primary/30' : 'border-(--ui-border)'"
    @dragover.prevent="dragging = true" @dragleave.self="dragging = false" @drop.prevent="onDrop"
  >
    <div v-if="dragging" class="absolute inset-0 z-10 rounded-2xl grid place-items-center bg-primary/5 text-primary text-sm font-medium pointer-events-none">Drop images to attach</div>

    <div v-if="files.length" class="flex flex-wrap gap-2 p-3 pb-0">
      <div v-for="(f, i) in files" :key="f.url" class="relative group">
        <img :src="f.url" :alt="f.file.name" class="size-16 rounded-lg object-cover border border-(--ui-border)" />
        <button type="button" class="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-(--ui-bg-inverted) text-(--ui-bg) grid place-items-center" :aria-label="`Remove ${f.file.name}`" @click="removeAt(i)">
          <UIcon name="i-lucide-x" class="size-3" />
        </button>
      </div>
    </div>

    <UTextarea
      ref="textarea" v-model="text" :rows="1" :maxrows="8" autoresize variant="none" :maxlength="CHAT_LIMITS.maxChars"
      placeholder="Ask anything, or attach an image…" class="w-full" :ui="{ base: 'px-4 pt-3 pb-1 text-sm' }"
      aria-label="Message" @keydown="onKeydown" @paste="onPaste"
    />

    <div class="flex items-center gap-2 px-2 pb-2">
      <input ref="fileInput" type="file" :accept="CHAT_LIMITS.accept.join(',')" multiple class="hidden" @change="e => { add((e.target as HTMLInputElement).files); (e.target as HTMLInputElement).value = '' }" />
      <UButton icon="i-lucide-image-plus" color="neutral" variant="ghost" :disabled="files.length >= CHAT_LIMITS.maxImages" aria-label="Attach images" @click="fileInput?.click()" />
      <span class="text-xs text-(--ui-text-dimmed) hidden sm:inline">Enter to send · Shift+Enter new line · paste or drop images</span>
      <span class="flex-1" />
      <UButton v-if="sending" icon="i-lucide-square" color="neutral" variant="soft" label="Stop" @click="emit('stop')" />
      <UButton v-else icon="i-lucide-arrow-up" :disabled="!canSend" aria-label="Send" class="rounded-full" @click="submit" />
    </div>
  </div>
</template>
