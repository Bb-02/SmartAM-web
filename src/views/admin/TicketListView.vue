<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getApplicationList, approveApplication, rejectApplication, getApplicationLogs } from '@/api/asset-applications'
import type { AssetApplicationItem } from '@/types/asset-application'

const searchForm = reactive({ status: '', type: '' })
const loading = ref(false)
const listData = ref<AssetApplicationItem[]>([])
const pagination = reactive({ current: 1, size: 20, total: 0 })

const selected = ref<AssetApplicationItem | null>(null)
const detailLoading = ref(false)
const logs = ref<any[]>([])
const acting = ref(false)

const pendingCount = computed(() => listData.value.filter((r) => r.status === 'PENDING').length)
const approvedCount = computed(() => listData.value.filter((r) => r.status === 'APPROVED').length)
const rejectedCount = computed(() => listData.value.filter((r) => r.status === 'REJECTED').length)

const typeLabel: Record<string, string> = { APPLY: '申领', SCRAP: '报废', TRANSFER: '转移' }
const typeColor: Record<string, string> = { APPLY: '#2563eb', SCRAP: '#d97706', TRANSFER: '#7c3aed' }
const statusLabel: Record<string, string> = { PENDING: '待审批', APPROVED: '已通过', REJECTED: '已拒绝', CANCELLED: '已取消' }
const statusColor: Record<string, string> = { PENDING: '#d97706', APPROVED: '#16a34a', REJECTED: '#dc2626', CANCELLED: '#94a3b8' }

async function fetchData() {
  loading.value = true
  try {
    const res = await getApplicationList({
      page: pagination.current,
      size: pagination.size,
      status: searchForm.status || undefined,
    })
    let records = res.data.records
    if (searchForm.type) {
      records = records.filter((r) => r.type === searchForm.type)
    }
    listData.value = records
    pagination.total = res.data.total
    if (selected.value && !records.find((r) => r.id === selected.value!.id)) selected.value = null
  } catch { listData.value = [] }
  finally { loading.value = false }
}

async function selectItem(item: AssetApplicationItem) {
  selected.value = item
  detailLoading.value = true
  try { logs.value = (await getApplicationLogs(item.id)).data }
  catch { logs.value = [] }
  finally { detailLoading.value = false }
}

async function handleApprove() {
  acting.value = true
  try {
    await approveApplication(selected.value!.id)
    ElMessage.success('已通过')
    selected.value = null
    fetchData()
  } catch { /* toast */ }
  finally { acting.value = false }
}

async function handleReject() {
  let remark = ''
  try {
    const { value } = await ElMessageBox.prompt('请输入拒绝原因', '拒绝申请', {
      type: 'warning', inputPlaceholder: '如：资产信息不符',
      inputValidator: (v: string) => v.trim() ? true : '拒绝原因不能为空',
    })
    remark = value || ''
  } catch { return }
  acting.value = true
  try {
    await rejectApplication(selected.value!.id, remark)
    ElMessage.success('已拒绝')
    selected.value = null
    fetchData()
  } catch { /* toast */ }
  finally { acting.value = false }
}

function handleSearch() { pagination.current = 1; fetchData() }
function handleReset() { searchForm.status = ''; searchForm.type = ''; pagination.current = 1; fetchData() }
function handlePageChange(p: number) { pagination.current = p; fetchData() }
function formatTime(iso: string) { return iso ? iso.slice(0, 16).replace('T', ' ') : '-' }

const logActionLabel: Record<string, string> = {
  CREATE: '提交申请', APPROVE: '审批通过', REJECT: '审批拒绝', CANCEL: '取消申请',
}

onMounted(() => { fetchData() })
</script>

