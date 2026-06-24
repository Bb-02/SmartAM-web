import http from './index'
import type { ApiResponse, PageResult } from '@/types/api'
import type { WorkOrderItem, WorkOrderCreateRequest } from '@/types/work-order'

export function getWorkOrderList(params?: {
  page?: number
  size?: number
  status?: string
  priority?: string
}): Promise<ApiResponse<PageResult<WorkOrderItem>>> {
  return http.get('/work-orders', { params: { page: 1, size: 20, ...params } }).then((res) => res.data)
}

export function createWorkOrder(data: WorkOrderCreateRequest): Promise<ApiResponse<WorkOrderItem>> {
  return http.post('/work-orders', data).then((res) => res.data)
}
