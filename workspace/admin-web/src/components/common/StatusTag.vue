<template>
  <span class="status-tag" :style="tagStyle">
    <span class="status-shape">{{ shape }}</span>
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { STATUS_CONFIG } from '@/utils/constants'

const props = defineProps<{
  status: string
}>()

const config = computed(() => {
  return STATUS_CONFIG[props.status] || {
    label: props.status || '未知',
    color: '#B8AAA5',
    bgColor: '#F5F3F1',
    shape: '?',
  }
})

const label = computed(() => config.value.label)
const shape = computed(() => config.value.shape)

const tagStyle = computed(() => ({
  color: config.value.color,
  backgroundColor: config.value.bgColor,
}))
</script>

<style scoped>
.status-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border-radius: var(--radius-tag);
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  line-height: 20px;
}

.status-shape {
  font-size: 14px;
  line-height: 1;
}
</style>
