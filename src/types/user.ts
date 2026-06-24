export interface UserItem {
  id: number
  tenantId: number
  regionId: number
  deptId: number | null
  username: string
  realName: string
  phone: string
  email: string
  role: string
  status: number
  createdAt: string
  updatedAt: string
}
