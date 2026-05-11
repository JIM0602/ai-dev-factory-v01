<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { onPullDownRefresh } from '@dcloudio/uni-app';
import { getMerchantReservations, type ReservationItem } from '@/api/reservation';
import { getTimerDashboard } from '@/api/timer';
import { formatDateDisplay, getToday } from '@/utils/date';
import { useUserStore } from '@/store/user';
import type { DashboardSession } from '@/api/timer';

const userStore = useUserStore();

const loading = ref(true);
const error = ref('');

// 概览数据
const todaySummary = ref({
  pending_count: 0,
  confirmed_count: 0,
  total_count: 0,
});
const activeCount = ref(0);
const availableTables = ref(0);
const pendingReservations = ref<ReservationItem[]>([]);

const todayStr = getToday();

onMounted(async () => {
  await loadData();
});

async function loadData(): Promise<void> {
  loading.value = true;
  error.value = '';
  try {
    // 并行加载概览数据
    const [reservationsRes, timerRes] = await Promise.all([
      getMerchantReservations({ date: todayStr, status: '', page: 1, page_size: 10 }),
      getTimerDashboard(),
    ]);

    if (reservationsRes.code === 0 && reservationsRes.data) {
      const allRecent = reservationsRes.data.list || [];
      todaySummary.value.total_count = reservationsRes.data.pagination.total;
      todaySummary.value.pending_count = allRecent.filter(r => r.status === 'pending').length;
      todaySummary.value.confirmed_count = allRecent.filter(r => r.status === 'confirmed').length;
      pendingReservations.value = allRecent.filter(r => r.status === 'pending').slice(0, 5);
    }

    if (timerRes.code === 0 && timerRes.data) {
      activeCount.value = timerRes.data.active_count;
      availableTables.value = timerRes.data.available_tables;
    }
  } catch {
    error.value = '加载失败，请重试';
  } finally {
    loading.value = false;
  }
}

function switchToCustomer(): void {
  userStore.switchRole('customer');
  uni.switchTab({ url: '/pages/customer/store/index' });
}

// 快捷入口
const shortcuts = [
  { label: '预约列表', icon: '&#x1F4CB;', url: '/pages/merchant/reservation/list' },
  { label: '添加预约', icon: '&#x2795;', url: '/pages/merchant/reservation/add' },
  { label: '计时看板', icon: '&#x23F1;', url: '/pages/merchant/timer/dashboard' },
  { label: '会员查询', icon: '&#x1F465;', url: '/pages/merchant/member/search' },
];

function goTo(url: string): void {
  uni.navigateTo({ url });
}

function goToReservationDetail(id: number): void {
  uni.navigateTo({ url: `/pages/merchant/reservation/detail?id=${id}` });
}

onPullDownRefresh(async () => {
  await loadData();
  uni.stopPullDownRefresh();
});
</script>

<template>
  <view class="dashboard-page">
    <PageContainer
      :loading="loading"
      :error="error"
      navbar-title="工作台"
      @retry="loadData"
    >
      <view class="dashboard-content">
        <!-- 今日日期 -->
        <view class="today-date">
          <text class="today-text">今日 {{ formatDateDisplay(todayStr) }}</text>
        </view>

        <!-- 概览卡片 -->
        <view class="stats-row">
          <view class="stat-card">
            <view class="stat-bar" style="background: #E07A5F;" />
            <text class="stat-value">{{ todaySummary.total_count }}</text>
            <text class="stat-label">今日预约</text>
          </view>
          <view class="stat-card">
            <view class="stat-bar" style="background: #81B29A;" />
            <text class="stat-value">{{ activeCount }}</text>
            <text class="stat-label">计时中</text>
          </view>
          <view class="stat-card">
            <view class="stat-bar" style="background: #7B9EA8;" />
            <text class="stat-value">{{ availableTables }}</text>
            <text class="stat-label">空闲桌位</text>
          </view>
        </view>

        <!-- 快捷入口 -->
        <view class="shortcuts">
          <view
            v-for="item in shortcuts"
            :key="item.url"
            class="shortcut-item"
            @tap="goTo(item.url)"
          >
            <text class="shortcut-icon" v-html="item.icon" />
            <text class="shortcut-label">{{ item.label }}</text>
          </view>
        </view>

        <!-- 待处理预约 -->
        <view v-if="pendingReservations.length > 0" class="pending-section">
          <text class="section-title">待处理预约 ({{ todaySummary.pending_count }})</text>
          <view class="pending-list">
            <ReservationCard
              v-for="item in pendingReservations"
              :key="item.id"
              :reservation="item"
              :show-actions="true"
              action-type="merchant"
              @click="goToReservationDetail(item.id)"
              @confirm="goToReservationDetail(item.id)"
              @reject="goToReservationDetail(item.id)"
              @checkin="uni.navigateTo({ url: `/pages/merchant/timer/checkin?id=${item.id}` })"
            />
          </view>
        </view>

        <!-- 角色切换 -->
        <view class="role-switch">
          <button class="btn btn-text btn-sm" @tap="switchToCustomer">
            切换到用户端
          </button>
        </view>
      </view>
    </PageContainer>
  </view>
</template>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  background: var(--color-bg-page);
}

.dashboard-content {
  padding: 0 var(--space-lg);
  padding-bottom: 40rpx;
}

.today-date {
  padding: var(--space-md) 0;
}

.today-text {
  font-size: 28rpx;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.stats-row {
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}

.stat-card {
  flex: 1;
  background: var(--color-bg-card);
  border-radius: var(--radius-card-sm);
  box-shadow: var(--shadow-sm);
  padding: 20rpx;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-bar {
  height: 4rpx;
  width: 100%;
  margin-bottom: 12rpx;
}

.stat-value {
  font-size: 34rpx;
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: 4rpx;
}

.stat-label {
  font-size: 22rpx;
  color: var(--color-text-secondary);
}

.shortcuts {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--space-lg);
}

.shortcut-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm);
  min-width: 120rpx;
}

.shortcut-icon {
  font-size: 48rpx;
}

.shortcut-label {
  font-size: 24rpx;
  color: var(--color-text-primary);
}

.pending-section {
  margin-bottom: var(--space-lg);
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--space-sm);
  display: block;
}

.pending-list {
  display: flex;
  flex-direction: column;
}

.role-switch {
  display: flex;
  justify-content: center;
  padding: var(--space-md) 0;
}
</style>
