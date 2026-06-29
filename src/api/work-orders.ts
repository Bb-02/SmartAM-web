import http from './index'
import type { ApiResponse, PageResult } from '@/types/api'
import type { WorkOrderItem, WorkOrderCreateRequest } from '@/types/work-order'

export function getWorkOrderList(params?: {
  page?: number
  size?: number
  status?: string
  priority?: string
  keyword?: string
  assetId?: number
  engineerId?: number
  reporterId?: number
}): Promise<ApiResponse<PageResult<WorkOrderItem>>> {
  return http.get('/work-orders', { params: { page: 1, size: 20, ...params } }).then((res) => res.data)
}

export function getWorkOrderDetail(id: number): Promise<ApiResponse<WorkOrderItem>> {
  return http.get(`/work-orders/${id}`).then((res) => res.data)
}

export function createWorkOrder(data: WorkOrderCreateRequest): Promise<ApiResponse<WorkOrderItem>> {
  return http.post('/work-orders', data).then((res) => res.data)
}

export function claimWorkOrder(id: number): Promise<ApiResponse<null>> {
  return http.post(`/work-orders/${id}/claim`).then((res) => res.data)
}

export function resolveWorkOrder(id: number, resolution: string): Promise<ApiResponse<null>> {
  return http.post(`/work-orders/${id}/resolve`, { resolution }).then((res) => res.data)
}

export function rejectWorkOrder(id: number, remark: string): Promise<ApiResponse<null>> {
  return http.post(`/work-orders/${id}/reject`, null, { params: { remark } }).then((res) => res.data)
}

export function confirmWorkOrder(id: number, rating: number): Promise<ApiResponse<null>> {
  return http.post(`/work-orders/${id}/confirm`, { rating }).then((res) => res.data)
}

export function getWorkOrderLogs(id: number): Promise<ApiResponse<any[]>> {
  return http.get(`/work-orders/${id}/logs`).then((res) => res.data)
}
