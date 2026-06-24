<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getWorkOrderDetail, claimWorkOrder, resolveWorkOrder, rejectWorkOrder, confirmWorkOrder, getWorkOrderLogs } from '@/api/work-orders'
import { useAuthStore } from '@/stores/auth'
import { WO_STATUS_LABEL, WO_STATUS_TAG, PRIORITY_LABEL, PRIORITY_TAG } from '@/types/work-order'
import type { WorkOrderItem, WorkOrderStatus } from '@/types/work-order'

const props = defineProps<{
  visible: boolean
  workOrderId: number
}>()

const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void
  (e: 'action-done'): void
}>()

const authStore = useAuthStore()
const role = computed(() => authStore.role)
const userId = computed(() => authStore.userId)

const loading = ref(false)
const acting = ref(false)
const data = ref<WorkOrderItem | null>(null)
const logs = ref<any[]>([])

watch(() => props.visible, async (v) => {
  if (!v || !props.workOrderId) return
  loading.value = true
  try {
    const [detailRes, logsRes] = await Promise.all([
      getWorkOrderDetail(props.workOrderId),
      getWorkOrderLogs(props.workOrderId),
    ])
    data.value = detailRes.data
    logs.value = logsRes.data
  } catch { data.value = null; logs.value = [] }
  finally { loading.value = false }
})

const canClaim = computed(() =>
  role.value === 'ENGINEER' && data.value?.status === 'PENDING'
)
const canResolve = computed(() =>
  role.value === 'ENGINEER' && data.value?.status === 'IN_WORK' && data.value?.engineerId === userId.value
)
const canReject = computed(() =>
  (role.value === 'ADMIN_TENANT' || role.value === 'ADMIN_REGION') && data.value?.status === 'PENDING'
)
const canConfirm = computed(() =>
  role.value === 'EMPLOYEE' && data.value?.status === 'RESOLVED' && data.value?.reporterId === userId.value
)
const canRejectResolved = computed(() =>
  role.value === 'EMPLOYEE' && data.value?.status === 'RESOLVED' && data.value?.reporterId === userId.value
)

async function handleClaim() {
  if (!data.value) return
  try { await ElMessageBox.confirm('确定受理此工单？', '确认接单', { type: 'info' }) }
  catch { return }
  acting.value = true
  try {
    await claimWorkOrder(data.value.id)
    ElMessage.success('接单成功')
    emit('action-done')
    emit('update:visible', false)
  } catch { /* toast */ }
  finally { acting.value = false }
}

async function handleResolve() {
  let resolution = ''
  try {
    const { value } = await ElMessageBox.prompt('请输入处理结果', '提交结果', {
      type: 'info',
      inputType: 'textarea',
      inputPlaceholder: '描述处理过程和结果...',
      inputValidator: (v: string) => v.trim() ? true : '处理结果不能为空',
    })
    resolution = value || ''
  } catch { return }
  acting.value = true
  try {
    await resolveWorkOrder(data.value!.id, resolution)
    ElMessage.success('结果已提交')
    emit('action-done')
    emit('update:visible', false)
  } catch { /* toast */ }
  finally { acting.value = false }
}

async function handleReject() {
  let remark = ''
  try {
    const { value } = await ElMessageBox.prompt('请输入驳回原因', '驳回工单', {
      type: 'warning',
      inputPlaceholder: '如：信息不完整',
      inputValidator: (v: string) => v.trim() ? true : '驳回原因不能为空',
    })
    remark = value || ''
  } catch { return }
  acting.value = true
  try {
    await rejectWorkOrder(data.value!.id, remark)
    ElMessage.success('已驳回')
    emit('action-done')
    emit('update:visible', false)
  } catch { /* toast */ }
  finally { acting.value = false }
}

async function handleConfirm() {
  let rating = 5
  try {
    const { value } = await ElMessageBox.prompt('请评分（1-5）', '确认结单', {
      type: 'info',
      inputPlaceholder: '5',
      inputValue: '5',
      inputValidator: (v: string) => {
        const n = Number(v)
        return n >= 1 && n <= 5 ? true : '请输入 1-5 的评分'
      },
    })
    rating = Number(value)
  } catch { return }
  acting.value = true
  try {
    await confirmWorkOrder(data.value!.id, rating)
    ElMessage.success('已结单')
    emit('action-done')
    emit('update:visible', false)
  } catch { /* toast */ }
  finally { acting.value = false }
}

