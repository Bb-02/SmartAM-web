// ── 状态 ──
export type WorkOrderStatus = 'PENDING' | 'IN_WORK' | 'RESOLVED' | 'CLOSED'

export const WO_STATUS_LABEL: Record<WorkOrderStatus, string> = {
  PENDING: '待受理',
  IN_WORK: '处理中',
  RESOLVED: '已解决',
  CLOSED: '已结单',
}

export const WO_STATUS_TAG: Record<WorkOrderStatus, string> = {
  PENDING: 'warning',
  IN_WORK: '',
  RESOLVED: 'success',
  CLOSED: 'info',
}

// ── 优先级 ──
export const PRIORITY_LABEL: Record<string, string> = {
  LOW: '低',
  NORMAL: '普通',
  HIGH: '高',
  URGENT: '紧急',
}

export const PRIORITY_TAG: Record<string, string> = {
  LOW: 'info',
  NORMAL: '',
  HIGH: 'warning',
  URGENT: 'danger',
}

// ── 实体 ──
export interface WorkOrderItem {
  id: number
  tenantId: number
  regionId: number
  type: string
  title: string
  description: string
  assetId: number | null
  reporterId: number
  reporterName: string
  engineerId: number | null
  engineerName: string | null
  status: WorkOrderStatus
  priority: string
  resolution: string | null
  rating: number | null
  createdAt: string
  updatedAt: string
}

// ── 请求 ──
export interface WorkOrderCreateRequest {
  title: string
  type?: string
  description?: string
  assetId?: number
  priority?: string
}
