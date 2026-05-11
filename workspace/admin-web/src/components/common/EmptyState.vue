<template>
  <div class="empty-state">
    <div class="empty-icon">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="12" width="32" height="28" rx="3" stroke="currentColor" stroke-width="1.5" fill="none" />
        <line x1="8" y1="20" x2="40" y2="20" stroke="currentColor" stroke-width="1.5" />
        <line x1="20" y1="40" x2="20" y2="20" stroke="currentColor" stroke-width="1.5" />
        <line x1="14" y1="16" x2="16" y2="16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        <line x1="22" y1="16" x2="24" y2="16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
    </div>
    <p class="empty-text">{{ description }}</p>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  description: string
}>()
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  min-height: 200px;
}

.empty-icon {
  color: var(--color-text-placeholder);
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-text {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0 0 16px;
  text-align: center;
}
</style>
