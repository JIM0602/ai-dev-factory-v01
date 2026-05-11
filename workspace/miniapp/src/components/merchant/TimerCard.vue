<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue';
import type { DashboardSession } from '@/api/timer';
import { formatCountdown, formatDuration } from '@/utils/date';
import { TIMER_URGENT_THRESHOLD, TIMER_CRITICAL_THRESHOLD } from '@/utils/constants';

interface Props {
  session: DashboardSession;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  extend: [sessionId: number];
  end: [sessionId: number];
  click: [session: DashboardSession];
}>();

const now = ref(Date.now());
const timer = setInterval(() => {
  now.value = Date.now();
}, 1000);

onUnmounted(() => {
  clearInterval(timer);
});

const remainingSeconds = computed(() => {
  // 使用后端返回的 remaining_seconds，配合客户端每秒递减
  const serverRemaining = props.session.remaining_seconds;
  const elapsedSinceResponse = Math.floor((now.value - new Date(props.session.check_in_time).getTime()) / 1000);
  const sessionEndTime = new Date(props.session.check_in_time).getTime() +
    (props.session.original_duration_minutes + props.session.total_extension_minutes) * 60 * 1000;
  const remaining = Math.floor((sessionEndTime - now.value) / 1000);
  return Math.max(0, remaining);
});

const isUrgent = computed(() => {
  return remainingSeconds.value <= TIMER_URGENT_THRESHOLD && remainingSeconds.value > TIMER_CRITICAL_THRESHOLD;
});

const isCritical = computed(() => {
  return remainingSeconds.value <= TIMER_CRITICAL_THRESHOLD;
});

const statusClass = computed(() => {
  if (isCritical.value) return 'timer-card--critical';
  if (isUrgent.value) return 'timer-card--urgent';
  return 'timer-card--normal';
});

const totalMinutes = computed(() => {
  return props.session.original_duration_minutes + props.session.total_extension_minutes;
});

const progressPercent = computed(() => {
  if (totalMinutes.value <= 0) return 0;
  return Math.min(100, (props.session.used_minutes / totalMinutes.value) * 100);
});

const countdownText = computed(() => {
  return formatCountdown(remainingSeconds.value);
});

const usedText = computed(() => {
  return formatDuration(props.session.used_minutes);
});

const totalText = computed(() => {
  return formatDuration(totalMinutes.value);
});
</script>

<template>
  <view class="timer-card" :class="statusClass" @tap="emit('click', session)">
    <view class="timer-card-header">
      <view class="timer-customer">
        <text class="timer-name">{{ session.customer_name }}</text>
        <text class="timer-table">{{ session.table_number }}号桌</text>
      </view>
      <StatusBadge status="in_progress" />
    </view>

    <!-- 倒计时 (核心) -->
    <view class="timer-countdown" :class="{ 'timer-countdown--critical': isCritical }">
      <text class="countdown-number">{{ countdownText }}</text>
      <text class="countdown-label">剩余</text>
    </view>

    <!-- 进度条 -->
    <view class="timer-progress-bar">
      <view
        class="timer-progress-fill"
        :class="{
          'progress--normal': !isUrgent && !isCritical,
          'progress--urgent': isUrgent,
          'progress--critical': isCritical,
        }"
        :style="{ width: `${progressPercent}%` }"
      />
    </view>

    <!-- 进度文字 -->
    <view class="timer-progress-text">
      <text class="progress-label">已用 {{ usedText }} / 总计 {{ totalText }}</text>
    </view>

    <!-- 时段信息 -->
    <view class="timer-meta">
      <text class="meta-text">时段 {{ session.slot_start_time }} - {{ session.slot_end_time }}</text>
      <text v-if="session.total_extension_minutes > 0" class="meta-text meta-extension">
        已加时 {{ session.total_extension_minutes }}分钟
      </text>
    </view>

    <!-- 操作按钮 -->
    <view class="timer-actions">
      <button class="btn btn-text btn-xs" @tap.stop="emit('extend', session.id)">
        + 加时
      </button>
      <button class="btn btn-danger btn-xs" @tap.stop="emit('end', session.id)">
        结束计时
      </button>
    </view>
  </view>
</template>

<style scoped>
.timer-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-sm);
  border: 2rpx solid transparent;
  overflow: hidden;
  margin-bottom: var(--space-sm);
  padding: var(--space-md);
  transition: border-color 300ms;
}

.timer-card--normal {
  border-color: var(--color-success);
}

.timer-card--urgent {
  border-color: var(--color-warning);
  background: var(--color-warning-bg);
}

.timer-card--critical {
  border-color: var(--color-danger);
  background: var(--color-danger-bg);
}

.timer-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-md);
}

.timer-customer {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.timer-name {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--color-text-primary);
}

.timer-table {
  font-size: 24rpx;
  color: var(--color-text-secondary);
  background: var(--color-bg-surface);
  padding: 2rpx 12rpx;
  border-radius: 8rpx;
}

.timer-countdown {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8rpx;
  margin-bottom: var(--space-md);
  padding: var(--space-sm) 0;
}

.countdown-number {
  font-size: 60rpx;
  font-weight: 700;
  color: var(--color-success);
  line-height: 1;
  font-variant-numeric: tabular-nums;
  transition: color 300ms;
}

.timer-card--urgent .countdown-number {
  color: var(--color-warning);
}

.timer-card--critical .countdown-number {
  color: var(--color-danger);
  animation: breathe-color 2.5s ease-in-out infinite;
}

.countdown-label {
  font-size: 26rpx;
  color: var(--color-text-secondary);
}

.timer-progress-bar {
  height: 6rpx;
  background: var(--color-border);
  border-radius: 3rpx;
  overflow: hidden;
  margin-bottom: 4rpx;
}

.timer-progress-fill {
  height: 100%;
  border-radius: 3rpx;
  transition: width 1s linear, background-color 300ms;
}

.progress--normal {
  background-color: var(--color-success);
}

.progress--urgent {
  background-color: var(--color-warning);
}

.progress--critical {
  background-color: var(--color-danger);
  animation: pulse-critical 2.5s ease-in-out infinite;
}

.timer-progress-text {
  margin-bottom: var(--space-sm);
}

.progress-label {
  font-size: 22rpx;
  color: var(--color-text-placeholder);
}

.timer-meta {
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.meta-text {
  font-size: 24rpx;
  color: var(--color-text-secondary);
}

.meta-extension {
  color: var(--color-primary);
  font-weight: 500;
}

.timer-actions {
  display: flex;
  gap: var(--space-sm);
  justify-content: flex-end;
}
</style>
