<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getAssetList } from '@/api/assets'
import { useAuthStore } from '@/stores/auth'
import { statusLabel, categoryLabel } from '@/types/asset'
import type { AssetItem, AssetStatus, AssetCategory } from '@/types/asset'
import AssetFormDrawer from '@/views/admin/AssetFormDrawer.vue'

const authStore = useAuthStore()
const loading = ref(false)
const assetList = ref<AssetItem[]>([])

const statusColor: Record<string, string> = {
  IN_STORAGE: '#94a3b8', IN_USE: '#16a34a', IN_REPAIR: '#d97706', SCRAPPED: '#dc2626',
}

async function fetchData() {
  loading.value = true
  try {
    const res = await getAssetList({ page: 1, size: 500 })
    assetList.value = res.data.records.filter((a) => a.userId === authStore.userId)
  } catch { assetList.value = [] }
  finally { loading.value = false }
}

function getCategoryLabel(cat: string) { return categoryLabel[cat as AssetCategory] || cat }
function formatDate(iso: string) { return iso ? iso.slice(0, 10) : '-' }

const drawerVisible = ref(false)
const drawerAssetId = ref<number>()
function openView(id: number) { drawerAssetId.value = id; drawerVisible.value = true }

onMounted(() => { fetchData() })
</script>

<template>
  <div class="my-assets-page">
    <div class="page-header">
      <div class="header-left">
        <h2>我的资产</h2>
        <span class="header-count">{{ assetList.length }} 件资产</span>
      </div>
    </div>

    <!-- 卡片网格 -->
    <div class="asset-grid" v-loading="loading">
      <template v-if="assetList.length > 0">
        <div v-for="a in assetList" :key="a.id" class="asset-card" @click="openView(a.id)">
          <div class="card-accent" :style="{ background: statusColor[a.status] || '#94a3b8' }"></div>
          <div class="card-inner">
            <div class="card-head">
              <span class="card-name">{{ a.name }}</span>
              <span class="card-tag" :style="{ background: (statusColor[a.status] || '#94a3b8') + '18', color: statusColor[a.status] || '#94a3b8' }">
                {{ statusLabel[a.status as AssetStatus] || a.status }}
              </span>
            </div>
            <div class="card-info">
              <span class="info-item">{{ getCategoryLabel(a.category) }}</span>
              <span class="info-sep">·</span>
              <span class="info-item">{{ a.code }}</span>
              <span class="info-sep">·</span>
              <span class="info-item">{{ a.location || '未指定位置' }}</span>
            </div>
          </div>
        </div>
      </template>
      <div v-else class="empty-state">
        <el-icon :size="44" color="#cbd5e1"><Goods /></el-icon>
        <p class="empty-title">暂无领用的资产</p>
        <p class="empty-desc">管理员分配资产后，这里会显示你的资产列表</p>
      </div>
    </div>

    <AssetFormDrawer v-model:visible="drawerVisible" mode="view" :asset-id="drawerAssetId" />
  </div>
</template>

<style scoped>
.my-assets-page { padding: 4px 0; }

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e8ecf1;
}
.header-left { display: flex; align-items: baseline; gap: 14px; }
.header-left h2 { font-size: 22px; font-weight: 700; color: #0f172a; letter-spacing: -0.4px; }
.header-count { font-size: 14px; color: #94a3b8; }

.asset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  min-height: 100px;
}

.asset-card {
  display: flex;
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 10px;
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.15s, box-shadow 0.15s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.02), 0 2px 6px rgba(0,0,0,0.03);
}
.asset-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 1px 2px rgba(0,0,0,0.03), 0 6px 18px rgba(0,0,0,0.06);
}

.card-accent {
  width: 4px;
  flex-shrink: 0;
}

.card-inner {
  flex: 1;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.card-name {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.card-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 12px;
  flex-shrink: 0;
}
.card-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #94a3b8;
}
.info-sep { color: #e2e8f0; }

.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64px 0;
}
.empty-title { font-size: 16px; font-weight: 600; color: #475569; margin: 16px 0 4px; }
.empty-desc { font-size: 14px; color: #94a3b8; margin: 0; }
</style>
