<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false })
defineProps<{ title?: string; message: string; loading?: boolean }>()
const emit = defineEmits<{ confirm: [] }>()
</script>

<template>
  <UModal v-model:open="open" :title="title ?? 'Are you sure?'">
    <template #body><p>{{ message }}</p></template>
    <template #footer>
      <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 w-full">
        <UButton color="neutral" variant="outline" label="Cancel" class="justify-center" @click="open = false" />
        <UButton color="error" label="Delete" :loading="loading" @click="emit('confirm')" class="justify-center" />
      </div>
    </template>
  </UModal>
</template>
