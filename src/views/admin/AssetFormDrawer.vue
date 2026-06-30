<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { createAsset, updateAsset, getAsset, getAssetLogs } from '@/api/assets'
import { getRegionList } from '@/api/regions'
import { getDepartmentList } from '@/api/departments'
import { getUserList } from '@/api/users'
import { useAuthStore } from '@/stores/auth'
import { categoryOptions, statusOptions as allStatusOptions, categoryLabel } from '@/types/asset'
import type { AssetItem, AssetLog, AssetCategory } from '@/types/asset'
import type { RegionItem } from '@/types/region'
import type { DepartmentItem } from '@/types/department'
import type { UserItem } from '@/types/user'

const props = defineProps<{
  visible: boolean
  mode: 'create' | 'edit' | 'view'
  assetId?: number
}>()

const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void
  (e: 'saved'): void
}>()

const authStore = useAuthStore()
const isTenantAdmin = computed(() => authStore.role === 'ADMIN_TENANT')
const isAdmin = computed(() => authStore.role === 'ADMIN_TENANT' || authStore.role === 'ADMIN_REGION')

const regionOptions = ref<RegionItem[]>([])
const deptOptions = ref<DepartmentItem[]>([])
const userOptions = ref<UserItem[]>([])

// view 模式下从响应中获取的关联名称
const assetDeptName = ref('')
const assetUserName = ref('')

const statusOptions = allStatusOptions.filter((o) => o.value !== '')

const formRef = ref<FormInstance>()
const submitting = ref(false)
const loading = ref(false)
const logs = ref<AssetLog[]>([])

const title = computed(() => {
  if (props.mode === 'create') return '新增资产'
  if (props.mode === 'edit') return '编辑资产'
  return '资产详情'
})

const isDisabled = computed(() => props.mode === 'view')

