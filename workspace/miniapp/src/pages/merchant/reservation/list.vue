<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { getMerchantReservations, confirmReservation, rejectReservation, type ReservationItem } from '@/api/reservation';
import { MERCHANT_STATUS_TABS } from '@/utils/constants';
import { getToday } from '@/utils/date';

const loading = ref(true);
const error = ref('');
const reservations = ref<ReservationItem[]>([]);
const activeTab = ref('');
const searchText = ref('');
const selectedDate = ref(getToday());
const page = ref(1);
const totalPages = ref(0);
const loadingMore = ref(false);
const hasMore = ref(true);

const rejectDialogVisible = ref(false);
const rejectTargetId = ref<number>(0);
const rejectReason = ref('');

onMounted(async () => {
  await loadData(true);
});

async function loadData(reset = false): Promise<void> {
  if (reset) { page.value = 1; loading.value = true; } else { loadingMore.value = true; }
  error.value = '';

  try {
    const res = await getMerchantReservations({
      date: selectedDate.value || undefined,
      status: activeTab.value || undefined,
      search: searchText.value || undefined,
      page: page.value,
      page_size: 20,
    });
    if (res.code === 0 && res.data) {
      if (reset) { reservations.value = res.data.list; } else { reservations.value.push(...res.data.list); }
      totalPages.value = res.data.pagination.total_pages;
      hasMore.value = page.value < totalPages.value;
    } else {
      error.value = res.message || '加载失败';
    }
  } catch {
    error.value = '网络错误，请重试';
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
}

function onTabChange(tab: string): void { activeTab.value = tab; loadData(true); }
function onSearch(): void { loadData(true); }

function onCardClick(item: ReservationItem): void {
  uni.navigateTo({ url: `/pages/merchant/reservation/detail?id=${item.id}` });
}

async function handleConfirm(id: number): Promise<void> {
  const res = await confirmReservation(id);
  if (res.code === 0) {
    uni.showToast({ title: '已确认', icon: 'success' });
    loadData(true);
  } else {
    uni.showToast({ title: res.message || '操作失败', icon: 'none' });
  }
}

function handleReject(id: number): void {
  rejectTargetId.value = id;
  rejectReason.value = '';
  rejectDialogVisible.value = true;
}

async function handleRejectConfirm(): Promise<void> {
  if (rejectTargetId.value <= 0) return;
  const res = await rejectReservation(rejectTargetId.value, rejectReason.value || undefined);
  if (res.code === 0) {
    uni.showToast({ title: '已拒绝', icon: 'success' });
    loadData(true);
  } else {
    uni.showToast({ title: res.message || '操作失败', icon: 'none' });
  }
  rejectDialogVisible.value = false;
}

function handleCheckin(id: number): void {
  uni.navigateTo({ url: `/pages/merchant/timer/checkin?id=${id}` });
}

function goToAdd(): void {
  uni.navigateTo({ url: '/pages/merchant/reservation/add' });
}

onPullDownRefresh(async () => { await loadData(true); uni.stopPullDownRefresh(); });
onReachBottom(() => { if (hasMore.value && !loadingMore.value) { page.value++; loadData(); } });
</script>

<template>
  <view class="list-page">
    <AppNavbar title="预约管理" />

    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-input-wrap">
        <text class="search-icon">&#x1F50D;</text>
        <input
          v-model="searchText"
          class="search-input"
          placeholder="搜索手机号/姓名"
          confirm-type="search"
          @confirm="onSearch"
        />
      </view>
      <button class="btn btn-primary btn-sm" style="min-width: 140rpx;" @tap="goToAdd">
        + 添加
      </button>
    </view>

    <!-- 日期和状态筛选 -->
    <view class="filter-row">
      <picker mode="date" :value="selectedDate" @change="(e: { detail: { value: string } }) => { selectedDate = e.detail.value; loadData(true); }">
        <view class="filter-item">
          <text>{{ selectedDate || '选择日期' }}</text>
          <text class="filter-arrow">&#x2304;</text>
        </view>
      </picker>
      <scroll-view scroll-x class="filter-tabs" :show-scrollbar="false">
        <view
          v-for="tab in MERCHANT_STATUS_TABS"
          :key="tab.value"
          class="filter-tab"
          :class="{ 'filter-tab--active': activeTab === tab.value }"
          @tap="onTabChange(tab.value)"
        >
          <text class="filter-tab-text">{{ tab.label }}</text>
        </view>
      </scroll-view>
    </view>

    <PageContainer :loading="loading && page === 1" :error="error" :show-navbar="false" @retry="loadData(true)">
      <template v-if="!loading && reservations.length === 0 && !error">
        <EmptyState title="暂无预约记录" />
      </template>
      <view v-else class="list-content">
        <ReservationCard
          v-for="item in reservations"
          :key="item.id"
          :reservation="item"
          :show-actions="true"
          action-type="merchant"
          @click="onCardClick"
          @confirm="handleConfirm"
          @reject="handleReject"
          @checkin="handleCheckin"
        />
        <view v-if="loadingMore" class="load-more"><text class="load-more-text">加载中...</text></view>
        <view v-else-if="!hasMore && reservations.length > 0" class="load-more"><text class="load-more-text">没有更多了</text></view>
      </view>
    </PageContainer>

    <!-- 拒绝弹窗 -->
    <ConfirmDialog
      :visible="rejectDialogVisible"
      title="拒绝预约"
      content="确认拒绝该预约？"
      confirm-text="确认拒绝"
      confirm-type="danger"
      @confirm="handleRejectConfirm"
      @close="rejectDialogVisible = false"
    />
  </view>
</template>

<style scoped>
.list-page { min-height: 100vh; background: var(--color-bg-page); }

.search-bar {
  display: flex;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-lg);
  background: var(--color-bg-card);
}

.search-input-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  background: var(--color-bg-page);
  border: 1rpx solid var(--color-border);
  border-radius: var(--radius-input);
  padding: 0 var(--space-md);
  height: 64rpx;
}

.search-icon { font-size: 28rpx; color: var(--color-text-placeholder); }

.search-input {
  flex: 1;
  font-size: 26rpx;
  color: var(--color-text-primary);
}

.filter-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-lg);
  background: var(--color-bg-card);
  border-bottom: 1rpx solid var(--color-border);
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 4rpx;
  font-size: 24rpx;
  color: var(--color-text-primary);
  white-space: nowrap;
}

.filter-arrow { font-size: 20rpx; color: var(--color-text-placeholder); }

.filter-tabs { flex: 1; display: flex; white-space: nowrap; }

.filter-tab {
  display: inline-flex;
  padding: var(--space-xs) var(--space-sm);
  font-size: 22rpx;
  color: var(--color-text-secondary);
}

.filter-tab--active .filter-tab-text { color: var(--color-primary); font-weight: 600; }

.list-content { padding: var(--space-sm) var(--space-lg); }

.load-more { display: flex; justify-content: center; padding: var(--space-md); }
.load-more-text { font-size: 24rpx; color: var(--color-text-placeholder); }
</style>
