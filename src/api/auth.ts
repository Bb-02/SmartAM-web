import http from './index'
import type { ApiResponse } from '@/types/api'
import type {
  LoginRequest,
  LoginResponseData,
  RegisterRequest,
  RegisterResponseData,
} from '@/types/auth'

export function login(data: LoginRequest): Promise<ApiResponse<LoginResponseData>> {
  return http.post('/auth/login', data).then((res) => res.data)
}

export function register(data: RegisterRequest): Promise<ApiResponse<RegisterResponseData>> {
  return http.post('/tenant/register', data).then((res) => res.data)
}
