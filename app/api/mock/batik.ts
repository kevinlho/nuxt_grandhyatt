import type { Product } from '~/types/product'
import type { Order } from '~/types/order'

type Seed = Omit<Product, 'id' | 'createdAt' | 'stock' | 'isActive' | 'sku'>

// Same catalogue the ecommerce-batik storefront ships in dummy mode.
const seed: Seed[] = [
  { slug: 'kain-kawung-sogan', name: 'Kain Kawung Sogan', category: 'Kain', gender: 'Unisex', origin: 'Solo', technique: 'Tulis', price: 1850000, pattern: 'kawung', colors: ['#5b3a22', '#c9a46a', '#f3e7d3'], description: 'Classic four-petal kawung motif drawn by hand with canting, dyed in the warm sogan browns of the Surakarta court tradition.', material: 'Primissima cotton', dimensions: '105 × 250 cm', variants: [{ size: 'All Size', stock: 3 }] },
  { slug: 'kain-parang-rusak', name: 'Kain Parang Rusak', category: 'Kain', gender: 'Unisex', origin: 'Yogyakarta', technique: 'Tulis', price: 2400000, pattern: 'parang', colors: ['#2c2017', '#a87b4f', '#efe4d0'], description: 'The diagonal parang wave, once reserved for royalty, symbolising strength and an unbroken spirit.', material: 'Primissima cotton', dimensions: '105 × 250 cm', variants: [{ size: 'All Size', stock: 1 }] },
  { slug: 'kemeja-megamendung-biru', name: 'Kemeja Megamendung Biru', category: 'Kemeja', gender: 'Pria', origin: 'Cirebon', technique: 'Cap', price: 425000, pattern: 'megamendung', colors: ['#1f3a5f', '#5f8db8', '#e8eef5'], description: 'Short-sleeve shirt in the layered cloud motif of Cirebon. Relaxed fit, coconut-shell buttons.', material: 'Cotton', dimensions: 'S – XXL', variants: [{ size: 'S', stock: 4 }, { size: 'M', stock: 10 }, { size: 'L', stock: 2 }, { size: 'XL', stock: 0 }, { size: 'XXL', stock: 5 }] },
  { slug: 'dress-truntum-merah', name: 'Dress Truntum Merah', category: 'Dress', gender: 'Wanita', origin: 'Solo', technique: 'Kombinasi', price: 695000, pattern: 'truntum', colors: ['#7a1f1f', '#d9a441', '#f6ead8'], description: 'Midi wrap dress with the starry truntum motif — a symbol of love that blooms again.', material: 'Rayon viscose', dimensions: 'S – XL', variants: [{ size: 'S', stock: 0 }, { size: 'M', stock: 6 }, { size: 'L', stock: 3 }, { size: 'XL', stock: 1 }] },
  { slug: 'scarf-lereng-hijau', name: 'Scarf Lereng Hijau', category: 'Scarf', gender: 'Wanita', origin: 'Pekalongan', technique: 'Cap', price: 275000, pattern: 'lereng', colors: ['#2f4a3a', '#9bb38a', '#f1efe3'], description: 'Lightweight scarf in coastal Pekalongan greens with diagonal lereng stripes.', material: 'Silk blend', dimensions: '55 × 180 cm', variants: [{ size: 'All Size', stock: 12 }] },
  { slug: 'kain-sidomukti', name: 'Kain Sidomukti', category: 'Kain', gender: 'Unisex', origin: 'Solo', technique: 'Tulis', price: 2950000, pattern: 'sidomukti', colors: ['#3d2a1c', '#b8894f', '#f5ecdc'], description: 'Traditionally worn at weddings, sidomukti carries a wish for lasting happiness and prosperity.', material: 'Primissima cotton', dimensions: '105 × 250 cm', variants: [{ size: 'All Size', stock: 0 }] },
  { slug: 'kemeja-parang-indigo', name: 'Kemeja Parang Indigo', category: 'Kemeja', gender: 'Pria', origin: 'Yogyakarta', technique: 'Kombinasi', price: 575000, pattern: 'parang', colors: ['#1b2440', '#7d8fb8', '#eceff6'], description: 'Long-sleeve shirt in natural indigo, finished with a hand-drawn parang motif.', material: 'Cotton dobby', dimensions: 'S – XXL', variants: [{ size: 'M', stock: 5 }, { size: 'L', stock: 8 }, { size: 'XL', stock: 2 }] },
  { slug: 'scarf-kawung-sutra', name: 'Scarf Kawung Sutra', category: 'Scarf', gender: 'Wanita', origin: 'Yogyakarta', technique: 'Tulis', price: 650000, pattern: 'kawung', colors: ['#6b4423', '#e0b77a', '#fbf4e8'], description: 'Pure silk scarf with a delicate hand-drawn kawung. A light, elegant gift.', material: 'Silk', dimensions: '50 × 170 cm', variants: [{ size: 'All Size', stock: 4 }] },
  { slug: 'blouse-lereng-pastel', name: 'Blouse Lereng Pastel', category: 'Blouse', gender: 'Wanita', origin: 'Pekalongan', technique: 'Cap', price: 385000, pattern: 'lereng', colors: ['#8a5a6b', '#d9b2bd', '#faf1f3'], description: 'Loose-fit blouse with three-quarter sleeves, printed in soft Pekalongan pastels.', material: 'Rayon', dimensions: 'S – XL', variants: [{ size: 'S', stock: 3 }, { size: 'M', stock: 7 }, { size: 'L', stock: 5 }, { size: 'XL', stock: 2 }] },
  { slug: 'kemeja-sidomukti-pria', name: 'Kemeja Sidomukti Pria', category: 'Kemeja', gender: 'Pria', origin: 'Solo', technique: 'Tulis', price: 1250000, pattern: 'sidomukti', colors: ['#2e2218', '#a9824c', '#f2e8d6'], description: 'Formal long-sleeve shirt, fully hand-drawn sidomukti — made for weddings and kondangan.', material: 'Primissima cotton, lined', dimensions: 'M – XXL', variants: [{ size: 'M', stock: 2 }, { size: 'L', stock: 3 }, { size: 'XL', stock: 1 }, { size: 'XXL', stock: 1 }] }
]

