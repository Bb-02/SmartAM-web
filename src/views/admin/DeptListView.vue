<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getDepartmentList, deleteDepartment } from '@/api/departments'
import { getRegionList } from '@/api/regions'
import { useAuthStore } from '@/stores/auth'
import type { DepartmentItem } from '@/types/department'
import type { RegionItem } from '@/types/region'
import DeptFormDrawer from './DeptFormDrawer.vue'

const authStore = useAuthStore()
const isTenantAdmin = computed(() => authStore.role === 'ADMIN_TENANT')

const regionOptions = ref<RegionItem[]>([])
const searchForm = reactive({ keyword: '', regionId: undefined as number | undefined })
const loading = ref(false)
const tableData = ref<DepartmentItem[]>([])

function getRegionName(id: number) {
  return regionOptions.value.find((r) => r.id === id)?.name || '-'
}

async function loadRegions() {
  try { regionOptions.value = (await getRegionList()).data.records }
  catch { /* ignore */ }
}

async function fetchData() {
  loading.value = true
  try {
    const res = await getDepartmentList({
      keyword: searchForm.keyword || undefined,
      regionId: searchForm.regionId,
    })
    tableData.value = res.data.records
  } catch { tableData.value = [] }
  finally { loading.value = false }
}

function handleSearch() { fetchData() }
function handleReset() { searchForm.keyword = ''; searchForm.regionId = undefined; fetchData() }

async function handleDelete(row: DepartmentItem) {
  try { await ElMessageBox.confirm(`确定删除部门「${row.name}」？`, '确认删除', { type: 'warning' }) }
  catch { return }
  try {
    await deleteDepartment(row.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch { /* toast */ }
}

// 抽屉
const drawerVisible = ref(false)
const drawerMode = ref<'create' | 'edit' | 'view'>('create')
const drawerDeptId = ref<number>()

function openCreate() { drawerMode.value = 'create'; drawerDeptId.value = undefined; drawerVisible.value = true }
function openEdit(id: number) { drawerMode.value = 'edit'; drawerDeptId.value = id; drawerVisible.value = true }
function openView(id: number) { drawerMode.value = 'view'; drawerDeptId.value = id; drawerVisible.value = true }

onMounted(async () => {
  await loadRegions()
  fetchData()
})
</script>

<template>
  <div class="dept-list">
    <div class="search-bar">
      <el-input v-model="searchForm.keyword" placeholder="部门名称 / 编码" clearable style="width: 200px" @keyup.enter="handleSearch" />
      <el-select v-if="isTenantAdmin" v-model="searchForm.regionId" style="width: 160px" placeholder="全部分区" clearable @change="handleSearch">
        <el-option v-for="r in regionOptions" :key="r.id" :label="r.name" :value="r.id" />
      </el-select>
      <el-button type="primary" @click="handleSearch"><el-icon><Search /></el-icon>搜索</el-button>
      <el-button @click="handleReset">重置</el-button>
      <el-button type="primary" class="add-btn" @click="openCreate"><el-icon><Plus /></el-icon>新增部门</el-button>
    </div>

    <el-table :data="tableData" v-loading="loading" stripe>
      <el-table-column type="index" label="#" width="55" />
      <el-table-column label="部门名称" min-width="140">
        <template #default="{ row }">
          <el-button text type="primary" @click="openView(row.id)">{{ row.name }}</el-button>
        </template>
      </el-table-column>
      <el-table-column prop="code" label="编码" width="100" />
      <el-table-column v-if="isTenantAdmin" label="所属分区" width="120">
        <template #default="{ row }">{{ getRegionName(row.regionId) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button text type="primary" size="small" @click="openEdit(row.id)">编辑</el-button>
          <el-button text type="danger" size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <DeptFormDrawer v-model:visible="drawerVisible" :mode="drawerMode" :dept-id="drawerDeptId" @saved="fetchData" />
  </div>
</template>

<style scoped>
.dept-list { background: #fff; border-radius: 8px; padding: 24px; }
.search-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
.add-btn { margin-left: auto; }
</style>
