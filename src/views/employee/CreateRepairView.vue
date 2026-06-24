<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { getAssetList } from '@/api/assets'
import { getWorkOrderList, createWorkOrder } from '@/api/work-orders'
import { useAuthStore } from '@/stores/auth'
import type { AssetItem } from '@/types/asset'

const authStore = useAuthStore()
const formRef = ref<FormInstance>()
const submitting = ref(false)
const myAssets = ref<AssetItem[]>([])
const busyAssetIds = ref<Set<number>>(new Set())

const form = reactive({
  title: '',
  assetId: undefined as number | undefined,
  priority: 'NORMAL',
  description: '',
})

const rules: FormRules = {
  title: [{ required: true, message: '请输入工单标题', trigger: 'blur' }],
}

const priorityOptions = [
  { label: '低', value: 'LOW' },
  { label: '普通', value: 'NORMAL' },
  { label: '高', value: 'HIGH' },
  { label: '紧急', value: 'URGENT' },
]

async function loadMyAssets() {
  try {
    const [assetRes, orderRes] = await Promise.all([
      getAssetList({ page: 1, size: 500 }),
      getWorkOrderList({ page: 1, size: 500 }),
    ])
    myAssets.value = assetRes.data.records.filter((a) => a.userId === authStore.userId)
    // 找出已有活跃工单的资产 ID（PENDING 或 IN_WORK）
    busyAssetIds.value = new Set(
      orderRes.data.records
        .filter((o) => o.assetId && (o.status === 'PENDING' || o.status === 'IN_WORK'))
        .map((o) => o.assetId!)
    )
  } catch { /* ignore */ }
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await createWorkOrder({
      title: form.title,
      assetId: form.assetId,
      priority: form.priority,
      description: form.description || undefined,
    })
    ElMessage.success('报修工单已提交')
    form.title = ''
    form.assetId = undefined
    form.priority = 'NORMAL'
    form.description = ''
    formRef.value?.resetFields()
  } catch { /* toast */ }
  finally { submitting.value = false }
}

onMounted(() => { loadMyAssets() })
</script>

<template>
  <div class="repair-form">
    <h2>发起报修</h2>

    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="form-body">
      <el-form-item label="工单标题" prop="title">
        <el-input v-model="form.title" placeholder="简要描述故障，如：笔记本无法开机" />
      </el-form-item>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="关联资产">
            <el-select v-model="form.assetId" style="width: 100%" placeholder="选择资产（可选）" clearable filterable>
              <el-option
                v-for="a in myAssets"
                :key="a.id"
                :label="`${a.name} (${a.code})${busyAssetIds.has(a.id) ? ' — 已有工单处理中' : a.status === 'IN_REPAIR' ? ' — 维修中' : ''}`"
                :value="a.id"
                :disabled="busyAssetIds.has(a.id) || a.status === 'IN_REPAIR'"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="优先级">
            <el-select v-model="form.priority" style="width: 100%">
              <el-option v-for="p in priorityOptions" :key="p.value" :label="p.label" :value="p.value" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="问题描述">
        <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请详细描述故障现象，已尝试的排查步骤等" />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">提交工单</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped>
.repair-form { background: #fff; border-radius: 8px; padding: 24px; }
.repair-form h2 { font-size: 18px; color: #1e293b; margin-bottom: 20px; }
.form-body { max-width: 640px; }
</style>
