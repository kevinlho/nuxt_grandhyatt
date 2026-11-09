export interface Product {
  id: string
  name: string
  sku: string
  category: string
  price: number
  stock: number
  isActive: boolean
  createdAt: string
}

export type ProductInput = Omit<Product, 'id' | 'createdAt'>
