<script setup lang="ts">
import { FILE_KINDS, kindOf } from '~/types/document'
const props = defineProps<{ ext: string; size?: 'sm' | 'md' | 'lg' }>()
const kind = computed(() => FILE_KINDS[kindOf(props.ext)])
const box = computed(() => ({ sm: 'size-8', md: 'size-10', lg: 'size-14' })[props.size ?? 'md'])
</script>

<template>
  <div class="shrink-0 rounded-lg bg-(--ui-bg-elevated) grid place-items-center relative" :class="box">
    <UIcon :name="kind?.icon ?? 'i-lucide-file'" :class="[kind?.color ?? 'text-(--ui-text-muted)', size === 'lg' ? 'size-7' : 'size-5']" />
    <span v-if="size !== 'sm'" class="absolute -bottom-1 -right-1 px-1 rounded text-[9px] font-semibold uppercase bg-(--ui-bg) border border-(--ui-border)">{{ ext }}</span>
  </div>
</template>
