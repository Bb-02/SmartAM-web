<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getOverview } from '@/api/statistics'
import { getAssetList } from '@/api/assets'
import { getRegionList } from '@/api/regions'
import { getWorkOrderList } from '@/api/work-orders'

const router = useRouter()
const authStore = useAuthStore()
const isTenantAdmin = computed(() => authStore.role === 'ADMIN_TENANT')

const loading = ref(true)
const stats = ref({
  assetTotal: 0, assetExpiring: 0,
  userTotal: 0,
  orderPending: 0, orderInWork: 0, orderResolved: 0, orderStalled: 0,
  regionTotal: 0, deptTotal: 0,
})

const regionSummaries = ref<{ name: string; assets: number; orders: number }[]>([])

onMounted(async () => {
  try {
    const [overviewRes, orderRes, assetRes, regionRes] = await Promise.all([
      getOverview(),
      getWorkOrderList({ page: 1, size: 200 }),
      getAssetList({ page: 1, size: 200 }),
      isTenantAdmin.value ? getRegionList() : Promise.resolve(null),
    ])
    const overview = overviewRes.data
    const orders = orderRes.data.records
    const now = new Date()

    // 即将过保资产
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const expiring = assetRes.data.records.filter((a) => {
      if (!a.warrantyEnd) return false
      const d = new Date(a.warrantyEnd)
      return d >= now && d <= thirtyDaysLater
    })

    stats.value = {
      assetTotal: overview.assetTotal,
      assetExpiring: expiring.length,
      userTotal: overview.userTotal,
      orderPending: overview.woPending,
      orderInWork: overview.woInWork,
      orderResolved: overview.woResolved,
      orderStalled: orders.filter((o) => {
        if (o.status !== 'PENDING') return false
        const created = new Date(o.createdAt)
        return (now.getTime() - created.getTime()) > 48 * 60 * 60 * 1000
      }).length,
      regionTotal: overview.regionTotal,
      deptTotal: overview.departmentTotal,
    }

    // 分区概况
    if (isTenantAdmin.value && regionRes) {
      regionSummaries.value = regionRes.data.records.map((r) => ({
        name: r.name,
        assets: 0,
        orders: orders.filter((o) => o.regionId === r.id).length,
      }))
    }
  } catch { /* ignore */ }
  finally { loading.value = false }
})

function goTo(path: string) { router.push(path) }

const alerts = computed(() => {
  const list: { text: string; link?: string }[] = []
  if (stats.value.assetExpiring > 0) list.push({ text: `${stats.value.assetExpiring} 台资产将在 30 天内过保`, link: 'assets' })
  if (stats.value.orderStalled > 0) list.push({ text: `${stats.value.orderStalled} 个工单超过 48 小时无人受理`, link: 'tickets' })
  return list
})
</script>

