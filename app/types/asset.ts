export const ASSET_CATEGORIES = ['IT Equipment', 'Furniture', 'Kitchen', 'Vehicle', 'Linen', 'Audio Visual', 'Other'] as const
export type AssetCategory = typeof ASSET_CATEGORIES[number]

export const ASSET_CONDITIONS = ['new', 'good', 'fair', 'damaged'] as const
export type AssetCondition = typeof ASSET_CONDITIONS[number]

export type AssetStatus = 'active' | 'deprecated'

export interface Asset {
  id: string
  tag: string               // unique asset tag, e.g. 'GH-IT-0001'
  name: string
  category: AssetCategory
  departmentId?: string | null
  location: string
  condition: AssetCondition
  purchaseDate?: string     // YYYY-MM-DD
  value?: number            // IDR
  notes: string
  /** deprecated = retired from use but kept on record (assets are never deleted) */
  status: AssetStatus
  deprecatedAt?: string | null
  deprecatedReason?: string | null
  createdAt: string
  createdBy?: string        // user name, set by the server
}

export type AssetInput = Omit<Asset, 'id' | 'createdAt' | 'createdBy'>

export const conditionColor: Record<AssetCondition, 'success' | 'info' | 'warning' | 'error'> = {
  new: 'success', good: 'info', fair: 'warning', damaged: 'error'
}
