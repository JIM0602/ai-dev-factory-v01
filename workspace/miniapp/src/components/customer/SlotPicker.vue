<script setup lang="ts">
import type { SlotInfo } from '@/api/reservation';

interface Props {
  slots: SlotInfo[];
  modelValue: string;
  loading?: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  select: [slot: SlotInfo];
}>();

function handleSelect(slot: SlotInfo): void {
  if (!slot.is_available) return;
  const value = `${slot.start_time}-${slot.end_time}`;
  emit('update:modelValue', value);
  emit('select', slot);
}
</script>

<template>
  <view class="slot-picker">
    <LoadingSkeleton v-if="loading" type="list" :count="3" />
    <template v-else-if="slots.length === 0">
      <view class="slot-empty">
        <text class="slot-empty-text">该日期无可用时段</text>
      </view>
    </template>
    <template v-else>
      <view class="slot-grid">
        <view
          v-for="slot in slots"
          :key="`${slot.start_time}-${slot.end_time}`"
          class="slot-item"
          :class="{
            'slot-item--selected': modelValue === `${slot.start_time}-${slot.end_time}`,
            'slot-item--disabled': !slot.is_available,
            'slot-item--past': slot.is_past,
          }"
          @tap="handleSelect(slot)"
        >
          <view class="slot-time-row">
            <text class="slot-time">{{ slot.start_time }} - {{ slot.end_time }}</text>
            <text v-if="!slot.is_available && !slot.is_past" class="slot-full">已满</text>
            <text v-else-if="slot.is_past" class="slot-past">已过</text>
            <text v-else class="slot-available">余 {{ slot.available_count }} 位</text>
          </view>
          <!-- 容量进度条 -->
          <view v-if="!slot.is_past" class="slot-progress">
            <view
              class="slot-progress-fill"
              :style="{
                width: `${slot.total_tables > 0 ? (slot.booked_count / slot.total_tables) * 100 : 0}%`,
                backgroundColor: slot.available_count === 0 ? '#E76F51' : slot.available_count <= 2 ? '#E8A040' : '#81B29A',
              }"
            />
          </view>
        </view>
      </view>
    </template>
  </view>
</template>

<style scoped>
.slot-picker {
  padding: var(--space-sm) 0;
}

.slot-empty {
  padding: var(--space-xl);
  text-align: center;
}

.slot-empty-text {
  font-size: 26rpx;
  color: var(--color-text-placeholder);
}

.slot-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.slot-item {
  width: calc(50% - 8rpx);
  padding: var(--space-sm) var(--space-md);
  background: var(--color-bg-card);
  border: 2rpx solid var(--color-border);
  border-radius: var(--radius-input);
  min-height: 72rpx;
  transition: all 150ms;
}

.slot-item--selected {
  background: var(--color-primary-bg);
  border-color: var(--color-primary);
}

.slot-item--disabled {
  opacity: 0.45;
}

.slot-item--past {
  opacity: 0.35;
}

.slot-time-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8rpx;
}

.slot-time {
  font-size: 26rpx;
  font-weight: 500;
  color: var(--color-text-primary);
}

.slot-available {
  font-size: 22rpx;
  color: var(--color-secondary);
  font-weight: 500;
}

.slot-full {
  font-size: 22rpx;
  color: var(--color-danger);
  font-weight: 500;
}

.slot-past {
  font-size: 22rpx;
  color: var(--color-text-placeholder);
}

.slot-progress {
  height: 4rpx;
  background: var(--color-border);
  border-radius: 2rpx;
  overflow: hidden;
}

.slot-progress-fill {
  height: 100%;
  border-radius: 2rpx;
  transition: width 300ms;
}
</style>
