<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getRegionList, patchRegionStatus, deleteRegion } from '@/api/regions'
import type { RegionItem } from '@/types/region'
import RegionFormDrawer from './RegionFormDrawer.vue'

const loading = ref(false)
const tableData = ref<RegionItem[]>([])
const searchKeyword = ref('')

async function fetchData() {
  loading.value = true
  try {
    const res = await getRegionList(searchKeyword.value || undefined)
    tableData.value = res.data.records
  } catch { tableData.value = [] }
  finally { loading.value = false }
}

function handleSearch() { fetchData() }
function handleReset() { searchKeyword.value = ''; fetchData() }

async function handleToggle(row: RegionItem) {
  const newStatus = row.status === 1 ? 0 : 1
  if (newStatus === 0 && row.isDefault === 1) {
    ElMessage.warning('默认分区不能停用')
    return
  }
  try {
    await patchRegionStatus(row.id, newStatus)
    ElMessage.success(newStatus === 1 ? '已启用' : '已停用')
    fetchData()
  } catch { /* toast */ }
}

function canDelete(row: RegionItem) { return row.isDefault !== 1 }

async function handleDelete(row: RegionItem) {
  try { await ElMessageBox.confirm(`确定删除分区「${row.name}」？`, '确认删除', { type: 'warning' }) }
  catch { return }
  try {
    await deleteRegion(row.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch { /* toast */ }
}

// 抽屉
const drawerVisible = ref(false)
const drawerMode = ref<'create' | 'edit' | 'view'>('create')
const drawerRegionId = ref<number>()

function openCreate() { drawerMode.value = 'create'; drawerRegionId.value = undefined; drawerVisible.value = true }
function openEdit(id: number) { drawerMode.value = 'edit'; drawerRegionId.value = id; drawerVisible.value = true }
function openView(id: number) { drawerMode.value = 'view'; drawerRegionId.value = id; drawerVisible.value = true }

onMounted(() => { fetchData() })
</script>

<template>
  <div class="region-list">
    <div class="search-bar">
      <el-input v-model="searchKeyword" placeholder="分区名称 / 标识" clearable style="width: 240px" @keyup.enter="handleSearch" />
      <el-button type="primary" @click="handleSearch"><el-icon><Search /></el-icon>搜索</el-button>
      <el-button @click="handleReset">重置</el-button>
      <el-button type="primary" class="add-btn" @click="openCreate"><el-icon><Plus /></el-icon>新增分区</el-button>
    </div>

    <el-table :data="tableData" v-loading="loading" stripe>
      <el-table-column type="index" label="#" width="55" />
      <el-table-column label="分区名称" min-width="140">
        <template #default="{ row }">
          <span class="table-link" @click="openView(row.id)">{{ row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="code" label="标识" width="120" />
      <el-table-column label="类型" width="90">
        <template #default="{ row }">
          <el-tag v-if="row.isDefault === 1" type="warning" size="small">默认</el-tag>
          <el-tag v-else type="info" size="small">普通</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
            {{ row.status === 1 ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <span class="table-action" @click="openEdit(row.id)">编辑</span>
          <span class="table-action" @click="handleToggle(row)">
            {{ row.status === 1 ? '停用' : '启用' }}
          </span>
          <span v-if="canDelete(row)" class="table-action-danger" @click="handleDelete(row)">删除</span>
        </template>
      </el-table-column>
    </el-table>

    <RegionFormDrawer v-model:visible="drawerVisible" :mode="drawerMode" :region-id="drawerRegionId" @saved="fetchData" />
  </div>
</template>

<style scoped>
.region-list { background: #fff; border-radius: 8px; padding: 24px; }
.search-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.add-btn { margin-left: auto; }
.text-muted { color: #94a3b8; font-size: 13px; }
</style>
