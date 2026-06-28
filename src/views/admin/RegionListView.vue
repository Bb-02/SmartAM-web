<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getRegionList, patchRegionStatus, deleteRegion } from '@/api/regions'
import type { RegionItem } from '@/types/region'
import RegionFormDrawer from './RegionFormDrawer.vue'

const loading = ref(false)
const regionList = ref<RegionItem[]>([])
const searchKeyword = ref('')

const filteredList = computed(() => {
  if (!searchKeyword.value) return regionList.value
  const kw = searchKeyword.value.toLowerCase()
  return regionList.value.filter((r) => r.name.toLowerCase().includes(kw) || r.code.toLowerCase().includes(kw))
})

const stats = computed(() => ({
  total: regionList.value.length,
  active: regionList.value.filter((r) => r.status === 1).length,
  inactive: regionList.value.filter((r) => r.status === 0).length,
}))

async function fetchData() {
  loading.value = true
  try {
    const res = await getRegionList(searchKeyword.value || undefined)
    regionList.value = res.data.records
  } catch { regionList.value = [] }
  finally { loading.value = false }
}

function handleSearch() { fetchData() }
function handleReset() { searchKeyword.value = ''; fetchData() }

async function handleToggle(row: RegionItem) {
  const newStatus = row.status === 1 ? 0 : 1
  if (newStatus === 0 && row.isDefault === 1) {
    ElMessage.warning('默认分区不能停用')
    return
  }
  try {
    await patchRegionStatus(row.id, newStatus)
    ElMessage.success(newStatus === 1 ? '已启用' : '已停用')
    fetchData()
  } catch { /* toast */ }
}

function canDelete(row: RegionItem) { return row.isDefault !== 1 }

async function handleDelete(row: RegionItem) {
  try { await ElMessageBox.confirm(`确定删除分区「${row.name}」？`, '确认删除', { type: 'warning' }) }
  catch { return }
  try {
    await deleteRegion(row.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch { /* toast */ }
}

const drawerVisible = ref(false)
const drawerMode = ref<'create' | 'edit' | 'view'>('create')
const drawerRegionId = ref<number>()

function openCreate() { drawerMode.value = 'create'; drawerRegionId.value = undefined; drawerVisible.value = true }
function openEdit(id: number) { drawerMode.value = 'edit'; drawerRegionId.value = id; drawerVisible.value = true }
function openView(id: number) { drawerMode.value = 'view'; drawerRegionId.value = id; drawerVisible.value = true }

function formatDate(iso: string) { return iso ? iso.slice(0, 10) : '-' }

onMounted(() => { fetchData() })
</script>

<template>
  <div class="region-page">
    <!-- 页面标题 — 和 Dashboard 一样带底部分隔线 -->
    <div class="page-header">
      <div class="header-left">
        <h2>分区管理</h2>
        <p class="header-sub">管理公司的组织分区结构</p>
      </div>
    </div>

    <!-- 搜索 + 新建 — 搜索区用浅灰底托住 -->
    <div class="search-bar">
      <el-input v-model="searchKeyword" placeholder="搜索分区名称或标识..." clearable style="width: 280px" @keyup.enter="handleSearch" @clear="handleSearch">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-button v-if="searchKeyword" @click="handleReset" text>重置</el-button>
      <el-button type="primary" class="create-btn" @click="openCreate"><el-icon><Plus /></el-icon>新增分区</el-button>
    </div>

    <!-- 统计条 -->
    <div class="stat-bar" v-if="regionList.length > 0">
      <div class="sb-accent"></div>
      <div class="sb-inner">
        <div class="sb-item">
          <span class="sb-icon"><el-icon :size="40"><Location /></el-icon></span>
          <span class="sb-num">{{ stats.total }}</span>
          <span class="sb-label">分区总数</span>
        </div>
        <span class="sb-div"></span>
        <div class="sb-item">
          <span class="sb-icon on"><el-icon :size="40"><CircleCheck /></el-icon></span>
          <span class="sb-num on">{{ stats.active }}</span>
          <span class="sb-label"><i class="sb-dot dot-on"></i>启用中</span>
        </div>
        <span class="sb-div"></span>
        <div class="sb-item">
          <span class="sb-icon off"><el-icon :size="40"><VideoPause /></el-icon></span>
          <span class="sb-num off">{{ stats.inactive }}</span>
          <span class="sb-label"><i class="sb-dot dot-off"></i>已停用</span>
        </div>
      </div>
    </div>

    <!-- 分区卡片网格 -->
    <div class="region-grid" v-loading="loading">
      <template v-if="filteredList.length > 0">
        <div
          v-for="r in filteredList"
          :key="r.id"
          class="region-card"
          :class="{ 'is-disabled': r.status === 0 }"
          @click="openView(r.id)"
        >
          <div class="card-glow" :class="r.status === 1 ? 'glow-active' : 'glow-inactive'"></div>
          <div class="card-accent" :class="r.status === 1 ? 'accent-on' : 'accent-off'"></div>

          <div class="card-inner">
            <div class="card-head">
              <div class="card-title-wrap">
                <p class="card-name">{{ r.name }}</p>
                <p class="card-code">{{ r.code }}</p>
              </div>
              <span class="card-badge" :class="r.isDefault === 1 ? 'badge-default' : 'badge-normal'">
                {{ r.isDefault === 1 ? '默认' : '普通' }}
              </span>
            </div>

            <div class="card-meta">
              <div class="meta-item">
                <span class="status-dot" :class="r.status === 1 ? 'dot-on' : 'dot-off'"></span>
                <span>{{ r.status === 1 ? '启用中' : '已停用' }}</span>
              </div>
              <div class="meta-item">
                <el-icon :size="14"><Calendar /></el-icon>
                <span>{{ formatDate(r.createdAt) }}</span>
              </div>
            </div>

            <div class="card-actions" @click.stop>
              <button class="act-btn act-edit" @click="openEdit(r.id)">
                <el-icon :size="14"><Edit /></el-icon>编辑
              </button>
              <button class="act-btn" @click="handleToggle(r)">
                <el-icon :size="14"><VideoPause /></el-icon>{{ r.status === 1 ? '停用' : '启用' }}
              </button>
              <button v-if="canDelete(r)" class="act-btn act-del" @click="handleDelete(r)">
                <el-icon :size="14"><Delete /></el-icon>删除
              </button>
            </div>
          </div>
        </div>
      </template>

      <div v-else class="empty-state">
        <div class="empty-icon"><el-icon :size="48"><Location /></el-icon></div>
        <p class="empty-title">暂无分区</p>
        <p class="empty-desc">创建分区来管理不同区域的人员和资产</p>
        <el-button type="primary" @click="openCreate">创建第一个分区</el-button>
      </div>
    </div>

    <RegionFormDrawer v-model:visible="drawerVisible" :mode="drawerMode" :region-id="drawerRegionId" @saved="fetchData" />
  </div>
</template>

<style scoped>
.region-page { padding: 4px 0; }

/* ── 页面标题（Dashboard 同款） ── */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 28px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e8ecf1;
}
.header-left h2 {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.4px;
}
.header-sub {
  font-size: 14px;
  color: #94a3b8;
  margin-top: 4px;
}

/* ── 搜索栏 ── */
.search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
}
.create-btn { margin-left: auto; }

