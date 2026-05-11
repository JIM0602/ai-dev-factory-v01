<script setup lang="ts">
interface Props {
  loading?: boolean;
  error?: string;
  showNavbar?: boolean;
  navbarTitle?: string;
  showBack?: boolean;
  enableRefresh?: boolean;
}

withDefaults(defineProps<Props>(), {
  loading: false,
  error: '',
  showNavbar: true,
  navbarTitle: '',
  showBack: false,
  enableRefresh: false,
});

const emit = defineEmits<{
  retry: [];
  back: [];
}>();
</script>

<template>
  <view class="page-container">
    <AppNavbar
      v-if="showNavbar"
      :title="navbarTitle"
      :show-back="showBack"
      @back="emit('back')"
    />

    <!-- 错误状态 -->
    <view v-if="error" class="page-error">
      <view class="error-bar">
        <text class="error-icon">&#x26A0;</text>
        <text class="error-text">{{ error }}</text>
        <text class="error-retry" @tap="emit('retry')">重试</text>
      </view>
    </view>

    <!-- 加载状态 -->
    <LoadingSkeleton v-if="loading" :type="'card'" :count="3" />

    <!-- 内容区 -->
    <view v-else-if="!error" class="page-content">
      <slot />
    </view>
  </view>
</template>

<style scoped>
.page-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg-page);
}

.page-content {
  flex: 1;
  padding-bottom: var(--space-xxl);
}

.page-error {
  padding: var(--space-sm) var(--space-lg);
}

.error-bar {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  background: #FFF3E6;
  border-radius: var(--radius-card-sm);
  padding: var(--space-sm) var(--space-md);
  min-height: 72rpx;
}

.error-icon {
  font-size: 32rpx;
  color: var(--color-primary);
}

.error-text {
  flex: 1;
  font-size: 24rpx;
  color: var(--color-primary);
}

.error-retry {
  font-size: 24rpx;
  color: var(--color-primary);
  font-weight: 500;
  padding: var(--space-xs) var(--space-sm);
  min-width: 60rpx;
  text-align: center;
}
</style>
