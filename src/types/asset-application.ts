export interface AssetApplicationItem {
  id: number
  tenantId: number
  regionId: number
  assetId: number
  assetName: string
  applicantId: number
  applicantName: string
  type: string
  reason: string
  status: string
  approverId: number | null
  approverName: string | null
  remark: string | null
  createdAt: string
  updatedAt: string
}

export interface AssetApplicationCreateRequest {
  assetId: number
  reason: string
  type?: string
  targetUserId?: number
  targetDeptId?: number
}

export interface AssetApplicationLog {
  id: number
  applicationId: number
  assetId: number
  fromStatus: string
  toStatus: string
  operatorId: number
  remark: string | null
  createdAt: string
}
