<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Search, CircleCheck } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { createApplication } from '@/api/asset-applications'
import { getAssetList } from '@/api/assets'
import { categoryLabel, categoryOptions } from '@/types/asset'
import type { AssetItem, AssetCategory } from '@/types/asset'
import AssetFormDrawer from '@/views/admin/AssetFormDrawer.vue'

const formRef = ref<FormInstance>()
const submitting = ref(false)
const availableAssets = ref<AssetItem[]>([])

const searchKeyword = ref('')
const searchCategory = ref('')

const form = reactive({
  assetId: undefined as number | undefined,
  type: 'APPLY' as string,
  reason: '',
})

const rules: FormRules = {
  assetId: [{ required: true, message: '请选择要申领的资产', trigger: 'change' }],
  reason: [{ required: true, message: '请说明申领原因', trigger: 'blur' }],
}

const selectedAsset = computed(() =>
  availableAssets.value.find((a) => a.id === form.assetId) ?? null
)

const applyAssets = computed(() =>
  availableAssets.value.filter((a) => a.userId == null)
)

const filteredAssets = computed(() => {
  let list = applyAssets.value
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    list = list.filter(
      (a) => a.name.toLowerCase().includes(kw) || a.code.toLowerCase().includes(kw)
    )
  }
  if (searchCategory.value) {
    list = list.filter((a) => a.category === searchCategory.value)
  }
  return list
})

const hasActiveFilter = computed(() => searchKeyword.value || searchCategory.value)

function clearFilters() {
  searchKeyword.value = ''
  searchCategory.value = ''
}

async function loadAvailableAssets() {
  try {
    const res = await getAssetList({ page: 1, size: 500, status: 'IN_STORAGE', scope: 'region' })
    availableAssets.value = res.data.records
  } catch { /* ignore */ }
}

function getCategoryLabel(cat: string) {
  return categoryLabel[cat as AssetCategory] || cat
}

function selectAsset(id: number) {
  form.assetId = form.assetId === id ? undefined : id
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await createApplication({
      assetId: form.assetId!,
      reason: form.reason,
      type: form.type,
    })
    ElMessage.success('申领已提交，等待管理员审批')
    form.assetId = undefined
    form.reason = ''
    formRef.value?.resetFields()
    loadAvailableAssets()
  } catch { /* toast */ }
  finally { submitting.value = false }
}

const detailVisible = ref(false)
const detailAssetId = ref<number>()
function openDetail(id: number) {
  detailAssetId.value = id
  detailVisible.value = true
}

onMounted(() => { loadAvailableAssets() })
</script>

<template>
  <div class="apply-page">
    <div class="page-header">
      <div class="header-left">
        <h2>发起申领</h2>
        <span class="header-sub">选择在库资产并提交申领请求</span>
      </div>
    </div>

    <div class="layout">
      <!-- ===== 左侧：资产浏览 ===== -->
      <div class="layout-left">
        <!-- 搜索栏 -->
        <div class="search-section">
          <div class="search-row">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索资产名称或编号"
              clearable
              :prefix-icon="Search"
              class="search-input"
            />
            <el-select v-model="searchCategory" placeholder="全部品类" clearable class="search-category">
              <el-option v-for="c in categoryOptions" :key="c.value" :label="c.label" :value="c.value" />
            </el-select>
          </div>
          <div class="search-meta">
            <span>共 {{ filteredAssets.length }} 件可申领资产</span>
            <el-button v-if="hasActiveFilter" size="small" text type="primary" @click="clearFilters">清除筛选</el-button>
          </div>
        </div>

        <!-- 资产卡片列表 -->
        <div class="asset-list" v-if="filteredAssets.length > 0">
          <div
            v-for="a in filteredAssets"
            :key="a.id"
            class="asset-card"
            :class="{ selected: form.assetId === a.id }"
            @click="selectAsset(a.id)"
          >
            <div class="card-accent"></div>
            <div class="card-body">
              <div class="card-top">
                <div class="card-title-row">
                  <span class="card-name">{{ a.name }}</span>
                  <el-icon v-if="form.assetId === a.id" class="card-check" :size="18"><CircleCheck /></el-icon>
                </div>
                <span class="card-tag">{{ getCategoryLabel(a.category) }}</span>
              </div>
              <div class="card-meta">
                <span v-if="a.code" class="meta-item">{{ a.code }}</span>
                <template v-if="a.code && a.model"><span class="meta-sep">·</span></template>
                <span v-if="a.model" class="meta-item">{{ a.model }}</span>
                <template v-if="(a.code || a.model) && a.brand"><span class="meta-sep">·</span></template>
                <span v-if="a.brand" class="meta-item">{{ a.brand }}</span>
                <template v-if="(a.code || a.model || a.brand) && a.location"><span class="meta-sep">·</span></template>
                <span v-if="a.location" class="meta-item">{{ a.location }}</span>
              </div>
              <div class="card-bottom">
                <el-button size="small" text type="primary" @click.stop="openDetail(a.id)">查看详情</el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-state">
          <div class="empty-icon">
            <el-icon :size="36"><Search /></el-icon>
          </div>
          <p class="empty-title">{{ hasActiveFilter ? '没有匹配的资产' : '暂无可申领的在库资产' }}</p>
          <p class="empty-desc">
            {{ hasActiveFilter ? '尝试调整搜索条件或清除筛选' : '等待管理员录入资产后即可申领' }}
          </p>
          <el-button v-if="hasActiveFilter" size="small" @click="clearFilters">清除筛选</el-button>
        </div>
      </div>

      <!-- ===== 右侧：申领表单 ===== -->
      <div class="layout-right">
        <div class="form-panel">
          <div class="panel-header">
            <h3>申领信息</h3>
          </div>

          <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="panel-form">
            <!-- 已选资产 -->
            <div class="selected-section" :class="{ active: !!selectedAsset }">
              <div class="section-label">已选资产</div>
              <template v-if="selectedAsset">
                <div class="selected-card">
                  <div class="sc-left">
                    <span class="sc-name">{{ selectedAsset.name }}</span>
                    <div class="sc-meta">
                      <span>{{ selectedAsset.code }}</span>
                      <span class="meta-sep">·</span>
                      <span>{{ getCategoryLabel(selectedAsset.category) }}</span>
                    </div>
                    <div class="sc-detail" v-if="selectedAsset.model || selectedAsset.brand || selectedAsset.location">
                      <span v-if="selectedAsset.model">{{ selectedAsset.model }}</span>
                      <template v-if="selectedAsset.model && selectedAsset.brand"><span class="meta-sep">·</span></template>
                      <span v-if="selectedAsset.brand">{{ selectedAsset.brand }}</span>
                      <template v-if="(selectedAsset.model || selectedAsset.brand) && selectedAsset.location"><span class="meta-sep">·</span></template>
                      <span v-if="selectedAsset.location">{{ selectedAsset.location }}</span>
                    </div>
                  </div>
                  <div class="sc-actions">
                    <el-button size="small" text @click="openDetail(selectedAsset.id)">详情</el-button>
                    <el-button size="small" text type="danger" @click="form.assetId = undefined">取消</el-button>
                  </div>
                </div>
              </template>
              <div v-else class="selected-empty">点击左侧资产卡片进行选择</div>
            </div>

            <!-- 申领原因 -->
            <el-form-item label="申领原因" prop="reason">
              <el-input
                v-model="form.reason"
                type="textarea"
                :rows="4"
                placeholder="简要说明申领原因和使用用途"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>

            <!-- 提交 -->
            <el-button
              type="primary"
              size="large"
              :loading="submitting"
              :disabled="!form.assetId"
              class="submit-btn"
              @click="handleSubmit"
            >
              <el-icon><Plus /></el-icon>提交申领
            </el-button>
          </el-form>
        </div>
      </div>
    </div>

    <AssetFormDrawer v-model:visible="detailVisible" mode="view" :asset-id="detailAssetId" />
  </div>
