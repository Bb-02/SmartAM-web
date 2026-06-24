<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getWorkOrderList, claimWorkOrder } from '@/api/work-orders'
import { PRIORITY_LABEL, PRIORITY_TAG } from '@/types/work-order'
import type { WorkOrderItem } from '@/types/work-order'

const searchForm = reactive({ keyword: '', priority: '' })
const loading = ref(false)
const tableData = ref<WorkOrderItem[]>([])
const pagination = reactive({ current: 1, size: 20, total: 0 })

async function fetchData() {
  loading.value = true
  try {
    const res = await getWorkOrderList({
      page: pagination.current,
      size: pagination.size,
      status: 'PENDING',
      priority: searchForm.priority || undefined,
    })
    // 前端按标题搜索（后端可能不支持 keyword，这里做兜底）
    let records = res.data.records
    if (searchForm.keyword) {
      const kw = searchForm.keyword.toLowerCase()
      records = records.filter((r) => r.title.toLowerCase().includes(kw))
    }
    tableData.value = records
    pagination.total = res.data.total
  } catch { tableData.value = [] }
  finally { loading.value = false }
}

function handleSearch() { pagination.current = 1; fetchData() }
function handleReset() { searchForm.keyword = ''; searchForm.priority = ''; pagination.current = 1; fetchData() }
function handleSizeChange(s: number) { pagination.size = s; pagination.current = 1; fetchData() }
function handlePageChange(p: number) { pagination.current = p; fetchData() }

async function handleClaim(row: WorkOrderItem) {
  try { await ElMessageBox.confirm(`确定受理工单「${row.title}」？`, '确认接单', { type: 'info' }) }
  catch { return }
  try {
    await claimWorkOrder(row.id)
    ElMessage.success('接单成功')
    fetchData()
  } catch { /* toast */ }
}

function formatDate(iso: string) { return iso ? iso.slice(0, 10) : '-' }

onMounted(() => { fetchData() })
</script>

<template>
  <div class="work-order-pool">
    <div class="search-bar">
      <el-input v-model="searchForm.keyword" placeholder="搜索标题" clearable style="width: 200px" @keyup.enter="handleSearch" />
      <el-select v-model="searchForm.priority" style="width: 120px" placeholder="全部优先级" clearable @change="handleSearch">
        <el-option label="低" value="LOW" />
        <el-option label="普通" value="NORMAL" />
        <el-option label="高" value="HIGH" />
        <el-option label="紧急" value="URGENT" />
      </el-select>
      <el-button type="primary" @click="handleSearch"><el-icon><Search /></el-icon>搜索</el-button>
      <el-button @click="handleReset">重置</el-button>
    </div>

    <el-table :data="tableData" v-loading="loading" stripe>
      <el-table-column type="index" label="#" width="55" />
      <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
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
      <el-table-column prop="reporterName" label="提交人" width="100" />
      <el-table-column label="提交时间" width="110">
        <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="80" fixed="right">
        <template #default="{ row }">
          <span class="table-action" @click="handleClaim(row)">接单</span>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-bar" v-if="pagination.total > 0">
      <el-pagination v-model:current-page="pagination.current" v-model:page-size="pagination.size" :total="pagination.total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange" @current-change="handlePageChange" />
    </div>

    <el-empty v-if="!loading && tableData.length === 0" description="暂无待受理工单" />
  </div>
</template>

<style scoped>
.work-order-pool { background: #fff; border-radius: 8px; padding: 24px; }
.search-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.pagination-bar { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
