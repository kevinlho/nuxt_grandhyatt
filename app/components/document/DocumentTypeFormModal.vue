<script setup lang="ts">
import { DOC_TYPE_ICONS, type DocumentType, type DocumentTypeInput } from '~/types/document'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{ type?: DocumentType | null; inUse?: number; saving?: boolean }>()
const emit = defineEmits<{ submit: [input: DocumentTypeInput] }>()

const empty = (): DocumentTypeInput => ({ key: '', name: '', icon: 'i-lucide-folder', description: '', keywords: [], isActive: true })
const form = reactive<DocumentTypeInput>(empty())
const keywordText = ref('')
const keyTouched = ref(false)
watch(open, (v) => {
  if (!v) return
  const t = props.type
  Object.assign(form, t ? { key: t.key, name: t.name, icon: t.icon, description: t.description, keywords: [...t.keywords], isActive: t.isActive } : empty())
  keywordText.value = form.keywords.join(', ')
  keyTouched.value = !!t
})
watch(() => form.name, n => { if (!keyTouched.value) form.key = n.trim().toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30) })
const keyLocked = computed(() => !!props.type && (props.inUse ?? 0) > 0)

// live preview of auto-sorting with the keywords being edited
const sample = ref('')
const previewType = computed<DocumentType>(() => ({ ...form, id: 'preview', createdAt: '', isActive: true, keywords: parsedKeywords.value }))
const parsedKeywords = computed(() => keywordText.value.split(',').map(k => k.trim().toLowerCase()).filter(Boolean))
const sampleMatches = computed(() => sample.value.trim() && suggestCategory(sample.value, [previewType.value]) === form.key)

function submit() { emit('submit', { ...toRaw(form), name: form.name.trim(), keywords: [...new Set(parsedKeywords.value)] }) }
</script>

<template>
  <UModal v-model:open="open" :title="type ? 'Edit document type' : 'New document type'" :ui="{ content: 'sm:max-w-lg' }">
    <template #body>
      <form id="doctype-form" class="space-y-4" @submit.prevent="submit">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <UFormField label="Name" required class="sm:col-span-2"><UInput v-model="form.name" class="w-full" placeholder="e.g. Safety Notices" autofocus /></UFormField>
          <UFormField label="Key" required :help="keyLocked ? 'Locked: in use' : undefined">
            <UInput v-model="form.key" class="w-full font-mono" :disabled="keyLocked" @input="keyTouched = true" />
          </UFormField>
        </div>
        <UFormField label="Icon">
          <div class="flex flex-wrap gap-1.5">
            <UButton v-for="ic in DOC_TYPE_ICONS" :key="ic" :icon="ic" size="sm" :variant="form.icon === ic ? 'solid' : 'outline'" :color="form.icon === ic ? 'primary' : 'neutral'" :aria-label="ic.replace('i-lucide-', '')" :aria-pressed="form.icon === ic" @click="form.icon = ic" />
          </div>
        </UFormField>
        <UFormField label="Description"><UInput v-model="form.description" class="w-full" placeholder="What belongs here?" /></UFormField>
        <UFormField label="Auto-sort keywords" help="Comma separated. A file whose name contains one of these is sorted into this type.">
          <UTextarea v-model="keywordText" :rows="2" autoresize class="w-full" placeholder="safety, k3, emergency, evacuation" />
        </UFormField>
        <div class="rounded-lg bg-(--ui-bg-muted) p-3 space-y-2">
          <p class="text-xs font-medium text-(--ui-text-muted)">Test a file name</p>
          <UInput v-model="sample" size="sm" class="w-full" placeholder="Evacuation_Plan_Tower_B.pdf" icon="i-lucide-file" />
          <p v-if="sample.trim()" class="text-xs flex items-center gap-1.5" :class="sampleMatches ? 'text-(--ui-success)' : 'text-(--ui-text-muted)'">
            <UIcon :name="sampleMatches ? 'i-lucide-check' : 'i-lucide-x'" />
            {{ sampleMatches ? `Would be sorted into ${form.name || 'this type'}` : 'No keyword matches' }}
          </p>
        </div>
        <USwitch v-model="form.isActive" label="Active" description="Inactive types can't receive new uploads; existing documents keep it." />
      </form>
    </template>
    <template #footer>
      <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 w-full">
        <UButton color="neutral" variant="outline" label="Cancel" class="justify-center" @click="open = false" />
        <UButton type="submit" form="doctype-form" label="Save" :loading="saving" class="justify-center" />
      </div>
    </template>
  </UModal>
</template>
