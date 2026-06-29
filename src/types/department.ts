export interface DepartmentItem {
  id: number
  tenantId: number
  regionId: number
  parentId: number
  name: string
  code: string
  status: number
  createdAt: string
  updatedAt: string
}

export interface DepartmentTreeNode {
  id: number
  name: string
  code: string
  parentId: number | null
  regionId: number
  children: DepartmentTreeNode[]
}

export interface DepartmentCreateRequest {
  name: string
  code: string
  regionId?: number
  parentId?: number
}

export interface DepartmentUpdateRequest {
  name?: string
  code?: string
  parentId?: number
}
