<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { createDepartment, updateDepartment, getDepartment, getDepartmentTree } from '@/api/departments'
import { getRegionList } from '@/api/regions'
import { useAuthStore } from '@/stores/auth'
import type { RegionItem } from '@/types/region'
import type { DepartmentTreeNode } from '@/types/department'

const props = defineProps<{
  visible: boolean
  mode: 'create' | 'edit' | 'view'
  deptId?: number
}>()

const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void
  (e: 'saved'): void
}>()

const authStore = useAuthStore()
const isTenantAdmin = computed(() => authStore.role === 'ADMIN_TENANT')

const regionOptions = ref<RegionItem[]>([])
const deptTree = ref<DepartmentTreeNode[]>([])
const formRef = ref<FormInstance>()
const submitting = ref(false)
const loading = ref(false)

const title = computed(() => {
  if (props.mode === 'create') return '新增部门'
  if (props.mode === 'edit') return '编辑部门'
  return '部门详情'
})

const isDisabled = computed(() => props.mode === 'view')

// 过滤掉自己（防止循环引用）
function filterSelf(nodes: DepartmentTreeNode[]): DepartmentTreeNode[] {
  return nodes
    .filter((n) => n.id !== props.deptId)
    .map((n) => ({ ...n, children: filterSelf(n.children) }))
}

const form = ref({ name: '', code: '', regionId: undefined as number | undefined, parentId: undefined as number | undefined })
const rules: FormRules = {
  name: [{ required: true, message: '请输入部门名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入部门编码', trigger: 'blur' }],
}

watch(
  () => props.visible,
  async (v) => {
    if (!v) return
    try {
      const [regionRes, treeRes] = await Promise.all([getRegionList(), getDepartmentTree()])
      regionOptions.value = regionRes.data.records
      deptTree.value = treeRes.data
    } catch { /* ignore */ }

    if (props.mode === 'create') {
      form.value = { name: '', code: '', regionId: undefined, parentId: undefined }
      formRef.value?.resetFields()
    } else if (props.deptId) {
      loading.value = true
      try {
        const d = (await getDepartment(props.deptId)).data
        form.value = {
          name: d.name,
          code: d.code,
          regionId: d.regionId,
          parentId: d.parentId || undefined,
        }
      } finally { loading.value = false }
    }
  },
)

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (props.mode === 'create') {
      await createDepartment({
        name: form.value.name,
        code: form.value.code,
        regionId: isTenantAdmin.value ? form.value.regionId : undefined,
        parentId: form.value.parentId,
      })
      ElMessage.success('新增成功')
    } else {
      await updateDepartment(props.deptId!, {
        name: form.value.name || undefined,
        code: form.value.code || undefined,
        parentId: form.value.parentId,
      })
      ElMessage.success('保存成功')
    }
    emit('saved')
    emit('update:visible', false)
  } finally { submitting.value = false }
}

function handleClose() { emit('update:visible', false) }
</script>

<template>
  <el-drawer :model-value="visible" :title="title" direction="rtl" size="480px" @close="handleClose">
    <el-alert
      v-if="mode === 'edit'"
      type="info"
      show-icon
      :closable="false"
      style="margin-bottom: 20px"
    >
      <template #title>
        修改名称后，该部门下所有员工和资产的所属显示将同步更新
      </template>
    </el-alert>

    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" :disabled="isDisabled" v-loading="loading">
      <el-form-item label="部门名称" prop="name">
        <el-input v-model="form.name" placeholder="如 研发部" />
      </el-form-item>
      <el-form-item label="部门编码" prop="code">
        <el-input v-model="form.code" placeholder="唯一编码，如 rd" />
      </el-form-item>
      <el-form-item v-if="isTenantAdmin" label="所属分区">
        <el-select v-model="form.regionId" style="width: 100%" placeholder="选择分区" filterable :disabled="mode === 'edit'">
          <el-option v-for="r in regionOptions" :key="r.id" :label="`${r.name} (${r.code})`" :value="r.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="上级部门">
        <el-tree-select
          v-model="form.parentId"
          :data="filterSelf(deptTree)"
          :props="{ label: 'name', value: 'id', children: 'children' }"
          placeholder="无（顶级部门）"
          clearable
          check-strictly
          filterable
          style="width: 100%"
        />
        <div style="font-size:12px;color:#94a3b8;margin-top:4px">
          不选则为顶级部门，选上级则构成父子层级（仅用于组织架构展示，不影响权限）
        </div>
      </el-form-item>
    </el-form>

    <template v-if="!isDisabled" #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        {{ mode === 'create' ? '确认新增' : '保存修改' }}
      </el-button>
    </template>
  </el-drawer>
</template>
