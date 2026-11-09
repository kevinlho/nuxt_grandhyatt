<script setup lang="ts">
import type { Asset } from '~/types/asset'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{ asset?: Asset | null; saving?: boolean }>()
const emit = defineEmits<{ confirm: [reason: string] }>()
const reasons = ['Broken beyond repair', 'Replaced', 'Sold', 'Lost / stolen', 'Donated']
const reason = ref('')
watch(open, v => { if (v) reason.value = '' })
const restoring = computed(() => props.asset?.status === 'deprecated')
</script>

<template>
  <UModal v-model:open="open" :title="restoring ? 'Restore asset?' : 'Mark as deprecated?'">
    <template #body>
      <p class="text-sm mb-4"><span class="font-mono">{{ asset?.tag }}</span> · {{ asset?.name }}</p>
      <p v-if="restoring" class="text-sm text-(--ui-text-muted)">It will become active again and count in totals.</p>
      <template v-else>
        <p class="text-sm text-(--ui-text-muted) mb-3">The asset stays on record but is retired: hidden from the active list and excluded from totals. You can restore it later.</p>
        <UFormField label="Reason" required>
          <UInput v-model="reason" class="w-full" placeholder="Why is it being retired?" autofocus />
        </UFormField>
        <div class="mt-2 flex flex-wrap gap-1.5">
          <UButton v-for="r in reasons" :key="r" :label="r" size="xs" color="neutral" :variant="reason === r ? 'solid' : 'outline'" @click="reason = r" />
        </div>
      </template>
    </template>
    <template #footer>
      <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 w-full">
        <UButton color="neutral" variant="outline" label="Cancel" class="justify-center" @click="open = false" />
        <UButton v-if="restoring" icon="i-lucide-archive-restore" label="Restore" :loading="saving" class="justify-center" @click="emit('confirm', '')" />
        <UButton v-else icon="i-lucide-archive" color="warning" label="Mark deprecated" :disabled="!reason.trim()" :loading="saving" class="justify-center" @click="emit('confirm', reason.trim())" />
      </div>
    </template>
  </UModal>
</template>
