<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAssetList, deleteAsset } from '@/api/assets'
import { useAuthStore } from '@/stores/auth'
import { statusTagType, statusLabel, statusOptions, categoryOptions, categoryLabel } from '@/types/asset'
import type { AssetItem, AssetStatus, AssetCategory } from '@/types/asset'
import AssetFormDrawer from './AssetFormDrawer.vue'

const authStore = useAuthStore()
const canDelete = computed(() => authStore.role === 'ADMIN_TENANT')

// 搜索
const searchForm = reactive({ keyword: '', status: '', category: '' })

// 表格
const loading = ref(false)
const tableData = ref<AssetItem[]>([])
const pagination = reactive({ current: 1, size: 20, total: 0 })

async function fetchData() {
  loading.value = true
  try {
    const res = await getAssetList({
      page: pagination.current,
      size: pagination.size,
      keyword: searchForm.keyword || undefined,
      status: searchForm.status || undefined,
      category: searchForm.category || undefined,
    })
    tableData.value = res.data.records
    pagination.total = res.data.total
  } catch {
    tableData.value = []
  } finally {
    loading.value = false
  }
}

function handleSearch() { pagination.current = 1; fetchData() }
function handleReset() { searchForm.keyword = ''; searchForm.status = ''; searchForm.category = ''; pagination.current = 1; fetchData() }
function handleSizeChange(s: number) { pagination.size = s; pagination.current = 1; fetchData() }
function handlePageChange(p: number) { pagination.current = p; fetchData() }

async function handleDelete(row: AssetItem) {
  try { await ElMessageBox.confirm(`确定删除资产「${row.name}」？`, '确认删除', { type: 'warning' }) }
  catch { return }
  try {
    await deleteAsset(row.id)
    ElMessage.success('删除成功')
    if (tableData.value.length === 1 && pagination.current > 1) pagination.current--
    fetchData()
  } catch { /* toast */ }
}

function formatDate(iso: string) { return iso ? iso.slice(0, 10) : '-' }

// 抽屉
const drawerVisible = ref(false)
const drawerMode = ref<'create' | 'edit' | 'view'>('create')
const drawerAssetId = ref<number>()

function openCreate() { drawerMode.value = 'create'; drawerAssetId.value = undefined; drawerVisible.value = true }
function openEdit(id: number) { drawerMode.value = 'edit'; drawerAssetId.value = id; drawerVisible.value = true }
function openView(id: number) { drawerMode.value = 'view'; drawerAssetId.value = id; drawerVisible.value = true }

function onSaved() { fetchData() }

function getStatus(row: AssetItem) {
  return { label: statusLabel[row.status as AssetStatus] || row.status, type: statusTagType[row.status as AssetStatus] || '' }
}

onMounted(() => { fetchData() })
</script>

<template>
  <div class="asset-list">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-input v-model="searchForm.keyword" placeholder="资产名称 / 编号" clearable style="width: 200px" @keyup.enter="handleSearch" />
      <el-select v-model="searchForm.status" style="width: 130px" @change="handleSearch">
        <el-option v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
      </el-select>
      <el-select v-model="searchForm.category" style="width: 130px" placeholder="全部品类" clearable @change="handleSearch">
        <el-option v-for="c in categoryOptions" :key="c.value" :label="c.label" :value="c.value" />
      </el-select>
      <el-button type="primary" @click="handleSearch"><el-icon><Search /></el-icon>搜索</el-button>
      <el-button @click="handleReset">重置</el-button>
      <el-button type="primary" class="add-btn" @click="openCreate"><el-icon><Plus /></el-icon>新增资产</el-button>
    </div>

    <!-- 表格 -->
    <el-table :data="tableData" v-loading="loading" stripe>
      <el-table-column type="index" label="#" width="55" />
      <el-table-column prop="name" label="资产名称" min-width="180" show-overflow-tooltip>
        <template #default="{ row }">
          <span class="table-link" @click="openView(row.id)">{{ row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="code" label="编号" width="150" />
      <el-table-column label="品类" width="110">
        <template #default="{ row }">{{ categoryLabel[row.category as AssetCategory] || row.category }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="getStatus(row).type" size="small">{{ getStatus(row).label }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="location" label="存放位置" width="120" show-overflow-tooltip />
      <el-table-column label="入库时间" width="110">
        <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <span class="table-action" @click="openEdit(row.id)">编辑</span>
          <span v-if="canDelete" class="table-action-danger" @click="handleDelete(row)">删除</span>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-bar" v-if="pagination.total > 0">
      <el-pagination v-model:current-page="pagination.current" v-model:page-size="pagination.size" :total="pagination.total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange" @current-change="handlePageChange" />
    </div>

    <!-- 抽屉 -->
    <AssetFormDrawer v-model:visible="drawerVisible" :mode="drawerMode" :asset-id="drawerAssetId" @saved="onSaved" />
  </div>
</template>

<style scoped>
.asset-list { background: #fff; border-radius: 8px; padding: 24px; }
.search-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
.add-btn { margin-left: auto; }
.pagination-bar { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
