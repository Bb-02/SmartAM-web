<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const pageTitle = computed(() => (route.meta.title as string) || '')

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <el-container class="layout">
    <!-- 左侧 Sidebar -->
    <el-aside width="260px" class="layout-aside">
      <div class="sidebar-logo">
        <h1>SmartAM</h1>
        <p>智能资产管理系统</p>
      </div>

      <el-menu
        :default-active="route.path"
        router
        background-color="#1E3A5F"
        text-color="rgba(255,255,255,0.65)"
        active-text-color="#fff"
      >
        <el-menu-item index="/">
          <template #title>
            <el-icon><HomeFilled /></el-icon>
            <span>首页</span>
          </template>
        </el-menu-item>
        <el-menu-item index="/assets">
          <el-icon><Goods /></el-icon>
          <span>资产管理</span>
        </el-menu-item>
        <el-menu-item index="/users">
          <el-icon><UserFilled /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="/tickets">
          <el-icon><Document /></el-icon>
          <span>工单管理</span>
        </el-menu-item>
      </el-menu>

      <div class="sidebar-footer">
        <span>{{ authStore.realName }}</span>
        <small>{{ authStore.role }}</small>
      </div>
    </el-aside>

    <!-- 右侧：Header + Main -->
    <el-container>
      <el-header class="layout-header" height="56px">
        <span class="page-title">{{ pageTitle }}</span>
        <el-button text type="primary" @click="handleLogout">退出登录</el-button>
      </el-header>

      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.layout {
  height: 100%;
}

/* === Sidebar === */
.layout-aside {
  background-color: #1e3a5f;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.sidebar-logo {
  padding: 24px 20px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.sidebar-logo h1 {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.5px;
}

.sidebar-logo p {
  margin-top: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.sidebar-footer {
  margin-top: auto;
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.55);
  font-size: 13px;
}

.sidebar-footer small {
  display: block;
  margin-top: 2px;
  font-size: 11px;
}

/* Override el-menu border */
.layout-aside :deep(.el-menu) {
  border-right: none;
}

/* === Header === */
.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  padding: 0 24px;
}

.page-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

/* === Main === */
.layout-main {
  background: #f1f5f9;
  padding: 24px;
}
</style>
