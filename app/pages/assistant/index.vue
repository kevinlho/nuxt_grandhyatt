<script setup lang="ts">
definePageMeta({ permission: 'chatbot.use' })
const { user } = useAuth()
const { conversations, active, activeId, sending, send, retry, stop, select, newConversation, removeConversation, validateFiles } = useChat()

const scroller = ref<HTMLElement>()
const composer = ref<{ focus: () => void }>()
const historyOpen = ref(false)
const previewUrl = ref<string | null>(null)

function scrollDown() { nextTick(() => scroller.value?.scrollTo({ top: scroller.value.scrollHeight, behavior: 'smooth' })) }
watch(() => [active.value?.messages.length, sending.value], scrollDown)
watch(activeId, () => { scrollDown(); historyOpen.value = false })

async function onSend(text: string, images: File[]) { await send(text, images); composer.value?.focus() }

const suggestions = [
  { icon: 'i-lucide-bar-chart-3', text: 'Summarise this week’s pending orders' },
  { icon: 'i-lucide-image', text: 'What is wrong in this photo of the room?' },
  { icon: 'i-lucide-file-text', text: 'Draft a reply to a guest complaint about noise' },
  { icon: 'i-lucide-workflow', text: 'Which requests are waiting for my approval?' }
]
const firstName = computed(() => user.value?.name.split(/[\s(]/)[0])
</script>

<template>
  <div class="-m-4 sm:-m-6 flex h-[calc(100dvh-3.5rem-env(safe-area-inset-top))] lg:h-dvh">
    <!-- conversation history -->
    <aside class="hidden md:flex w-64 shrink-0 flex-col border-r border-(--ui-border) bg-(--ui-bg)">
      <div class="p-3"><UButton icon="i-lucide-plus" label="New chat" block variant="soft" @click="newConversation" /></div>
      <ChatHistory :conversations="conversations" :active-id="activeId" class="flex-1" @select="select" @remove="removeConversation" />
    </aside>

    <section class="flex-1 min-w-0 flex flex-col">
      <header class="h-14 shrink-0 flex items-center gap-2 px-3 sm:px-4 border-b border-(--ui-border) bg-(--ui-bg)">
        <UButton class="md:hidden" icon="i-lucide-history" color="neutral" variant="ghost" aria-label="Chat history" @click="historyOpen = true" />
        <UIcon name="i-lucide-sparkles" class="text-primary" />
        <h1 class="font-semibold truncate flex-1">{{ active?.title ?? 'AI Assistant' }}</h1>
        <UButton v-if="active" icon="i-lucide-square-pen" color="neutral" variant="ghost" aria-label="New chat" @click="newConversation" />
      </header>

      <div ref="scroller" class="flex-1 overflow-y-auto">
        <div class="max-w-3xl mx-auto px-3 sm:px-6 py-6 space-y-5">
          <div v-if="!active" class="pt-6 sm:pt-12 text-center space-y-6">
            <div class="mx-auto size-14 rounded-2xl bg-primary/10 grid place-items-center"><UIcon name="i-lucide-sparkles" class="size-7 text-primary" /></div>
            <div>
              <h2 class="text-xl sm:text-2xl font-semibold">Hi {{ firstName }}, how can I help?</h2>
              <p class="text-sm text-(--ui-text-muted) mt-1">Ask a question or attach images for the agent to analyse.</p>
            </div>
            <div class="grid sm:grid-cols-2 gap-2 text-left">
              <button v-for="s in suggestions" :key="s.text" type="button" class="flex items-start gap-3 p-3 rounded-xl border border-(--ui-border) bg-(--ui-bg) hover:border-primary/50 hover:bg-primary/5 text-sm transition-colors" @click="onSend(s.text, [])">
                <UIcon :name="s.icon" class="size-4 mt-0.5 text-primary shrink-0" /><span>{{ s.text }}</span>
              </button>
            </div>
          </div>

          <template v-else>
            <ChatMessage v-for="m in active.messages" :key="m.id" :message="m" @retry="retry(m)" @preview="u => previewUrl = u" />
            <div v-if="sending" class="flex gap-3" aria-live="polite">
              <UAvatar icon="i-lucide-sparkles" size="sm" class="bg-primary/10 text-primary" />
              <div class="rounded-2xl rounded-bl-md border border-(--ui-border) bg-(--ui-bg) px-4 py-3 flex items-center gap-1.5" aria-label="Assistant is thinking">
                <span v-for="i in 3" :key="i" class="size-1.5 rounded-full bg-(--ui-text-muted) animate-bounce" :style="{ animationDelay: `${i * 120}ms` }" />
              </div>
            </div>
          </template>
        </div>
      </div>

      <div class="shrink-0 px-3 sm:px-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
        <div class="max-w-3xl mx-auto">
          <ChatComposer ref="composer" :sending="sending" :validate="validateFiles" @send="onSend" @stop="stop" />
          <p class="mt-1.5 text-center text-[11px] text-(--ui-text-dimmed)">AI answers can be wrong — check important information.</p>
        </div>
      </div>
    </section>

    <USlideover v-model:open="historyOpen" side="left" title="Chats" :ui="{ content: 'max-w-[80vw] w-72' }">
      <template #body>
        <UButton icon="i-lucide-plus" label="New chat" block variant="soft" class="mb-3" @click="newConversation(); historyOpen = false" />
        <ChatHistory :conversations="conversations" :active-id="activeId" @select="select" @remove="removeConversation" />
      </template>
    </USlideover>

    <UModal :open="!!previewUrl" title="Image" :ui="{ content: 'sm:max-w-4xl' }" @update:open="v => { if (!v) previewUrl = null }">
      <template #body><img v-if="previewUrl" :src="previewUrl" alt="Attached image" class="max-h-[75vh] mx-auto rounded-lg" /></template>
    </UModal>
  </div>
</template>
