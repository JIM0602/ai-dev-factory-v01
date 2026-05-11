<script setup lang="ts">
import { computed } from 'vue';
import type { ReservationItem } from '@/api/reservation';
import { formatDateDisplay } from '@/utils/date';
import { RESERVATION_STATUS_COLORS, RESERVATION_SOURCE_LABEL, type ReservationStatus } from '@/utils/constants';

interface Props {
  reservation: ReservationItem;
  showActions?: boolean;
  actionType?: 'customer' | 'merchant';
}

const props = withDefaults(defineProps<Props>(), {
  showActions: false,
  actionType: 'customer',
});

const emit = defineEmits<{
  click: [reservation: ReservationItem];
  confirm: [id: number];
  reject: [id: number];
  cancel: [id: number];
  checkin: [id: number];
}>();

const statusBarColor = computed(() => {
  const status = props.reservation.status as ReservationStatus;
  return RESERVATION_STATUS_COLORS[status]?.bar || '#B5A99E';
});

const sourceLabel = computed(() => {
  return RESERVATION_SOURCE_LABEL[props.reservation.source as keyof typeof RESERVATION_SOURCE_LABEL] || '';
});
</script>

<template>
  <view class="reservation-card" @tap="emit('click', reservation)">
    <!-- 状态顶条 -->
    <view class="card-bar" :style="{ backgroundColor: statusBarColor }" />

    <view class="card-body">
      <!-- 头部：日期 + 状态 -->
      <view class="card-header">
        <view class="card-date">
          <text class="date-text">{{ formatDateDisplay(reservation.reservation_date) }}</text>
          <text v-if="sourceLabel" class="source-tag">{{ sourceLabel }}</text>
        </view>
        <StatusBadge :status="reservation.status" />
      </view>

      <!-- 内容 -->
      <view class="card-info">
        <text class="info-slot">
          {{ reservation.slot_start_time }} - {{ reservation.slot_end_time }}
        </text>
        <view class="info-meta">
          <text v-if="reservation.guest_count" class="meta-text">
            {{ reservation.guest_count }}人
          </text>
          <text v-if="reservation.customer_name" class="meta-text">
            {{ reservation.customer_name }}
          </text>
          <text v-if="reservation.customer_phone" class="meta-text meta-phone">
            {{ reservation.customer_phone }}
          </text>
        </view>
      </view>

      <!-- 操作按钮 (商家端) -->
      <view v-if="showActions && actionType === 'merchant'" class="card-actions">
        <button
          v-if="reservation.status === 'pending'"
          class="btn btn-success btn-xs"
          @tap.stop="emit('confirm', reservation.id)"
        >
          确认
        </button>
        <button
          v-if="reservation.status === 'pending'"
          class="btn btn-danger btn-xs"
          style="min-width: 120rpx;"
          @tap.stop="emit('reject', reservation.id)"
        >
          拒绝
        </button>
        <button
          v-if="reservation.status === 'confirmed'"
          class="btn btn-primary btn-xs"
          @tap.stop="emit('checkin', reservation.id)"
        >
          到店登记
        </button>
        <button
          v-if="reservation.status === 'in_progress'"
          class="btn btn-text btn-xs"
          @tap.stop="emit('click', reservation)"
        >
          查看计时
        </button>
      </view>

      <!-- 操作按钮 (顾客端) -->
      <view v-if="showActions && actionType === 'customer' && reservation.can_cancel" class="card-actions">
        <button
          class="btn btn-danger btn-xs"
          @tap.stop="emit('cancel', reservation.id)"
        >
          取消预约
        </button>
      </view>
    </view>
  </view>
</template>

<style scoped>
.reservation-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  margin-bottom: var(--space-sm);
  position: relative;
}

.card-bar {
  height: 4rpx;
  width: 100%;
}

.card-body {
  padding: var(--space-md);
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--space-sm);
}

.card-date {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.date-text {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--color-text-primary);
}

.source-tag {
  font-size: 20rpx;
  color: var(--color-text-placeholder);
  background: var(--color-bg-surface);
  padding: 2rpx 8rpx;
  border-radius: 4rpx;
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.info-slot {
  font-size: 30rpx;
  font-weight: 500;
  color: var(--color-text-primary);
}

.info-meta {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.meta-text {
  font-size: 24rpx;
  color: var(--color-text-secondary);
}

.meta-phone {
  font-family: monospace;
}

.card-actions {
  display: flex;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
  justify-content: flex-end;
}
</style>
