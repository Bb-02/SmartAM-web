<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getWorkOrderList, claimWorkOrder, resolveWorkOrder, rejectWorkOrder, getWorkOrderLogs } from '@/api/work-orders'
import { useAuthStore } from '@/stores/auth'
import { WO_STATUS_LABEL, WO_STATUS_TAG, PRIORITY_LABEL, PRIORITY_TAG } from '@/types/work-order'
import type { WorkOrderItem, WorkOrderStatus } from '@/types/work-order'

const authStore = useAuthStore()
const userId = computed(() => authStore.userId)

const searchForm = reactive({ keyword: '', priority: '' })
const loading = ref(false)
const listData = ref<WorkOrderItem[]>([])
const pagination = reactive({ current: 1, size: 20, total: 0 })

const selected = ref<WorkOrderItem | null>(null)
const detailLoading = ref(false)
const logs = ref<any[]>([])
const acting = ref(false)

const urgentCount = computed(() => listData.value.filter((r) => r.priority === 'URGENT').length)
const highCount = computed(() => listData.value.filter((r) => r.priority === 'HIGH').length)
const normalCount = computed(() => listData.value.filter((r) => r.priority === 'NORMAL' || r.priority === 'LOW').length)

async function fetchData() {
  loading.value = true
  try {
    const res = await getWorkOrderList({
      page: pagination.current,
      size: pagination.size,
      status: 'PENDING',
      priority: searchForm.priority || undefined,
    })
    let records = res.data.records
    if (searchForm.keyword) {
      const kw = searchForm.keyword.toLowerCase()
      records = records.filter((r) => r.title.toLowerCase().includes(kw))
    }
    listData.value = records
    pagination.total = res.data.total

    if (selected.value && !records.find((r) => r.id === selected.value!.id)) {
      selected.value = null
    }
  } catch { listData.value = [] }
  finally { loading.value = false }
}

async function selectItem(item: WorkOrderItem) {
  selected.value = item
  detailLoading.value = true
  try {
    logs.value = (await getWorkOrderLogs(item.id)).data
  } catch { logs.value = [] }
  finally { detailLoading.value = false }
}

async function handleClaim() {
  if (!selected.value) return
  try { await ElMessageBox.confirm('确定受理此工单？', '确认接单', { type: 'info' }) }
  catch { return }
  acting.value = true
  try {
    await claimWorkOrder(selected.value.id)
    ElMessage.success('接单成功')
    selected.value = null
    fetchData()
  } catch { /* toast */ }
  finally { acting.value = false }
}

async function handleResolve() {
  let resolution = ''
  try {
    const { value } = await ElMessageBox.prompt('请输入处理结果', '提交结果', {
      type: 'info', inputType: 'textarea',
      inputPlaceholder: '描述处理过程和结果...',
      inputValidator: (v: string) => v.trim() ? true : '处理结果不能为空',
    })
    resolution = value || ''
  } catch { return }
  acting.value = true
  try {
    await resolveWorkOrder(selected.value!.id, resolution)
    ElMessage.success('结果已提交')
    selected.value = null
    fetchData()
  } catch { /* toast */ }
  finally { acting.value = false }
}

async function handleReject() {
  let remark = ''
  try {
    const { value } = await ElMessageBox.prompt('请输入驳回原因', '驳回工单', {
      type: 'warning', inputPlaceholder: '如：信息不完整',
      inputValidator: (v: string) => v.trim() ? true : '驳回原因不能为空',
    })
    remark = value || ''
  } catch { return }
  acting.value = true
  try {
    await rejectWorkOrder(selected.value!.id, remark)
    ElMessage.success('已驳回')
    selected.value = null
    fetchData()
  } catch { /* toast */ }
  finally { acting.value = false }
}

function handleSearch() { pagination.current = 1; fetchData() }
function handleReset() {
  searchForm.keyword = ''; searchForm.priority = ''
  pagination.current = 1; fetchData()
}
function handlePageChange(p: number) { pagination.current = p; fetchData() }

