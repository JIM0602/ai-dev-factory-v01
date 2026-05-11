<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useStoreInfoStore } from '@/store/store';
import { useUserStore } from '@/store/user';
import { useReservationStore } from '@/store/reservation';
import { getToday } from '@/utils/date';

const storeInfoStore = useStoreInfoStore();
const userStore = useUserStore();
const reservationStore = useReservationStore();

const loading = ref(true);
const error = ref('');

onMounted(async () => {
  await loadData();
});

async function loadData(): Promise<void> {
  loading.value = true;
  error.value = '';
  try {
    await storeInfoStore.fetchStoreInfo();
    if (storeInfoStore.error) {
      error.value = storeInfoStore.error;
    }
    // 预加载今日时段
    await reservationStore.fetchSlots(getToday());
  } catch {
    error.value = '加载失败，请重试';
  } finally {
    loading.value = false;
  }
}

function onNavigate(): void {
  const store = storeInfoStore.storeInfo;
  if (!store) return;
  uni.openLocation({
    latitude: 23.1291, // 默认广州坐标，实际应从门店经纬度获取
    longitude: 113.2644,
    name: store.name,
    address: store.address,
    scale: 16,
  });
}

function onContactPhone(): void {
  const phone = storeInfoStore.storeInfo?.phone;
  if (!phone) return;
  uni.makePhoneCall({ phoneNumber: phone });
}

function goToBooking(): void {
  uni.navigateTo({ url: '/pages/customer/reservation/create' });
}

function switchToMerchant(): void {
  userStore.switchRole('merchant');
  uni.switchTab({ url: '/pages/merchant/dashboard/index' });
}

function onRefresh(): void {
  loadData();
}
</script>

<template>
  <view class="store-page">
    <!-- 自定义导航 -->
    <AppNavbar title="门店主页" />

    <PageContainer
      :loading="loading"
      :error="error"
      :show-navbar="false"
      @retry="onRefresh"
    >
      <template v-if="storeInfoStore.storeInfo">
        <!-- 轮播图 -->
        <StoreBanner :photos="storeInfoStore.storeInfo.photos" :height="420" />

        <!-- 门店信息 -->
        <view class="store-section">
          <StoreHeader
            :store="storeInfoStore.storeInfo"
            @navigate="onNavigate"
          />
        </view>

        <!-- 今日时段概览 -->
        <view
          v-if="reservationStore.slots.length > 0"
          class="today-slots card"
          style="margin: var(--space-md) var(--space-lg);"
        >
          <view class="slots-header">
            <text class="slots-title">今日可预约时段</text>
            <text class="slots-count">
              共 {{ reservationStore.slots.filter(s => s.is_available).length }} 个时段
            </text>
          </view>
          <view class="slots-preview">
            <view
              v-for="slot in reservationStore.slots.filter(s => s.is_available).slice(0, 4)"
              :key="`${slot.start_time}-${slot.end_time}`"
              class="slot-preview-item"
            >
              <text class="slot-preview-time">{{ slot.start_time }}</text>
              <text class="slot-preview-avail">余{{ slot.available_count }}</text>
            </view>
          </view>
        </view>

        <!-- 商家切换入口 -->
        <view v-if="userStore.isMerchant" class="role-switch">
          <button class="btn btn-text btn-sm" @tap="switchToMerchant">
            切换到商家端
          </button>
        </view>
      </template>
    </PageContainer>

    <!-- 底部预约按钮 -->
    <view class="bottom-bar safe-bottom">
      <button
        class="btn btn-primary bottom-btn"
        :disabled="!storeInfoStore.storeInfo?.is_open_today"
        @tap="goToBooking"
      >
        {{ storeInfoStore.storeInfo?.is_open_today ? '预约' : '今日休息' }}
      </button>
    </view>
  </view>
</template>

<style scoped>
.store-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-page);
}

.store-section {
  margin-top: -20rpx;
  position: relative;
  z-index: 1;
}

.today-slots {
  padding: var(--space-md);
}

.slots-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-sm);
}

.slots-title {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--color-text-primary);
}

.slots-count {
  font-size: 22rpx;
  color: var(--color-text-secondary);
}

.slots-preview {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.slot-preview-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 16rpx;
  background: var(--color-primary-bg);
  border-radius: var(--radius-tag);
}

.slot-preview-time {
  font-size: 24rpx;
  font-weight: 500;
  color: var(--color-primary);
}

.slot-preview-avail {
  font-size: 20rpx;
  color: var(--color-secondary);
}

.role-switch {
  display: flex;
  justify-content: center;
  padding: var(--space-md);
  margin-top: var(--space-md);
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--color-bg-card);
  box-shadow: var(--shadow-md);
  padding: var(--space-sm) var(--space-lg);
  z-index: 50;
}

.bottom-btn {
  width: 100%;
}
</style>
