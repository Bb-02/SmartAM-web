<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getAssetList } from '@/api/assets'
import { statusTagType, statusLabel, statusOptions, categoryOptions, categoryLabel } from '@/types/asset'
import type { AssetItem, AssetStatus, AssetCategory } from '@/types/asset'
import AssetFormDrawer from '@/views/admin/AssetFormDrawer.vue'

const searchForm = reactive({ keyword: '', status: '', category: '' })
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
  } catch { tableData.value = [] }
  finally { loading.value = false }
}

function handleSearch() { pagination.current = 1; fetchData() }
function handleReset() { searchForm.keyword = ''; searchForm.status = ''; searchForm.category = ''; pagination.current = 1; fetchData() }
function handleSizeChange(s: number) { pagination.size = s; pagination.current = 1; fetchData() }
function handlePageChange(p: number) { pagination.current = p; fetchData() }

function getStatus(row: AssetItem) {
  return { label: statusLabel[row.status as AssetStatus] || row.status, type: statusTagType[row.status as AssetStatus] || '' }
}

function formatDate(iso: string) { return iso ? iso.slice(0, 10) : '-' }

const drawerVisible = ref(false)
const drawerAssetId = ref<number>()
function openView(id: number) { drawerAssetId.value = id; drawerVisible.value = true }

onMounted(() => { fetchData() })
</script>

<template>
  <div class="asset-view">
    <div class="search-bar">
      <el-input v-model="searchForm.keyword" placeholder="资产名称 / 编号" clearable style="width: 200px" @keyup.enter="handleSearch" />
      <el-select v-model="searchForm.status" style="width: 130px" @change="handleSearch">
        <el-option v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
      </el-select>
      <el-select v-model="searchForm.category" style="width: 130px" placeholder="全部分类" clearable @change="handleSearch">
        <el-option v-for="c in categoryOptions" :key="c.value" :label="c.label" :value="c.value" />
      </el-select>
      <el-button type="primary" @click="handleSearch"><el-icon><Search /></el-icon>搜索</el-button>
      <el-button @click="handleReset">重置</el-button>
    </div>

    <el-table :data="tableData" v-loading="loading" stripe>
      <el-table-column type="index" label="#" width="55" />
      <el-table-column label="资产名称" min-width="180" show-overflow-tooltip>
        <template #default="{ row }">
          <span class="table-link" @click="openView(row.id)">{{ row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="code" label="编号" width="150" />
      <el-table-column label="分类" width="110">
        <template #default="{ row }">{{ categoryLabel[row.category as AssetCategory] || row.category }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="getStatus(row).type" size="small">{{ getStatus(row).label }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="location" label="存放位置" width="140" show-overflow-tooltip />
      <el-table-column label="入库时间" width="110">
        <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
      </el-table-column>
    </el-table>

    <div class="pagination-bar" v-if="pagination.total > 0">
      <el-pagination v-model:current-page="pagination.current" v-model:page-size="pagination.size" :total="pagination.total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange" @current-change="handlePageChange" />
    </div>

    <AssetFormDrawer v-model:visible="drawerVisible" mode="view" :asset-id="drawerAssetId" />
  </div>
</template>

<style scoped>
.asset-view { background: #fff; border-radius: 8px; padding: 24px; }
.search-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
.pagination-bar { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
