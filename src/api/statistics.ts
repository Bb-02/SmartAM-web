import http from './index'
import type { ApiResponse } from '@/types/api'
import type { StatisticsOverview } from '@/types/statistics'

export function getOverview(): Promise<ApiResponse<StatisticsOverview>> {
  return http.get('/statistics/overview').then((res) => res.data)
}