<template>
  <div class="dashboard" v-loading="loading">
    <!-- 欢迎区 -->
    <div class="dash-header">
      <div class="header-left">
        <h2>{{ authStore.companyName || 'SmartAM' }}</h2>
        <p class="header-greeting">欢迎回来，{{ authStore.realName }}</p>
      </div>
      <div class="header-date">{{ new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }) }}</div>
    </div>

    <!-- 警报 / 一切正常 -->
    <div v-if="alerts.length > 0" class="alert-strip">
      <div v-for="a in alerts" :key="a.text" class="alert-item" @click="a.link && goTo(a.link)">
        <span class="alert-dot"></span>
        {{ a.text }}
        <span v-if="a.link" class="alert-link">→ 查看</span>
      </div>
    </div>
    <div v-else class="alert-strip all-clear">
      <span class="alert-dot green"></span> 一切正常，没有需要关注的事项
    </div>

    <!-- 核心指标 -->
    <div class="stat-row">
      <div class="stat-card" @click="goTo('assets')">
        <div class="stat-accent accent-blue"></div>
        <div class="stat-body">
          <div class="stat-num blue">{{ stats.assetTotal }}</div>
          <div class="stat-label">资产总数</div>
          <div v-if="stats.assetExpiring > 0" class="stat-sub">其中 {{ stats.assetExpiring }} 台即将过保</div>
        </div>
        <div class="stat-icon"><el-icon :size="72"><Goods /></el-icon></div>
      </div>

      <div class="stat-card" @click="goTo('users')">
        <div class="stat-accent accent-purple"></div>
        <div class="stat-body">
          <div class="stat-num purple">{{ stats.userTotal }}</div>
          <div class="stat-label">用户总数</div>
        </div>
        <div class="stat-icon"><el-icon :size="72"><UserFilled /></el-icon></div>
      </div>

      <div class="stat-card" @click="goTo('tickets')">
        <div class="stat-accent accent-red"></div>
        <div class="stat-body">
          <div class="stat-num red">{{ stats.orderPending }}</div>
          <div class="stat-label">待受理工单</div>
          <div class="stat-inline">
            <span class="muted">{{ stats.orderInWork }} 处理中</span>
            <span class="muted">{{ stats.orderResolved }} 已解决</span>
          </div>
        </div>
        <div class="stat-icon"><el-icon :size="72"><Document /></el-icon></div>
      </div>

      <div v-if="isTenantAdmin" class="stat-card" @click="goTo('regions')">
        <div class="stat-accent accent-green"></div>
        <div class="stat-body">
          <div class="stat-num green">{{ stats.regionTotal }}</div>
          <div class="stat-label">分区</div>
          <div class="stat-inline">
            <span class="muted">{{ stats.deptTotal }} 个部门</span>
          </div>
        </div>
        <div class="stat-icon"><el-icon :size="72"><Location /></el-icon></div>
      </div>
    </div>

    <!-- 分区概况（仅总管理员） -->
    <div v-if="isTenantAdmin && regionSummaries.length > 0" class="panel">
      <div class="panel-head">
        <span class="panel-title">分区概况</span>
      </div>
      <div class="region-row">
        <div v-for="r in regionSummaries" :key="r.name" class="region-card">
          <div class="region-name">{{ r.name }}</div>
          <div class="region-meta">{{ r.orders }} 工单</div>
        </div>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="quick-row">
      <el-button type="primary" @click="goTo('assets')">资产管理</el-button>
      <el-button @click="goTo('users')">用户管理</el-button>
      <el-button v-if="isTenantAdmin" @click="goTo('regions')">分区管理</el-button>
      <el-button v-if="isTenantAdmin" @click="goTo('depts')">部门管理</el-button>
      <el-button @click="goTo('tickets')">工单管理</el-button>
    </div>
  </div>
</template>

<style scoped>
/* ── 欢迎区 ── */
.dash-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 28px;
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

/* ── 警报条 ── */
.alert-strip {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 32px;
}
.alert-strip.all-clear {
  color: #16a34a;
  font-size: 14px;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  padding: 12px 18px;
  border-radius: 8px;
}
.alert-item {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  padding: 12px 18px;
  border-radius: 8px;
  font-size: 14px;
  color: #991b1b;
  cursor: pointer;
  transition: background 0.12s;
}
.alert-item:hover { background: #fee2e2; }
.alert-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #dc2626;
  flex-shrink: 0;
}
.alert-dot.green { background: #16a34a; }
.alert-link {
  color: #dc2626;
  font-weight: 500;
  margin-left: auto;
  font-size: 13px;
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
.accent-purple { background: #7c3aed; }
.accent-red    { background: #dc2626; }
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
.stat-num.purple { color: #7c3aed; }
.stat-num.red    { color: #dc2626; }
.stat-num.green  { color: #16a34a; }
.stat-label {
  font-size: 14px;
  color: #64748b;
  margin-top: 8px;
  font-weight: 500;
}
.stat-sub {
  font-size: 13px;
  color: #d97706;
  margin-top: 4px;
}
.stat-inline {
  display: flex;
  gap: 14px;
  margin-top: 6px;
}
.muted {
  font-size: 13px;
  color: #94a3b8;
}

.stat-icon {
  position: absolute;
  right: 12px;
  bottom: -6px;
  color: #f1f5f9;
  z-index: 0;
  pointer-events: none;
}

/* ── 分区面板 ── */
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
  margin-bottom: 16px;
}
.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.region-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}
.region-card {
  background: #f8fafc;
  border: 1px solid #e8ecf1;
  border-radius: 8px;
  padding: 18px 22px;
}
.region-name {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}
.region-meta {
  font-size: 13px;
  color: #94a3b8;
  margin-top: 4px;
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
