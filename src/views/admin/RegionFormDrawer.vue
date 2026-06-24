<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { createRegion, updateRegion, getRegion } from '@/api/regions'

const props = defineProps<{
  visible: boolean
  mode: 'create' | 'edit' | 'view'
  regionId?: number
}>()

const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void
  (e: 'saved'): void
}>()

const formRef = ref<FormInstance>()
const submitting = ref(false)
const loading = ref(false)

const title = computed(() => {
  if (props.mode === 'create') return '新增分区'
  if (props.mode === 'edit') return '编辑分区'
  return '分区详情'
})

const isDisabled = computed(() => props.mode === 'view')

const form = ref({ name: '', code: '' })
const rules: FormRules = {
  name: [{ required: true, message: '请输入分区名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入分区标识', trigger: 'blur' }],
}

watch(
  () => props.visible,
  async (v) => {
    if (!v) return
    if (props.mode === 'create') {
      form.value = { name: '', code: '' }
      formRef.value?.resetFields()
    } else if (props.regionId) {
      loading.value = true
      try {
        const r = (await getRegion(props.regionId)).data
        form.value = { name: r.name, code: r.code }
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
      await createRegion(form.value)
      ElMessage.success('新增成功')
    } else {
      await updateRegion(props.regionId!, {
        name: form.value.name || undefined,
        code: form.value.code || undefined,
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
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" :disabled="isDisabled" v-loading="loading">
      <el-form-item label="分区名称" prop="name">
        <el-input v-model="form.name" placeholder="如 华东分区" />
      </el-form-item>
      <el-form-item label="分区标识" prop="code">
        <el-input v-model="form.code" placeholder="唯一标识，如 east" />
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
