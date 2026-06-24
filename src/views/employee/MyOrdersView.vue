<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getWorkOrderList } from '@/api/work-orders'
import { useAuthStore } from '@/stores/auth'
import { WO_STATUS_LABEL, WO_STATUS_TAG, PRIORITY_LABEL, PRIORITY_TAG } from '@/types/work-order'
import type { WorkOrderItem, WorkOrderStatus } from '@/types/work-order'
import WorkOrderDetailDrawer from '@/views/engineer/WorkOrderDetailDrawer.vue'

const authStore = useAuthStore()

const searchForm = reactive({ keyword: '', status: '' })
const loading = ref(false)
const tableData = ref<WorkOrderItem[]>([])
const pagination = reactive({ current: 1, size: 20, total: 0 })

const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '待受理', value: 'PENDING' },
  { label: '处理中', value: 'IN_WORK' },
  { label: '已解决', value: 'RESOLVED' },
  { label: '已结单', value: 'CLOSED' },
]

async function fetchData() {
  loading.value = true
  try {
    const res = await getWorkOrderList({
      page: pagination.current,
      size: pagination.size,
      status: searchForm.status || undefined,
    })
    let records = res.data.records.filter((r) => r.reporterId === authStore.userId)
    if (searchForm.keyword) {
      const kw = searchForm.keyword.toLowerCase()
      records = records.filter((r) => r.title.toLowerCase().includes(kw))
    }
    tableData.value = records
    pagination.total = records.length
  } catch { tableData.value = [] }
  finally { loading.value = false }
}

function handleSearch() { pagination.current = 1; fetchData() }
function handleReset() { searchForm.keyword = ''; searchForm.status = ''; pagination.current = 1; fetchData() }
function handleSizeChange(s: number) { pagination.size = s; pagination.current = 1; fetchData() }
function handlePageChange(p: number) { pagination.current = p; fetchData() }

function formatDate(iso: string) { return iso ? iso.slice(0, 10) : '-' }

const detailVisible = ref(false)
const detailId = ref(0)
function openDetail(id: number) { detailId.value = id; detailVisible.value = true }
function onActionDone() { fetchData() }

onMounted(() => { fetchData() })
</script>

<template>
  <div class="my-orders">
    <div class="search-bar">
      <el-input v-model="searchForm.keyword" placeholder="搜索标题" clearable style="width: 200px" @keyup.enter="handleSearch" />
      <el-select v-model="searchForm.status" style="width: 120px" @change="handleSearch">
        <el-option v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value" />
      </el-select>
      <el-button type="primary" @click="handleSearch"><el-icon><Search /></el-icon>搜索</el-button>
      <el-button @click="handleReset">重置</el-button>
    </div>

    <el-table :data="tableData" v-loading="loading" stripe>
      <el-table-column type="index" label="#" width="55" />
      <el-table-column label="标题" min-width="200" show-overflow-tooltip>
        <template #default="{ row }">
          <span class="table-link" @click="openDetail(row.id)">{{ row.title }}</span>
        </template>
      </el-table-column>
      <el-table-column label="类型" width="80">
        <template #default="{ row }">
          <el-tag size="small" type="warning">{{ row.type === 'REPAIR' ? '报修' : row.type }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="优先级" width="80">
        <template #default="{ row }">
          <el-tag :type="PRIORITY_TAG[row.priority] || ''" size="small">
            {{ PRIORITY_LABEL[row.priority] || row.priority }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="WO_STATUS_TAG[row.status as WorkOrderStatus] || ''" size="small">
            {{ WO_STATUS_LABEL[row.status as WorkOrderStatus] || row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="engineerName" label="工程师" width="100">
        <template #default="{ row }">
          <span>{{ row.engineerName || '—' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="提交时间" width="110">
        <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
      </el-table-column>
    </el-table>

    <div class="pagination-bar" v-if="pagination.total > 0">
      <el-pagination v-model:current-page="pagination.current" v-model:page-size="pagination.size" :total="pagination.total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange" @current-change="handlePageChange" />
    </div>

    <el-empty v-if="!loading && tableData.length === 0" description="暂无工单" />

    <WorkOrderDetailDrawer v-model:visible="detailVisible" :work-order-id="detailId" @action-done="onActionDone" />
  </div>
</template>

<style scoped>
.my-orders { background: #fff; border-radius: 8px; padding: 24px; }
.search-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.pagination-bar { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
