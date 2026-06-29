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

export interface UserCreateRequest {
  username: string
  password: string
  realName: string
  role: string
  regionId?: number
  deptId?: number
  phone?: string
  email?: string
}

export interface UserUpdateRequest {
  realName?: string
  password?: string
  phone?: string
  email?: string
  regionId?: number
  deptId?: number
  status?: number
}

export interface UserSelfUpdateRequest {
  realName?: string
  phone?: string
  email?: string
}

export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}

export interface ResetPasswordRequest {
  password: string
}

// ── 角色常量 ──
export const ROLE_LABEL: Record<string, string> = {
  ADMIN_TENANT: '租户管理员',
  ADMIN_REGION: '分区管理员',
  ENGINEER: '工程师',
  EMPLOYEE: '员工',
}

export function getRoleOptions(currentRole: string) {
  if (currentRole === 'ADMIN_TENANT') {
    return [
      { label: '分区管理员', value: 'ADMIN_REGION' },
      { label: '工程师', value: 'ENGINEER' },
      { label: '员工', value: 'EMPLOYEE' },
    ]
  }
  // ADMIN_REGION 只能创建 ENGINEER 和 EMPLOYEE
  return [
    { label: '工程师', value: 'ENGINEER' },
    { label: '员工', value: 'EMPLOYEE' },
  ]
}
