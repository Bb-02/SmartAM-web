<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getMenuByRoute } from '@/config/menus'
import { getUnreadCount, getMessageList, markRead, markAllRead } from '@/api/messages'
import type { MessageItem } from '@/types/message'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const pageTitle = computed(() => (route.meta.title as string) || '')
const menuItems = computed(() => getMenuByRoute(route.path))

// 消息
const unreadCount = ref(0)
const messages = ref<MessageItem[]>([])
const msgLoading = ref(false)
let msgTimer: ReturnType<typeof setInterval> | null = null

async function fetchUnread() {
  try { unreadCount.value = (await getUnreadCount()).data }
  catch { /* ignore */ }
}

async function fetchMessages() {
  msgLoading.value = true
  try { messages.value = (await getMessageList({ page: 1, size: 5 })).data.records }
  catch { messages.value = [] }
  finally { msgLoading.value = false }
}

async function handleReadOne(msg: MessageItem) {
  try {
    await markRead(msg.id)
    unreadCount.value = Math.max(0, unreadCount.value - 1)
    if (msg.relatedId) {
      // 根据类型跳转
      if (msg.type === 'WORK_ORDER') router.push('/employee/orders')
      else if (msg.type === 'APPLICATION') router.push('/employee/apply')
      else if (msg.type === 'ASSET') router.push('/employee/assets')
    }
  } catch { /* ignore */ }
}

async function handleReadAll() {
  try {
    await markAllRead()
    unreadCount.value = 0
    messages.value = messages.value.map((m) => ({ ...m, isRead: 1 }))
  } catch { /* ignore */ }
}

const msgTypeLabel: Record<string, string> = { WORK_ORDER: '工单', APPLICATION: '申领', ASSET: '资产' }

onMounted(() => {
  fetchUnread()
  msgTimer = setInterval(fetchUnread, 60000)
})
onUnmounted(() => {
  if (msgTimer) clearInterval(msgTimer)
})

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

function handleCommand(command: string) {
  if (command === 'logout') handleLogout()
  if (command === 'profile') router.push('/profile')
  if (command === 'messages') router.push('/messages')
}
</script>

<template>
  <el-container class="app-layout">
    <!-- 左侧 Sidebar -->
    <el-aside width="220px" class="app-aside">
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
          <el-popover placement="bottom-end" :width="360" trigger="click" @show="fetchMessages">
            <template #reference>
              <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99" class="bell-badge">
                <el-icon class="bell-icon"><Bell /></el-icon>
              </el-badge>
            </template>
            <div class="msg-panel" v-loading="msgLoading">
              <div class="msg-panel-head">
                <span>消息通知</span>
                <el-button v-if="unreadCount > 0" size="small" text @click="handleReadAll">全部已读</el-button>
              </div>
              <div v-if="messages.length === 0" class="msg-empty">暂无消息</div>
              <div v-for="m in messages" :key="m.id" class="msg-item" :class="{ unread: m.isRead === 0 }" @click="handleReadOne(m)">
                <div class="msg-top">
                  <span class="msg-type-tag">{{ msgTypeLabel[m.type] || m.type }}</span>
                  <span class="msg-dot" v-if="m.isRead === 0"></span>
                </div>
                <div class="msg-title">{{ m.title }}</div>
                <div class="msg-time">{{ m.createdAt?.slice(0, 16).replace('T', ' ') }}</div>
              </div>
              <div class="msg-panel-foot">
                <el-button size="small" text @click="router.push('/messages')">查看全部 →</el-button>
              </div>
            </div>
          </el-popover>
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
                <el-dropdown-item command="profile">个人设置</el-dropdown-item>
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

.bell-badge {
  cursor: pointer;
}
.bell-icon {
  font-size: 20px;
  color: #94a3b8;
}
.bell-icon:hover {
  color: #1e3a5f;
}

/* 消息弹窗 */
.msg-panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}
.msg-empty {
  padding: 32px 0;
  text-align: center;
  font-size: 13px;
  color: #94a3b8;
}
.msg-item {
  padding: 12px 0;
  cursor: pointer;
  border-bottom: 1px solid #f8fafc;
  transition: background 0.1s;
}
.msg-item:hover { background: #f8fafc; margin: 0 -12px; padding-left: 12px; padding-right: 12px; border-radius: 4px; }
.msg-item.unread { background: #f8fafc; }
.msg-top { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.msg-type-tag { font-size: 11px; font-weight: 600; color: #64748b; background: #f1f5f9; padding: 2px 8px; border-radius: 3px; }
.msg-dot { width: 6px; height: 6px; border-radius: 50%; background: #dc2626; margin-left: auto; }
.msg-title { font-size: 13px; color: #334155; line-height: 1.4; }
.msg-time { font-size: 11px; color: #94a3b8; margin-top: 3px; }
.msg-panel-foot {
  padding-top: 8px;
  text-align: center;
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