const form = ref({
  name: '',
  code: '',
  category: '',
  model: '',
  brand: '',
  price: undefined as number | undefined,
  quantity: 1,
  unit: '',
  regionId: undefined as number | undefined,
  deptId: undefined as number | undefined,
  userId: undefined as number | undefined,
  location: '',
  purchaseDate: '',
  warrantyEnd: '',
  description: '',
  status: '',
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入资产名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入资产编号', trigger: 'blur' }],
  category: [{ required: true, message: '请选择品类', trigger: 'change' }],
}

// 打开抽屉时加载
watch(
  () => props.visible,
  async (v) => {
    if (!v) return
    await loadOptions()
    if (props.mode === 'create') {
      resetForm()
    } else if (props.assetId) {
      await loadAsset(props.assetId)
    }
  },
)

async function loadOptions() {
  try {
    const [regionRes, deptRes, userRes] = await Promise.all([
      getRegionList(),
      getDepartmentList(),
      getUserList({ role: 'EMPLOYEE' }),
    ])
    regionOptions.value = regionRes.data.records
    deptOptions.value = deptRes.data.records
    userOptions.value = userRes.data.records
  } catch { /* ignore */ }
}

async function loadAsset(id: number) {
  loading.value = true
  try {
    const [assetRes, logsRes] = await Promise.all([getAsset(id), getAssetLogs(id)])
    const a = assetRes.data
    form.value = {
      name: a.name,
      code: a.code,
      category: a.category,
      model: a.model || '',
      brand: a.brand || '',
      price: a.price,
      quantity: a.quantity,
      unit: a.unit || '',
      regionId: a.regionId,
      deptId: a.deptId ?? undefined,
      userId: a.userId ?? undefined,
      location: a.location || '',
      purchaseDate: a.purchaseDate || '',
      warrantyEnd: a.warrantyEnd || '',
      description: a.description || '',
      status: a.status,
    }
    logs.value = logsRes.data
    assetDeptName.value = a.deptName || ''
    assetUserName.value = a.userName || ''
  } catch {
    // toast already
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.value = {
    name: '', code: '', category: '', model: '', brand: '',
    price: undefined, quantity: 1, unit: '',
    regionId: undefined, deptId: undefined, userId: undefined,
    location: '', purchaseDate: '', warrantyEnd: '', description: '', status: '',
  }
  logs.value = []
  formRef.value?.resetFields()
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (props.mode === 'create') {
      await createAsset({
        name: form.value.name,
        code: form.value.code,
        category: form.value.category,
        model: form.value.model || undefined,
        brand: form.value.brand || undefined,
        price: form.value.price,
        quantity: form.value.quantity,
        unit: form.value.unit || undefined,
        regionId: form.value.regionId,
        deptId: form.value.deptId,
        userId: form.value.userId,
        location: form.value.location || undefined,
        purchaseDate: form.value.purchaseDate || undefined,
        warrantyEnd: form.value.warrantyEnd || undefined,
        description: form.value.description || undefined,
      })
      ElMessage.success('新增成功')
    } else {
      await updateAsset(props.assetId!, {
        name: form.value.name || undefined,
        code: form.value.code || undefined,
        category: form.value.category || undefined,
        model: form.value.model || undefined,
        brand: form.value.brand || undefined,
        price: form.value.price,
        quantity: form.value.quantity,
        unit: form.value.unit || undefined,
        regionId: form.value.regionId,
        deptId: form.value.deptId || null,
        userId: form.value.userId || null,
        status: form.value.status || undefined,
        location: form.value.location || undefined,
        purchaseDate: form.value.purchaseDate || undefined,
        warrantyEnd: form.value.warrantyEnd || undefined,
        description: form.value.description || undefined,
      })
      ElMessage.success('保存成功')
    }
    emit('saved')
    emit('update:visible', false)
  } catch {
    // toast already
  } finally {
    submitting.value = false
  }
}

function handleClose() {
  emit('update:visible', false)
}

function getCategoryName(cat: string) {
  return categoryLabel[cat as AssetCategory] || cat
}

function formatLogDate(iso: string) {
  return iso ? iso.slice(0, 16).replace('T', ' ') : '-'
}

const logActionLabel: Record<string, string> = {
  CREATE: '入库',
  ASSIGN: '分配',
  RETURN: '退库',
  REPAIR: '送修',
  REPAIR_DONE: '修复',
  SCRAP: '报废',
  UPDATE: '变更',
}
</script>

<template>
  <el-drawer
    :model-value="visible"
    :title="title"
    direction="rtl"
    size="600px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      :disabled="isDisabled"
      v-loading="loading"
    >
      <!-- 基本信息 -->
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="资产名称" prop="name">
            <el-input v-model="form.name" placeholder="如 ThinkPad X1 Carbon" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="资产编号" prop="code">
            <el-input v-model="form.code" placeholder="如 IT-2026-0001" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="品类" prop="category">
        <template v-if="isDisabled">
          <el-input :model-value="getCategoryName(form.category)" disabled />
        </template>
        <template v-else>
          <el-select v-model="form.category" style="width: 100%" placeholder="请选择品类">
            <el-option v-for="c in categoryOptions" :key="c.value" :label="c.label" :value="c.value" />
          </el-select>
        </template>
      </el-form-item>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="型号">
            <el-input v-model="form.model" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="品牌">
            <el-input v-model="form.brand" />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 数量 / 价格 -->
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="单价">
            <el-input-number v-model="form.price" :min="0" :precision="2" style="width: 100%" controls-position="right" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="数量">
            <el-input-number v-model="form.quantity" :min="1" style="width: 100%" controls-position="right" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="单位">
            <el-select v-model="form.unit" style="width: 100%" placeholder="选择">
              <el-option label="台" value="台" />
              <el-option label="个" value="个" />
              <el-option label="套" value="套" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 归属 -->
      <el-row :gutter="16">
        <el-col v-if="isTenantAdmin" :span="8">
          <el-form-item label="所属分区">
            <template v-if="isDisabled && !isAdmin">
              <el-input disabled :model-value="form.regionId ? String(form.regionId) : '-'" />
            </template>
            <template v-else>
              <el-select v-model="form.regionId" style="width: 100%" placeholder="选择分区" clearable filterable>
                <el-option v-for="r in regionOptions" :key="r.id" :label="`${r.name} (${r.code})`" :value="r.id" />
              </el-select>
            </template>
          </el-form-item>
        </el-col>
        <el-col :span="isTenantAdmin ? 8 : 12">
          <el-form-item label="所属部门">
            <template v-if="isDisabled && !isAdmin">
              <el-input disabled :model-value="assetDeptName || (form.deptId ? String(form.deptId) : '-')" />
            </template>
            <template v-else>
              <el-select :model-value="form.deptId" @update:model-value="(v: any) => form.deptId = v || undefined" @clear="form.deptId = undefined" style="width: 100%" placeholder="选择部门" clearable filterable>
                <el-option v-for="d in deptOptions" :key="d.id" :label="d.name" :value="d.id" />
              </el-select>
            </template>
          </el-form-item>
        </el-col>
        <el-col :span="isTenantAdmin ? 8 : 12">
          <el-form-item label="领用人">
            <template v-if="isDisabled && !isAdmin">
              <el-input disabled :model-value="assetUserName || (form.userId ? String(form.userId) : '-')" />
            </template>
            <template v-else>
              <el-select :model-value="form.userId" @update:model-value="(v: any) => form.userId = v || undefined" @clear="form.userId = undefined" style="width: 100%" placeholder="选择领用人" clearable filterable>
                <el-option v-for="u in userOptions" :key="u.id" :label="`${u.realName} (${u.username})`" :value="u.id" />
              </el-select>
            </template>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 存放位置 -->
      <el-form-item label="存放位置">
        <el-input v-model="form.location" placeholder="如 3楼A区" />
      </el-form-item>

      <!-- 日期 -->
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="采购日期">
            <el-date-picker
              v-model="form.purchaseDate"
              type="date"
              placeholder="选择日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="保修截止">
            <el-date-picker
              v-model="form.warrantyEnd"
              type="date"
              placeholder="选择日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 备注 -->
      <el-form-item label="备注">
        <el-input v-model="form.description" type="textarea" :rows="2" placeholder="备注信息" />
      </el-form-item>

      <!-- 状态（仅编辑模式） -->
      <el-form-item v-if="mode === 'edit'" label="状态">
        <el-select v-model="form.status" style="width: 100%">
          <el-option v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value" />
        </el-select>
      </el-form-item>
    </el-form>

    <!-- 变更日志 -->
    <div v-if="mode !== 'create' && logs.length > 0" class="log-section">
      <el-divider content-position="left">变更日志</el-divider>
      <el-table :data="logs" size="small">
        <el-table-column label="操作" width="80">
          <template #default="{ row }">{{ logActionLabel[row.action] || row.action }}</template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="时间" width="140">
          <template #default="{ row }">{{ formatLogDate(row.createdAt) }}</template>
        </el-table-column>
      </el-table>
    </div>

    <template v-if="!isDisabled" #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        {{ mode === 'create' ? '确认新增' : '保存修改' }}
      </el-button>
    </template>
  </el-drawer>
</template>

<style scoped>
.log-section { margin-top: 8px; }
</style>
