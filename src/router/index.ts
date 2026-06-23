import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
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
    {
      path: '/',
      name: 'Dashboard',
      component: () => import('@/views/dashboard/DashboardView.vue'),
      meta: { requiresAuth: true },
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
