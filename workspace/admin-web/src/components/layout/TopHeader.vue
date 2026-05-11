<template>
  <header class="top-header">
    <div class="header-left">
      <h2 class="page-title">{{ title }}</h2>
    </div>
    <div class="header-right">
      <div class="store-badge" v-if="storeName">
        <span class="store-dot"></span>
        {{ storeName }}
      </div>
      <div class="user-info">
        <span class="user-avatar">{{ userInitial }}</span>
        <span class="user-name">{{ username }}</span>
      </div>
      <button class="logout-btn" @click="handleLogout" title="退出登录">
        退出
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { useStoreStore } from '@/store/store'

defineProps<{
  title: string
}>()

const router = useRouter()
const authStore = useAuthStore()
const storeStore = useStoreStore()

const username = computed(() => authStore.username || '管理员')
const storeName = computed(() => storeStore.config?.name || '')
const userInitial = computed(() => (username.value || '管').charAt(0))

function handleLogout(): void {
  authStore.logout()
  storeStore.clearConfig()
  router.push('/login')
}
</script>

<style scoped>
.top-header {
  height: var(--header-height);
  background: var(--header-bg);
  border-bottom: 1px solid var(--header-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
}

.page-title {
  font: var(--font-web-h2);
  color: var(--color-text-primary);
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.store-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: var(--color-bg-surface);
  border-radius: 12px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.store-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-success);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-primary-bg);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
}

.user-name {
  font-size: 14px;
  color: var(--color-text-primary);
}

.logout-btn {
  padding: 6px 14px;
  border: 1px solid var(--color-border);
  background: #fff;
  color: var(--color-text-secondary);
  border-radius: var(--radius-button-sm);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.logout-btn:hover {
  color: var(--color-danger);
  border-color: var(--color-danger);
}
</style>
