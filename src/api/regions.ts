import http from './index'
import type { ApiResponse, PageResult } from '@/types/api'
import type { RegionItem, RegionCreateRequest, RegionUpdateRequest } from '@/types/region'

export function getRegionList(keyword?: string): Promise<ApiResponse<PageResult<RegionItem>>> {
  return http.get('/regions', { params: { page: 1, size: 100, keyword } }).then((res) => res.data)
}

export function getRegion(id: number): Promise<ApiResponse<RegionItem>> {
  return http.get(`/regions/${id}`).then((res) => res.data)
}

export function createRegion(data: RegionCreateRequest): Promise<ApiResponse<RegionItem>> {
  return http.post('/regions', data).then((res) => res.data)
}

export function updateRegion(id: number, data: RegionUpdateRequest): Promise<ApiResponse<RegionItem>> {
  return http.put(`/regions/${id}`, data).then((res) => res.data)
}

export function patchRegionStatus(id: number, status: number): Promise<ApiResponse<null>> {
  return http.patch(`/regions/${id}/status`, null, { params: { status } }).then((res) => res.data)
}

export function deleteRegion(id: number): Promise<ApiResponse<null>> {
  return http.delete(`/regions/${id}`).then((res) => res.data)
}
