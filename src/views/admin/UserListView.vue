<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUserList, deleteUser } from '@/api/users'
import { useAuthStore } from '@/stores/auth'
import { ROLE_LABEL } from '@/types/user'
import type { UserItem } from '@/types/user'
import UserFormDrawer from './UserFormDrawer.vue'

const authStore = useAuthStore()
const canDelete = computed(() => authStore.role === 'ADMIN_TENANT')
const isTenantAdmin = computed(() => authStore.role === 'ADMIN_TENANT')

const roleOptions = computed(() => {
  const base = [{ label: '全部角色', value: '' }]
  if (isTenantAdmin.value) {
    base.push(
      { label: '分区管理员', value: 'ADMIN_REGION' },
      { label: '工程师', value: 'ENGINEER' },
      { label: '员工', value: 'EMPLOYEE' },
    )
  } else {
    base.push(
      { label: '工程师', value: 'ENGINEER' },
      { label: '员工', value: 'EMPLOYEE' },
    )
  }
  return base
})

const searchForm = reactive({ keyword: '', role: '' })
const loading = ref(false)
const tableData = ref<UserItem[]>([])
const pagination = reactive({ current: 1, size: 20, total: 0 })

async function fetchData() {
  loading.value = true
  try {
    const res = await getUserList({
      page: pagination.current,
      size: pagination.size,
      keyword: searchForm.keyword || undefined,
      role: searchForm.role || undefined,
    })
    tableData.value = res.data.records.filter((u) => u.id !== authStore.userId)
    pagination.total = Math.max(0, res.data.total - (res.data.records.some((u) => u.id === authStore.userId) ? 1 : 0))
  } catch { tableData.value = [] }
  finally { loading.value = false }
}

function handleSearch() { pagination.current = 1; fetchData() }
function handleReset() { searchForm.keyword = ''; searchForm.role = ''; pagination.current = 1; fetchData() }
function handleSizeChange(s: number) { pagination.size = s; pagination.current = 1; fetchData() }
function handlePageChange(p: number) { pagination.current = p; fetchData() }

function getRoleTagType(role: string) {
  if (role === 'ADMIN_TENANT' || role === 'ADMIN_REGION') return 'warning'
  if (role === 'ENGINEER') return 'success'
  return ''
}

function canDeleteUser(row: UserItem) {
  if (!canDelete.value) return false
  return row.role === 'ENGINEER' || row.role === 'EMPLOYEE'
}

async function handleDelete(row: UserItem) {
  try { await ElMessageBox.confirm(`确定删除用户「${row.realName}」？`, '确认删除', { type: 'warning' }) }
  catch { return }
  try {
    await deleteUser(row.id)
    ElMessage.success('删除成功')
    if (tableData.value.length === 1 && pagination.current > 1) pagination.current--
    fetchData()
  } catch { /* toast */ }
}

const drawerVisible = ref(false)
const drawerMode = ref<'create' | 'edit' | 'view'>('create')
const drawerUserId = ref<number>()

function openCreate() { drawerMode.value = 'create'; drawerUserId.value = undefined; drawerVisible.value = true }
function openEdit(id: number) { drawerMode.value = 'edit'; drawerUserId.value = id; drawerVisible.value = true }
function openView(id: number) { drawerMode.value = 'view'; drawerUserId.value = id; drawerVisible.value = true }
function onSaved() { fetchData() }

const hasActiveFilter = computed(() => searchForm.role)

onMounted(() => { fetchData() })
</script>

<template>
  <div class="list-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <h2>用户管理</h2>
        <span class="header-count">{{ pagination.total }} 条记录</span>
      </div>
      <el-button type="primary" @click="openCreate"><el-icon><Plus /></el-icon>新增用户</el-button>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-input v-model="searchForm.keyword" placeholder="账号 / 姓名 / 手机号" clearable style="width: 240px" @keyup.enter="handleSearch" />
      <el-select v-model="searchForm.role" style="width: 150px" placeholder="全部角色" clearable @change="handleSearch">
        <el-option v-for="r in roleOptions" :key="r.value" :label="r.label" :value="r.value" />
      </el-select>
      <el-button type="primary" @click="handleSearch"><el-icon><Search /></el-icon>搜索</el-button>
      <el-button v-if="hasActiveFilter" @click="handleReset">重置</el-button>
    </div>

    <!-- 表格 -->
    <div class="table-wrap">
      <el-table :data="tableData" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="username" label="用户名" min-width="140" show-overflow-tooltip />
        <el-table-column label="姓名" min-width="120">
          <template #default="{ row }">
            <span class="table-link" @click="openView(row.id)">{{ row.realName }}</span>
          </template>
        </el-table-column>
        <el-table-column label="角色" width="110">
          <template #default="{ row }">
            <el-tag :type="getRoleTagType(row.role)" size="small">{{ ROLE_LABEL[row.role] || row.role }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <span class="table-action" @click="openEdit(row.id)">编辑</span>
            <span v-if="canDeleteUser(row)" class="table-action-danger" @click="handleDelete(row)">删除</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination-bar" v-if="pagination.total > 0">
      <el-pagination v-model:current-page="pagination.current" v-model:page-size="pagination.size" :total="pagination.total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange" @current-change="handlePageChange" />
    </div>

    <UserFormDrawer v-model:visible="drawerVisible" :mode="drawerMode" :user-id="drawerUserId" @saved="onSaved" />
  </div>
</template>

<style scoped>
.list-page {
  background: #fff;
  border-radius: 12px;
  padding: 28px 32px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e8ecf1;
}
.header-left {
  display: flex;
  align-items: baseline;
  gap: 14px;
}
.header-left h2 {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.3px;
}
.header-count {
  font-size: 14px;
  color: #94a3b8;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  background: #f8fafc;
  padding: 14px 18px;
  border-radius: 8px;
  border: 1px solid #e8ecf1;
}

.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
}
</style>
