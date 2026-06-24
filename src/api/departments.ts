import http from './index'
import type { ApiResponse, PageResult } from '@/types/api'
import type { DepartmentItem } from '@/types/department'

export function getDepartmentList(params?: {
  regionId?: number
  keyword?: string
}): Promise<ApiResponse<PageResult<DepartmentItem>>> {
  return http.get('/departments', { params: { page: 1, size: 200, ...params } }).then((res) => res.data)
}
