<script setup lang="ts">
interface Props {
  icon?: string;
  title?: string;
  description?: string;
  actionText?: string;
  showAction?: boolean;
}

withDefaults(defineProps<Props>(), {
  icon: '📋',
  title: '暂无数据',
  description: '',
  actionText: '',
  showAction: false,
});

const emit = defineEmits<{
  action: [];
}>();
</script>

<template>
  <view class="empty-state">
    <view class="empty-icon">
      <text class="empty-icon-text">{{ icon }}</text>
    </view>
    <text class="empty-title">{{ title }}</text>
    <text v-if="description" class="empty-desc">{{ description }}</text>
    <button
      v-if="showAction && actionText"
      class="btn btn-primary empty-action"
      @tap="emit('action')"
    >
      {{ actionText }}
    </button>
  </view>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-xxl) var(--space-lg);
  min-height: 400rpx;
}

.empty-icon {
  width: 160rpx;
  height: 160rpx;
  background: var(--color-bg-surface);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-md);
}

.empty-icon-text {
  font-size: 64rpx;
}

.empty-title {
  font-size: 30rpx;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: var(--space-xs);
  text-align: center;
}

.empty-desc {
  font-size: 24rpx;
  color: var(--color-text-secondary);
  text-align: center;
  line-height: 1.5;
  padding: 0 var(--space-lg);
}

.empty-action {
  margin-top: var(--space-lg);
  min-width: 280rpx;
}
</style>
