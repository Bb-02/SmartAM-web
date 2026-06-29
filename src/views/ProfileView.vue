<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { getMyInfo, updateMyInfo, changePassword } from '@/api/users'
import { useAuthStore } from '@/stores/auth'
import { getRoleHome } from '@/config/menus'
import type { UserItem } from '@/types/user'
import { ROLE_LABEL } from '@/types/user'

const router = useRouter()
const authStore = useAuthStore()
const infoRef = ref<FormInstance>()
const pwdRef = ref<FormInstance>()
const infoLoading = ref(false)
const pwdLoading = ref(false)
const user = ref<UserItem | null>(null)

const infoForm = reactive({ realName: '', phone: '', email: '' })
const pwdForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })

const infoRules: FormRules = {
  realName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
}
const pwdRules: FormRules = {
  oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  newPassword: [{ required: true, message: '请输入新密码', trigger: 'blur' }],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: (_rule, value: string, cb) => value !== pwdForm.newPassword ? cb(new Error('两次密码不一致')) : cb(), trigger: 'blur' },
  ],
}

async function loadProfile() {
  try {
    user.value = (await getMyInfo()).data
    infoForm.realName = user.value.realName
    infoForm.phone = user.value.phone || ''
    infoForm.email = user.value.email || ''
  } catch { /* ignore */ }
}

async function handleSaveInfo() {
  const valid = await infoRef.value?.validate().catch(() => false)
  if (!valid) return
  infoLoading.value = true
  try {
    await updateMyInfo({ realName: infoForm.realName, phone: infoForm.phone || undefined, email: infoForm.email || undefined })
    authStore.realName = infoForm.realName
    ElMessage.success('个人信息已更新')
  } catch { /* toast */ }
  finally { infoLoading.value = false }
}

async function handleChangePwd() {
  const valid = await pwdRef.value?.validate().catch(() => false)
  if (!valid) return
  pwdLoading.value = true
  try {
    await changePassword({ oldPassword: pwdForm.oldPassword, newPassword: pwdForm.newPassword })
    ElMessage.success('密码已修改，请重新登录')
    pwdForm.oldPassword = ''
    pwdForm.newPassword = ''
    pwdForm.confirmPassword = ''
    setTimeout(() => authStore.logout(), 1500)
  } catch { /* toast */ }
  finally { pwdLoading.value = false }
}

onMounted(() => { loadProfile() })
</script>

<template>
  <div class="profile-page">
    <div class="page-header">
      <el-button text @click="router.push(getRoleHome(authStore.role))">
        <el-icon><ArrowLeft /></el-icon>返回首页
      </el-button>
      <h2>个人设置</h2>
    </div>

    <div class="profile-grid">
      <!-- 基本信息卡片 -->
      <div class="profile-card">
        <div class="card-title">基本信息</div>
        <div class="card-meta" v-if="user">
          <span>{{ user.username }}</span>
          <span class="meta-divider">|</span>
          <span>{{ ROLE_LABEL[user.role] || user.role }}</span>
          <span class="meta-divider">|</span>
          <span :class="{ active: user.status === 1, inactive: user.status !== 1 }">{{ user.status === 1 ? '正常' : '已禁用' }}</span>
        </div>

        <el-form ref="infoRef" :model="infoForm" :rules="infoRules" label-position="top" class="card-form">
          <el-form-item label="姓名" prop="realName">
            <el-input v-model="infoForm.realName" />
          </el-form-item>
          <el-form-item label="手机号">
            <el-input v-model="infoForm.phone" placeholder="选填" />
          </el-form-item>
          <el-form-item label="邮箱">
            <el-input v-model="infoForm.email" placeholder="选填" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="infoLoading" @click="handleSaveInfo">保存修改</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 修改密码卡片 -->
      <div class="profile-card">
        <div class="card-title">修改密码</div>

        <el-form ref="pwdRef" :model="pwdForm" :rules="pwdRules" label-position="top" class="card-form">
          <el-form-item label="旧密码" prop="oldPassword">
            <el-input v-model="pwdForm.oldPassword" type="password" show-password />
          </el-form-item>
          <el-form-item label="新密码" prop="newPassword">
            <el-input v-model="pwdForm.newPassword" type="password" show-password />
          </el-form-item>
          <el-form-item label="确认新密码" prop="confirmPassword">
            <el-input v-model="pwdForm.confirmPassword" type="password" show-password />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="pwdLoading" @click="handleChangePwd">修改密码</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-page { padding: 4px 0; }
.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 28px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e8ecf1;
}
.page-header h2 { font-size: 22px; font-weight: 700; color: #0f172a; }

.profile-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  max-width: 800px;
}

.profile-card {
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 12px;
  padding: 28px 32px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02);
}
.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}
.card-meta {
  font-size: 13px;
  color: #94a3b8;
  margin-bottom: 24px;
  display: flex;
  gap: 8px;
  align-items: center;
}
.meta-divider { color: #e2e8f0; }
.active { color: #16a34a; }
.inactive { color: #dc2626; }
.card-form { margin-top: 8px; }
</style>
