<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useUserStore } from '@/store/user';
import { USER_ROLE } from '@/utils/constants';

const userStore = useUserStore();

interface TabItem {
  pagePath: string;
  text: string;
  icon: string;
}

const customerTabs: TabItem[] = [
  { pagePath: '/pages/customer/store/index', text: '首页', icon: '\u{1F3E0}' },
  { pagePath: '/pages/customer/reservation/my-list', text: '我的预约', icon: '\u{1F4C5}' },
];

const merchantTabs: TabItem[] = [
  { pagePath: '/pages/merchant/dashboard/index', text: '工作台', icon: '\u{1F4CA}' },
  { pagePath: '/pages/merchant/reservation/list', text: '预约', icon: '\u{1F4CB}' },
  { pagePath: '/pages/merchant/timer/dashboard', text: '计时', icon: '\u{23F1}' },
  { pagePath: '/pages/merchant/member/search', text: '会员', icon: '\u{1F465}' },
];

const tabs = computed(() => {
  return userStore.isMerchant ? merchantTabs : customerTabs;
});

const currentIndex = ref(0);

// 监听页面切换
watch(
  () => tabs.value,
  () => {
    currentIndex.value = 0;
  }
);

function switchTab(index: number): void {
  const tab = tabs.value[index];
  if (!tab) return;
  currentIndex.value = index;
  uni.switchTab({
    url: tab.pagePath,
  });
}

// 根据当前页面路径判断选中项
function getCurrentIndex(): number {
  const pages = getCurrentPages();
  if (pages.length === 0) return 0;
  const currentPath = '/' + pages[pages.length - 1].route;
  return tabs.value.findIndex(t => t.pagePath === currentPath);
}

// 初始化时使用 uni 的 selected 属性
const selected = ref(0);

// 暴露给 uni-app 调用的方法
defineExpose({
  setSelected(index: number) {
    selected.value = index;
  },
});
</script>

<template>
  <view class="custom-tab-bar safe-bottom">
    <view
      v-for="(tab, index) in tabs"
      :key="tab.pagePath"
      class="tab-item"
      :class="{ 'tab-item--active': selected === index }"
      @tap="switchTab(index)"
    >
      <text class="tab-icon">{{ tab.icon }}</text>
      <text class="tab-text">{{ tab.text }}</text>
    </view>
  </view>
</template>

<style scoped>
.custom-tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-around;
  background: #FFFFFF;
  box-shadow: 0 -1rpx 0 0 #F0E4D4;
  height: 100rpx;
  z-index: 999;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 80rpx;
  padding-top: 4rpx;
  transition: all 150ms;
}

.tab-item--active .tab-text {
  color: #E07A5F;
  font-weight: 500;
}

.tab-icon {
  font-size: 40rpx;
  line-height: 1;
  margin-bottom: 2rpx;
}

.tab-text {
  font-size: 20rpx;
  color: #B8AAA5;
  line-height: 1;
  transition: color 150ms;
}

.tab-item--active .tab-text {
  color: #E07A5F;
}
</style>