function formatDateTime(iso: string) { return iso ? iso.slice(0, 16).replace('T', ' ') : '-' }

function handleClose() { emit('update:visible', false) }

const logActionLabel: Record<string, string> = {
  CREATE: '提交报修',
  CLAIM: '受理',
  RESOLVE: '提交结果',
  CONFIRM: '确认结单',
  REJECT: '驳回',
}
</script>

<template>
  <el-drawer :model-value="visible" title="工单详情" direction="rtl" size="560px" @close="handleClose" v-loading="loading">
    <template v-if="data">
      <!-- 状态概览 -->
      <div class="wo-header">
        <div class="wo-status-row">
          <el-tag :type="WO_STATUS_TAG[data.status as WorkOrderStatus] || ''" size="large">
            {{ WO_STATUS_LABEL[data.status as WorkOrderStatus] || data.status }}
          </el-tag>
          <el-tag :type="PRIORITY_TAG[data.priority] || ''" size="large">
            {{ PRIORITY_LABEL[data.priority] || data.priority }}优先级
          </el-tag>
          <el-tag size="large" type="warning">{{ data.type === 'REPAIR' ? '报修' : data.type }}</el-tag>
        </div>
        <h2 class="wo-title">{{ data.title }}</h2>
      </div>

      <!-- 人员信息 -->
      <div class="wo-section">
        <div class="section-title">人员信息</div>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="提交人">{{ data.reporterName }}</el-descriptions-item>
          <el-descriptions-item label="工程师">{{ data.engineerName || '未分配' }}</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ formatDateTime(data.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatDateTime(data.updatedAt) }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 问题描述 -->
      <div class="wo-section">
        <div class="section-title">问题描述</div>
        <div class="wo-description">{{ data.description || '无详细描述' }}</div>
      </div>

      <!-- 处理结果 -->
      <div v-if="data.resolution" class="wo-section">
        <div class="section-title">处理结果</div>
        <div class="wo-description">{{ data.resolution }}</div>
      </div>

      <!-- 流转日志 -->
      <div v-if="logs.length > 0" class="wo-section">
        <div class="section-title">流转日志</div>
        <el-timeline>
          <el-timeline-item
            v-for="log in logs"
            :key="log.id"
            :timestamp="formatDateTime(log.createdAt)"
            placement="top"
          >
            <span class="log-action">{{ logActionLabel[log.action] || log.action }}</span>
            <span v-if="log.remark" class="log-remark"> — {{ log.remark }}</span>
          </el-timeline-item>
        </el-timeline>
      </div>
    </template>

    <template v-if="data" #footer>
      <el-button @click="handleClose">关闭</el-button>
      <el-button v-if="canClaim" type="primary" :loading="acting" @click="handleClaim">接单</el-button>
      <el-button v-if="canResolve" type="primary" :loading="acting" @click="handleResolve">提交结果</el-button>
      <el-button v-if="canReject" type="danger" :loading="acting" @click="handleReject">驳回</el-button>
      <el-button v-if="canConfirm" type="primary" :loading="acting" @click="handleConfirm">确认结单</el-button>
      <el-button v-if="canRejectResolved" type="danger" :loading="acting" @click="handleReject">驳回重做</el-button>
    </template>
  </el-drawer>
</template>

<style scoped>
.wo-header { margin-bottom: 24px; }
.wo-status-row { display: flex; gap: 8px; margin-bottom: 12px; }
.wo-title { font-size: 18px; color: #1e293b; font-weight: 600; }
.wo-section { margin-bottom: 20px; }
.section-title { font-size: 13px; font-weight: 600; color: #64748b; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
.wo-description { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 16px; font-size: 14px; color: #334155; line-height: 1.6; white-space: pre-wrap; }
.log-action { font-weight: 500; color: #1e293b; }
.log-remark { color: #64748b; }
</style>
