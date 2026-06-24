<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getWorkOrderList, rejectWorkOrder, getWorkOrderLogs } from '@/api/work-orders'
import { WO_STATUS_LABEL, WO_STATUS_TAG, PRIORITY_LABEL, PRIORITY_TAG } from '@/types/work-order'
import type { WorkOrderItem, WorkOrderStatus } from '@/types/work-order'

const searchForm = reactive({ keyword: '', status: '', priority: '' })
const loading = ref(false)
const listData = ref<WorkOrderItem[]>([])
const pagination = reactive({ current: 1, size: 20, total: 0 })

const selected = ref<WorkOrderItem | null>(null)
const detailLoading = ref(false)
const logs = ref<any[]>([])
const acting = ref(false)

const pendingCount = computed(() => listData.value.filter((r) => r.status === 'PENDING').length)
const inWorkCount = computed(() => listData.value.filter((r) => r.status === 'IN_WORK').length)
const resolvedCount = computed(() => listData.value.filter((r) => r.status === 'RESOLVED').length)

async function fetchData() {
  loading.value = true
  try {
    const res = await getWorkOrderList({
      page: pagination.current,
      size: pagination.size,
      status: searchForm.status || undefined,
      priority: searchForm.priority || undefined,
    })
    let records = res.data.records
    if (searchForm.keyword) {
      const kw = searchForm.keyword.toLowerCase()
      records = records.filter((r) => r.title.toLowerCase().includes(kw))
    }
    listData.value = records
    pagination.total = res.data.total
    if (selected.value && !records.find((r) => r.id === selected.value!.id)) selected.value = null
  } catch { listData.value = [] }
  finally { loading.value = false }
}

