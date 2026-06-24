import http from './index'
import type { ApiResponse, PageResult } from '@/types/api'
import type { UserItem, UserCreateRequest, UserUpdateRequest } from '@/types/user'

export function getUserList(params?: {
  page?: number
  size?: number
  role?: string
  deptId?: number
  keyword?: string
}): Promise<ApiResponse<PageResult<UserItem>>> {
  return http.get('/users', { params: { page: 1, size: 200, ...params } }).then((res) => res.data)
}

export function getUser(id: number): Promise<ApiResponse<UserItem>> {
  return http.get(`/users/${id}`).then((res) => res.data)
}

export function createUser(data: UserCreateRequest): Promise<ApiResponse<UserItem>> {
  return http.post('/users', data).then((res) => res.data)
}

export function updateUser(id: number, data: UserUpdateRequest): Promise<ApiResponse<UserItem>> {
  return http.put(`/users/${id}`, data).then((res) => res.data)
}

export function deleteUser(id: number): Promise<ApiResponse<null>> {
  return http.delete(`/users/${id}`).then((res) => res.data)
}
