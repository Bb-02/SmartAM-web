import http from './index'
import type { ApiResponse } from '@/types/api'
import type { DictData } from '@/types/dict'

export function getDict(): Promise<ApiResponse<DictData>> {
  return http.get('/dict').then((res) => res.data)
}
