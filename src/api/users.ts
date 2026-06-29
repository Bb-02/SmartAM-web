import http from './index'
import type { ApiResponse, PageResult } from '@/types/api'
import type { UserItem, UserCreateRequest, UserUpdateRequest, UserSelfUpdateRequest, ChangePasswordRequest, ResetPasswordRequest } from '@/types/user'

export function getUserList(params?: {
  page?: number
  size?: number
  role?: string
  regionId?: number
  deptId?: number
  keyword?: string
}): Promise<ApiResponse<PageResult<UserItem>>> {
  return http.get('/users', { params: { page: 1, size: 200, ...params } }).then((res) => res.data)
}

export function getMyInfo(): Promise<ApiResponse<UserItem>> {
  return http.get('/users/me').then((res) => res.data)
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

export function updateMyInfo(data: UserSelfUpdateRequest): Promise<ApiResponse<UserItem>> {
  return http.put('/users/me', data).then((res) => res.data)
}

export function changePassword(data: ChangePasswordRequest): Promise<ApiResponse<null>> {
  return http.put('/users/me/password', data).then((res) => res.data)
}

export function resetUserPassword(id: number, data: ResetPasswordRequest): Promise<ApiResponse<null>> {
  return http.put(`/users/${id}/reset-password`, data).then((res) => res.data)
}

export function deleteUser(id: number): Promise<ApiResponse<null>> {
  return http.delete(`/users/${id}`).then((res) => res.data)
}