</template>

<style scoped>
/* ── 页面根 ── */
.apply-page { padding: 4px 0; }

/* ── 头部 ── */
.page-header {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e8ecf1;
}
.header-left h2 {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.4px;
}
.header-sub {
  font-size: 13px;
  color: #94a3b8;
  margin-top: 2px;
  display: block;
}

/* ── 双栏布局 ── */
.layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}
.layout-left {
  flex: 1;
  min-width: 0;
}
.layout-right {
  width: 380px;
  flex-shrink: 0;
  position: sticky;
  top: 16px;
}

/* ── 搜索区 ── */
.search-section {
  margin-bottom: 20px;
}
.search-row {
  display: flex;
  gap: 10px;
}
.search-input { flex: 1; }
.search-category { width: 150px; flex-shrink: 0; }
.search-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 13px;
  color: #94a3b8;
  padding: 0 4px;
}

/* ── 资产列表 ── */
.asset-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.asset-card {
  display: flex;
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.12s;
}
.asset-card:hover {
  border-color: #cbd5e1;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.asset-card.selected {
  border-color: #409eff;
  background: #f5f9ff;
}

.card-accent {
  width: 3px;
  flex-shrink: 0;
  background: #e8ecf1;
  transition: background 0.15s;
}
.asset-card.selected .card-accent { background: #409eff; }

.card-body {
  flex: 1;
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}
.card-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex: 1;
}
.card-name {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.card-check { color: #409eff; flex-shrink: 0; }
.card-tag {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;
  flex-shrink: 0;
}

.card-meta {
  font-size: 12px;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  line-height: 1.5;
}
.meta-item { white-space: nowrap; }
.meta-sep { color: #e2e8f0; flex-shrink: 0; }

.card-bottom {
  padding-top: 2px;
}

/* ── 空状态 ── */
.empty-state {
  text-align: center;
  padding: 60px 20px;
}
.empty-icon {
  color: #cbd5e1;
  margin-bottom: 12px;
}
.empty-title {
  font-size: 15px;
  font-weight: 600;
  color: #475569;
  margin: 0 0 6px;
}
.empty-desc {
  font-size: 13px;
  color: #94a3b8;
  margin: 0 0 16px;
}

/* ── 右侧表单面板 ── */
.form-panel {
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04);
  overflow: hidden;
}
.panel-header {
  padding: 18px 24px;
  border-bottom: 1px solid #f1f5f9;
}
.panel-header h3 {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.2px;
}
.panel-form { padding: 20px 24px 24px; }

/* 已选资产区 */
.selected-section {
  margin-bottom: 20px;
}
.section-label {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
}
.selected-card {
  background: #f5f9ff;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  padding: 14px 16px;
}
.sc-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
}
.sc-name {
  font-size: 15px;
  font-weight: 700;
  color: #1e3a5f;
}
.sc-meta {
  font-size: 12px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 4px;
}
.sc-detail {
  font-size: 12px;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}
.sc-actions {
  display: flex;
  gap: 4px;
}
.selected-empty {
  font-size: 13px;
  color: #c0c8d4;
  background: #fafbfc;
  border: 1px dashed #e2e8f0;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
}

/* 提交按钮 */
.submit-btn {
  width: 100%;
  margin-top: 4px;
}

/* ── 响应式 ── */
@media (max-width: 1024px) {
  .layout {
    flex-direction: column;
    gap: 20px;
  }
  .layout-right {
    width: 100%;
    position: static;
  }
}
</style>
