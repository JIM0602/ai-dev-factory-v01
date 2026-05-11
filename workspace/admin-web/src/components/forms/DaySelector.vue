<template>
  <div class="day-selector">
    <el-checkbox-group :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
      <el-checkbox
        v-for="day in WEEKDAY_OPTIONS"
        :key="day.value"
        :label="day.value"
        :value="day.value"
      >
        {{ day.label }}
      </el-checkbox>
    </el-checkbox-group>
  </div>
</template>

<script setup lang="ts">
import { WEEKDAY_OPTIONS } from '@/utils/constants'

defineProps<{
  modelValue: number[]
}>()

defineEmits<{
  'update:modelValue': [value: number[]]
}>()
</script>

<script lang="ts">
export default {
  name: 'DaySelector',
}
</script>

<style scoped>
.day-selector {
  display: flex;
}

.day-selector :deep(.el-checkbox-group) {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
</style>
