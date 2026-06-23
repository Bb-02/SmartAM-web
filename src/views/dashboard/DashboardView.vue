<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="dashboard">
    <h1>SmartAM Dashboard</h1>
    <p>欢迎，{{ authStore.realName }}</p>
    <p class="role-tag">角色：{{ authStore.role }}</p>
    <el-button @click="handleLogout">退出登录</el-button>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 12px;
}

.dashboard h1 {
  font-size: 28px;
  color: #1e3a5f;
}

.role-tag {
  color: #64748b;
  font-size: 14px;
}
</style>
