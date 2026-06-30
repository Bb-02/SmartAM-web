<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getApplicationList, cancelApplication, updateApplication } from '@/api/asset-applications'
import type { AssetApplicationItem } from '@/types/asset-application'

const loading = ref(false)
const listData = ref<AssetApplicationItem[]>([])
const pagination = reactive({ current: 1, size: 20, total: 0 })
const statusFilter = ref('')

const typeLabel: Record<string, string> = { APPLY: '申领', SCRAP: '报废', TRANSFER: '转移' }
const typeColor: Record<string, string> = { APPLY: '#2563eb', SCRAP: '#d97706', TRANSFER: '#7c3aed' }
const statusLabel: Record<string, string> = { PENDING: '待审批', APPROVED: '已通过', REJECTED: '已拒绝', CANCELLED: '已取消' }
const statusColor: Record<string, string> = { PENDING: '#d97706', APPROVED: '#16a34a', REJECTED: '#dc2626', CANCELLED: '#94a3b8' }

// 详情弹窗
const detailVisible = ref(false)
const detailItem = ref<AssetApplicationItem | null>(null)

// 编辑状态
const editing = ref(false)
const editForm = reactive({ reason: '' })

async function fetchData() {
  loading.value = true
  try {
    const params: any = { page: pagination.current, size: pagination.size }
    if (statusFilter.value) params.status = statusFilter.value
    const res = await getApplicationList(params)
    listData.value = res.data.records
    pagination.total = res.data.total
  } catch { listData.value = [] }
  finally { loading.value = false }
}

function openDetail(row: AssetApplicationItem) {
  detailItem.value = row
  detailVisible.value = true
  editing.value = false
}

function startEdit() {
  if (!detailItem.value) return
  editForm.reason = detailItem.value.reason
  editing.value = true
}

function cancelEdit() {
  editing.value = false
}

async function handleSaveEdit() {
  if (!detailItem.value) return
  try {
    await updateApplication(detailItem.value.id, { reason: editForm.reason || undefined })
    ElMessage.success('修改成功')
    detailItem.value.reason = editForm.reason
    editing.value = false
  } catch { /* toast */ }
}

async function handleCancel(row: AssetApplicationItem) {
  try {
    await ElMessageBox.confirm('确定取消该申领吗？', '取消申领', { type: 'warning' })
    await cancelApplication(row.id)
    ElMessage.success('已取消')
    fetchData()
  } catch { /* cancel */ }
}

function handlePageChange(p: number) { pagination.current = p; fetchData() }
function formatTime(iso: string) { return iso ? iso.slice(0, 16).replace('T', ' ') : '-' }

onMounted(() => { fetchData() })
</script>

