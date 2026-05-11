<script setup lang="ts">
import { computed } from 'vue';
import type { ReservationStatus } from '@/utils/constants';
import { RESERVATION_STATUS_LABEL, RESERVATION_STATUS_SHAPE, RESERVATION_STATUS_COLORS } from '@/utils/constants';

interface Props {
  status: ReservationStatus | string;
  size?: 'default' | 'large';
}

const props = withDefaults(defineProps<Props>(), {
  status: 'pending',
  size: 'default',
});

const label = computed(() => {
  return RESERVATION_STATUS_LABEL[props.status as ReservationStatus] || props.status;
});

const shape = computed(() => {
  return RESERVATION_STATUS_SHAPE[props.status as ReservationStatus] || '●';
});

const colors = computed(() => {
  return RESERVATION_STATUS_COLORS[props.status as ReservationStatus] || {
    bg: '#F5F3F1',
    text: '#B5A99E',
    bar: '#B5A99E',
  };
});
</script>

<template>
  <view
    class="status-badge"
    :class="[`status-badge--${size}`]"
    :style="{
      backgroundColor: colors.bg,
      color: colors.text,
    }"
  >
    <text class="status-shape">{{ shape }}</text>
    <text class="status-label">{{ label }}</text>
  </view>
</template>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  border-radius: var(--radius-tag);
  white-space: nowrap;
}

.status-badge--default {
  padding: 4rpx 12rpx;
  font-size: 20rpx;
  font-weight: 500;
}

.status-badge--large {
  padding: 8rpx 20rpx;
  font-size: 24rpx;
  font-weight: 500;
}

.status-shape {
  font-size: inherit;
  line-height: 1;
}

.status-label {
  font-size: inherit;
  color: inherit;
}
</style>
