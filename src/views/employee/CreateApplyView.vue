<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { getAssetList } from '@/api/assets'
import { useAuthStore } from '@/stores/auth'
import { categoryLabel } from '@/types/asset'
import type { AssetItem, AssetCategory } from '@/types/asset'

const authStore = useAuthStore()
const formRef = ref<FormInstance>()
const submitting = ref(false)
const availableAssets = ref<AssetItem[]>([])

const form = reactive({
  assetId: undefined as number | undefined,
  reason: '',
})

const rules: FormRules = {
  reason: [{ required: true, message: '请输入申领原因', trigger: 'blur' }],
}

async function loadAvailableAssets() {
  try {
    const res = await getAssetList({ page: 1, size: 500 })
    // 只展示在库且未分配的资产
    availableAssets.value = res.data.records.filter(
      (a) => a.status === 'IN_STORAGE'
    )
  } catch { /* ignore */ }
}

function getCategoryLabel(cat: string) {
  return categoryLabel[cat as AssetCategory] || cat
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  // 申领功能待后端接口
  ElMessage.info('申领功能将在后续版本中开放')
}

onMounted(() => { loadAvailableAssets() })
</script>

<template>
  <div class="apply-page">
    <div class="page-header">
      <div class="header-left">
        <h2>发起申领</h2>
        <span class="header-sub">申请领用库内资产</span>
      </div>
    </div>

    <div class="form-card">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="form-body">
        <el-form-item label="选择资产" prop="assetId">
          <el-select v-model="form.assetId" style="width: 100%" placeholder="选择要申领的资产" clearable filterable size="large">
            <el-option
              v-for="a in availableAssets"
              :key="a.id"
              :label="`${a.name} (${a.code}) — ${getCategoryLabel(a.category)}`"
              :value="a.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="申领原因" prop="reason">
          <el-input v-model="form.reason" type="textarea" :rows="4" placeholder="请说明申领原因和用途" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" size="large" :loading="submitting" @click="handleSubmit">
            <el-icon><Plus /></el-icon>提交申领
          </el-button>
          <span class="form-hint">申领功能将在后续版本中开放</span>
        </el-form-item>
      </el-form>
    </div>

    <!-- 可申领资产预览 -->
    <div class="section-title">可申领资产</div>
    <div class="asset-grid" v-if="availableAssets.length > 0">
      <div v-for="a in availableAssets" :key="a.id" class="asset-card" @click="form.assetId = a.id">
        <div class="card-accent" :class="{ selected: form.assetId === a.id }"></div>
        <div class="card-inner">
          <span class="card-name">{{ a.name }}</span>
          <span class="card-meta">{{ a.code }} · {{ getCategoryLabel(a.category) }}</span>
        </div>
      </div>
    </div>
    <div v-else class="empty-hint">暂无可申领的在库资产</div>
  </div>
</template>

<style scoped>
.apply-page { padding: 4px 0; }

.page-header {
  margin-bottom: 28px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e8ecf1;
}
.header-left h2 {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.4px;
}
.header-sub {
  font-size: 14px;
  color: #94a3b8;
  margin-top: 4px;
  display: block;
}

.form-card {
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 12px;
  padding: 32px 36px;
  margin-bottom: 36px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02);
}
.form-body { max-width: 680px; }
.form-hint {
  font-size: 13px;
  color: #94a3b8;
  margin-left: 16px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 16px;
}

.asset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}
.asset-card {
  display: flex;
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 8px;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.asset-card:hover { border-color: #bfdbfe; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }

.card-accent {
  width: 4px;
  flex-shrink: 0;
  background: #e8ecf1;
  transition: background 0.15s;
}
.card-accent.selected { background: #409eff; }

.card-inner {
  flex: 1;
  padding: 14px 18px;
}
.card-name {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  display: block;
}
.card-meta {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 3px;
  display: block;
}

.empty-hint {
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
  padding: 36px 0;
}
</style>