<template>
  <div class="ticket-layout">
    <div class="ticket-left">
      <div class="ticket-stats">
        <span class="stat-item pending">{{ pendingCount }}<em>待审批</em></span>
        <span class="stat-item approved">{{ approvedCount }}<em>已通过</em></span>
        <span class="stat-item rejected">{{ rejectedCount }}<em>已拒绝</em></span>
      </div>

      <div class="ticket-search">
        <el-select v-model="searchForm.type" size="small" style="width: 90px" placeholder="类型" clearable @change="handleSearch">
          <el-option label="申领" value="APPLY" />
          <el-option label="报废" value="SCRAP" />
          <el-option label="转移" value="TRANSFER" />
        </el-select>
        <el-select v-model="searchForm.status" size="small" style="width: 100px" placeholder="状态" clearable @change="handleSearch">
          <el-option label="待审批" value="PENDING" />
          <el-option label="已通过" value="APPROVED" />
          <el-option label="已拒绝" value="REJECTED" />
          <el-option label="已取消" value="CANCELLED" />
        </el-select>
        <el-button size="small" text @click="handleReset">重置</el-button>
      </div>

      <div class="ticket-list" v-loading="loading">
        <div v-for="item in listData" :key="item.id" class="ticket-item" :class="{ active: selected?.id === item.id }" @click="selectItem(item)">
          <div class="item-left-bar" :style="{ background: typeColor[item.type] || '#94a3b8' }"></div>
          <div class="item-body">
            <div class="item-title">{{ item.assetName || '未知资产' }}</div>
            <div class="item-meta">
              <span>{{ item.applicantName }}</span>
              <span>·</span>
              <span>{{ typeLabel[item.type] || item.type }}</span>
              <span>·</span>
              <span>{{ formatTime(item.createdAt) }}</span>
            </div>
          </div>
          <div class="item-tags">
            <span class="status-dot" :style="{ background: statusColor[item.status] }"></span>
            <span class="status-text">{{ statusLabel[item.status] || item.status }}</span>
          </div>
        </div>
        <el-empty v-if="!loading && listData.length === 0" description="暂无申领记录" :image-size="80" />
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
              <span class="type-badge" :style="{ background: typeColor[selected.type] }">{{ typeLabel[selected.type] || selected.type }}</span>
              <span class="status-badge" :style="{ background: statusColor[selected.status] }">{{ statusLabel[selected.status] || selected.status }}</span>
            </div>
            <h2 class="detail-title">{{ selected.assetName || '未知资产' }}</h2>
          </div>

          <div class="detail-section">
            <div class="section-label">申请信息</div>
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="申请人">{{ selected.applicantName }}</el-descriptions-item>
              <el-descriptions-item label="申请类型">{{ typeLabel[selected.type] || selected.type }}</el-descriptions-item>
              <el-descriptions-item label="资产 ID">{{ selected.assetId }}</el-descriptions-item>
              <el-descriptions-item v-if="selected.quantity" label="申领数量">{{ selected.quantity }} 件</el-descriptions-item>
              <el-descriptions-item label="提交时间">{{ formatTime(selected.createdAt) }}</el-descriptions-item>
              <el-descriptions-item v-if="selected.approverName" label="审批人">{{ selected.approverName }}</el-descriptions-item>
              <el-descriptions-item v-if="selected.updatedAt !== selected.createdAt" label="处理时间">{{ formatTime(selected.updatedAt) }}</el-descriptions-item>
            </el-descriptions>
          </div>

          <div class="detail-section">
            <div class="section-label">申请原因</div>
            <div class="detail-text">{{ selected.reason || '无' }}</div>
          </div>

          <div v-if="selected.remark" class="detail-section">
            <div class="section-label">审批备注</div>
            <div class="detail-text">{{ selected.remark }}</div>
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
            <el-button type="success" :loading="acting" @click="handleApprove">通过</el-button>
            <el-button type="danger" :loading="acting" @click="handleReject">拒绝</el-button>
          </div>
        </div>
      </template>
      <div v-else class="detail-empty">
        <el-icon :size="48" color="#cbd5e1"><List /></el-icon>
        <p>选择左侧申领查看详情</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ticket-layout { display: flex; height: calc(100vh - 56px - 48px - 40px); background: #fff; border-radius: 8px; overflow: hidden; }
.ticket-left { width: 40%; min-width: 360px; flex-shrink: 0; border-right: 1px solid #e2e8f0; display: flex; flex-direction: column; }

/* 统计条 */
.ticket-stats { display: flex; gap: 0; padding: 16px; border-bottom: 1px solid #f1f5f9; }
.stat-item { flex: 1; text-align: center; font-size: 22px; font-weight: 700; padding: 10px 0; border-radius: 6px; line-height: 1.2; }
.stat-item em { display: block; font-style: normal; font-size: 11px; font-weight: 500; margin-top: 2px; }
.stat-item.pending { color: #d97706; background: #fffbeb; margin-right: 6px; }
.stat-item.approved { color: #16a34a; background: #f0fdf4; margin-right: 6px; }
.stat-item.rejected { color: #dc2626; background: #fef2f2; }

/* 搜索 */
.ticket-search { display: flex; gap: 8px; padding: 12px 16px; border-bottom: 1px solid #f1f5f9; }

/* 列表 */
.ticket-list { flex: 1; overflow-y: auto; }
.ticket-item { display: flex; align-items: center; padding: 12px 16px 12px 0; cursor: pointer; border-bottom: 1px solid #f8fafc; transition: background 0.1s; }
.ticket-item:hover { background: #f8fafc; }
.ticket-item.active { background: #eff6ff; }
.item-left-bar { width: 3px; height: 36px; border-radius: 0 2px 2px 0; margin-right: 12px; flex-shrink: 0; }
.item-body { flex: 1; min-width: 0; }
.item-title { font-size: 14px; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
.item-meta { font-size: 12px; color: #94a3b8; display: flex; gap: 6px; }

.item-tags { display: flex; align-items: center; gap: 6px; flex-shrink: 0; margin-left: 8px; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; }
.status-text { font-size: 12px; color: #64748b; }

.ticket-pagination { padding: 12px 16px; border-top: 1px solid #f1f5f9; display: flex; justify-content: center; }

/* 详情 */
.ticket-right { flex: 1; overflow-y: auto; }
.detail-inner { padding: 32px; max-width: 720px; }
.detail-header { margin-bottom: 24px; }
.detail-badges { display: flex; gap: 8px; margin-bottom: 12px; }
.type-badge { font-size: 12px; font-weight: 600; color: #fff; padding: 4px 12px; border-radius: 4px; }
.status-badge { font-size: 12px; font-weight: 600; color: #fff; padding: 4px 12px; border-radius: 4px; }
.detail-title { font-size: 20px; font-weight: 600; color: #0f172a; line-height: 1.4; }
.detail-section { margin-bottom: 24px; }
.section-label { font-size: 12px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
.detail-text { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; font-size: 14px; color: #334155; line-height: 1.7; white-space: pre-wrap; }
.log-action { font-weight: 500; color: #1e293b; }
.log-remark { color: #94a3b8; }
.detail-actions { margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; display: flex; gap: 12px; }
.detail-empty { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; font-size: 14px; gap: 12px; }
</style>
