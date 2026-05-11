<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getReservationDetail, type ReservationDetail } from '@/api/reservation';
import { checkin as checkinApi } from '@/api/timer';
import { useStoreInfoStore } from '@/store/store';
import { validateTableNumber } from '@/utils/validator';

const storeInfoStore = useStoreInfoStore();

const loading = ref(true);
const submitting = ref(false);
const detail = ref<ReservationDetail | null>(null);
const tableNumber = ref<number | undefined>(undefined);
const tableError = ref('');
const coupons = ref<Array<{ id: string; coupon_code: string; coupon_source: string; coupon_type: string }>>([]);
const reservationId = ref(0);

onLoad((options) => {
  const id = parseInt(options?.id as string, 10);
  if (id) { reservationId.value = id; loadDetail(); } else { loading.value = false; }
});

async function loadDetail(): Promise<void> {
  loading.value = true;
  await storeInfoStore.fetchStoreInfo();
  const res = await getReservationDetail(reservationId.value);
  if (res.code === 0 && res.data) { detail.value = res.data; }
  loading.value = false;
}

// 自动分配桌位号
const autoTableSuggestion = computed(() => {
  const total = storeInfoStore.storeInfo?.table_count || 0;
  if (!total) return undefined;
  return Math.ceil(Math.random() * total) || 1;
});

function useAutoTable(): void {
  tableNumber.value = autoTableSuggestion.value;
}

async function handleSubmit(): Promise<void> {
  tableError.value = '';
  if (tableNumber.value) {
    const vr = validateTableNumber(tableNumber.value);
    if (!vr.valid) { tableError.value = vr.message; return; }
  }

  submitting.value = true;
  try {
    const res = await checkinApi(reservationId.value, {
      table_number: tableNumber.value,
      coupons: coupons.value.map(c => ({
        coupon_code: c.coupon_code,
        coupon_source: c.coupon_source,
        coupon_type: c.coupon_type || undefined,
      })),
    });
    if (res.code === 0) {
      uni.showToast({ title: '已开始计时', icon: 'success' });
      setTimeout(() => {
        uni.redirectTo({ url: '/pages/merchant/timer/dashboard' });
      }, 1500);
    } else {
      uni.showToast({ title: res.message || '操作失败', icon: 'none' });
    }
  } finally { submitting.value = false; }
}
</script>

<template>
  <view class="checkin-page">
    <AppNavbar title="到店登记" :show-back="true" />

    <template v-if="loading">
      <LoadingSkeleton type="detail" />
    </template>

    <template v-else-if="detail">
      <scroll-view scroll-y class="checkin-scroll">
        <!-- 预约信息确认 -->
        <view class="card">
          <text class="card-title">预约信息确认</text>
          <view class="info-grid">
            <view class="info-row"><text class="info-label">顾客</text><text class="info-value">{{ detail.customer_name }}</text></view>
            <view class="info-row"><text class="info-label">时段</text><text class="info-value">{{ detail.slot_start_time }} - {{ detail.slot_end_time }}</text></view>
            <view class="info-row"><text class="info-label">人数</text><text class="info-value">{{ detail.guest_count }}人</text></view>
          </view>
        </view>

        <!-- 桌位号 -->
        <view class="card">
          <text class="card-title">桌位号</text>
          <view class="form-group">
            <input v-model="tableNumber" class="form-input" :class="{ 'form-input--error': tableError }" type="number" placeholder="手动输入桌位号（或自动分配）" />
            <text v-if="tableError" class="form-error">{{ tableError }}</text>
          </view>
          <button v-if="autoTableSuggestion && !tableNumber" class="btn btn-text btn-sm" @tap="useAutoTable">
            自动分配（建议 {{ autoTableSuggestion }} 号桌）
          </button>
        </view>

        <!-- 团购券 -->
        <view class="card">
          <CouponInput v-model="coupons" />
        </view>

        <view style="height: 200rpx;" />
      </scroll-view>

      <!-- 底部按钮 -->
      <view class="bottom-bar safe-bottom">
        <button class="btn btn-primary bottom-btn" :loading="submitting" @tap="handleSubmit">
          确认到店，开始计时
        </button>
      </view>
    </template>

    <template v-else>
      <EmptyState title="未找到该预约" />
    </template>
  </view>
</template>

<style scoped>
.checkin-page { min-height: 100vh; background: var(--color-bg-page); display: flex; flex-direction: column; }
.checkin-scroll { flex: 1; padding: 0 var(--space-lg); padding-top: var(--space-md); }
.card { background: var(--color-bg-card); border-radius: var(--radius-card); box-shadow: var(--shadow-sm); padding: var(--space-md); margin-bottom: var(--space-md); }
.card-title { font-size: 28rpx; font-weight: 600; color: var(--color-text-primary); margin-bottom: var(--space-sm); display: block; }
.info-grid { display: flex; flex-direction: column; }
.info-row { display: flex; justify-content: space-between; padding: var(--space-xs) 0; }
.info-row + .info-row { border-top: 1rpx solid var(--color-border); margin-top: var(--space-xs); padding-top: var(--space-sm); }
.info-label { font-size: 26rpx; color: var(--color-text-secondary); }
.info-value { font-size: 26rpx; color: var(--color-text-primary); }
.form-group { margin-bottom: var(--space-sm); }
.form-input { width: 100%; height: var(--input-height); background: var(--color-bg-page); border: 1rpx solid var(--color-border); border-radius: var(--radius-input); padding: 0 var(--space-md); font-size: 28rpx; }
.form-input:focus { border-color: var(--color-primary); }
.form-input--error { border-color: var(--color-danger); background: #FFF8F6; }
.form-error { font-size: 22rpx; color: var(--color-danger); margin-top: 4rpx; }
.bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; background: var(--color-bg-card); box-shadow: var(--shadow-md); padding: var(--space-sm) var(--space-lg); z-index: 50; }
.bottom-btn { width: 100%; }
</style>
