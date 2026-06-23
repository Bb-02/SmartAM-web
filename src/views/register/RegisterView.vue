<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { register } from '@/api/auth'

const router = useRouter()

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  companyName: '',
  companyCode: '',
  adminUsername: '',
  adminPassword: '',
  adminRealName: '',
  adminPhone: '',
  adminEmail: '',
})

const rules: FormRules = {
  companyName: [{ required: true, message: '请输入企业名称', trigger: 'blur' }],
  companyCode: [
    { required: true, message: '请输入企业标识', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_-]{3,50}$/, message: '3-50位字母、数字、下划线或连字符', trigger: 'blur' },
  ],
  adminUsername: [
    { required: true, message: '请输入管理员用户名', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9]{3,30}$/, message: '3-30位字母或数字', trigger: 'blur' },
  ],
  adminPassword: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码不少于6位', trigger: 'blur' },
  ],
  adminRealName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' },
    { min: 2, message: '姓名不少于2个字', trigger: 'blur' },
  ],
  adminPhone: [
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
  adminEmail: [
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
  ],
}

async function handleRegister() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await register({
      companyName: form.companyName,
      companyCode: form.companyCode,
      adminUsername: form.adminUsername,
      adminPassword: form.adminPassword,
      adminRealName: form.adminRealName,
      adminPhone: form.adminPhone || undefined,
      adminEmail: form.adminEmail || undefined,
    })
    ElMessage.success('注册成功，请登录')
    router.push('/login')
  } catch {
    // 错误已在拦截器中 toast
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-wrapper">
    <div class="auth-card">
      <div class="auth-header">
        <h1>企业注册</h1>
        <p>创建您的 SmartAM 管理账号</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
      >
        <el-form-item label="企业名称" prop="companyName">
          <el-input v-model="form.companyName" placeholder="如：示例科技有限公司" />
        </el-form-item>

        <el-form-item label="企业标识" prop="companyCode">
          <el-input v-model="form.companyCode" placeholder="唯一标识，如 example-corp" />
        </el-form-item>

        <el-form-item label="管理员用户名" prop="adminUsername">
          <el-input v-model="form.adminUsername" placeholder="登录用的账号" />
        </el-form-item>

        <el-form-item label="密码" prop="adminPassword">
          <el-input
            v-model="form.adminPassword"
            type="password"
            show-password
            placeholder="不少于6位"
          />
        </el-form-item>

        <el-form-item label="真实姓名" prop="adminRealName">
          <el-input v-model="form.adminRealName" placeholder="管理员姓名" />
        </el-form-item>

        <el-form-item label="手机号" prop="adminPhone">
          <el-input v-model="form.adminPhone" placeholder="选填" />
        </el-form-item>

        <el-form-item label="邮箱" prop="adminEmail">
          <el-input v-model="form.adminEmail" placeholder="选填" />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            class="auth-btn"
            @click="handleRegister"
          >
            注 册
          </el-button>
        </el-form-item>
      </el-form>

      <p class="auth-footer">
        已有账号？
        <router-link to="/login">返回登录</router-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #1e3a5f 0%, #0f2440 100%);
}

.auth-card {
  width: 460px;
  padding: 40px 36px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.12);
}

.auth-header {
  text-align: center;
  margin-bottom: 28px;
}

.auth-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: #1e3a5f;
}

.auth-header p {
  margin-top: 6px;
  font-size: 14px;
  color: #64748b;
}

.auth-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  letter-spacing: 4px;
}

.auth-footer {
  text-align: center;
  font-size: 14px;
  color: #94a3b8;
}

.auth-footer a {
  color: #1e3a5f;
  font-weight: 500;
  text-decoration: none;
}

.auth-footer a:hover {
  text-decoration: underline;
}
</style>
