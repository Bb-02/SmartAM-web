import http from './index'
import type { ApiResponse, PageResult } from '@/types/api'
import type { DepartmentItem, DepartmentCreateRequest, DepartmentUpdateRequest } from '@/types/department'

export function getDepartmentList(params?: {
  regionId?: number
  keyword?: string
}): Promise<ApiResponse<PageResult<DepartmentItem>>> {
  return http.get('/departments', { params: { page: 1, size: 200, ...params } }).then((res) => res.data)
}

export function getDepartment(id: number): Promise<ApiResponse<DepartmentItem>> {
  return http.get(`/departments/${id}`).then((res) => res.data)
}

export function createDepartment(data: DepartmentCreateRequest): Promise<ApiResponse<DepartmentItem>> {
  return http.post('/departments', data).then((res) => res.data)
}

export function updateDepartment(id: number, data: DepartmentUpdateRequest): Promise<ApiResponse<DepartmentItem>> {
  return http.put(`/departments/${id}`, data).then((res) => res.data)
}

export function deleteDepartment(id: number): Promise<ApiResponse<null>> {
  return http.delete(`/departments/${id}`).then((res) => res.data)
}
