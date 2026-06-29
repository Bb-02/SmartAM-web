import http from './index'
import type { ApiResponse, PageResult } from '@/types/api'
import type { MessageItem } from '@/types/message'

export function getMessageList(params?: {
  page?: number
  size?: number
  type?: string
  isRead?: number
}): Promise<ApiResponse<PageResult<MessageItem>>> {
  return http.get('/messages', { params: { page: 1, size: 20, ...params } }).then((res) => res.data)
}

export function getUnreadCount(): Promise<ApiResponse<number>> {
  return http.get('/messages/unread-count').then((res) => res.data)
}

export function markRead(id: number): Promise<ApiResponse<null>> {
  return http.put(`/messages/${id}/read`).then((res) => res.data)
}

export function markAllRead(): Promise<ApiResponse<null>> {
  return http.put('/messages/read-all').then((res) => res.data)
}