/* ── 统计条 ── */
.stat-bar {
  display: flex;
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 12px;
  margin-bottom: 32px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02);
}
.sb-accent {
  width: 4px;
  flex-shrink: 0;
  background: linear-gradient(180deg, #2563eb, #3b82f6);
}
.sb-inner {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 24px 0;
}
.sb-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}
.sb-num {
  font-size: 36px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -1px;
  font-variant-numeric: tabular-nums;
  color: #0f172a;
  z-index: 1;
}
.sb-num.on  { color: #16a34a; }
.sb-num.off { color: #94a3b8; }
.sb-label {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
  z-index: 1;
}
.sb-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot-on  { background: #16a34a; }
.dot-off { background: #cbd5e1; }
.sb-icon {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-80px, -50%);
  opacity: 0.12;
  color: #94a3b8;
  z-index: 0;
  pointer-events: none;
  display: flex;
}
.sb-icon.on  { color: #16a34a; }
.sb-icon.off { color: #94a3b8; }
.sb-div {
  width: 1px;
  height: 40px;
  background: #e8ecf1;
  flex-shrink: 0;
}

/* ── 卡片网格 ── */
.region-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  min-height: 120px;
}

.region-card {
  position: relative;
  display: flex;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  box-shadow:
    0 1px 2px rgba(0,0,0,0.02),
    0 3px 8px rgba(0,0,0,0.03);
}
.region-card:hover {
  transform: translateY(-3px);
  border-color: #cbd5e1;
  box-shadow:
    0 1px 2px rgba(0,0,0,0.03),
    0 12px 28px rgba(0,0,0,0.08);
}
.region-card.is-disabled { opacity: 0.5; }
.region-card.is-disabled:hover { opacity: 0.65; }

/* 光效 */
.card-glow {
  position: absolute;
  top: -40px;
  right: -40px;
  width: 130px;
  height: 130px;
  border-radius: 50%;
  pointer-events: none;
  opacity: 0.06;
  filter: blur(24px);
}
.glow-active   { background: #16a34a; }
.glow-inactive { background: #94a3b8; }

/* 左侧竖条 */
.card-accent {
  width: 5px;
  flex-shrink: 0;
  z-index: 1;
}
.accent-on  { background: linear-gradient(180deg, #16a34a, #22c55e); }
.accent-off { background: #cbd5e1; }

.card-inner {
  flex: 1;
  padding: 28px 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  z-index: 1;
}

/* 标题 + 徽章 */
.card-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
}
.card-title-wrap { min-width: 0; }
.card-name {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.3px;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.card-code {
  font-size: 12px;
  font-weight: 500;
  color: #94a3b8;
  margin: 4px 0 0;
}
.card-badge {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  padding: 4px 10px;
  border-radius: 6px;
  flex-shrink: 0;
}
.badge-default { background: #fef3c7; color: #a16207; }
.badge-normal  { background: #e8ecf1; color: #64748b; }

/* 信息行 */
.card-meta {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #64748b;
}
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot-on  { background: #16a34a; }
.dot-off { background: #cbd5e1; }

/* 操作 */
.card-actions {
  display: flex;
  gap: 6px;
  padding-top: 16px;
  border-top: 1px solid #e8ecf1;
}
.act-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: none;
  background: none;
  font-size: 13px;
  font-weight: 500;
  padding: 7px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
  font-family: inherit;
  color: #475569;
}
.act-btn:hover { background: #e8ecf1; color: #0f172a; }
.act-btn.act-edit { color: #409eff; }
.act-btn.act-edit:hover { background: rgba(64,158,255,0.08); color: #2979d1; }
.act-btn.act-del { color: #dc2626; }
.act-btn.act-del:hover { background: #fef2f2; color: #b91c1c; }

/* ── 空状态 ── */
.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 72px 0;
}
.empty-icon { color: #cbd5e1; margin-bottom: 20px; }
.empty-title { font-size: 17px; font-weight: 600; color: #475569; margin: 0 0 6px; }
.empty-desc { font-size: 14px; color: #94a3b8; margin: 0 0 24px; }
</style>
