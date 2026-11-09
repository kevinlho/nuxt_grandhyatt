<script setup lang="ts">
import { ORDER_STATUSES, statusColor, type Order, type OrderStatus } from '~/types/order'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{ order?: Order | null; saving?: boolean }>()
const emit = defineEmits<{ submit: [status: OrderStatus] }>()

const status = ref<OrderStatus>('pending')
const canManage = computed(() => usePermission().can('orders.manage'))
watch(open, v => { if (v && props.order) status.value = props.order.status })

const paymentLabel = { transfer: 'Bank transfer', ewallet: 'E-wallet', qris: 'QRIS' } as const
const date = (s: string) => new Date(s).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
</script>

<template>
  <UModal v-model:open="open" :title="order ? `Order ${order.code}` : 'Order'" :description="order ? date(order.createdAt) : undefined" :ui="{ content: 'sm:max-w-xl' }">
    <template #body>
      <div v-if="order" class="space-y-5 text-sm">
        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <p class="text-xs uppercase tracking-wide text-(--ui-text-muted) mb-1">Customer</p>
            <p class="font-medium">{{ order.customerName }}</p>
            <p>{{ order.email }}</p>
            <p>{{ order.phone }}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wide text-(--ui-text-muted) mb-1">Ship to</p>
            <p>{{ order.address }}</p>
            <p>{{ order.city }}</p>
            <p class="mt-1 text-(--ui-text-muted)">Paid via {{ paymentLabel[order.payment] }}</p>
          </div>
        </div>
        <ul class="divide-y divide-(--ui-border) border-y border-(--ui-border)">
          <li v-for="i in order.items" :key="`${i.productId}-${i.size}`" class="py-2 flex justify-between gap-3">
            <span class="min-w-0">{{ i.name }} <span class="text-(--ui-text-muted)">· {{ i.size }} × {{ i.qty }}</span></span>
            <span class="shrink-0">{{ idr(i.price * i.qty) }}</span>
          </li>
        </ul>
        <div class="space-y-1">
          <p class="flex justify-between"><span class="text-(--ui-text-muted)">Subtotal</span><span>{{ idr(order.subtotal) }}</span></p>
          <p class="flex justify-between"><span class="text-(--ui-text-muted)">Shipping</span><span>{{ order.shipping ? idr(order.shipping) : 'Free' }}</span></p>
          <p class="flex justify-between font-semibold"><span>Total</span><span>{{ idr(order.total) }}</span></p>
        </div>
        <UFormField label="Status">
          <USelect v-model="status" :disabled="!canManage" :items="[...ORDER_STATUSES]" class="w-full capitalize">
            <template #leading><UBadge :color="statusColor[status]" variant="solid" class="size-2 p-0 rounded-full" /></template>
          </USelect>
        </UFormField>
      </div>
    </template>
    <template #footer>
      <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 w-full">
        <UButton color="neutral" variant="outline" label="Close" class="justify-center" @click="open = false" />
        <UButton v-if="canManage" label="Update status" :loading="saving" :disabled="status === order?.status" class="justify-center" @click="emit('submit', status)" />
      </div>
    </template>
  </UModal>
</template>
