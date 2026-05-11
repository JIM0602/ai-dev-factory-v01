<script setup lang="ts">
interface Props {
  title?: string;
  showBack?: boolean;
  backgroundColor?: string;
}

withDefaults(defineProps<Props>(), {
  title: '',
  showBack: false,
  backgroundColor: '#FFFFFF',
});

const emit = defineEmits<{
  back: [];
}>();

function handleBack(): void {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    uni.navigateBack();
  } else {
    uni.switchTab({ url: '/pages/customer/store/index' });
  }
  emit('back');
}
</script>

<template>
  <view class="navbar" :style="{ backgroundColor }">
    <view class="navbar-content">
      <view v-if="showBack" class="navbar-back" @tap="handleBack">
        <text class="navbar-back-icon">&#x2039;</text>
        <text class="navbar-back-text">返回</text>
      </view>
      <view class="navbar-title">
        <text class="navbar-title-text">{{ title }}</text>
      </view>
      <view v-if="showBack" class="navbar-placeholder" />
    </view>
  </view>
</template>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
}

.navbar-content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  padding: 0 var(--space-lg);
  position: relative;
}

.navbar-back {
  position: absolute;
  left: var(--space-sm);
  display: flex;
  align-items: center;
  min-width: 88rpx;
  min-height: 44rpx;
  padding: var(--space-xs);
}

.navbar-back-icon {
  font-size: 44rpx;
  color: var(--color-text-primary);
  line-height: 1;
}

.navbar-back-text {
  font-size: 28rpx;
  color: var(--color-text-primary);
  margin-left: 4rpx;
}

.navbar-title {
  flex: 1;
  display: flex;
  justify-content: center;
}

.navbar-title-text {
  font-size: 34rpx;
  font-weight: 600;
  color: var(--color-text-primary);
}

.navbar-placeholder {
  width: 88rpx;
}
</style>
