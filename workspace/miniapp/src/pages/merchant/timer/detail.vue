<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getReservationDetail, type ReservationDetail } from '@/api/reservation';
import { useTimerStore } from '@/store/timer';
import { formatCountdown, formatDuration, formatDateTime } from '@/utils/date';
import { TIMER_URGENT_THRESHOLD, TIMER_CRITICAL_THRESHOLD } from '@/utils/constants';

const timerStore = useTimerStore();

const loading = ref(true);
const detail = ref<ReservationDetail | null>(null);
const sessionId = ref(0);
const extendPickerVisible = ref(false);
const endDialogVisible = ref(false);

const now = ref(Date.now());
let ticker: ReturnType<typeof setInterval> | null = null;

onLoad((options) => {
  const id = parseInt(options?.sessionId as string, 10);
  if (id) { sessionId.value = id; loadData(); } else { loading.value = false; }
});

onMounted(() => { ticker = setInterval(() => { now.value = Date.now(); }, 1000); });
onUnmounted(() => { if (ticker) clearInterval(ticker); });

async function loadData(): Promise<void> {
  loading.value = true;
  // 通过预约详情获取计时信息（timer_session）
  // 在实际项目中可能需要单独的 timer_sessions 详情接口
  // 这里尝试通过看板数据获取
  await timerStore.fetchDashboard();
  const session = timerStore.sessions.find(s => s.id === sessionId.value);
  if (session) {
    // 构造基本详情对象
    detail.value = {
      id: 0,
      reservation_date: '',
      slot_start_time: session.slot_start_time,
      slot_end_time: session.slot_end_time,
      guest_count: 0,
      customer_name: session.customer_name,
      status: 'in_progress',
      source: 'customer',
      created_at: session.check_in_time,
      updated_at: session.check_in_time,
      timer_session: {
        id: session.id,
        table_number: session.table_number,
        check_in_time: session.check_in_time,
        expected_end_time: '',
        actual_end_time: null,
        original_duration_minutes: (session.used_minutes + session.total_extension_minutes) - session.total_extension_minutes,
        total_extension_minutes: session.total_extension_minutes,
        status: 'active',
        remaining_seconds: session.remaining_seconds,
        extensions: [],
        coupons: [],
      },
    };
  }
  loading.value = false;
}

// 实时剩余秒数
const liveRemaining = computed(() => {
  if (!detail.value?.timer_session) return 0;
  const totalSec = (detail.value.timer_session.original_duration_minutes + detail.value.timer_session.total_extension_minutes) * 60;
  const elapsed = Math.floor((now.value - new Date(detail.value.timer_session.check_in_time).getTime()) / 1000);
  return Math.max(0, totalSec - elapsed);
});

const isUrgent = computed(() => liveRemaining.value <= TIMER_URGENT_THRESHOLD && liveRemaining.value > TIMER_CRITICAL_THRESHOLD);
const isCritical = computed(() => liveRemaining.value <= TIMER_CRITICAL_THRESHOLD);

const countdownColor = computed(() => {
  if (isCritical.value) return '#E76F51';
  if (isUrgent.value) return '#E8A040';
  return '#81B29A';
});

async function handleExtendConfirm(minutes: number): Promise<void> {
  if (!detail.value?.timer_session) return;
  const result = await timerStore.extendTimerSession(detail.value.timer_session.id, minutes);
  if (result.success) {
    uni.showToast({ title: result.message, icon: 'success' });
    loadData();
  } else {
    uni.showToast({ title: result.message, icon: 'none' });
  }
  extendPickerVisible.value = false;
}

async function handleEndConfirm(): Promise<void> {
  if (!detail.value?.timer_session) return;
  const result = await timerStore.endTimerSession(detail.value.timer_session.id);
  if (result.success) {
    uni.showToast({ title: result.message, icon: 'success' });
    setTimeout(() => { uni.navigateBack(); }, 1500);
  } else {
    uni.showToast({ title: result.message, icon: 'none' });
  }
  endDialogVisible.value = false;
}
</script>

