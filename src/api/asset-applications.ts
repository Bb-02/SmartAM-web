import http from './index'
import type { ApiResponse, PageResult } from '@/types/api'
import type { AssetApplicationItem, AssetApplicationCreateRequest, AssetApplicationUpdateRequest, AssetApplicationLog } from '@/types/asset-application'

export function getApplicationList(params?: {
  page?: number
  size?: number
  status?: string
  assetId?: number
  applicantId?: number
}): Promise<ApiResponse<PageResult<AssetApplicationItem>>> {
  return http.get('/asset-applications', { params: { page: 1, size: 20, ...params } }).then((res) => res.data)
}

export function getApplication(id: number): Promise<ApiResponse<AssetApplicationItem>> {
  return http.get(`/asset-applications/${id}`).then((res) => res.data)
}

export function createApplication(data: AssetApplicationCreateRequest): Promise<ApiResponse<AssetApplicationItem>> {
  return http.post('/asset-applications', data).then((res) => res.data)
}

export function approveApplication(id: number): Promise<ApiResponse<AssetApplicationItem>> {
  return http.post(`/asset-applications/${id}/approve`).then((res) => res.data)
}

export function rejectApplication(id: number, remark?: string): Promise<ApiResponse<AssetApplicationItem>> {
  return http.post(`/asset-applications/${id}/reject`, null, { params: { remark } }).then((res) => res.data)
}

export function cancelApplication(id: number): Promise<ApiResponse<AssetApplicationItem>> {
  return http.post(`/asset-applications/${id}/cancel`).then((res) => res.data)
}

export function updateApplication(id: number, data: AssetApplicationUpdateRequest): Promise<ApiResponse<AssetApplicationItem>> {
  return http.put(`/asset-applications/${id}`, data).then((res) => res.data)
}

export function getApplicationLogs(id: number): Promise<ApiResponse<AssetApplicationLog[]>> {
  return http.get(`/asset-applications/${id}/logs`).then((res) => res.data)
}
