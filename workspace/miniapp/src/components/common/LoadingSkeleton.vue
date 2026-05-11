<script setup lang="ts">
interface Props {
  type?: 'card' | 'list' | 'detail';
  count?: number;
}

withDefaults(defineProps<Props>(), {
  type: 'card',
  count: 3,
});
</script>

<template>
  <view class="skeleton-container">
    <!-- 列表骨架 -->
    <template v-if="type === 'list'">
      <view v-for="i in count" :key="i" class="skeleton-list-item">
        <view class="skeleton skeleton-line-title" />
        <view class="skeleton skeleton-line-short" />
        <view class="skeleton skeleton-line-medium" />
      </view>
    </template>

    <!-- 卡片骨架 -->
    <template v-else-if="type === 'card'">
      <view v-for="i in count" :key="i" class="skeleton-card">
        <view class="skeleton skeleton-card-bar" />
        <view class="skeleton-card-body">
          <view class="skeleton skeleton-line-title" />
          <view class="skeleton skeleton-line-short" />
          <view class="skeleton skeleton-line-medium" />
        </view>
      </view>
    </template>

    <!-- 详情骨架 -->
    <template v-else>
      <view class="skeleton-detail">
        <view class="skeleton skeleton-block-lg" />
        <view class="skeleton skeleton-line-title" />
        <view class="skeleton skeleton-line-long" />
        <view class="skeleton skeleton-line-long" />
        <view class="skeleton skeleton-line-medium" />
        <view class="skeleton skeleton-line-short" />
      </view>
    </template>
  </view>
</template>

<style scoped>
.skeleton-container {
  padding: var(--space-md) var(--space-lg);
}

.skeleton-list-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-md);
  margin-bottom: var(--space-sm);
  background: var(--color-bg-card);
  border-radius: var(--radius-card-sm);
}

.skeleton-card {
  margin-bottom: var(--space-sm);
  background: var(--color-bg-card);
  border-radius: var(--radius-card);
  overflow: hidden;
}

.skeleton-card-bar {
  height: 8rpx;
  width: 100%;
}

.skeleton-card-body {
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.skeleton-detail {
  padding: var(--space-md) var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.skeleton-line-title {
  height: 36rpx;
  width: 60%;
}

.skeleton-line-long {
  height: 28rpx;
  width: 100%;
}

.skeleton-line-medium {
  height: 28rpx;
  width: 75%;
}

.skeleton-line-short {
  height: 28rpx;
  width: 40%;
}

.skeleton-block-lg {
  height: 320rpx;
  width: 100%;
  border-radius: var(--radius-image);
}
</style>
