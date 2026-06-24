export interface RegionItem {
  id: number
  tenantId: number
  name: string
  code: string
  isDefault: number
  status: number
  createdAt: string
  updatedAt: string
}

export interface RegionCreateRequest {
  name: string
  code: string
}

export interface RegionUpdateRequest {
  name?: string
  code?: string
}
