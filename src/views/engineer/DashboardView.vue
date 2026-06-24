<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getWorkOrderList } from '@/api/work-orders'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const stats = ref({ pending: 0, inWork: 0, resolvedToday: 0 })
const recentOrders = ref<{ id: number; title: string; priority: string; reporterName: string; createdAt: string }[]>([])

onMounted(async () => {
  try {
    const [pendingRes, myRes] = await Promise.all([
      getWorkOrderList({ page: 1, size: 200, status: 'PENDING' }),
      getWorkOrderList({ page: 1, size: 200 }),
    ])
    const all = myRes.data.records
    const myOrders = all.filter((o) => o.engineerId === authStore.userId)

    stats.value = {
      pending: pendingRes.data.records.length,
      inWork: myOrders.filter((o) => o.status === 'IN_WORK').length,
      resolvedToday: myOrders.filter((o) => {
        if (o.status !== 'RESOLVED' && o.status !== 'CLOSED') return false
        const d = new Date(o.updatedAt)
        const today = new Date()
        return d.toDateString() === today.toDateString()
      }).length,
    }

    recentOrders.value = pendingRes.data.records
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5)
      .map((o) => ({
        id: o.id, title: o.title, priority: o.priority,
        reporterName: o.reporterName, createdAt: o.createdAt,
      }))
  } catch { /* ignore */ }
  finally { loading.value = false }
})

function goPool() { router.push('/engineer/pool') }
function goMy() { router.push('/engineer/my-orders') }
function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)} 小时前`
  return iso.slice(0, 10)
}

const priorityLabel: Record<string, string> = { URGENT: '紧急', HIGH: '高', NORMAL: '普通', LOW: '低' }
const priorityColor: Record<string, string> = { URGENT: '#dc2626', HIGH: '#d97706', NORMAL: '#64748b', LOW: '#94a3b8' }
</script>

<template>
  <div class="dash" v-loading="loading">
    <!-- 欢迎区 -->
    <div class="dash-header">
      <div class="header-left">
        <h2>工作台</h2>
        <p class="header-greeting">{{ authStore.realName }}，下午好</p>
      </div>
      <div class="header-date">{{ new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }) }}</div>
    </div>

    <!-- 统计卡片 -->
    <div class="stat-row">
      <div class="stat-card" @click="goPool">
        <div class="stat-accent accent-red"></div>
        <div class="stat-body">
          <div class="stat-num red">{{ stats.pending }}</div>
          <div class="stat-label">待受理工单</div>
        </div>
        <div class="stat-icon">
          <el-icon :size="72"><List /></el-icon>
        </div>
      </div>

      <div class="stat-card" @click="goMy">
        <div class="stat-accent accent-blue"></div>
        <div class="stat-body">
          <div class="stat-num blue">{{ stats.inWork }}</div>
          <div class="stat-label">处理中</div>
        </div>
        <div class="stat-icon">
          <el-icon :size="72"><Loading /></el-icon>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-accent accent-green"></div>
        <div class="stat-body">
          <div class="stat-num green">{{ stats.resolvedToday }}</div>
          <div class="stat-label">今日完成</div>
        </div>
        <div class="stat-icon">
          <el-icon :size="72"><CircleCheck /></el-icon>
        </div>
      </div>
    </div>

    <!-- 待受理工单列表 -->
    <div v-if="recentOrders.length > 0" class="panel">
      <div class="panel-head">
        <span class="panel-title">待受理工单</span>
        <span class="panel-link" @click="goPool">查看全部 →</span>
      </div>
      <div class="order-list">
        <div v-for="o in recentOrders" :key="o.id" class="order-row" @click="goPool">
          <span class="order-priority" :style="{ background: priorityColor[o.priority] }">{{ priorityLabel[o.priority] }}</span>
          <span class="order-title">{{ o.title }}</span>
          <span class="order-meta">{{ o.reporterName }} · {{ formatTime(o.createdAt) }}</span>
        </div>
      </div>
    </div>
    <div v-else class="panel">
      <div class="panel-head">
        <span class="panel-title">待受理工单</span>
      </div>
      <div class="empty-hint">暂无待受理工单</div>
    </div>

    <!-- 快捷操作 -->
    <div class="quick-row">
      <el-button type="primary" @click="goPool" :icon="List">去工单池</el-button>
      <el-button @click="goMy">我的工单</el-button>
      <el-button @click="router.push('/engineer/assets')">资产查看</el-button>
    </div>
  </div>
</template>

<style scoped>
/* ── 欢迎区 ── */
.dash-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 36px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e8ecf1;
}
.header-left h2 {
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.5px;
}
.header-greeting {
  font-size: 15px;
  color: #64748b;
  margin-top: 4px;
}
.header-date {
  font-size: 14px;
  color: #94a3b8;
}

/* ── 统计卡片 ── */
.stat-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 36px;
}
.stat-card {
  position: relative;
  background: #fff;
  border-radius: 12px;
  padding: 32px 24px 32px 0;
  display: flex;
  align-items: center;
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.15s, box-shadow 0.15s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02);
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.07);
}
.stat-accent {
  width: 4px;
  height: 60px;
  border-radius: 0 3px 3px 0;
  margin-right: 24px;
  flex-shrink: 0;
}
.accent-red  { background: #dc2626; }
.accent-blue { background: #2563eb; }
.accent-green{ background: #16a34a; }

.stat-body {
  flex: 1;
  z-index: 1;
}
.stat-num {
  font-size: 48px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -1.5px;
  font-variant-numeric: tabular-nums;
}
.stat-num.red   { color: #dc2626; }
.stat-num.blue  { color: #2563eb; }
.stat-num.green { color: #16a34a; }
.stat-label {
  font-size: 14px;
  color: #64748b;
  margin-top: 8px;
  font-weight: 500;
}

.stat-icon {
  position: absolute;
  right: 12px;
  bottom: -6px;
  color: #f1f5f9;
  z-index: 0;
  pointer-events: none;
}

/* ── 通用面板 ── */
.panel {
  background: #fff;
  border-radius: 12px;
  padding: 24px 28px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02);
}
.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}
.panel-link {
  font-size: 14px;
  color: #409eff;
  cursor: pointer;
}
.panel-link:hover { color: #337ecc; }

.empty-hint {
  text-align: center;
  color: #94a3b8;
  font-size: 15px;
  padding: 32px 0 16px;
}

/* ── 工单列表 ── */
.order-list {
  margin-top: 10px;
}
.order-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 0;
  cursor: pointer;
  transition: background 0.12s;
  border-radius: 6px;
  margin: 0 -8px;
  padding-left: 8px;
  padding-right: 8px;
}
.order-row:hover { background: #f8fafc; }
.order-row + .order-row { border-top: 1px solid #f1f5f9; }

.order-priority {
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  padding: 3px 10px;
  border-radius: 4px;
  flex-shrink: 0;
  min-width: 40px;
  text-align: center;
}
.order-title {
  flex: 1;
  font-size: 15px;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.order-meta {
  font-size: 13px;
  color: #94a3b8;
  white-space: nowrap;
  flex-shrink: 0;
}

/* ── 快捷操作 ── */
.quick-row {
  display: flex;
  gap: 12px;
}
.quick-row .el-button {
  padding: 10px 20px;
  font-size: 14px;
}
</style>
