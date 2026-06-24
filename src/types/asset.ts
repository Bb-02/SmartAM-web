export interface AssetItem {
  id: number
  tenantId: number
  regionId: number
  deptId: number | null
  userId: number | null
  name: string
  code: string
  category: string
  model: string
  brand: string
  price: number
  quantity: number
  unit: string
  status: AssetStatus
  location: string
  purchaseDate: string
  warrantyEnd: string
  description: string
  createdAt: string
  updatedAt: string
}

export type AssetStatus = 'IN_STORAGE' | 'IN_USE' | 'IN_REPAIR' | 'SCRAPPED'

export interface AssetQueryParams {
  page?: number
  size?: number
  status?: string
  category?: string
  deptId?: number
  keyword?: string
}
