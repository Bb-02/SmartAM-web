import http from './index'
import type { ApiResponse, PageResult } from '@/types/api'
import type {
  AssetItem,
  AssetQueryParams,
  AssetCreateRequest,
  AssetUpdateRequest,
  AssetLog,
} from '@/types/asset'

export function getAssetList(params: AssetQueryParams): Promise<ApiResponse<PageResult<AssetItem>>> {
  return http.get('/assets', { params }).then((res) => res.data)
}

export function getAsset(id: number): Promise<ApiResponse<AssetItem>> {
  return http.get(`/assets/${id}`).then((res) => res.data)
}

export function createAsset(data: AssetCreateRequest): Promise<ApiResponse<AssetItem>> {
  return http.post('/assets', data).then((res) => res.data)
}

export function updateAsset(id: number, data: AssetUpdateRequest): Promise<ApiResponse<AssetItem>> {
  return http.put(`/assets/${id}`, data).then((res) => res.data)
}

export function deleteAsset(id: number): Promise<ApiResponse<null>> {
  return http.delete(`/assets/${id}`).then((res) => res.data)
}

export function getAssetLogs(id: number): Promise<ApiResponse<AssetLog[]>> {
  return http.get(`/assets/${id}/logs`).then((res) => res.data)
}
