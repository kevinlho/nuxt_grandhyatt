/**
 * Product contract shared with the ecommerce-batik storefront.
 * Keep in sync with ecommerce-batik/types/catalog.ts and the Go API DTO.
 */
export const CATEGORIES = ['Kain', 'Kemeja', 'Blouse', 'Dress', 'Scarf'] as const
export const GENDERS = ['Wanita', 'Pria', 'Unisex'] as const
export const TECHNIQUES = ['Tulis', 'Cap', 'Kombinasi'] as const
export const PATTERNS = ['kawung', 'parang', 'megamendung', 'truntum', 'sidomukti', 'lereng'] as const
export const SIZES = ['All Size', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'] as const

export type Category = typeof CATEGORIES[number]
export type Gender = typeof GENDERS[number]
export type Technique = typeof TECHNIQUES[number]
export type Pattern = typeof PATTERNS[number]

export interface Variant { size: string; stock: number }

export interface Product {
  id: string
  name: string
  slug: string
  sku: string
  category: Category
  gender: Gender
  origin: string
  technique: Technique
  pattern: Pattern
  /** [dark, mid, light] — used by the storefront motif artwork */
  colors: [string, string, string]
  description: string
  material: string
  dimensions: string
  price: number
  variants: Variant[]
  /** Total of variants[].stock — computed, never sent */
  stock: number
  isActive: boolean
  createdAt: string
}

export type ProductInput = Omit<Product, 'id' | 'createdAt' | 'stock'>

export const totalStock = (v: Variant[]) => v.reduce((s, x) => s + (x.stock || 0), 0)
export const slugify = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-')
