import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/login/LoginView.vue'),
      meta: { guest: true, title: '登录' },
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/views/register/RegisterView.vue'),
      meta: { guest: true, title: '注册' },
    },
    {
      path: '/',
      component: () => import('@/layouts/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'Dashboard',
          component: () => import('@/views/dashboard/DashboardView.vue'),
          meta: { title: '首页' },
        },
        {
          path: 'assets',
          name: 'Assets',
          component: () => import('@/views/assets/AssetListView.vue'),
          meta: { title: '资产管理' },
        },
        {
          path: 'users',
          name: 'Users',
          component: () => import('@/views/users/UserListView.vue'),
          meta: { title: '用户管理' },
        },
        {
          path: 'tickets',
          name: 'Tickets',
          component: () => import('@/views/tickets/TicketListView.vue'),
          meta: { title: '工单管理' },
        },
      ],
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  const hasToken = !!authStore.token

  if (to.meta.requiresAuth) {
    if (hasToken) {
      next()
    } else {
      next({ name: 'Login', query: { redirect: to.fullPath } })
    }
  } else if (to.meta.guest && hasToken) {
    next({ name: 'Dashboard' })
  } else {
    next()
  }
})

export default router
