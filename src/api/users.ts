import http from './index'
import type { ApiResponse, PageResult } from '@/types/api'
import type { UserItem } from '@/types/user'

export function getUserList(params?: {
  role?: string
  deptId?: number
  keyword?: string
}): Promise<ApiResponse<PageResult<UserItem>>> {
  return http.get('/users', { params: { page: 1, size: 200, ...params } }).then((res) => res.data)
}
