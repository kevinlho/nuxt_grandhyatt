<script setup lang="ts">
import type { Conversation } from '~/types/chat'
defineProps<{ conversations: Conversation[]; activeId: string | null }>()
const emit = defineEmits<{ select: [id: string]; remove: [id: string] }>()
</script>

<template>
  <div class="overflow-y-auto px-3 pb-3">
    <p class="px-2 pb-1 text-xs font-medium uppercase tracking-wide text-(--ui-text-dimmed)">Recent</p>
    <p v-if="!conversations.length" class="px-2 py-4 text-sm text-(--ui-text-muted)">No chats yet.</p>
    <ul class="space-y-0.5">
      <li v-for="c in conversations" :key="c.id" class="group flex items-center rounded-md" :class="c.id === activeId ? 'bg-primary/10 text-primary' : 'hover:bg-(--ui-bg-elevated)'">
        <button type="button" class="flex-1 min-w-0 text-left px-2 py-1.5 text-sm truncate" :aria-current="c.id === activeId ? 'true' : undefined" @click="emit('select', c.id)">{{ c.title }}</button>
        <UButton icon="i-lucide-trash-2" size="xs" color="neutral" variant="ghost" class="opacity-0 group-hover:opacity-100 focus-visible:opacity-100" :aria-label="`Delete ${c.title}`" @click="emit('remove', c.id)" />
      </li>
    </ul>
  </div>
</template>
