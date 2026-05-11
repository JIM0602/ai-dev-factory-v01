<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { useReservationStore } from '@/store/reservation';
import { CUSTOMER_STATUS_TABS } from '@/utils/constants';
import type { ReservationItem } from '@/api/reservation';

const reservationStore = useReservationStore();

const activeTab = ref('');
const page = ref(1);
const loading = ref(true);
const error = ref('');
const loadingMore = ref(false);
const hasMore = ref(true);

const cancelDialogVisible = ref(false);
const cancelTargetId = ref<number | null>(null);

onMounted(async () => {
  await loadData(true);
});

async function loadData(reset = false): Promise<void> {
  if (reset) {
    page.value = 1;
    loading.value = true;
    error.value = '';
  } else {
    loadingMore.value = true;
  }

  try {
    await reservationStore.fetchMyReservations({
      status: activeTab.value || undefined,
      page: page.value,
      page_size: 20,
    });
    hasMore.value = page.value < reservationStore.pagination.totalPages;
  } catch {
    error.value = '加载失败，请重试';
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
}

function onTabChange(tabValue: string): void {
  activeTab.value = tabValue;
  loadData(true);
}

function onCardClick(item: ReservationItem): void {
  uni.navigateTo({ url: `/pages/customer/reservation/detail?id=${item.id}` });
}

function onCancelClick(id: number): void {
  cancelTargetId.value = id;
  cancelDialogVisible.value = true;
}

async function handleConfirmCancel(): Promise<void> {
  if (cancelTargetId.value === null) return;
  const result = await reservationStore.cancelReservationById(cancelTargetId.value);
  if (result.success) {
    uni.showToast({ title: '预约已取消', icon: 'success' });
  } else {
    uni.showToast({ title: result.message, icon: 'none' });
  }
  cancelDialogVisible.value = false;
  cancelTargetId.value = null;
}

// 下拉刷新
onPullDownRefresh(async () => {
  await loadData(true);
  uni.stopPullDownRefresh();
});

// 上拉加载更多
onReachBottom(() => {
  if (!hasMore.value || loadingMore.value) return;
  page.value++;
  loadData(false);
});
</script>

<template>
  <view class="my-list-page">
    <PageContainer
      :loading="loading && page === 1"
      :error="error"
      navbar-title="我的预约"
      @retry="loadData(true)"
    >
      <!-- 状态筛选 Tab -->
      <view class="tabs">
        <scroll-view scroll-x class="tabs-scroll" :show-scrollbar="false">
          <view
            v-for="tab in CUSTOMER_STATUS_TABS"
            :key="tab.value"
            class="tab-item"
            :class="{ 'tab-item--active': activeTab === tab.value }"
            @tap="onTabChange(tab.value)"
          >
            <text class="tab-text">{{ tab.label }}</text>
          </view>
        </scroll-view>
      </view>

      <!-- 列表 -->
      <template v-if="reservationStore.reservations.length > 0">
        <view class="list-container">
          <ReservationCard
            v-for="item in reservationStore.reservations"
            :key="item.id"
            :reservation="item"
            :show-actions="true"
            action-type="customer"
            @click="onCardClick"
            @cancel="onCancelClick"
          />
        </view>

        <!-- 加载更多 -->
        <view v-if="loadingMore" class="load-more">
          <text class="load-more-text">加载中...</text>
        </view>
        <view v-else-if="!hasMore && reservationStore.reservations.length > 0" class="load-more">
          <text class="load-more-text">没有更多了</text>
        </view>
      </template>

      <!-- 空状态 -->
      <EmptyState
        v-else-if="!loading"
        title="还没有预约记录"
        description="开始你的拼豆之旅吧"
        action-text="去预约"
        :show-action="true"
        @action="uni.switchTab({ url: '/pages/customer/store/index' })"
      />
    </PageContainer>

    <!-- 取消确认弹窗 -->
    <ConfirmDialog
      :visible="cancelDialogVisible"
      title="确认取消"
      content="确认取消该预约？取消后如需重新预约需再次选择时段。"
      confirm-text="确认取消"
      confirm-type="danger"
      @confirm="handleConfirmCancel"
      @close="cancelDialogVisible = false"
    />
  </view>
</template>

<style scoped>
.my-list-page {
  min-height: 100vh;
  background: var(--color-bg-page);
}

.tabs {
  background: var(--color-bg-card);
  border-bottom: 1rpx solid var(--color-border);
}

.tabs-scroll {
  white-space: nowrap;
  display: flex;
  padding: 0 var(--space-sm);
}

.tab-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-sm) var(--space-md);
  min-width: 100rpx;
  min-height: 72rpx;
  position: relative;
}

.tab-item--active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 48rpx;
  height: 4rpx;
  background: var(--color-primary);
  border-radius: 2rpx;
}

.tab-text {
  font-size: 26rpx;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.tab-item--active .tab-text {
  color: var(--color-primary);
  font-weight: 600;
}

.list-container {
  padding: var(--space-md) var(--space-lg);
}

.load-more {
  display: flex;
  justify-content: center;
  padding: var(--space-md);
}

.load-more-text {
  font-size: 24rpx;
  color: var(--color-text-placeholder);
}
</style>