export const batikProducts = (uid: () => string): Product[] => seed.map((p, i) => ({
  ...p,
  id: uid(),
  sku: `SB-${String(1001 + i)}`,
  stock: p.variants.reduce((s, v) => s + v.stock, 0),
  isActive: true,
  createdAt: new Date(Date.now() - i * 86400000 * 2).toISOString()
}))

export function batikOrders(uid: () => string, products: Product[]): Order[] {
  const people = [
    ['Sari Wulandari', 'Jakarta Selatan 12160'], ['Rudi Hartono', 'Bandung 40115'], ['Maya Putri', 'Surabaya 60271'],
    ['Agus Salim', 'Yogyakarta 55281'], ['Rina Kusuma', 'Semarang 50132'], ['Dimas Pratama', 'Depok 16424']
  ]
  const statuses = ['pending', 'paid', 'shipped', 'completed', 'cancelled', 'pending'] as const
  const payments = ['transfer', 'ewallet', 'qris'] as const
  return people.map(([name, city], i) => {
    const p = products[(i * 3) % products.length]!
    const v = p.variants.find(x => x.stock > 0) ?? p.variants[0]!
    const qty = (i % 2) + 1
    const subtotal = p.price * qty
    const shipping = subtotal >= 500000 ? 0 : 25000
    return {
      id: uid(), code: `SB-${(0x1a2b3c + i * 7919).toString(36).toUpperCase()}`,
      customerName: name!, email: `${name!.split(' ')[0]!.toLowerCase()}@example.com`, phone: `08123456${String(70 + i)}`,
      address: `Jl. Merdeka No. ${10 + i}`, city: city!, payment: payments[i % 3]!,
      items: [{ productId: p.id, slug: p.slug, name: p.name, size: v.size, qty, price: p.price }],
      subtotal, shipping, total: subtotal + shipping, status: statuses[i]!,
      createdAt: new Date(Date.now() - i * 86400000 * 1.5).toISOString()
    }
  })
}
