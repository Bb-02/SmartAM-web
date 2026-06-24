<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAssetList, deleteAsset } from '@/api/assets'
import type { AssetItem, AssetStatus } from '@/types/asset'

const statusMap: Record<AssetStatus, { label: string; type: string }> = {
  IN_STORAGE: { label: '在库', type: '' },
  IN_USE: { label: '使用中', type: 'success' },
  IN_REPAIR: { label: '维修中', type: 'warning' },
  SCRAPPED: { label: '已报废', type: 'danger' },
}

const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '在库', value: 'IN_STORAGE' },
  { label: '使用中', value: 'IN_USE' },
  { label: '维修中', value: 'IN_REPAIR' },
  { label: '已报废', value: 'SCRAPPED' },
]

const searchForm = reactive({ keyword: '', status: '' })
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
function handleReset() { searchForm.keyword = ''; searchForm.status = ''; pagination.current = 1; fetchData() }
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
  } catch { /* 已 toast */ }
}

function formatDate(iso: string) { return iso ? iso.slice(0, 10) : '-' }

onMounted(() => { fetchData() })
</script>

<template>
  <div class="asset-list">
    <div class="search-bar">
      <el-input v-model="searchForm.keyword" placeholder="资产名称 / 编号" clearable style="width: 240px" @keyup.enter="handleSearch" />
      <el-select v-model="searchForm.status" style="width: 140px" @change="handleSearch">
        <el-option v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
      </el-select>
      <el-button type="primary" @click="handleSearch"><el-icon><Search /></el-icon>搜索</el-button>
      <el-button @click="handleReset">重置</el-button>
      <el-button type="primary" class="add-btn" @click="ElMessage.info('功能开发中')"><el-icon><Plus /></el-icon>新增资产</el-button>
    </div>

    <el-table :data="tableData" v-loading="loading" stripe>
      <el-table-column type="index" label="#" width="60" />
      <el-table-column prop="name" label="资产名称" min-width="180" show-overflow-tooltip />
      <el-table-column prop="code" label="编号" width="160" />
      <el-table-column prop="category" label="品类" width="100" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusMap[row.status]?.type || ''" size="small">
            {{ statusMap[row.status]?.label || row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="location" label="存放位置" width="140" show-overflow-tooltip />
      <el-table-column label="入库时间" width="120">
        <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button text type="primary" size="small" @click="ElMessage.info('功能开发中')">编辑</el-button>
          <el-button text type="danger" size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-bar" v-if="pagination.total > 0">
      <el-pagination v-model:current-page="pagination.current" v-model:page-size="pagination.size" :total="pagination.total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange" @current-change="handlePageChange" />
    </div>
  </div>
</template>

<style scoped>
.asset-list { background: #fff; border-radius: 8px; padding: 24px; }
.search-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
.add-btn { margin-left: auto; }
.pagination-bar { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
