import http from './index'
import type { ApiResponse, PageResult } from '@/types/api'
import type { RegionItem } from '@/types/region'

export function getRegionList(keyword?: string): Promise<ApiResponse<PageResult<RegionItem>>> {
  return http.get('/regions', { params: { page: 1, size: 100, keyword } }).then((res) => res.data)
}
