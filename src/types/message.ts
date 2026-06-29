export interface MessageItem {
  id: number
  type: string
  title: string
  content: string
  relatedId: number | null
  isRead: number
  createdAt: string
}