async function selectItem(item: WorkOrderItem) {
  selected.value = item
  detailLoading.value = true
  try { logs.value = (await getWorkOrderLogs(item.id)).data }
  catch { logs.value = [] }
  finally { detailLoading.value = false }
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
function handleReset() { searchForm.keyword = ''; searchForm.status = ''; searchForm.priority = ''; pagination.current = 1; fetchData() }
function handlePageChange(p: number) { pagination.current = p; fetchData() }
function formatTime(iso: string) { return iso ? iso.slice(0, 16).replace('T', ' ') : '-' }
function statusColor(s: string) { if (s === 'PENDING') return '#d97706'; if (s === 'IN_WORK') return '#2563eb'; if (s === 'RESOLVED') return '#16a34a'; return '#94a3b8' }

const logActionLabel: Record<string, string> = {
  CREATE: '提交报修', CLAIM: '受理', RESOLVE: '提交结果', CONFIRM: '确认结单', REJECT: '驳回',
}

onMounted(() => { fetchData() })
</script>

<template>
  <div class="ticket-layout">
    <div class="ticket-left">
      <div class="ticket-stats">
        <span class="stat-item pending">{{ pendingCount }}<em>待受理</em></span>
        <span class="stat-item inwork">{{ inWorkCount }}<em>处理中</em></span>
        <span class="stat-item resolved">{{ resolvedCount }}<em>已解决</em></span>
      </div>

      <div class="ticket-search">
        <el-input v-model="searchForm.keyword" placeholder="搜索标题" clearable size="small" @keyup.enter="handleSearch" />
        <el-select v-model="searchForm.status" size="small" style="width: 100px" placeholder="状态" clearable @change="handleSearch">
          <el-option label="待受理" value="PENDING" />
          <el-option label="处理中" value="IN_WORK" />
          <el-option label="已解决" value="RESOLVED" />
          <el-option label="已结单" value="CLOSED" />
        </el-select>
      </div>

      <div class="ticket-list" v-loading="loading">
        <div v-for="item in listData" :key="item.id" class="ticket-item" :class="{ active: selected?.id === item.id }" @click="selectItem(item)">
          <div class="item-left-bar" :style="{ background: statusColor(item.status) }"></div>
          <div class="item-body">
            <div class="item-title">{{ item.title }}</div>
            <div class="item-meta">
              <span>{{ item.reporterName }}</span>
              <span>·</span>
              <span>{{ item.engineerName || '未分配' }}</span>
              <span>·</span>
              <span>{{ formatTime(item.createdAt) }}</span>
            </div>
          </div>
          <div class="item-tags">
            <el-tag :type="WO_STATUS_TAG[item.status as WorkOrderStatus] || ''" size="small">
              {{ WO_STATUS_LABEL[item.status as WorkOrderStatus] || item.status }}
            </el-tag>
          </div>
        </div>
        <el-empty v-if="!loading && listData.length === 0" description="暂无工单" :image-size="80" />
      </div>

      <div class="ticket-pagination" v-if="pagination.total > 0">
        <el-pagination v-model:current-page="pagination.current" :page-size="pagination.size" :total="pagination.total" layout="prev, pager, next" small @current-change="handlePageChange" />
      </div>
    </div>

    <div class="ticket-right">
      <template v-if="selected">
        <div class="detail-inner" v-loading="detailLoading">
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

          <div class="detail-section">
            <div class="section-label">人员信息</div>
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="提交人">{{ selected.reporterName }}</el-descriptions-item>
              <el-descriptions-item label="工程师">{{ selected.engineerName || '未分配' }}</el-descriptions-item>
              <el-descriptions-item label="提交时间">{{ formatTime(selected.createdAt) }}</el-descriptions-item>
              <el-descriptions-item label="更新时间">{{ formatTime(selected.updatedAt) }}</el-descriptions-item>
            </el-descriptions>
          </div>

          <div class="detail-section">
            <div class="section-label">问题描述</div>
            <div class="detail-text">{{ selected.description || '无详细描述' }}</div>
          </div>

          <div v-if="selected.resolution" class="detail-section">
            <div class="section-label">处理结果</div>
            <div class="detail-text">{{ selected.resolution }}</div>
          </div>

          <div v-if="logs.length > 0" class="detail-section">
            <div class="section-label">流转日志</div>
            <el-timeline>
              <el-timeline-item v-for="log in logs" :key="log.id" :timestamp="formatTime(log.createdAt)" placement="top">
                <span class="log-action">{{ logActionLabel[log.action] || log.action }}</span>
                <span v-if="log.remark" class="log-remark"> — {{ log.remark }}</span>
              </el-timeline-item>
            </el-timeline>
          </div>

          <div v-if="selected.status === 'PENDING'" class="detail-actions">
            <el-button type="danger" :loading="acting" @click="handleReject">驳回工单</el-button>
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
.ticket-layout { display: flex; height: calc(100vh - 56px - 48px - 40px); background: #fff; border-radius: 8px; overflow: hidden; }
.ticket-left { width: 40%; min-width: 360px; flex-shrink: 0; border-right: 1px solid #e2e8f0; display: flex; flex-direction: column; }
.ticket-stats { display: flex; gap: 0; padding: 16px; border-bottom: 1px solid #f1f5f9; }
.stat-item { flex: 1; text-align: center; font-size: 22px; font-weight: 700; padding: 10px 0; border-radius: 6px; line-height: 1.2; }
.stat-item em { display: block; font-style: normal; font-size: 11px; font-weight: 500; margin-top: 2px; }
.stat-item.pending { color: #d97706; background: #fffbeb; margin-right: 6px; }
.stat-item.inwork { color: #2563eb; background: #eff6ff; margin-right: 6px; }
.stat-item.resolved { color: #16a34a; background: #f0fdf4; }
.ticket-search { display: flex; gap: 8px; padding: 12px 16px; border-bottom: 1px solid #f1f5f9; }
.ticket-search :deep(.el-input__wrapper) { background: #f8fafc; }
.ticket-list { flex: 1; overflow-y: auto; }
.ticket-item { display: flex; align-items: center; padding: 12px 16px 12px 0; cursor: pointer; border-bottom: 1px solid #f8fafc; transition: background 0.1s; }
.ticket-item:hover { background: #f8fafc; }
.ticket-item.active { background: #eff6ff; }
.item-left-bar { width: 3px; height: 36px; border-radius: 0 2px 2px 0; margin-right: 12px; flex-shrink: 0; }
.item-body { flex: 1; min-width: 0; }
.item-title { font-size: 14px; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
.item-meta { font-size: 12px; color: #94a3b8; display: flex; gap: 6px; }
.item-tags { flex-shrink: 0; margin-left: 8px; }
.ticket-pagination { padding: 12px 16px; border-top: 1px solid #f1f5f9; display: flex; justify-content: center; }
.ticket-right { flex: 1; overflow-y: auto; }
.detail-inner { padding: 32px; max-width: 720px; }
.detail-header { margin-bottom: 24px; }
.detail-badges { display: flex; gap: 8px; margin-bottom: 12px; }
.detail-title { font-size: 20px; font-weight: 600; color: #0f172a; line-height: 1.4; }
.detail-section { margin-bottom: 24px; }
.section-label { font-size: 12px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
.detail-text { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; font-size: 14px; color: #334155; line-height: 1.7; white-space: pre-wrap; }
.log-action { font-weight: 500; color: #1e293b; }
.log-remark { color: #94a3b8; }
.detail-actions { margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; }
.detail-empty { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; font-size: 14px; gap: 12px; }
</style>
