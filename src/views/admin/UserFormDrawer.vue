<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { createUser, updateUser, getUser } from '@/api/users'
import { getRegionList } from '@/api/regions'
import { getDepartmentList } from '@/api/departments'
import { useAuthStore } from '@/stores/auth'
import { getRoleOptions } from '@/types/user'
import type { RegionItem } from '@/types/region'
import type { DepartmentItem } from '@/types/department'

const props = defineProps<{
  visible: boolean
  mode: 'create' | 'edit' | 'view'
  userId?: number
}>()

const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void
  (e: 'saved'): void
}>()

const authStore = useAuthStore()
const isTenantAdmin = computed(() => authStore.role === 'ADMIN_TENANT')
const roleOptions = computed(() => getRoleOptions(authStore.role))

const regionOptions = ref<RegionItem[]>([])
const deptOptions = ref<DepartmentItem[]>([])

const formRef = ref<FormInstance>()
const submitting = ref(false)
const loading = ref(false)

const title = computed(() => {
  if (props.mode === 'create') return '新增用户'
  if (props.mode === 'edit') return '编辑用户'
  return '用户详情'
})

const isDisabled = computed(() => props.mode === 'view')

const form = ref({
  username: '',
  password: '',
  realName: '',
  role: '',
  regionId: undefined as number | undefined,
  deptId: undefined as number | undefined,
  phone: '',
  email: '',
  status: 1,
})

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9]{3,30}$/, message: '3-30位字母或数字', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码不少于6位', trigger: 'blur' },
  ],
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
}

const showPassword = computed(() => props.mode === 'create')

watch(
  () => props.visible,
  async (v) => {
    if (!v) return
    await loadOptions()
    if (props.mode === 'create') {
      resetForm()
    } else if (props.userId) {
      await loadUser(props.userId)
    }
  },
)

async function loadOptions() {
  try {
    const [regionRes, deptRes] = await Promise.all([getRegionList(), getDepartmentList()])
    regionOptions.value = regionRes.data.records
    deptOptions.value = deptRes.data.records
  } catch { /* ignore */ }
}

async function loadUser(id: number) {
  loading.value = true
  try {
    const u = (await getUser(id)).data
    form.value = {
      username: u.username,
      password: '',
      realName: u.realName,
      role: u.role,
      regionId: u.regionId,
      deptId: u.deptId ?? undefined,
      phone: u.phone || '',
      email: u.email || '',
      status: u.status,
    }
  } catch { /* toast */ }
  finally { loading.value = false }
}

function resetForm() {
  form.value = {
    username: '', password: '', realName: '', role: '',
    regionId: undefined, deptId: undefined,
    phone: '', email: '', status: 1,
  }
  formRef.value?.resetFields()
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (props.mode === 'create') {
      await createUser({
        username: form.value.username,
        password: form.value.password,
        realName: form.value.realName,
        role: form.value.role,
        regionId: form.value.regionId,
        deptId: form.value.deptId,
        phone: form.value.phone || undefined,
        email: form.value.email || undefined,
      })
      ElMessage.success('新增成功')
    } else {
      await updateUser(props.userId!, {
        realName: form.value.realName || undefined,
        password: form.value.password || undefined,
        phone: form.value.phone || undefined,
        email: form.value.email || undefined,
        regionId: form.value.regionId,
        deptId: form.value.deptId,
        status: form.value.status,
      })
      ElMessage.success('保存成功')
    }
    emit('saved')
    emit('update:visible', false)
  } catch { /* toast */ }
  finally { submitting.value = false }
}

function handleClose() {
  emit('update:visible', false)
}
</script>

<template>
  <el-drawer
    :model-value="visible"
    :title="title"
    direction="rtl"
    size="520px"
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
      <el-form-item label="用户名" prop="username">
        <el-input v-model="form.username" :disabled="mode !== 'create'" placeholder="登录账号" />
      </el-form-item>

      <el-form-item v-if="showPassword" label="密码" prop="password">
        <el-input v-model="form.password" type="password" show-password placeholder="不少于6位" />
      </el-form-item>

      <el-form-item v-if="!showPassword" label="新密码">
        <el-input v-model="form.password" type="password" show-password placeholder="留空则不修改密码" />
      </el-form-item>

      <el-form-item label="真实姓名" prop="realName">
        <el-input v-model="form.realName" />
      </el-form-item>

      <el-form-item label="角色" prop="role">
        <el-select v-model="form.role" style="width: 100%" placeholder="请选择角色" :disabled="mode === 'edit'">
          <el-option v-for="r in roleOptions" :key="r.value" :label="r.label" :value="r.value" />
        </el-select>
        <div v-if="mode === 'edit'" style="font-size:12px;color:#94a3b8;margin-top:4px">角色不可修改，如需变更请删除后重新创建</div>
      </el-form-item>

      <el-row :gutter="16">
        <el-col v-if="isTenantAdmin || form.role === 'ADMIN_REGION'" :span="12">
          <el-form-item label="所属分区">
            <el-select v-model="form.regionId" style="width: 100%" placeholder="选择分区" clearable filterable>
              <el-option v-for="r in regionOptions" :key="r.id" :label="`${r.name} (${r.code})`" :value="r.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col v-if="form.role === 'EMPLOYEE' || mode === 'edit'" :span="12">
          <el-form-item label="所属部门">
            <el-select v-model="form.deptId" style="width: 100%" placeholder="选择部门" clearable filterable>
              <el-option v-for="d in deptOptions" :key="d.id" :label="d.name" :value="d.id" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="手机号">
            <el-input v-model="form.phone" placeholder="选填" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="邮箱">
            <el-input v-model="form.email" placeholder="选填" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item v-if="mode === 'edit'" label="状态">
        <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用" />
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
