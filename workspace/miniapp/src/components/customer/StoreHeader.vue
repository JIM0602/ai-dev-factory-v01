<script setup lang="ts">
import type { StoreInfo } from '@/api/store';

interface Props {
  store: StoreInfo;
}

defineProps<Props>();

const emit = defineEmits<{
  navigate: [];
}>();
</script>

<template>
  <view class="store-header">
    <!-- 门店名称 -->
    <view class="store-name-row">
      <text class="store-name">{{ store.name }}</text>
      <view class="store-status" :class="store.is_open_today ? 'status-open' : 'status-closed'">
        <text class="status-dot" />
        <text class="status-text">{{ store.is_open_today ? '营业中' : '休息中' }}</text>
      </view>
    </view>

    <!-- 地址 -->
    <view class="store-address" @tap="emit('navigate')">
      <text class="address-icon">&#x1F4CD;</text>
      <text class="address-text">{{ store.address }}</text>
      <text class="address-arrow">&#x203A;</text>
    </view>

    <!-- 门牌指引 -->
    <view v-if="store.address_guide" class="store-guide">
      <text class="guide-text">{{ store.address_guide }}</text>
    </view>

    <!-- 营业信息 -->
    <view class="store-meta">
      <view class="meta-item">
        <text class="meta-label">营业时间</text>
        <text class="meta-value">{{ store.open_time }} - {{ store.close_time }}</text>
      </view>
      <view v-if="store.is_open_today" class="meta-item">
        <text class="meta-label">今日剩余</text>
        <text class="meta-value meta-value--highlight">
          {{ store.today_available_slots }} 个时段
        </text>
      </view>
    </view>

    <!-- 介绍 -->
    <view v-if="store.description" class="store-desc">
      <text class="desc-text">{{ store.description }}</text>
    </view>
  </view>
</template>

<style scoped>
.store-header {
  padding: var(--space-md) var(--space-lg);
  background: var(--color-bg-card);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-sm);
  margin: 0 var(--space-lg);
}

.store-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-sm);
}

.store-name {
  font-size: 40rpx;
  font-weight: 700;
  color: var(--color-text-primary);
}

.store-status {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
  font-weight: 500;
}

.status-open {
  background: var(--color-secondary-bg);
  color: var(--color-secondary);
}

.status-closed {
  background: var(--color-status-cancelled-bg);
  color: var(--color-status-cancelled);
}

.status-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: currentColor;
}

.status-text {
  font-size: 22rpx;
}

.store-address {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: var(--space-sm) var(--space-md);
  background: var(--color-bg-surface);
  border-radius: var(--radius-input);
  margin-bottom: var(--space-sm);
}

.address-icon {
  font-size: 28rpx;
  flex-shrink: 0;
}

.address-text {
  flex: 1;
  font-size: 26rpx;
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.address-arrow {
  font-size: 32rpx;
  color: var(--color-text-placeholder);
}

.store-guide {
  padding: var(--space-xs) var(--space-sm);
  margin-bottom: var(--space-sm);
}

.guide-text {
  font-size: 24rpx;
  color: var(--color-text-secondary);
  background: var(--color-bg-surface);
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
}

.store-meta {
  display: flex;
  gap: var(--space-md);
  margin-bottom: var(--space-sm);
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.meta-label {
  font-size: 22rpx;
  color: var(--color-text-placeholder);
}

.meta-value {
  font-size: 26rpx;
  color: var(--color-text-primary);
  font-weight: 500;
}

.meta-value--highlight {
  color: var(--color-primary);
  font-weight: 600;
}

.store-desc {
  padding-top: var(--space-sm);
  border-top: 1rpx solid var(--color-border);
}

.desc-text {
  font-size: 26rpx;
  color: var(--color-text-secondary);
  line-height: 1.6;
}
</style>
