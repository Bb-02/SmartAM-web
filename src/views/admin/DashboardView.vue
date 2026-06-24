<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
const authStore = useAuthStore()
</script>

<template>
  <div class="admin-dashboard">
    <h2>{{ authStore.companyName || 'SmartAM' }}</h2>
    <p class="subtitle">欢迎，{{ authStore.realName }}</p>
    <el-divider />
    <el-empty description="数据概览 — 即将开发" />
  </div>
</template>

<style scoped>
.admin-dashboard h2 { font-size: 22px; color: #1e293b; }
.subtitle { color: #64748b; margin-top: 4px; }
</style>
