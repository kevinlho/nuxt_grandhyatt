<script setup lang="ts">
import { ASSET_CATEGORIES, ASSET_CONDITIONS, type Asset, type AssetCategory, type AssetInput } from '~/types/asset'
import type { Department } from '~/types/department'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{ asset?: Asset | null; departments: Department[]; existingTags: string[]; saving?: boolean }>()
const emit = defineEmits<{ submit: [input: AssetInput] }>()

const PREFIX: Record<AssetCategory, string> = {
  'IT Equipment': 'IT', Furniture: 'FN', Kitchen: 'KT', Vehicle: 'VH', Linen: 'LN', 'Audio Visual': 'AV', Other: 'OT'
}
/** next free tag for the category, e.g. GH-IT-0004 */
function suggestTag(c: AssetCategory) {
  const base = `GH-${PREFIX[c]}-`
  const max = props.existingTags.filter(t => t.startsWith(base)).map(t => Number(t.slice(base.length)) || 0).reduce((a, b) => Math.max(a, b), 0)
  return base + String(max + 1).padStart(4, '0')
}

const empty = (): AssetInput => ({
  tag: '', name: '', category: 'IT Equipment', departmentId: null, location: '', condition: 'new',
  purchaseDate: new Date().toISOString().slice(0, 10), value: undefined, notes: '',
  status: 'active', deprecatedAt: null, deprecatedReason: null
})
const form = reactive<AssetInput>(empty())
const tagTouched = ref(false)
watch(open, (v) => {
  if (!v) return
  const a = props.asset
  if (a) {
    const { id: _i, createdAt: _c, createdBy: _b, ...rest } = a
    Object.assign(form, empty(), rest)
    tagTouched.value = true
  } else {
    Object.assign(form, empty())
    tagTouched.value = false
    form.tag = suggestTag(form.category)
  }
})
watch(() => form.category, c => { if (!tagTouched.value) form.tag = suggestTag(c) })

function submit() {
  emit('submit', { ...toRaw(form), tag: form.tag.trim().toUpperCase(), name: form.name.trim(), location: form.location.trim() })
}
const categories = [...ASSET_CATEGORIES]
const conditions = [...ASSET_CONDITIONS]
const NONE = '__none'
const deptItems = computed(() => [{ label: 'No department', value: NONE }, ...props.departments.map(d => ({ label: d.name, value: d.id }))])
const dept = computed({ get: () => form.departmentId || NONE, set: v => { form.departmentId = v === NONE ? null : v } })
</script>

<template>
  <UModal v-model:open="open" :title="asset ? `Edit ${asset.tag}` : 'Add Asset'" :ui="{ content: 'sm:max-w-xl' }">
    <template #body>
      <UAlert v-if="asset?.status === 'deprecated'" class="mb-4" color="neutral" variant="subtle" icon="i-lucide-archive"
        title="This asset is deprecated" :description="asset.deprecatedReason || undefined" />
      <form id="asset-form" class="space-y-4" @submit.prevent="submit">
        <UFormField label="Name" required><UInput v-model="form.name" class="w-full" placeholder="e.g. Front desk PC #2" autofocus /></UFormField>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField label="Category" required><USelect v-model="form.category" :items="categories" class="w-full" /></UFormField>
          <UFormField label="Asset tag" required :help="asset ? undefined : 'Auto-numbered; edit if the label differs'">
            <UInput v-model="form.tag" class="w-full font-mono uppercase" placeholder="GH-IT-0001" @input="tagTouched = true" />
          </UFormField>
          <UFormField label="Department"><USelect v-model="dept" :items="deptItems" class="w-full" /></UFormField>
          <UFormField label="Location" required><UInput v-model="form.location" class="w-full" placeholder="e.g. Main kitchen" /></UFormField>
          <UFormField label="Condition"><USelect v-model="form.condition" :items="conditions" class="w-full capitalize" /></UFormField>
          <UFormField label="Purchase date"><UInput v-model="form.purchaseDate" type="date" class="w-full" /></UFormField>
        </div>
        <UFormField label="Value (IDR)" hint="Optional">
          <UInputNumber v-model="form.value" :min="0" :step="100000" :format-options="{ style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }" class="w-full" />
        </UFormField>
        <UFormField label="Notes"><UTextarea v-model="form.notes" :rows="2" autoresize class="w-full" placeholder="Serial number, supplier, warranty…" /></UFormField>
      </form>
    </template>
    <template #footer>
      <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 w-full">
        <UButton color="neutral" variant="outline" label="Cancel" class="justify-center" @click="open = false" />
        <UButton type="submit" form="asset-form" :icon="asset ? 'i-lucide-save' : 'i-lucide-plus'" :label="asset ? 'Save changes' : 'Add asset'" :loading="saving" class="justify-center" />
      </div>
    </template>
  </UModal>
</template>
