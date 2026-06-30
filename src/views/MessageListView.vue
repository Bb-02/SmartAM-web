<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMessageList, markRead, markAllRead } from '@/api/messages'
import { useAuthStore } from '@/stores/auth'
import { getRoleHome } from '@/config/menus'
import type { MessageItem } from '@/types/message'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const listData = ref<MessageItem[]>([])
const pagination = reactive({ current: 1, size: 20, total: 0 })
const detailVisible = ref(false)
const detailMsg = ref<MessageItem | null>(null)

const typeLabel: Record<string, string> = { WORK_ORDER: '工单', APPLICATION: '申领', ASSET: '资产' }

async function fetchData() {
  loading.value = true
  try {
    const res = await getMessageList({ page: pagination.current, size: pagination.size })
    listData.value = res.data.records
    pagination.total = res.data.total
  } catch { listData.value = [] }
  finally { loading.value = false }
}

function openDetail(msg: MessageItem) {
  detailMsg.value = msg
  detailVisible.value = true
  if (msg.isRead === 0) {
    markRead(msg.id).then(() => { msg.isRead = 1 }).catch(() => {})
  }
}

async function handleReadAll() {
  try {
    await markAllRead()
    listData.value.forEach((m) => (m.isRead = 1))
  } catch { /* ignore */ }
}

function handlePageChange(p: number) { pagination.current = p; fetchData() }
function formatTime(iso: string) { return iso ? iso.slice(0, 16).replace('T', ' ') : '-' }

onMounted(() => { fetchData() })
</script>

<template>
  <div class="msg-page">
    <div class="page-header">
      <div class="header-left">
        <el-button text @click="router.push(getRoleHome(authStore.role))">
          <el-icon><ArrowLeft /></el-icon>返回首页
        </el-button>
        <h2>消息通知</h2>
      </div>
      <el-button text @click="handleReadAll" v-if="listData.some((m) => m.isRead === 0)">全部已读</el-button>
    </div>

    <div class="msg-list" v-loading="loading">
      <div v-for="m in listData" :key="m.id" class="msg-card" :class="{ unread: m.isRead === 0 }" @click="openDetail(m)">
        <div class="msg-head">
          <span class="msg-type-tag">{{ typeLabel[m.type] || m.type }}</span>
          <span class="msg-dot" v-if="m.isRead === 0"></span>
          <span class="msg-time">{{ formatTime(m.createdAt) }}</span>
        </div>
        <div class="msg-title">{{ m.title }}</div>
        <div class="msg-content" v-if="m.content">{{ m.content }}</div>
      </div>
      <el-empty v-if="!loading && listData.length === 0" description="暂无消息" :image-size="80" />
    </div>

    <div class="msg-pagination" v-if="pagination.total > 0">
      <el-pagination v-model:current-page="pagination.current" :page-size="pagination.size" :total="pagination.total" layout="prev, pager, next" small @current-change="handlePageChange" />
    </div>

    <!-- 消息详情对话框 -->
    <el-dialog v-model="detailVisible" title="消息详情" width="520px" :close-on-click-modal="true">
      <template v-if="detailMsg">
        <div class="detail-type">
          <span class="dt-tag">{{ typeLabel[detailMsg.type] || detailMsg.type }}</span>
          <span class="dt-time">{{ formatTime(detailMsg.createdAt) }}</span>
        </div>
        <h3 class="dt-title">{{ detailMsg.title }}</h3>
        <div class="dt-body">{{ detailMsg.content || '暂无详细内容' }}</div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.msg-page { padding: 4px 0; }
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e8ecf1;
}
.header-left { display: flex; align-items: center; gap: 12px; }
.header-left h2 { font-size: 22px; font-weight: 700; color: #0f172a; letter-spacing: -0.4px; }

.msg-list { display: flex; flex-direction: column; gap: 8px; }
.msg-card {
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 10px;
  padding: 20px 24px;
  cursor: pointer;
  transition: background 0.12s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.02);
}
.msg-card:hover { background: #f8fafc; }
.msg-card.unread { border-left: 3px solid #dc2626; background: #fef2f2; }

.msg-head { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.msg-type-tag { font-size: 11px; font-weight: 600; color: #64748b; background: #f1f5f9; padding: 2px 8px; border-radius: 3px; }
.msg-dot { width: 6px; height: 6px; border-radius: 50%; background: #dc2626; }
.msg-time { font-size: 12px; color: #94a3b8; margin-left: auto; }

.msg-title { font-size: 15px; font-weight: 600; color: #1e293b; }
.msg-content { font-size: 13px; color: #64748b; margin-top: 6px; line-height: 1.6; }

.msg-pagination { display: flex; justify-content: center; margin-top: 24px; }

/* 详情对话框 */
.detail-type { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.dt-tag { font-size: 12px; font-weight: 600; color: #64748b; background: #f1f5f9; padding: 3px 10px; border-radius: 4px; }
.dt-time { font-size: 13px; color: #94a3b8; }
.dt-title { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 20px; line-height: 1.5; }
.dt-body { font-size: 14px; color: #475569; line-height: 1.8; white-space: pre-wrap; background: #f8fafc; border-radius: 8px; padding: 16px 20px; }
</style>
