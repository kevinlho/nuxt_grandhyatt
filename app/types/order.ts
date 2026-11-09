export const ORDER_STATUSES = ['pending', 'paid', 'shipped', 'completed', 'cancelled'] as const
export type OrderStatus = typeof ORDER_STATUSES[number]
export type PaymentMethod = 'transfer' | 'ewallet' | 'qris'

export interface OrderItem {
  productId: string
  slug: string
  name: string
  size: string
  qty: number
  price: number
}

/** Created by the storefront checkout, managed (status only) in the CMS. */
export interface Order {
  id: string
  code: string
  customerName: string
  email: string
  phone: string
  address: string
  city: string
  payment: PaymentMethod
  items: OrderItem[]
  subtotal: number
  shipping: number
  total: number
  status: OrderStatus
  createdAt: string
}

export interface OrderStatusInput { status: OrderStatus }

export const statusColor: Record<OrderStatus, 'warning' | 'info' | 'primary' | 'success' | 'neutral'> = {
  pending: 'warning', paid: 'info', shipped: 'primary', completed: 'success', cancelled: 'neutral'
}
