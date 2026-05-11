<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { onLoad, onReachBottom } from '@dcloudio/uni-app';
import { getMemberDetail, type MemberDetail, type ConsumptionRecord } from '@/api/member';
import { maskPhone } from '@/utils/index';
import { formatDateDisplay, formatDuration } from '@/utils/date';

const loading = ref(true);
const member = ref<MemberDetail | null>(null);
const records = ref<ConsumptionRecord[]>([]);
const page = ref(1);
const totalPages = ref(0);
const loadingMore = ref(false);
const hasMore = ref(true);
const memberId = ref(0);

onLoad((options) => {
  const id = parseInt(options?.id as string, 10);
  if (id) { memberId.value = id; loadData(true); } else { loading.value = false; }
});

async function loadData(resetPage = true): Promise<void> {
  if (resetPage) { page.value = 1; loading.value = true; } else { loadingMore.value = true; }
  try {
    const res = await getMemberDetail(memberId.value, page.value, 20);
    if (res.code === 0 && res.data) {
      member.value = res.data;
      if (resetPage) {
        records.value = res.data.records.list;
      } else {
        records.value.push(...res.data.records.list);
      }
      totalPages.value = res.data.records.pagination.total_pages;
      hasMore.value = page.value < totalPages.value;
    }
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
}

function loadMore(): void {
  if (!hasMore.value || loadingMore.value) return;
  page.value++;
  loadData(false);
}

onReachBottom(loadMore);
</script>

<template>
  <view class="member-detail-page">
    <AppNavbar title="会员详情" :show-back="true" />

    <template v-if="loading && page === 1">
      <LoadingSkeleton type="detail" />
    </template>

    <template v-else-if="member">
      <scroll-view scroll-y class="detail-scroll" @scrolltolower="loadMore">
        <!-- 会员信息卡片 -->
        <view class="card member-card">
          <text class="member-name">{{ member.name }}</text>
          <text class="member-phone">{{ maskPhone(member.phone) }}</text>
          <view class="member-meta">
            <view class="meta-item">
              <text class="meta-value">{{ member.total_visits }}</text>
              <text class="meta-label">累计到店</text>
            </view>
            <view class="meta-item">
              <text class="meta-value">{{ member.total_duration_minutes >= 60 ? Math.floor(member.total_duration_minutes / 60) + 'h' : member.total_duration_minutes + 'm' }}</text>
              <text class="meta-label">累计时长</text>
            </view>
            <view class="meta-item">
              <text class="meta-value">{{ member.last_visit_date ? formatDateDisplay(member.last_visit_date) : '暂无' }}</text>
              <text class="meta-label">最近到店</text>
            </view>
          </view>
        </view>

        <!-- 历史记录 -->
        <view class="section-title">历史到店记录</view>
        <template v-if="records.length > 0">
          <view v-for="record in records" :key="record.id" class="card record-card">
            <view class="record-header">
              <text class="record-date">{{ formatDateDisplay(record.visit_date) }}</text>
              <view v-if="record.has_coupon" class="record-tag">
                <text class="tag-text">&#x1F3AB; 券</text>
              </view>
            </view>
            <view class="record-body">
              <text class="record-text">{{ formatDuration(record.duration_minutes) }}</text>
              <text class="record-source">{{ record.source === 'merchant' ? '商家代约' : record.source === 'customer' ? '小程序' : '到店' }}</text>
            </view>
          </view>

          <view v-if="loadingMore" class="load-more"><text class="load-more-text">加载中...</text></view>
          <view v-else-if="!hasMore && records.length > 0" class="load-more"><text class="load-more-text">没有更多了</text></view>
        </template>
        <EmptyState v-else title="暂无从业记录" />
      </scroll-view>
    </template>
  </view>
</template>

<style scoped>
.member-detail-page { min-height: 100vh; background: var(--color-bg-page); }
.detail-scroll { padding: var(--space-md) var(--space-lg); }

.member-card {
  padding: var(--space-lg);
  margin-bottom: var(--space-lg);
  text-align: center;
}

.member-name {
  font-size: 40rpx;
  font-weight: 700;
  color: var(--color-text-primary);
  display: block;
  margin-bottom: var(--space-xs);
}

.member-phone {
  font-size: 26rpx;
  color: var(--color-text-secondary);
  font-family: monospace;
  display: block;
  margin-bottom: var(--space-md);
}

.member-meta {
  display: flex;
  justify-content: center;
  gap: var(--space-xl);
}

.meta-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.meta-value {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--color-primary);
}

.meta-label {
  font-size: 22rpx;
  color: var(--color-text-placeholder);
  margin-top: 4rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--space-sm);
}

.record-card {
  padding: var(--space-md);
  margin-bottom: var(--space-sm);
}

.record-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-xs);
}

.record-date {
  font-size: 28rpx;
  font-weight: 500;
  color: var(--color-text-primary);
}

.record-tag {
  background: var(--color-primary-bg);
  padding: 2rpx 10rpx;
  border-radius: 4rpx;
}

.tag-text {
  font-size: 20rpx;
  color: var(--color-primary);
}

.record-body {
  display: flex;
  justify-content: space-between;
}

.record-text {
  font-size: 26rpx;
  color: var(--color-text-secondary);
}

.record-source {
  font-size: 22rpx;
  color: var(--color-text-placeholder);
}

.load-more { display: flex; justify-content: center; padding: var(--space-md); }
.load-more-text { font-size: 24rpx; color: var(--color-text-placeholder); }
</style>