<template>
  <view class="timer-detail-page">
    <AppNavbar title="计时详情" :show-back="true" />

    <template v-if="loading">
      <LoadingSkeleton type="detail" />
    </template>

    <template v-else-if="detail?.timer_session">
      <scroll-view scroll-y class="detail-scroll">
        <!-- 倒计时 -->
        <view class="countdown-section">
          <text class="countdown-number" :style="{ color: countdownColor }" :class="{ 'countdown-critical': isCritical }">
            {{ formatCountdown(liveRemaining) }}
          </text>
          <text class="countdown-label">剩余</text>
        </view>

        <!-- 进度条 -->
        <view class="progress-section">
          <view class="progress-bar">
            <view
              class="progress-fill"
              :style="{
                width: `${((detail.timer_session.original_duration_minutes + detail.timer_session.total_extension_minutes > 0)
                  ? (detail.timer_session.original_duration_minutes / (detail.timer_session.original_duration_minutes + detail.timer_session.total_extension_minutes)) * 100 : 0)}%`,
                backgroundColor: countdownColor,
              }"
            />
          </view>
          <text class="progress-text">
            已用 {{ formatDuration(detail.timer_session.original_duration_minutes) }} / 总计 {{ formatDuration(detail.timer_session.original_duration_minutes + detail.timer_session.total_extension_minutes) }}
          </text>
        </view>

        <!-- 信息卡片 -->
        <view class="card">
          <text class="card-title">当前计时</text>
          <view class="info-grid">
            <view class="info-row"><text class="info-label">顾客</text><text class="info-value">{{ detail.customer_name }}</text></view>
            <view class="info-row"><text class="info-label">桌位</text><text class="info-value">{{ detail.timer_session.table_number }}号桌</text></view>
            <view class="info-row"><text class="info-label">时段</text><text class="info-value">{{ detail.slot_start_time }} - {{ detail.slot_end_time }}</text></view>
            <view class="info-row"><text class="info-label">到店</text><text class="info-value">{{ formatDateTime(detail.timer_session.check_in_time) }}</text></view>
            <view v-if="detail.timer_session.total_extension_minutes > 0" class="info-row">
              <text class="info-label">已加时</text><text class="info-value info-value--highlight">{{ detail.timer_session.total_extension_minutes }}分钟</text>
            </view>
          </view>
        </view>

        <!-- 加时记录 -->
        <view v-if="detail.timer_session.extensions?.length" class="card">
          <text class="card-title">加时记录</text>
          <view v-for="ext in detail.timer_session.extensions" :key="ext.id" class="ext-item">
            <text class="ext-text">+{{ ext.extension_minutes }}分钟</text>
            <text class="ext-time">{{ formatDateTime(ext.created_at) }}</text>
          </view>
        </view>

        <!-- 团购券 -->
        <view v-if="detail.timer_session.coupons?.length" class="card">
          <text class="card-title">已核销券</text>
          <view v-for="c in detail.timer_session.coupons" :key="c.id" class="coupon-row">
            <text class="coupon-code">{{ c.coupon_code }}</text>
            <text class="coupon-src">{{ c.coupon_source }}</text>
          </view>
        </view>

        <view style="height: 200rpx;" />
      </scroll-view>

      <!-- 底部操作 -->
      <view class="bottom-bar safe-bottom">
        <button class="btn btn-text bottom-action-btn" @tap="extendPickerVisible = true">
          + 加时
        </button>
        <button class="btn btn-danger-solid bottom-action-btn" @tap="endDialogVisible = true">
          结束计时
        </button>
      </view>
    </template>

    <template v-else>
      <EmptyState title="未找到计时信息" />
    </template>

    <!-- 加时选择器 -->
    <TimeExtensionPicker
      :visible="extendPickerVisible"
      :customer-name="detail?.customer_name"
      @confirm="handleExtendConfirm"
      @close="extendPickerVisible = false"
    />

    <!-- 结束确认 -->
    <ConfirmDialog
      :visible="endDialogVisible"
      title="结束计时"
      :content="`确认 ${detail?.customer_name} 已离店？计时将停止，桌位将释放。`"
      confirm-text="确认离店"
      confirm-type="danger"
      @confirm="handleEndConfirm"
      @close="endDialogVisible = false"
    />
  </view>
</template>

<style scoped>
.timer-detail-page { min-height: 100vh; background: var(--color-bg-page); display: flex; flex-direction: column; }
.detail-scroll { flex: 1; padding: 0 var(--space-lg); }

.countdown-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-xl) 0;
}

.countdown-number {
  font-size: 72rpx;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  transition: color 300ms;
}

.countdown-critical {
  animation: breathe-color 2.5s ease-in-out infinite;
}

.countdown-label { font-size: 28rpx; color: var(--color-text-secondary); margin-top: var(--space-xs); }

.progress-section { margin-bottom: var(--space-lg); }
.progress-bar { height: 8rpx; background: var(--color-border); border-radius: 4rpx; overflow: hidden; margin-bottom: 8rpx; }
.progress-fill { height: 100%; border-radius: 4rpx; transition: width 1s linear; }
.progress-text { font-size: 22rpx; color: var(--color-text-placeholder); }

.card { background: var(--color-bg-card); border-radius: var(--radius-card); box-shadow: var(--shadow-sm); padding: var(--space-md); margin-bottom: var(--space-md); }
.card-title { font-size: 28rpx; font-weight: 600; color: var(--color-text-primary); margin-bottom: var(--space-sm); display: block; }
.info-grid { display: flex; flex-direction: column; }
.info-row { display: flex; justify-content: space-between; padding: var(--space-xs) 0; }
.info-row + .info-row { border-top: 1rpx solid var(--color-border); margin-top: var(--space-xs); padding-top: var(--space-sm); }
.info-label { font-size: 26rpx; color: var(--color-text-secondary); }
.info-value { font-size: 26rpx; color: var(--color-text-primary); text-align: right; }
.info-value--highlight { color: var(--color-primary); font-weight: 500; }

.ext-item { display: flex; justify-content: space-between; padding: var(--space-xs) 0; }
.ext-item + .ext-item { border-top: 1rpx solid var(--color-border); }
.ext-text { font-size: 24rpx; color: var(--color-primary); }
.ext-time { font-size: 22rpx; color: var(--color-text-placeholder); }
.coupon-row { display: flex; gap: var(--space-sm); padding: var(--space-xs) 0; font-size: 24rpx; }
.coupon-code { color: var(--color-text-primary); font-family: monospace; }
.coupon-src { color: var(--color-text-secondary); }

.bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; background: var(--color-bg-card); box-shadow: var(--shadow-md); padding: var(--space-sm) var(--space-lg); z-index: 50; display: flex; gap: var(--space-sm); }
.bottom-action-btn { flex: 1; min-height: 88rpx !important; }
</style>
