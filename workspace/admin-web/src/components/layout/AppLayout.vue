<template>
  <div class="app-layout" :class="{ 'sidebar-collapsed': collapsed }">
    <SideMenu :collapsed="collapsed" @toggle="collapsed = !collapsed" />
    <div class="main-area" :style="{ marginLeft: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)' }">
      <TopHeader :title="pageTitle" />
      <main class="main-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useStoreStore } from '@/store/store'
import SideMenu from './SideMenu.vue'
import TopHeader from './TopHeader.vue'

const route = useRoute()
const storeStore = useStoreStore()
const collapsed = ref(false)

const pageTitle = computed(() => {
  return (route.meta?.title as string) || '拼豆店管理后台'
})

onMounted(() => {
  // 加载门店配置用于顶栏展示
  storeStore.fetchConfig()
})
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.25s ease;
  min-width: 0;
}

.main-content {
  flex: 1;
  background: var(--color-bg-page);
  overflow-y: auto;
}
</style>
