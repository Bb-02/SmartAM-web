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
  <div class="repair-page">
    <div class="page-header">
      <div class="header-left">
        <h2>发起报修</h2>
        <span class="header-sub">提交资产维修工单</span>
      </div>
    </div>

    <div class="form-card">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="form-body">
        <el-form-item label="工单标题" prop="title">
          <el-input v-model="form.title" placeholder="简要描述故障，如：笔记本无法开机" size="large" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="关联资产">
              <el-select v-model="form.assetId" style="width: 100%" placeholder="选择资产（可选）" clearable filterable size="large">
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
              <el-select v-model="form.priority" style="width: 100%" size="large">
                <el-option v-for="p in priorityOptions" :key="p.value" :label="p.label" :value="p.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="问题描述">
          <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请详细描述故障现象、已尝试的排查步骤等" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" size="large" :loading="submitting" @click="handleSubmit">
            <el-icon><Upload /></el-icon>提交工单
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.repair-page { padding: 4px 0; }

.page-header {
  margin-bottom: 28px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e8ecf1;
}
.header-left h2 {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.4px;
}
.header-sub {
  font-size: 14px;
  color: #94a3b8;
  margin-top: 4px;
  display: block;
}

.form-card {
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 12px;
  padding: 32px 36px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02);
}
.form-body { max-width: 680px; }
</style>
