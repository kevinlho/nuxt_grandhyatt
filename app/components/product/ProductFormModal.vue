<script setup lang="ts">
import { CATEGORIES, GENDERS, PATTERNS, SIZES, TECHNIQUES, slugify, totalStock, type Product, type ProductInput } from '~/types/product'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{ product?: Product | null; saving?: boolean }>()
const emit = defineEmits<{ submit: [input: ProductInput] }>()

const empty = (): ProductInput => ({
  name: '', slug: '', sku: '', category: 'Kemeja', gender: 'Pria', origin: '', technique: 'Cap', pattern: 'parang',
  colors: ['#2c2017', '#a87b4f', '#efe4d0'], description: '', material: '', dimensions: '', price: 0,
  variants: [{ size: 'M', stock: 0 }], isActive: true
})
const form = reactive<ProductInput>(empty())
// auto-fill the slug from the name until the user edits it
const slugTouched = ref(false)

watch(open, (v) => {
  if (!v) return
  if (props.product) {
    const { id, createdAt, stock, ...rest } = props.product
    Object.assign(form, structuredClone(toRaw(rest)))
    slugTouched.value = true
  } else {
    Object.assign(form, empty())
    slugTouched.value = false
  }
})
watch(() => form.name, n => { if (!slugTouched.value) form.slug = slugify(n) })

const total = computed(() => totalStock(form.variants))
const usedSizes = computed(() => new Set(form.variants.map(v => v.size)))
function addVariant() {
  const next = SIZES.find(s => s !== 'All Size' && !usedSizes.value.has(s)) ?? ''
  form.variants.push({ size: next, stock: 0 })
}
function removeVariant(i: number) { form.variants.splice(i, 1) }
function oneSize() { form.variants = [{ size: 'All Size', stock: total.value }] }

const colorLabels = ['Dark', 'Mid', 'Light']
const sizeItems: string[] = [...SIZES]
const submit = () => emit('submit', structuredClone(toRaw(form)))
</script>

<template>
  <UModal v-model:open="open" :title="product ? 'Edit Product' : 'Add Product'" :ui="{ content: 'sm:max-w-2xl' }">
    <template #body>
      <form id="product-form" class="space-y-5" @submit.prevent="submit">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField label="Name" required class="sm:col-span-2"><UInput v-model="form.name" class="w-full" /></UFormField>
          <UFormField label="Slug" required help="Used in the shop URL /product/<slug>">
            <UInput v-model="form.slug" class="w-full" @input="slugTouched = true" />
          </UFormField>
          <UFormField label="SKU" required><UInput v-model="form.sku" class="w-full" /></UFormField>
          <UFormField label="For"><USelect v-model="form.gender" :items="[...GENDERS]" class="w-full" /></UFormField>
          <UFormField label="Category"><USelect v-model="form.category" :items="[...CATEGORIES]" class="w-full" /></UFormField>
          <UFormField label="Technique"><USelect v-model="form.technique" :items="[...TECHNIQUES]" class="w-full" /></UFormField>
          <UFormField label="Origin" required><UInput v-model="form.origin" placeholder="Solo, Pekalongan…" class="w-full" /></UFormField>
          <UFormField label="Price (IDR)"><UInputNumber v-model="form.price" :min="0" :step="5000" class="w-full" /></UFormField>
          <UFormField label="Material"><UInput v-model="form.material" class="w-full" /></UFormField>
          <UFormField label="Dimensions / size range"><UInput v-model="form.dimensions" placeholder="S – XL or 105 × 250 cm" class="w-full" /></UFormField>
          <UFormField label="Description" class="sm:col-span-2"><UTextarea v-model="form.description" :rows="3" autoresize class="w-full" /></UFormField>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField label="Motif"><USelect v-model="form.pattern" :items="[...PATTERNS]" class="w-full capitalize" /></UFormField>
          <UFormField label="Motif colors">
            <div class="flex gap-2">
              <label v-for="(_, i) in form.colors" :key="i" class="flex-1 flex items-center gap-2 rounded-md border border-(--ui-border) px-2 h-9 text-xs">
                <input v-model="form.colors[i]" type="color" class="size-6 shrink-0 cursor-pointer bg-transparent" :aria-label="`${colorLabels[i]} color`">
                <span class="text-(--ui-text-muted)">{{ colorLabels[i] }}</span>
              </label>
            </div>
          </UFormField>
        </div>

        <div>
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm font-medium">Sizes &amp; stock <span class="text-(--ui-text-muted) font-normal">· {{ total }} total</span></p>
            <div class="flex gap-1">
              <UButton size="xs" color="neutral" variant="ghost" label="One size" @click="oneSize" />
              <UButton size="xs" icon="i-lucide-plus" variant="soft" label="Size" @click="addVariant" />
            </div>
          </div>
          <div class="space-y-2">
            <div v-for="(v, i) in form.variants" :key="i" class="flex gap-2 items-center">
              <USelect v-model="v.size" :items="sizeItems" class="flex-1" :aria-label="`Size ${i + 1}`" />
              <UInputNumber v-model="v.stock" :min="0" class="w-32" :aria-label="`Stock for ${v.size}`" />
              <UButton icon="i-lucide-x" color="neutral" variant="ghost" :disabled="form.variants.length === 1" :aria-label="`Remove ${v.size}`" @click="removeVariant(i)" />
            </div>
          </div>
        </div>

        <USwitch v-model="form.isActive" label="Visible in shop" />
      </form>
    </template>
    <template #footer>
      <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 w-full">
        <UButton color="neutral" variant="outline" label="Cancel" class="justify-center" @click="open = false" />
        <UButton type="submit" form="product-form" label="Save" :loading="saving" class="justify-center" />
      </div>
    </template>
  </UModal>
</template>
