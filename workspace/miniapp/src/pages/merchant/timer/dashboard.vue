<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useTimerStore } from '@/store/timer';

const timerStore = useTimerStore();

const extendPickerVisible = ref(false);
const extendSessionId = ref(0);
const extendCustomerName = ref('');
const endDialogVisible = ref(false);
const endSessionId = ref(0);
const endCustomerName = ref('');

onMounted(() => {
  timerStore.startPolling();
});

onUnmounted(() => {
  timerStore.stopPolling();
});

function onExtendClick(sessionId: number, name: string): void {
  const session = timerStore.sessions.find(s => s.id === sessionId);
  extendSessionId.value = sessionId;
  extendCustomerName.value = name;
  extendPickerVisible.value = true;
}

async function handleExtendConfirm(minutes: number): Promise<void> {
  const result = await timerStore.extendTimerSession(extendSessionId.value, minutes);
  if (result.success) {
    uni.showToast({ title: result.message, icon: 'success' });
  } else {
    uni.showToast({ title: result.message, icon: 'none' });
  }
  extendPickerVisible.value = false;
}

function onEndClick(sessionId: number, name: string): void {
  endSessionId.value = sessionId;
  endCustomerName.value = name;
  endDialogVisible.value = true;
}

async function handleEndConfirm(): Promise<void> {
  const result = await timerStore.endTimerSession(endSessionId.value);
  if (result.success) {
    uni.showToast({ title: result.message, icon: 'success' });
  } else {
    uni.showToast({ title: result.message, icon: 'none' });
  }
  endDialogVisible.value = false;
}

function onSessionClick(sessionId: number): void {
  uni.navigateTo({ url: `/pages/merchant/timer/detail?sessionId=${sessionId}` });
}
</script>

<template>
  <view class="timer-dashboard-page">
    <AppNavbar title="计时看板" />

    <!-- 统计条 -->
    <view class="stats-bar">
      <view class="stats-item">
        <text class="stats-value">{{ timerStore.activeCount }}</text>
        <text class="stats-label">正在计时</text>
      </view>
      <view class="stats-divider" />
      <view class="stats-item">
        <text class="stats-value stats-value--green">{{ timerStore.availableTables }}</text>
        <text class="stats-label">空闲桌位</text>
      </view>
    </view>

    <!-- 计时卡片 -->
    <scroll-view scroll-y class="dashboard-scroll" :enhanced="true" :show-scrollbar="false">
      <template v-if="timerStore.sortedSessions.length > 0">
        <view class="dashboard-list">
          <TimerCard
            v-for="session in timerStore.sortedSessions"
            :key="session.id"
            :session="session"
            @extend="(sid: number) => onExtendClick(sid, session.customer_name)"
            @end="(sid: number) => onEndClick(sid, session.customer_name)"
            @click="(s) => onSessionClick(s.id)"
          />
        </view>
      </template>
      <EmptyState
        v-else
        icon="&#x1F3E0;"
        title="当前没有顾客在计时"
        description="此刻店里很安静，等待下一位手作人"
      />
    </scroll-view>

    <!-- 加时选择器 -->
    <TimeExtensionPicker
      :visible="extendPickerVisible"
      :customer-name="extendCustomerName"
      @confirm="handleExtendConfirm"
      @close="extendPickerVisible = false"
    />

    <!-- 结束确认弹窗 -->
    <ConfirmDialog
      :visible="endDialogVisible"
      title="结束计时"
      :content="`确认 ${endCustomerName} 已离店？计时将停止，桌位将释放。`"
      confirm-text="确认离店"
      confirm-type="danger"
      @confirm="handleEndConfirm"
      @close="endDialogVisible = false"
    />
  </view>
</template>

<style scoped>
.timer-dashboard-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-page);
}

.stats-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xl);
  padding: var(--space-md) var(--space-lg);
  background: var(--color-bg-card);
  border-bottom: 1rpx solid var(--color-border);
}

.stats-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}

.stats-value {
  font-size: 36rpx;
  font-weight: 700;
  color: var(--color-primary);
}

.stats-value--green {
  color: var(--color-secondary);
}

.stats-label {
  font-size: 22rpx;
  color: var(--color-text-secondary);
}

.stats-divider {
  width: 2rpx;
  height: 48rpx;
  background: var(--color-border);
}

.dashboard-scroll {
  flex: 1;
  padding: var(--space-md) var(--space-lg);
}

.dashboard-list {
  padding-bottom: var(--space-xxl);
}
</style>
