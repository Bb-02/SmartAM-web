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
const deptList = ref<DepartmentItem[]>([])

const filteredDepts = computed(() => {
  let list = deptList.value
  if (searchForm.keyword) {
    const kw = searchForm.keyword.toLowerCase()
    list = list.filter((d) => d.name.toLowerCase().includes(kw) || d.code.toLowerCase().includes(kw))
  }
  if (searchForm.regionId) {
    list = list.filter((d) => d.regionId === searchForm.regionId)
  }
  return list
})

const groupedDepts = computed(() => {
  const groups: { regionId: number; regionName: string; depts: DepartmentItem[] }[] = []
  const ids = new Set<number>()
  for (const d of filteredDepts.value) {
    if (!ids.has(d.regionId)) {
      ids.add(d.regionId)
      groups.push({
        regionId: d.regionId,
        regionName: regionOptions.value.find((r) => r.id === d.regionId)?.name || `分区 ${d.regionId}`,
        depts: [],
      })
    }
    groups.find((g) => g.regionId === d.regionId)!.depts.push(d)
  }
  return groups
})

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
    deptList.value = res.data.records
  } catch { deptList.value = [] }
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

const drawerVisible = ref(false)
const drawerMode = ref<'create' | 'edit' | 'view'>('create')
const drawerDeptId = ref<number>()

function openCreate() { drawerMode.value = 'create'; drawerDeptId.value = undefined; drawerVisible.value = true }
function openEdit(id: number) { drawerMode.value = 'edit'; drawerDeptId.value = id; drawerVisible.value = true }
function openView(id: number) { drawerMode.value = 'view'; drawerDeptId.value = id; drawerVisible.value = true }

const hasActiveFilter = computed(() => searchForm.regionId || searchForm.keyword)

onMounted(async () => {
  await loadRegions()
  fetchData()
})
</script>

<template>
  <div class="dept-page">
    <div class="page-header">
      <div class="header-left">
        <h2>部门管理</h2>
        <span class="header-count">{{ filteredDepts.length }} 个部门</span>
      </div>
      <div class="header-right">
        <el-input v-model="searchForm.keyword" placeholder="搜索部门..." clearable style="width: 200px" @keyup.enter="handleSearch" @clear="handleSearch" />
        <el-select v-if="isTenantAdmin" v-model="searchForm.regionId" style="width: 150px" placeholder="全部分区" clearable @change="handleSearch">
          <el-option v-for="r in regionOptions" :key="r.id" :label="r.name" :value="r.id" />
        </el-select>
        <el-button v-if="hasActiveFilter" @click="handleReset" text>重置</el-button>
        <el-button type="primary" @click="openCreate"><el-icon><Plus /></el-icon>新增部门</el-button>
      </div>
    </div>

    <div class="region-groups" v-loading="loading">
      <template v-if="groupedDepts.length > 0">
        <section v-for="group in groupedDepts" :key="group.regionId" class="region-section">
          <div class="section-head">
            <div class="section-head-left">
              <span class="section-marker"></span>
              <h3 class="section-title">{{ group.regionName }}</h3>
              <span class="section-count">{{ group.depts.length }} 个部门</span>
            </div>
          </div>

          <div class="dept-grid">
            <div
              v-for="d in group.depts"
              :key="d.id"
              class="dept-card"
              :class="{ 'is-disabled': d.status === 0 }"
              @click="openView(d.id)"
            >
              <div class="dept-accent" :class="d.status === 1 ? 'on' : 'off'"></div>
              <div class="dept-inner">
                <div class="dept-head">
                  <span class="dept-name">{{ d.name }}</span>
                  <el-tag :type="d.status === 1 ? 'success' : 'danger'" size="small" effect="light">
                    {{ d.status === 1 ? '启用' : '禁用' }}
                  </el-tag>
                </div>
                <span class="dept-code">{{ d.code }}</span>
                <div class="dept-actions" @click.stop>
                  <button class="dact-btn dact-edit" @click="openEdit(d.id)">编辑</button>
                  <button class="dact-btn dact-del" @click="handleDelete(d)">删除</button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </template>

      <div v-else class="empty-state">
        <div class="empty-icon"><el-icon :size="40"><OfficeBuilding /></el-icon></div>
        <p class="empty-title">{{ deptList.length === 0 ? '暂无部门' : '没有匹配的部门' }}</p>
        <p class="empty-desc" v-if="deptList.length === 0">创建部门来组织人员结构</p>
        <el-button v-if="deptList.length === 0" type="primary" @click="openCreate">创建第一个部门</el-button>
      </div>
    </div>

    <DeptFormDrawer v-model:visible="drawerVisible" :mode="drawerMode" :dept-id="drawerDeptId" @saved="fetchData" />
  </div>
</template>

<style scoped>
.dept-page { padding: 4px 0; }

/* ── 页面标题 ── */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
}
.header-left { display: flex; align-items: baseline; gap: 14px; }
.header-left h2 {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.4px;
}
.header-count { font-size: 14px; color: #94a3b8; }
.header-right { display: flex; align-items: center; gap: 10px; }

/* ── 分区区块 ── */
.region-groups { min-height: 100px; }
.region-section { margin-bottom: 32px; }

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e8ecf1;
}
.section-head-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.section-marker {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: #2563eb;
  flex-shrink: 0;
}
.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}
.section-count {
  font-size: 13px;
  color: #94a3b8;
}

/* ── 部门卡片 ── */
.dept-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
}

.dept-card {
  display: flex;
  background: linear-gradient(135deg, #fdfdfd 0%, #f9fafb 100%);
  border: 1px solid #e8ecf1;
  border-radius: 10px;
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  box-shadow:
    0 1px 2px rgba(0,0,0,0.02),
    0 2px 6px rgba(0,0,0,0.03);
}
.dept-card:hover {
  transform: translateY(-2px);
  box-shadow:
    0 1px 2px rgba(0,0,0,0.03),
    0 6px 18px rgba(0,0,0,0.06);
}
.dept-card.is-disabled { opacity: 0.5; }
.dept-card.is-disabled:hover { opacity: 0.65; }

.dept-accent {
  width: 4px;
  flex-shrink: 0;
}
.dept-accent.on  { background: linear-gradient(180deg, #16a34a, #22c55e); }
.dept-accent.off { background: #cbd5e1; }

.dept-inner {
  flex: 1;
  padding: 18px 22px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dept-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.dept-name {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  letter-spacing: -0.2px;
}
.dept-code {
  font-size: 12px;
  font-weight: 500;
  color: #94a3b8;
}

.dept-actions {
  display: flex;
  gap: 2px;
  padding-top: 8px;
  border-top: 1px solid #e8ecf1;
}
.dact-btn {
  border: none;
  background: none;
  font-size: 13px;
  font-weight: 500;
  padding: 5px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
  font-family: inherit;
  color: #475569;
}
.dact-btn:hover { background: #e8ecf1; color: #0f172a; }
.dact-btn.dact-edit { color: #409eff; }
.dact-btn.dact-edit:hover { background: rgba(64,158,255,0.08); color: #2979d1; }
.dact-btn.dact-del { color: #dc2626; }
.dact-btn.dact-del:hover { background: #fef2f2; color: #b91c1c; }

/* ── 空状态 ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64px 0;
}
.empty-icon { color: #cbd5e1; margin-bottom: 16px; }
.empty-title { font-size: 16px; font-weight: 600; color: #475569; margin: 0 0 4px; }
.empty-desc { font-size: 14px; color: #94a3b8; margin: 0 0 20px; }
</style>
