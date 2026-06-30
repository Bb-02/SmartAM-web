// ── 品类 ──
export const ASSET_CATEGORIES = [
  'COMPUTER', 'NETWORK_SERVER', 'PERIPHERAL', 'PRINTER',
  'TELECOM_SECURITY', 'OFFICE_FACILITY', 'OFFICE_FURNITURE', 'OTHER',
] as const
export type AssetCategory = (typeof ASSET_CATEGORIES)[number]

export const categoryLabel: Record<AssetCategory, string> = {
  COMPUTER: '计算机设备',
  NETWORK_SERVER: '网络与服务器',
  PERIPHERAL: '外设与显示',
  PRINTER: '打印设备',
  TELECOM_SECURITY: '通讯安防',
  OFFICE_FACILITY: '办公设施',
  OFFICE_FURNITURE: '办公家具',
  OTHER: '其他资产',
}

export const categoryOptions = ASSET_CATEGORIES.map((v) => ({ label: categoryLabel[v], value: v }))

// ── 状态 ──
export type AssetStatus = 'IN_STORAGE' | 'IN_USE' | 'IN_REPAIR' | 'SCRAPPED'

export const statusLabel: Record<AssetStatus, string> = {
  IN_STORAGE: '在库',
  IN_USE: '使用中',
  IN_REPAIR: '维修中',
  SCRAPPED: '已报废',
}

export const statusTagType: Record<AssetStatus, string> = {
  IN_STORAGE: '',
  IN_USE: 'success',
  IN_REPAIR: 'warning',
  SCRAPPED: 'danger',
}

export const statusOptions = [
  { label: '全部状态', value: '' },
  ...Object.entries(statusLabel).map(([value, label]) => ({ label, value })),
]

// ── 实体 ──
export interface AssetItem {
  id: number
  tenantId: number
  regionId: number
  regionName: string
  deptId: number | null
  deptName: string
  userId: number | null
  userName: string
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

// ── 请求 ──
export interface AssetQueryParams {
  page?: number
  size?: number
  status?: string
  category?: string
  regionId?: number
  deptId?: number
  userId?: number
  keyword?: string
  scope?: string
}

export interface AssetCreateRequest {
  name: string
  code: string
  category: string
  regionId?: number
  deptId?: number
  userId?: number
  model?: string
  brand?: string
  price?: number
  quantity?: number
  unit?: string
  location?: string
  purchaseDate?: string
  warrantyEnd?: string
  description?: string
}

export interface AssetUpdateRequest {
  name?: string
  code?: string
  category?: string
  regionId?: number
  deptId?: number
  userId?: number
  model?: string
  brand?: string
  price?: number
  quantity?: number
  unit?: string
  status?: string
  location?: string
  purchaseDate?: string
  warrantyEnd?: string
  description?: string
}

// ── 变更日志 ──
export interface AssetLog {
  id: number
  tenantId: number
  assetId: number
  operatorId: number
  action: string
  description: string
  remark: string | null
  createdAt: string
}
