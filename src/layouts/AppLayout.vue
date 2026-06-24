<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getMenuByRoute } from '@/config/menus'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const pageTitle = computed(() => (route.meta.title as string) || '')
const menuItems = computed(() => getMenuByRoute(route.path))

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

function handleCommand(command: string) {
  if (command === 'logout') handleLogout()
}
</script>

<template>
  <el-container class="app-layout">
    <!-- 左侧 Sidebar -->
    <el-aside width="260px" class="app-aside">
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
        <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.title }}</span>
        </el-menu-item>
      </el-menu>

      <div class="sidebar-footer">
        <span>{{ authStore.realName }}</span>
        <small>{{ authStore.role }}</small>
      </div>
    </el-aside>

    <!-- 右侧 -->
    <el-container>
      <!-- Header -->
      <el-header class="app-header" height="56px">
        <div class="header-left">
          <span class="header-title">{{ pageTitle }}</span>
          <el-divider direction="vertical" />
          <span class="header-company">{{ authStore.companyName || '—' }}</span>
        </div>

        <div class="header-right">
          <el-icon class="bell-icon"><Bell /></el-icon>
          <el-dropdown trigger="click" @command="handleCommand">
            <span class="user-dropdown">
              <el-avatar :size="32" icon="UserFilled" />
              <span class="user-name">{{ authStore.realName }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled>
                  {{ authStore.realName }} · {{ authStore.role }}
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- Main 内容区 -->
      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.app-layout {
  height: 100%;
}

/* === Sidebar === */
.app-aside {
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

.app-aside :deep(.el-menu) {
  border-right: none;
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

/* === Header === */
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  padding: 0 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.header-company {
  font-size: 13px;
  color: #64748b;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.bell-icon {
  font-size: 20px;
  color: #94a3b8;
  cursor: pointer;
}

.bell-icon:hover {
  color: #1e3a5f;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.user-name {
  font-size: 14px;
  color: #334155;
}

/* === Main === */
.app-main {
  background: #f1f5f9;
  padding: 24px;
}
</style>
