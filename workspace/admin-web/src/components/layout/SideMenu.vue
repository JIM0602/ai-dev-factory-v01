<template>
  <aside :class="['sidebar', { collapsed }]">
    <div class="sidebar-logo">
      <span class="logo-icon">豆</span>
      <span v-show="!collapsed" class="logo-text">拼豆店管理后台</span>
    </div>

    <nav class="sidebar-nav">
      <router-link
        v-for="item in menuItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="{ active: isActive(item.path) }"
      >
        <span class="nav-icon" v-html="item.icon"></span>
        <span v-show="!collapsed" class="nav-label">{{ item.label }}</span>
      </router-link>
    </nav>

    <div class="sidebar-footer">
      <button class="collapse-btn" @click="$emit('toggle')" :title="collapsed ? '展开菜单' : '折叠菜单'">
        <span v-if="collapsed">&#9654;</span>
        <span v-else>&#9664;</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

defineEmits<{
  toggle: []
}>()

defineProps<{
  collapsed: boolean
}>()

const route = useRoute()

const menuItems = [
  { path: '/dashboard', label: '工作台', icon: '&#9681;' },
  { path: '/reservations', label: '预约管理', icon: '&#9776;' },
  { path: '/members', label: '会员管理', icon: '&#9787;' },
  { path: '/coupons', label: '团购券', icon: '&#9733;' },
  { path: '/store/settings', label: '门店设置', icon: '&#9881;' },
  { path: '/store/rules', label: '预约规则', icon: '&#9878;' },
  { path: '/store/capacity', label: '容量设置', icon: '&#9864;' },
]

function isActive(path: string): boolean {
  return route.path === path || route.path.startsWith(path + '/')
}
</script>

<style scoped>
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: var(--sidebar-width);
  background: var(--sidebar-bg);
  display: flex;
  flex-direction: column;
  transition: width 0.25s ease;
  z-index: 100;
  overflow: hidden;
}

.sidebar.collapsed {
  width: var(--sidebar-collapsed-width);
}

.sidebar-logo {
  height: var(--header-height);
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.logo-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  flex-shrink: 0;
}

.logo-text {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
}

.sidebar-nav {
  flex: 1;
  padding: 12px 0;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  height: 44px;
  padding: 0 20px;
  color: var(--sidebar-text);
  text-decoration: none;
  font-size: 14px;
  gap: 12px;
  transition: background 0.15s, color 0.15s;
  cursor: pointer;
  white-space: nowrap;
}

.nav-item:hover {
  background: var(--sidebar-hover-bg);
  color: #fff;
}

.nav-item.active {
  background: var(--sidebar-active-bg);
  color: var(--sidebar-active-text);
  font-weight: 600;
}

.nav-icon {
  width: 20px;
  text-align: center;
  font-size: 16px;
  flex-shrink: 0;
  line-height: 1;
}

.nav-label {
  flex: 1;
}

.sidebar-footer {
  flex-shrink: 0;
  padding: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: center;
}

.collapse-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: var(--sidebar-text);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: background 0.15s, color 0.15s;
}

.collapse-btn:hover {
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
}
</style>