function formatTime(iso: string) { return iso ? iso.slice(0, 16).replace('T', ' ') : '-' }

function priorityColor(p: string) {
  if (p === 'URGENT') return '#dc2626'
  if (p === 'HIGH') return '#d97706'
  return '#64748b'
}

const logActionLabel: Record<string, string> = {
  CREATE: '提交报修', CLAIM: '受理', RESOLVE: '提交结果',
  CONFIRM: '确认结单', REJECT: '驳回',
}

onMounted(() => { fetchData() })
</script>

<template>
  <div class="pool-layout">
    <!-- 左侧列表 -->
    <div class="pool-left">
      <!-- 统计 -->
      <div class="pool-stats">
        <span class="stat-item urgent">{{ urgentCount }}<em>紧急</em></span>
        <span class="stat-item high">{{ highCount }}<em>高优先</em></span>
        <span class="stat-item normal">{{ normalCount }}<em>普通</em></span>
      </div>

      <!-- 搜索 -->
      <div class="pool-search">
        <el-input v-model="searchForm.keyword" placeholder="搜索标题" clearable size="small" @keyup.enter="handleSearch" />
        <el-select v-model="searchForm.priority" size="small" style="width: 90px" placeholder="优先级" clearable @change="handleSearch">
          <el-option label="紧急" value="URGENT" />
          <el-option label="高" value="HIGH" />
          <el-option label="普通" value="NORMAL" />
          <el-option label="低" value="LOW" />
        </el-select>
      </div>

      <!-- 列表 -->
      <div class="pool-list" v-loading="loading">
        <div
          v-for="item in listData"
          :key="item.id"
          class="pool-item"
          :class="{ active: selected?.id === item.id }"
          @click="selectItem(item)"
        >
          <div class="item-left-bar" :style="{ background: priorityColor(item.priority) }"></div>
          <div class="item-body">
            <div class="item-title">{{ item.title }}</div>
            <div class="item-meta">
              <span>{{ item.reporterName }}</span>
              <span>·</span>
              <span>{{ formatTime(item.createdAt) }}</span>
            </div>
          </div>
          <el-tag
            :type="PRIORITY_TAG[item.priority] || ''"
            size="small"
            class="item-tag"
          >
            {{ PRIORITY_LABEL[item.priority] || item.priority }}
          </el-tag>
        </div>

        <el-empty v-if="!loading && listData.length === 0" description="暂无待受理工单" :image-size="80" />
      </div>

      <!-- 分页 -->
      <div class="pool-pagination" v-if="pagination.total > 0">
        <el-pagination
          v-model:current-page="pagination.current"
          :page-size="pagination.size"
          :total="pagination.total"
          layout="prev, pager, next"
          small
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 右侧详情 -->
    <div class="pool-right">
      <template v-if="selected">
        <div class="detail-inner" v-loading="detailLoading">
          <!-- 头部 -->
          <div class="detail-header">
            <div class="detail-badges">
              <el-tag :type="WO_STATUS_TAG[selected.status as WorkOrderStatus] || ''">
                {{ WO_STATUS_LABEL[selected.status as WorkOrderStatus] || selected.status }}
              </el-tag>
              <el-tag :type="PRIORITY_TAG[selected.priority] || ''">
                {{ PRIORITY_LABEL[selected.priority] || selected.priority }}优先级
              </el-tag>
            </div>
            <h2 class="detail-title">{{ selected.title }}</h2>
          </div>

          <!-- 人员 -->
          <div class="detail-section">
            <div class="section-label">人员信息</div>
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="提交人">{{ selected.reporterName }}</el-descriptions-item>
              <el-descriptions-item label="工程师">{{ selected.engineerName || '未分配' }}</el-descriptions-item>
              <el-descriptions-item label="提交时间">{{ formatTime(selected.createdAt) }}</el-descriptions-item>
              <el-descriptions-item label="更新时间">{{ formatTime(selected.updatedAt) }}</el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- 描述 -->
          <div class="detail-section">
            <div class="section-label">问题描述</div>
            <div class="detail-text">{{ selected.description || '无详细描述' }}</div>
          </div>

          <!-- 处理结果 -->
          <div v-if="selected.resolution" class="detail-section">
            <div class="section-label">处理结果</div>
            <div class="detail-text">{{ selected.resolution }}</div>
          </div>

          <!-- 日志 -->
          <div v-if="logs.length > 0" class="detail-section">
            <div class="section-label">流转日志</div>
            <el-timeline>
              <el-timeline-item
                v-for="log in logs"
                :key="log.id"
                :timestamp="formatTime(log.createdAt)"
                placement="top"
              >
                <span class="log-action">{{ logActionLabel[log.action] || log.action }}</span>
                <span v-if="log.remark" class="log-remark"> — {{ log.remark }}</span>
              </el-timeline-item>
            </el-timeline>
          </div>

          <!-- 操作 -->
          <div class="detail-actions">
            <el-button type="primary" :loading="acting" @click="handleClaim">接单</el-button>
            <el-button type="danger" :loading="acting" @click="handleReject">驳回</el-button>
          </div>
        </div>
      </template>
      <div v-else class="detail-empty">
        <el-icon :size="48" color="#cbd5e1"><List /></el-icon>
        <p>选择左侧工单查看详情</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pool-layout {
  display: flex;
  height: calc(100vh - 56px - 48px - 40px);
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

/* ===== 左侧 ===== */
.pool-left {
  width: 40%;
  min-width: 340px;
  flex-shrink: 0;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
}

.pool-stats {
  display: flex;
  gap: 0;
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
}
.stat-item {
  flex: 1;
  text-align: center;
  font-size: 22px;
  font-weight: 700;
  padding: 10px 0;
  border-radius: 6px;
  line-height: 1.2;
}
.stat-item em {
  display: block;
  font-style: normal;
  font-size: 11px;
  font-weight: 500;
  margin-top: 2px;
}
.stat-item.urgent { color: #dc2626; background: #fef2f2; margin-right: 6px; }
.stat-item.high { color: #d97706; background: #fffbeb; margin-right: 6px; }
.stat-item.normal { color: #0284c7; background: #f0f9ff; }

.pool-search {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
}
.pool-search :deep(.el-input__wrapper) { background: #f8fafc; }

.pool-list {
  flex: 1;
  overflow-y: auto;
}

.pool-item {
  display: flex;
  align-items: center;
  padding: 12px 16px 12px 0;
  cursor: pointer;
  border-bottom: 1px solid #f8fafc;
  transition: background 0.1s;
}
.pool-item:hover { background: #f8fafc; }
.pool-item.active { background: #eff6ff; }

.item-left-bar {
  width: 3px;
  height: 36px;
  border-radius: 0 2px 2px 0;
  margin-right: 12px;
  flex-shrink: 0;
}

.item-body { flex: 1; min-width: 0; }
.item-title {
  font-size: 14px;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}
.item-meta {
  font-size: 12px;
  color: #94a3b8;
  display: flex;
  gap: 6px;
}
.item-tag { flex-shrink: 0; margin-left: 8px; }

.pool-pagination {
  padding: 12px 16px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: center;
}

/* ===== 右侧 ===== */
.pool-right {
  flex: 1;
  overflow-y: auto;
}

.detail-inner {
  padding: 32px;
  max-width: 720px;
}

.detail-header { margin-bottom: 24px; }
.detail-badges { display: flex; gap: 8px; margin-bottom: 12px; }
.detail-title { font-size: 20px; font-weight: 600; color: #0f172a; line-height: 1.4; }

.detail-section { margin-bottom: 24px; }
.section-label {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
}
.detail-text {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 14px 16px;
  font-size: 14px;
  color: #334155;
  line-height: 1.7;
  white-space: pre-wrap;
}
.log-action { font-weight: 500; color: #1e293b; }
.log-remark { color: #94a3b8; }

.detail-actions {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  gap: 12px;
}

.detail-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 14px;
  gap: 12px;
}
</style>
