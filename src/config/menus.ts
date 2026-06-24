export interface MenuItem {
  path: string
  title: string
  icon: string
}

const menus: Record<string, MenuItem[]> = {
  '/admin/tenant': [
    { path: '/admin/tenant/dashboard', title: '首页', icon: 'HomeFilled' },
    { path: '/admin/tenant/assets', title: '资产管理', icon: 'Goods' },
    { path: '/admin/tenant/users', title: '用户管理', icon: 'UserFilled' },
    { path: '/admin/tenant/regions', title: '分区管理', icon: 'Location' },
    { path: '/admin/tenant/depts', title: '部门管理', icon: 'OfficeBuilding' },
    { path: '/admin/tenant/tickets', title: '工单管理', icon: 'Document' },
  ],
  '/admin/region': [
    { path: '/admin/region/dashboard', title: '首页', icon: 'HomeFilled' },
    { path: '/admin/region/assets', title: '资产管理', icon: 'Goods' },
    { path: '/admin/region/users', title: '用户管理', icon: 'UserFilled' },
    { path: '/admin/region/tickets', title: '工单管理', icon: 'Document' },
  ],
  '/engineer': [
    { path: '/engineer/pool', title: '工单池', icon: 'List' },
    { path: '/engineer/my-orders', title: '我的工单', icon: 'Document' },
    { path: '/engineer/assets', title: '资产查看', icon: 'Goods' },
    { path: '/engineer/history', title: '历史工单', icon: 'Clock' },
  ],
  '/employee': [
    { path: '/employee/assets', title: '我的资产', icon: 'Goods' },
    { path: '/employee/repair', title: '发起报修', icon: 'WarningFilled' },
    { path: '/employee/apply', title: '发起申领', icon: 'Plus' },
  ],
}

export function getMenuByRoute(path: string): MenuItem[] {
  const keys = Object.keys(menus).sort((a, b) => b.length - a.length)
  for (const prefix of keys) {
    if (path.startsWith(prefix)) return menus[prefix]
  }
  return []
}

export function getRoleHome(role: string): string {
  const map: Record<string, string> = {
    ADMIN_TENANT: '/admin/tenant/dashboard',
    ADMIN_REGION: '/admin/region/dashboard',
    ENGINEER: '/engineer/pool',
    EMPLOYEE: '/employee/assets',
  }
  return map[role] || '/'
}
