import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getRoleHome } from '@/config/menus'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // ── 认证页面（独立） ──
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/login/LoginView.vue'),
      meta: { guest: true },
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/views/register/RegisterView.vue'),
      meta: { guest: true },
    },

    // ── ADMIN_TENANT ──
    {
      path: '/admin/tenant',
      component: () => import('@/layouts/AppLayout.vue'),
      meta: { requiresAuth: true, roles: ['ADMIN_TENANT'] },
      children: [
        { path: '', redirect: '/admin/tenant/dashboard' },
        { path: 'dashboard', name: 'TenantDashboard', component: () => import('@/views/admin/DashboardView.vue'), meta: { title: '首页' } },
        { path: 'assets', name: 'TenantAssets', component: () => import('@/views/admin/AssetListView.vue'), meta: { title: '资产管理' } },
        { path: 'users', name: 'TenantUsers', component: () => import('@/views/admin/UserListView.vue'), meta: { title: '用户管理' } },
        { path: 'regions', name: 'TenantRegions', component: () => import('@/views/admin/RegionListView.vue'), meta: { title: '分区管理' } },
        { path: 'depts', name: 'TenantDepts', component: () => import('@/views/admin/DeptListView.vue'), meta: { title: '部门管理' } },
        { path: 'tickets', name: 'TenantTickets', component: () => import('@/views/admin/TicketListView.vue'), meta: { title: '工单管理' } },
      ],
    },

    // ── ADMIN_REGION ──
    {
      path: '/admin/region',
      component: () => import('@/layouts/AppLayout.vue'),
      meta: { requiresAuth: true, roles: ['ADMIN_REGION'] },
      children: [
        { path: '', redirect: '/admin/region/dashboard' },
        { path: 'dashboard', name: 'RegionDashboard', component: () => import('@/views/admin/DashboardView.vue'), meta: { title: '首页' } },
        { path: 'assets', name: 'RegionAssets', component: () => import('@/views/admin/AssetListView.vue'), meta: { title: '资产管理' } },
        { path: 'users', name: 'RegionUsers', component: () => import('@/views/admin/UserListView.vue'), meta: { title: '用户管理' } },
        { path: 'tickets', name: 'RegionTickets', component: () => import('@/views/admin/TicketListView.vue'), meta: { title: '工单管理' } },
      ],
    },

    // ── ENGINEER ──
    {
      path: '/engineer',
      component: () => import('@/layouts/AppLayout.vue'),
      meta: { requiresAuth: true, roles: ['ENGINEER'] },
      children: [
        { path: '', redirect: '/engineer/dashboard' },
        { path: 'dashboard', name: 'EngineerDashboard', component: () => import('@/views/engineer/DashboardView.vue'), meta: { title: '工作台' } },
        { path: 'pool', name: 'WorkOrderPool', component: () => import('@/views/engineer/WorkOrderPoolView.vue'), meta: { title: '工单池' } },
        { path: 'my-orders', name: 'MyOrders', component: () => import('@/views/engineer/MyOrdersView.vue'), meta: { title: '我的工单' } },
        { path: 'assets', name: 'EngineerAssets', component: () => import('@/views/engineer/AssetViewView.vue'), meta: { title: '资产查看' } },

      ],
    },

    // ── EMPLOYEE ──
    {
      path: '/employee',
      component: () => import('@/layouts/AppLayout.vue'),
      meta: { requiresAuth: true, roles: ['EMPLOYEE'] },
      children: [
        { path: '', redirect: '/employee/dashboard' },
        { path: 'dashboard', name: 'EmployeeDashboard', component: () => import('@/views/employee/DashboardView.vue'), meta: { title: '工作台' } },
        { path: 'assets', name: 'MyAssets', component: () => import('@/views/employee/MyAssetsView.vue'), meta: { title: '我的资产' } },
        { path: 'orders', name: 'MyWorkOrders', component: () => import('@/views/employee/MyOrdersView.vue'), meta: { title: '我的工单' } },
        { path: 'repair', name: 'CreateRepair', component: () => import('@/views/employee/CreateRepairView.vue'), meta: { title: '发起报修' } },
        { path: 'apply', name: 'CreateApply', component: () => import('@/views/employee/CreateApplyView.vue'), meta: { title: '发起申领' } },
      ],
    },

    // ── 兜底 ──
    { path: '/:pathMatch(.*)*', redirect: '/login' },
  ],
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  const hasToken = !!authStore.token
  const role = authStore.role

  if (to.meta.requiresAuth) {
    if (!hasToken) {
      next({ name: 'Login', query: { redirect: to.fullPath } })
      return
    }
    const allowedRoles = to.meta.roles as string[] | undefined
    if (allowedRoles && !allowedRoles.includes(role)) {
      next(getRoleHome(role))
      return
    }
    next()
  } else if (to.meta.guest && hasToken) {
    next(getRoleHome(role))
  } else {
    next()
  }
})

export default router
