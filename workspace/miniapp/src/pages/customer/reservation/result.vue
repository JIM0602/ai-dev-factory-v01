<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

const status = ref<string>('');
const date = ref<string>('');
const slot = ref<string>('');

onLoad((options) => {
  status.value = (options?.status as string) || '';
  date.value = (options?.date as string) || '';
  slot.value = (options?.slot as string) || '';
});

const isSuccess = computed(() => {
  return status.value === 'confirmed' || status.value === 'pending';
});

const isPending = computed(() => {
  return status.value === 'pending';
});

const resultTitle = computed(() => {
  if (isPending.value) return '预约已提交';
  return '预约成功';
});

const resultDesc = computed(() => {
  if (isPending.value) {
    return '预约已提交，等待商家确认。商家确认后您将收到通知。';
  }
  return '预约成功！请在预约时间前到达门店。';
});

const resultIcon = computed(() => {
  if (isPending.value) return '&#x1F4AC;'; // 消息气泡
  return '&#x2705;'; // 绿色勾
});

function goToMyReservations(): void {
  uni.switchTab({ url: '/pages/customer/reservation/my-list' });
}

function goToHome(): void {
  uni.switchTab({ url: '/pages/customer/store/index' });
}
</script>

<template>
  <view class="result-page">
    <view class="result-container">
      <!-- 图标 -->
      <view class="result-icon" :class="{ 'result-icon--success': isSuccess, 'result-icon--fail': !isSuccess }">
        <text class="result-icon-text" v-html="resultIcon" />
      </view>

      <!-- 标题 -->
      <text class="result-title">{{ resultTitle }}</text>

      <!-- 描述 -->
      <text class="result-desc">{{ resultDesc }}</text>

      <!-- 预约摘要 -->
      <view class="result-card card">
        <view class="result-info-row">
          <text class="info-label">预约日期</text>
          <text class="info-value">{{ date }}</text>
        </view>
        <view class="result-info-row">
          <text class="info-label">预约时段</text>
          <text class="info-value">{{ slot }}</text>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="result-actions">
        <button class="btn btn-primary" @tap="goToMyReservations">
          查看我的预约
        </button>
        <button class="btn btn-text" @tap="goToHome">
          返回首页
        </button>
      </view>
    </view>
  </view>
</template>

<style scoped>
.result-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-page);
  padding: var(--space-lg);
}

.result-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 600rpx;
}

.result-icon {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-lg);
}

.result-icon--success {
  background: var(--color-secondary-bg);
}

.result-icon--fail {
  background: var(--color-status-rejected-bg);
}

.result-icon-text {
  font-size: 72rpx;
}

.result-title {
  font-size: 36rpx;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--space-sm);
}

.result-desc {
  font-size: 26rpx;
  color: var(--color-text-secondary);
  text-align: center;
  line-height: 1.6;
  margin-bottom: var(--space-xl);
  padding: 0 var(--space-md);
}

.result-card {
  width: 100%;
  padding: var(--space-md);
  margin-bottom: var(--space-xl);
}

.result-info-row {
  display: flex;
  justify-content: space-between;
  padding: var(--space-xs) 0;
}

.result-info-row + .result-info-row {
  border-top: 1rpx solid var(--color-border);
  padding-top: var(--space-sm);
  margin-top: var(--space-xs);
}

.info-label {
  font-size: 26rpx;
  color: var(--color-text-secondary);
}

.info-value {
  font-size: 26rpx;
  color: var(--color-text-primary);
  font-weight: 500;
}

.result-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  width: 100%;
}

.result-actions .btn {
  width: 100%;
}
</style>
