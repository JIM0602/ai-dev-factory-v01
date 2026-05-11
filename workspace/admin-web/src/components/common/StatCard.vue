<template>
  <div class="stat-card" :class="{ clickable }" @click="clickable && $emit('click')">
    <div class="stat-label">{{ label }}</div>
    <div class="stat-value" :style="{ color: valueColor }">
      <span v-if="loading" class="stat-loading">—</span>
      <template v-else>
        <span class="stat-number">{{ value }}</span>
        <span v-if="unit" class="stat-unit">{{ unit }}</span>
      </template>
    </div>
    <div v-if="subtitle" class="stat-subtitle">{{ subtitle }}</div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    value: string | number
    unit?: string
    subtitle?: string
    valueColor?: string
    loading?: boolean
    clickable?: boolean
  }>(),
  {
    valueColor: 'var(--color-primary)',
    loading: false,
    clickable: false,
  }
)

defineEmits<{
  click: []
}>()
</script>

<style scoped>
.stat-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: 20px 24px;
  min-width: 160px;
  flex: 1;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.stat-card.clickable {
  cursor: pointer;
}

.stat-card.clickable:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.stat-label {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.stat-number {
  font-variant-numeric: tabular-nums;
}

.stat-unit {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.stat-loading {
  color: var(--color-text-placeholder);
}

.stat-subtitle {
  font-size: 12px;
  color: var(--color-text-placeholder);
  margin-top: 4px;
}
</style>
