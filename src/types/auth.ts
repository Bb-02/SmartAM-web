export interface LoginRequest {
  companyCode: string
  username: string
  password: string
}

export interface LoginResponseData {
  token: string
  userId: number
  username: string
  role: string
  realName: string
  companyName: string
  regionId: number
  regionName: string
  deptId: number | null
}

export interface RegisterRequest {
  companyName: string
  companyCode: string
  adminUsername: string
  adminPassword: string
  adminRealName: string
  adminPhone?: string
  adminEmail?: string
}

export interface RegisterResponseData {
  tenantId: number
  tenantName: string
  adminUserId: number
}

export interface UserInfo {
  userId: number
  username: string
  role: string
  realName: string
  companyName: string
  regionId: number
  regionName: string
  deptId: number | null
}