<template>
  <div class="my-applies-page">
    <div class="page-header">
      <div class="header-left">
        <h2>我的申领</h2>
        <span class="header-count">{{ pagination.total }} 条记录</span>
      </div>
    </div>

    <!-- 状态筛选 -->
    <div class="filter-bar">
      <el-radio-group v-model="statusFilter" @change="pagination.current = 1; fetchData()" size="small">
        <el-radio-button value="">全部</el-radio-button>
        <el-radio-button value="PENDING">待审批</el-radio-button>
        <el-radio-button value="APPROVED">已通过</el-radio-button>
        <el-radio-button value="REJECTED">已拒绝</el-radio-button>
        <el-radio-button value="CANCELLED">已取消</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 列表 -->
    <div class="app-list" v-loading="loading">
      <template v-if="listData.length > 0">
        <div v-for="row in listData" :key="row.id" class="app-card" @click="openDetail(row)">
          <div class="card-left">
            <span class="type-badge" :style="{ background: typeColor[row.type] || '#64748b' }">
              {{ typeLabel[row.type] || row.type }}
            </span>
          </div>
          <div class="card-body">
            <div class="card-title">{{ row.assetName || '未知资产' }}</div>
            <div class="card-meta">
              <span>{{ formatTime(row.createdAt) }}</span>
            </div>
          </div>
          <div class="card-right">
            <span class="status-tag" :style="{ background: (statusColor[row.status] || '#94a3b8') + '18', color: statusColor[row.status] || '#94a3b8' }">
              {{ statusLabel[row.status] || row.status }}
            </span>
            <el-button
              v-if="row.status === 'PENDING'"
              size="small"
              type="danger"
              text
              @click.stop="handleCancel(row)"
            >取消</el-button>
          </div>
        </div>
      </template>
      <el-empty v-else description="暂无申领记录" :image-size="80" />
    </div>

    <div class="app-pagination" v-if="pagination.total > 0">
      <el-pagination v-model:current-page="pagination.current" :page-size="pagination.size" :total="pagination.total" layout="prev, pager, next" small @current-change="handlePageChange" />
    </div>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" title="申领详情" width="520px" :close-on-click-modal="true" @close="editing = false">
      <template v-if="detailItem">
        <div class="detail-type">
          <span class="dt-type" :style="{ background: (typeColor[detailItem.type] || '#64748b') + '18', color: typeColor[detailItem.type] || '#64748b' }">
            {{ typeLabel[detailItem.type] || detailItem.type }}
          </span>
          <span class="dt-status" :style="{ color: statusColor[detailItem.status] || '#94a3b8' }">
            {{ statusLabel[detailItem.status] || detailItem.status }}
          </span>
        </div>
        <h3 class="dt-asset">{{ detailItem.assetName || '未知资产' }}</h3>

        <!-- 非编辑模式 -->
        <template v-if="!editing">
          <div class="dt-section">
            <div class="dt-label">申领原因</div>
            <div class="dt-value">{{ detailItem.reason || '无' }}</div>
          </div>
          <div class="dt-meta">
            <span>提交时间：{{ formatTime(detailItem.createdAt) }}</span>
            <span v-if="detailItem.approverName">审批人：{{ detailItem.approverName }}</span>
            <span v-if="detailItem.remark">备注：{{ detailItem.remark }}</span>
          </div>
        </template>

        <!-- 编辑模式（仅 PENDING） -->
        <template v-else>
          <el-form label-position="top">
            <el-form-item label="申领原因">
              <el-input v-model="editForm.reason" type="textarea" :rows="3" />
            </el-form-item>
          </el-form>
        </template>
      </template>

      <template #footer>
        <template v-if="detailItem?.status === 'PENDING'">
          <template v-if="!editing">
            <el-button @click="startEdit">编辑</el-button>
            <el-button type="danger" @click="detailVisible = false; handleCancel(detailItem!)">取消申领</el-button>
          </template>
          <template v-else>
            <el-button @click="cancelEdit">取消编辑</el-button>
            <el-button type="primary" @click="handleSaveEdit">保存修改</el-button>
          </template>
        </template>
        <el-button v-else @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.my-applies-page { padding: 4px 0; }

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e8ecf1;
}
.header-left { display: flex; align-items: baseline; gap: 14px; }
.header-left h2 { font-size: 22px; font-weight: 700; color: #0f172a; letter-spacing: -0.4px; }
.header-count { font-size: 14px; color: #94a3b8; }

.filter-bar { margin-bottom: 20px; }

.app-list { display: flex; flex-direction: column; gap: 8px; }
.app-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 10px;
  padding: 16px 20px;
  cursor: pointer;
  transition: background 0.12s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.02);
}
.app-card:hover { background: #f8fafc; }

.card-left { flex-shrink: 0; }
.type-badge {
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  padding: 4px 10px;
  border-radius: 4px;
  min-width: 44px;
  text-align: center;
}

.card-body { flex: 1; min-width: 0; }
.card-title { font-size: 15px; font-weight: 600; color: #1e293b; }
.card-meta { font-size: 12px; color: #94a3b8; margin-top: 3px; }

.card-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.status-tag {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 4px;
}

.app-pagination { display: flex; justify-content: center; margin-top: 24px; }

/* 详情 */
.detail-type { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.dt-type { font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 4px; }
.dt-status { font-size: 13px; font-weight: 600; }
.dt-asset { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 20px; }

.dt-section { margin-bottom: 16px; }
.dt-label { font-size: 12px; color: #94a3b8; margin-bottom: 4px; }
.dt-value { font-size: 14px; color: #334155; line-height: 1.6; }

.dt-meta { font-size: 13px; color: #94a3b8; display: flex; flex-direction: column; gap: 4px; }
</style>
