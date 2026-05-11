<script setup lang="ts">
import { ref } from 'vue';
import { searchMembers, type MemberItem } from '@/api/member';
import { maskPhone } from '@/utils/index';

const searchText = ref('');
const members = ref<MemberItem[]>([]);
const loading = ref(false);
const searched = ref(false);
const totalPages = ref(0);
const page = ref(1);

async function doSearch(resetPage = true): Promise<void> {
  if (!searchText.value.trim()) {
    uni.showToast({ title: '请输入手机号或姓名', icon: 'none' });
    return;
  }
  if (resetPage) page.value = 1;
  loading.value = true;
  searched.value = true;
  try {
    const res = await searchMembers({ search: searchText.value.trim(), page: page.value, page_size: 20 });
    if (res.code === 0 && res.data) {
      members.value = resetPage ? res.data.list : [...members.value, ...res.data.list];
      totalPages.value = res.data.pagination.total_pages;
    }
  } finally { loading.value = false; }
}

function onSearchConfirm(): void { doSearch(true); }

function onMemberClick(member: MemberItem): void {
  uni.navigateTo({ url: `/pages/merchant/member/detail?id=${member.id}` });
}
</script>

<template>
  <view class="search-page">
    <AppNavbar title="会员查询" />

    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-input-wrap">
        <text class="search-icon">&#x1F50D;</text>
        <input
          v-model="searchText"
          class="search-input"
          placeholder="输入手机号或姓名搜索"
          confirm-type="search"
          @confirm="onSearchConfirm"
        />
      </view>
      <button class="btn btn-primary btn-sm" style="min-width: 120rpx;" @tap="onSearchConfirm">搜索</button>
    </view>

    <!-- 结果 -->
    <view class="search-results">
      <template v-if="!searched">
        <EmptyState
          icon="&#x1F50D;"
          title="输入手机号或姓名搜索会员"
        />
      </template>

      <template v-else-if="loading">
        <LoadingSkeleton type="list" :count="5" />
      </template>

      <template v-else-if="members.length === 0">
        <EmptyState title="未找到该会员" />
      </template>

      <template v-else>
        <view v-for="member in members" :key="member.id" class="member-item" @tap="onMemberClick(member)">
          <view class="member-info">
            <text class="member-name">{{ member.name }}</text>
            <text class="member-phone">{{ maskPhone(member.phone) }}</text>
          </view>
          <view class="member-stats">
            <view class="member-stat">
              <text class="stat-num">{{ member.total_visits }}</text>
              <text class="stat-label">次到店</text>
            </view>
            <view class="member-stat">
              <text class="stat-num">{{ member.total_duration_minutes >= 60 ? Math.floor(member.total_duration_minutes / 60) + 'h' : member.total_duration_minutes + 'm' }}</text>
              <text class="stat-label">累计</text>
            </view>
          </view>
          <text class="member-arrow">&#x203A;</text>
        </view>
      </template>
    </view>
  </view>
</template>

<style scoped>
.search-page { min-height: 100vh; background: var(--color-bg-page); }
.search-bar { display: flex; gap: var(--space-sm); padding: var(--space-sm) var(--space-lg); background: var(--color-bg-card); }
.search-input-wrap { flex: 1; display: flex; align-items: center; gap: var(--space-xs); background: var(--color-bg-page); border: 1rpx solid var(--color-border); border-radius: var(--radius-input); padding: 0 var(--space-md); height: 64rpx; }
.search-icon { font-size: 28rpx; }
.search-input { flex: 1; font-size: 26rpx; color: var(--color-text-primary); }

.search-results { padding: var(--space-sm) var(--space-lg); }

.member-item {
  display: flex;
  align-items: center;
  padding: var(--space-md);
  background: var(--color-bg-card);
  border-radius: var(--radius-card-sm);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--space-sm);
  min-height: 88rpx;
}

.member-info { flex: 1; display: flex; flex-direction: column; gap: 4rpx; }
.member-name { font-size: 28rpx; font-weight: 600; color: var(--color-text-primary); }
.member-phone { font-size: 24rpx; color: var(--color-text-secondary); font-family: monospace; }

.member-stats { display: flex; gap: var(--space-md); margin-right: var(--space-sm); }
.member-stat { display: flex; flex-direction: column; align-items: center; }
.stat-num { font-size: 24rpx; font-weight: 600; color: var(--color-primary); }
.stat-label { font-size: 20rpx; color: var(--color-text-placeholder); }

.member-arrow { font-size: 36rpx; color: var(--color-text-placeholder); }
</style>
