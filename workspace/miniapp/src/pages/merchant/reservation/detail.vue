<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getReservationDetail, confirmReservation, rejectReservation, type ReservationDetail } from '@/api/reservation';
import { formatDateDisplay, formatDateTime, isToday } from '@/utils/date';

const loading = ref(true);
const detail = ref<ReservationDetail | null>(null);
const reservationId = ref(0);
const rejectDialogVisible = ref(false);
const rejectReason = ref('');

onLoad((options) => {
  const id = parseInt(options?.id as string, 10);
  if (id) { reservationId.value = id; loadDetail(); } else { loading.value = false; }
});

async function loadDetail(): Promise<void> {
  loading.value = true;
  const res = await getReservationDetail(reservationId.value);
  if (res.code === 0 && res.data) { detail.value = res.data; }
  loading.value = false;
}

const isTodayReservation = computed(() => detail.value ? isToday(detail.value.reservation_date) : false);

async function handleConfirm(): Promise<void> {
  const res = await confirmReservation(reservationId.value);
  if (res.code === 0) { uni.showToast({ title: '已确认', icon: 'success' }); loadDetail(); }
  else { uni.showToast({ title: res.message || '操作失败', icon: 'none' }); }
}

function handleReject(): void { rejectDialogVisible.value = true; }

async function handleRejectConfirm(): Promise<void> {
  const res = await rejectReservation(reservationId.value, rejectReason.value || undefined);
  if (res.code === 0) { uni.showToast({ title: '已拒绝', icon: 'success' }); loadDetail(); }
  else { uni.showToast({ title: res.message || '操作失败', icon: 'none' }); }
  rejectDialogVisible.value = false;
}

function handleCheckin(): void {
  uni.navigateTo({ url: `/pages/merchant/timer/checkin?id=${reservationId.value}` });
}

function handleViewTimer(): void {
  if (detail.value?.timer_session) {
    uni.navigateTo({ url: `/pages/merchant/timer/detail?sessionId=${detail.value.timer_session.id}` });
  }
}

function callCustomer(): void {
  const phone = detail.value?.customer_phone_full;
  if (phone) { uni.makePhoneCall({ phoneNumber: phone }); }
}
</script>

<template>
  <view class="detail-page">
    <AppNavbar title="预约详情" :show-back="true" />

    <view v-if="loading" class="loading-wrap">
      <LoadingSkeleton type="detail" />
    </view>

    <template v-else-if="detail">
      <scroll-view scroll-y class="detail-scroll">
        <!-- 状态 -->
        <view class="status-section">
          <StatusBadge :status="detail.status" size="large" />
        </view>

        <!-- 顾客信息 -->
        <view class="card">
          <text class="card-title">顾客信息</text>
          <view class="info-grid">
            <view class="info-row"><text class="info-label">姓名</text><text class="info-value">{{ detail.customer_name }}</text></view>
            <view class="info-row">
              <text class="info-label">手机号</text>
              <text class="info-value info-value--phone" @tap="callCustomer">{{ detail.customer_phone_full || detail.customer_phone }}</text>
            </view>
          </view>
        </view>

        <!-- 预约信息 -->
        <view class="card">
          <text class="card-title">预约信息</text>
          <view class="info-grid">
            <view class="info-row"><text class="info-label">日期</text><text class="info-value">{{ formatDateDisplay(detail.reservation_date) }}</text></view>
            <view class="info-row"><text class="info-label">时段</text><text class="info-value">{{ detail.slot_start_time }} - {{ detail.slot_end_time }}</text></view>
            <view class="info-row"><text class="info-label">人数</text><text class="info-value">{{ detail.guest_count }}人</text></view>
            <view class="info-row"><text class="info-label">来源</text><text class="info-value">{{ detail.source === 'merchant' ? '商家代约' : '小程序' }}</text></view>
            <view class="info-row"><text class="info-label">提交时间</text><text class="info-value">{{ formatDateTime(detail.created_at) }}</text></view>
            <view v-if="detail.remark" class="info-row"><text class="info-label">备注</text><text class="info-value">{{ detail.remark }}</text></view>
          </view>
        </view>

        <!-- 计时信息 -->
        <view v-if="detail.timer_session" class="card">
          <text class="card-title">计时信息</text>
          <view class="info-grid">
            <view class="info-row"><text class="info-label">桌位</text><text class="info-value">{{ detail.timer_session.table_number }}号桌</text></view>
            <view class="info-row"><text class="info-label">到店</text><text class="info-value">{{ formatDateTime(detail.timer_session.check_in_time) }}</text></view>
            <view class="info-row"><text class="info-label">加时</text><text class="info-value">{{ detail.timer_session.total_extension_minutes }}分钟</text></view>
          </view>
        </view>

        <!-- 团购券 -->
        <view v-if="detail.timer_session?.coupons?.length" class="card">
          <text class="card-title">团购券</text>
          <view v-for="c in detail.timer_session.coupons" :key="c.id" class="coupon-item">
            <text class="coupon-code">{{ c.coupon_code }}</text>
            <text class="coupon-source">{{ c.coupon_source }}</text>
          </view>
        </view>

        <view style="height: 180rpx;" />
      </scroll-view>

      <!-- 底部操作 -->
      <view class="bottom-bar safe-bottom">
        <template v-if="detail.status === 'pending'">
          <button class="btn btn-success" style="flex: 1;" @tap="handleConfirm">确认</button>
          <button class="btn btn-danger" style="flex: 1;" @tap="handleReject">拒绝</button>
        </template>
        <template v-else-if="detail.status === 'confirmed' && isTodayReservation">
          <button class="btn btn-primary" style="flex: 1;" @tap="handleCheckin">到店登记</button>
        </template>
        <template v-else-if="detail.status === 'in_progress'">
          <button class="btn btn-primary" style="flex: 1;" @tap="handleViewTimer">查看计时</button>
        </template>
        <template v-else>
          <button class="btn btn-primary" style="flex: 1;" disabled>已完成</button>
        </template>
      </view>
    </template>

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
.detail-page { min-height: 100vh; background: var(--color-bg-page); display: flex; flex-direction: column; }

.loading-wrap { padding: var(--space-lg); }

.detail-scroll { flex: 1; padding: 0 var(--space-lg); }

.status-section { display: flex; justify-content: center; padding: var(--space-xl) 0; }

.card { background: var(--color-bg-card); border-radius: var(--radius-card); box-shadow: var(--shadow-sm); padding: var(--space-md); margin-bottom: var(--space-md); }

.card-title { font-size: 28rpx; font-weight: 600; color: var(--color-text-primary); margin-bottom: var(--space-sm); display: block; }

.info-grid { display: flex; flex-direction: column; }

.info-row { display: flex; justify-content: space-between; padding: var(--space-xs) 0; }
.info-row + .info-row { border-top: 1rpx solid var(--color-border); margin-top: var(--space-xs); padding-top: var(--space-sm); }

.info-label { font-size: 26rpx; color: var(--color-text-secondary); flex-shrink: 0; }

.info-value { font-size: 26rpx; color: var(--color-text-primary); text-align: right; }
.info-value--phone { color: var(--color-text-link); }

.coupon-item { display: flex; gap: var(--space-sm); padding: var(--space-xs) 0; font-size: 24rpx; }
.coupon-code { color: var(--color-text-primary); font-family: monospace; }
.coupon-source { color: var(--color-text-secondary); }

.bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; background: var(--color-bg-card); box-shadow: var(--shadow-md); padding: var(--space-sm) var(--space-lg); z-index: 50; display: flex; gap: var(--space-sm); }
</style>
