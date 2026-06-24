<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getAssetList } from '@/api/assets'
import { useAuthStore } from '@/stores/auth'
import { statusLabel, statusTagType, categoryLabel } from '@/types/asset'
import type { AssetItem, AssetStatus, AssetCategory } from '@/types/asset'
import AssetFormDrawer from '@/views/admin/AssetFormDrawer.vue'

const authStore = useAuthStore()
const loading = ref(false)
const tableData = ref<AssetItem[]>([])

async function fetchData() {
  loading.value = true
  try {
    const res = await getAssetList({ page: 1, size: 500 })
    // 只显示领用人是自己的资产
    tableData.value = res.data.records.filter((a) => a.userId === authStore.userId)
  } catch { tableData.value = [] }
  finally { loading.value = false }
}

function getCategoryLabel(cat: string) {
  return categoryLabel[cat as AssetCategory] || cat
}
function formatDate(iso: string) { return iso ? iso.slice(0, 10) : '-' }

// 查看详情
const drawerVisible = ref(false)
const drawerAssetId = ref<number>()
function openView(id: number) { drawerAssetId.value = id; drawerVisible.value = true }

onMounted(() => { fetchData() })
</script>

<template>
  <div class="my-assets">
    <div class="page-header">
      <h2>我的资产</h2>
      <span class="count-badge">{{ tableData.length }} 件</span>
    </div>

    <el-table :data="tableData" v-loading="loading" stripe>
      <el-table-column type="index" label="#" width="55" />
      <el-table-column label="资产名称" min-width="180">
        <template #default="{ row }">
          <span class="table-link" @click="openView(row.id)">{{ row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="code" label="编号" width="150" />
      <el-table-column label="品类" width="110">
        <template #default="{ row }">{{ getCategoryLabel(row.category) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="statusTagType[row.status as AssetStatus] || ''" size="small">
            {{ statusLabel[row.status as AssetStatus] || row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="location" label="存放位置" width="140" show-overflow-tooltip />
      <el-table-column label="领用时间" width="110">
        <template #default="{ row }">{{ formatDate(row.updatedAt) }}</template>
      </el-table-column>
    </el-table>

    <el-empty v-if="!loading && tableData.length === 0" description="暂无领用的资产" />

    <AssetFormDrawer v-model:visible="drawerVisible" mode="view" :asset-id="drawerAssetId" />
  </div>
</template>

<style scoped>
.my-assets { background: #fff; border-radius: 8px; padding: 24px; }
.page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.page-header h2 { font-size: 18px; color: #1e293b; }
.count-badge { background: #eff6ff; color: #1e3a5f; font-size: 13px; padding: 2px 10px; border-radius: 12px; }
</style>
