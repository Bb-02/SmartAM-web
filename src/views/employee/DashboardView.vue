<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getAssetList } from '@/api/assets'
import { getWorkOrderList } from '@/api/work-orders'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const stats = ref({ assetCount: 0, orderPending: 0, orderInWork: 0, orderResolved: 0 })
const recentOrders = ref<{ id: number; title: string; status: string; engineerName: string; updatedAt: string }[]>([])

const statusLabel: Record<string, string> = { PENDING: '待受理', IN_WORK: '处理中', RESOLVED: '待确认', CLOSED: '已结单' }
const statusColor: Record<string, string> = { PENDING: '#d97706', IN_WORK: '#2563eb', RESOLVED: '#16a34a', CLOSED: '#94a3b8' }

onMounted(async () => {
  try {
    const [assetRes, orderRes] = await Promise.all([
      getAssetList({ page: 1, size: 500 }),
      getWorkOrderList({ page: 1, size: 500 }),
    ])
    const myAssets = assetRes.data.records.filter((a) => a.userId === authStore.userId)
    const myOrders = orderRes.data.records.filter((o) => o.reporterId === authStore.userId)

    stats.value = {
      assetCount: myAssets.length,
      orderPending: myOrders.filter((o) => o.status === 'PENDING').length,
      orderInWork: myOrders.filter((o) => o.status === 'IN_WORK').length,
      orderResolved: myOrders.filter((o) => o.status === 'RESOLVED').length,
    }

    recentOrders.value = myOrders
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 5)
      .map((o) => ({
        id: o.id, title: o.title, status: o.status,
        engineerName: o.engineerName || '—', updatedAt: o.updatedAt,
      }))
  } catch { /* ignore */ }
  finally { loading.value = false }
})

function goAssets() { router.push('/employee/assets') }
function goOrders() { router.push('/employee/orders') }
function goRepair() { router.push('/employee/repair') }
function formatTime(iso: string) { return iso ? iso.slice(0, 16).replace('T', ' ') : '-' }
</script>

<template>
  <div class="dash" v-loading="loading">
    <!-- 欢迎区 -->
    <div class="dash-header">
      <div class="header-left">
        <h2>我的工作台</h2>
        <p class="header-greeting">{{ authStore.realName }}，欢迎回来</p>
      </div>
      <div class="header-date">{{ new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }) }}</div>
    </div>

    <!-- 统计卡片 -->
    <div class="stat-row">
      <div class="stat-card" @click="goAssets">
        <div class="stat-accent accent-blue"></div>
        <div class="stat-body">
          <div class="stat-num blue">{{ stats.assetCount }}</div>
          <div class="stat-label">我的资产</div>
        </div>
        <div class="stat-icon"><el-icon :size="72"><Goods /></el-icon></div>
      </div>

      <div class="stat-card" @click="goOrders">
        <div class="stat-accent accent-orange"></div>
        <div class="stat-body">
          <div class="stat-num orange">{{ stats.orderPending }}</div>
          <div class="stat-label">待受理工单</div>
        </div>
        <div class="stat-icon"><el-icon :size="72"><Clock /></el-icon></div>
      </div>

      <div class="stat-card" @click="goOrders">
        <div class="stat-accent accent-blue"></div>
        <div class="stat-body">
          <div class="stat-num blue">{{ stats.orderInWork }}</div>
          <div class="stat-label">处理中</div>
        </div>
        <div class="stat-icon"><el-icon :size="72"><Loading /></el-icon></div>
      </div>

      <div class="stat-card" @click="goOrders">
        <div class="stat-accent accent-green"></div>
        <div class="stat-body">
          <div class="stat-num green">{{ stats.orderResolved }}</div>
          <div class="stat-label">待确认</div>
        </div>
        <div class="stat-icon"><el-icon :size="72"><CircleCheck /></el-icon></div>
      </div>
    </div>

    <!-- 最近工单 -->
    <div v-if="recentOrders.length > 0" class="panel">
      <div class="panel-head">
        <span class="panel-title">最近工单</span>
        <span class="panel-link" @click="goOrders">查看全部 →</span>
      </div>
      <div class="order-list">
        <div v-for="o in recentOrders" :key="o.id" class="order-row" @click="goOrders">
          <span class="order-status-tag" :style="{ background: statusColor[o.status] }">{{ statusLabel[o.status] }}</span>
          <span class="order-title">{{ o.title }}</span>
          <span class="order-meta">{{ o.engineerName }} · {{ formatTime(o.updatedAt) }}</span>
        </div>
      </div>
    </div>
    <div v-else class="panel">
      <div class="panel-head">
        <span class="panel-title">最近工单</span>
      </div>
      <div class="empty-hint">暂无工单记录</div>
    </div>

    <!-- 快捷操作 -->
    <div class="quick-row">
      <el-button type="primary" @click="goRepair">发起报修</el-button>
      <el-button @click="goAssets">我的资产</el-button>
      <el-button @click="goOrders">我的工单</el-button>
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
  grid-template-columns: repeat(4, 1fr);
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
.accent-blue   { background: #2563eb; }
.accent-orange { background: #d97706; }
.accent-green  { background: #16a34a; }

.stat-body { flex: 1; z-index: 1; }
.stat-num {
  font-size: 48px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -1.5px;
  font-variant-numeric: tabular-nums;
}
.stat-num.blue   { color: #2563eb; }
.stat-num.orange { color: #d97706; }
.stat-num.green  { color: #16a34a; }
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

/* ── 工单面板 ── */
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
.order-list { margin-top: 10px; }
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

.order-status-tag {
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  padding: 3px 10px;
  border-radius: 4px;
  flex-shrink: 0;
  min-width: 48px;
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
