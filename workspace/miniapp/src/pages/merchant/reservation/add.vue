<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useReservationStore } from '@/store/reservation';
import { useStoreInfoStore } from '@/store/store';
import { createMerchantReservation } from '@/api/reservation';
import { getToday } from '@/utils/date';
import { validatePhone, validateName } from '@/utils/validator';
import type { SlotInfo } from '@/api/reservation';

const reservationStore = useReservationStore();
const storeInfoStore = useStoreInfoStore();

const selectedDate = ref(getToday());
const selectedSlotKey = ref('');
const guestCount = ref(1);
const phone = ref('');
const name = ref('');
const remark = ref('');

const dateLoading = ref(false);
const submitting = ref(false);
const phoneError = ref('');
const nameError = ref('');

const selectedSlot = computed<SlotInfo | undefined>(() => {
  if (!selectedSlotKey.value) return undefined;
  return reservationStore.slots.find(s => `${s.start_time}-${s.end_time}` === selectedSlotKey.value);
});

onMounted(async () => {
  await storeInfoStore.fetchStoreInfo();
  await loadSlots(selectedDate.value);
});

async function loadSlots(date: string): Promise<void> {
  dateLoading.value = true;
  try { await reservationStore.fetchSlots(date); } finally { dateLoading.value = false; }
}

async function onDateChange(date: string): Promise<void> {
  selectedDate.value = date; selectedSlotKey.value = ''; await loadSlots(date);
}

function decreaseCount(): void { if (guestCount.value > 1) guestCount.value--; }
function increaseCount(): void { if (guestCount.value < 10) guestCount.value++; }

async function onSubmit(): Promise<void> {
  nameError.value = ''; phoneError.value = '';
  const nr = validateName(name.value);
  if (!nr.valid) { nameError.value = nr.message; return; }
  const pr = validatePhone(phone.value);
  if (!pr.valid) { phoneError.value = pr.message; return; }
  if (!selectedSlot.value) { uni.showToast({ title: '请选择时段', icon: 'none' }); return; }
  if (!selectedSlot.value.is_available) { uni.showToast({ title: `该时段已满（剩余 ${selectedSlot.value.available_count} 位）`, icon: 'none' }); return; }

  submitting.value = true;
  try {
    const result = await createMerchantReservation({
      reservation_date: selectedDate.value,
      slot_start_time: selectedSlot.value.start_time,
      slot_end_time: selectedSlot.value.end_time,
      guest_count: guestCount.value,
      customer_phone: phone.value.trim(),
      customer_name: name.value.trim(),
      remark: remark.value.trim() || undefined,
    });
    if (result.code === 0) {
      uni.showToast({ title: '预约添加成功', icon: 'success' });
      setTimeout(() => { uni.navigateBack(); }, 1500);
    } else {
      uni.showToast({ title: result.message || '添加失败', icon: 'none' });
    }
  } finally { submitting.value = false; }
}
</script>

<template>
  <view class="add-page">
    <AppNavbar title="添加预约" :show-back="true" />

    <scroll-view scroll-y class="add-content">
      <view class="section">
        <text class="section-title">顾客信息</text>
        <view class="form-group">
          <text class="form-label">姓名 <text class="required">*</text></text>
          <input v-model="name" class="form-input" :class="{ 'form-input--error': nameError }" placeholder="顾客姓名" maxlength="20" />
          <text v-if="nameError" class="form-error">{{ nameError }}</text>
        </view>
        <view class="form-group">
          <text class="form-label">手机号 <text class="required">*</text></text>
          <input v-model="phone" class="form-input" :class="{ 'form-input--error': phoneError }" type="number" placeholder="11位手机号" maxlength="11" />
          <text v-if="phoneError" class="form-error">{{ phoneError }}</text>
        </view>
      </view>

      <view class="section">
        <text class="section-title">预约日期</text>
        <DateSelector v-model="selectedDate" :advance-days="7" :rest-days="storeInfoStore.storeInfo?.rest_days || []" @change="onDateChange" />
      </view>

      <view class="section">
        <text class="section-title">选择时段</text>
        <SlotPicker v-model="selectedSlotKey" :slots="reservationStore.slots" :loading="dateLoading" />
        <view v-if="selectedSlot" class="capacity-hint">
          <text :style="{ color: selectedSlot.available_count <= 2 ? '#E76F51' : '#81B29A' }">
            该时段还可预约 {{ selectedSlot.available_count }} 个桌位
          </text>
        </view>
      </view>

      <view class="section">
        <text class="section-title">人数</text>
        <view class="guest-counter">
          <view class="counter-btn" :class="{ disabled: guestCount <= 1 }" @tap="decreaseCount"><text class="counter-btn-text">-</text></view>
          <text class="counter-value">{{ guestCount }}</text>
          <view class="counter-btn" :class="{ disabled: guestCount >= 10 }" @tap="increaseCount"><text class="counter-btn-text">+</text></view>
        </view>
      </view>

      <view class="section">
        <text class="section-title">备注</text>
        <textarea v-model="remark" class="form-textarea" placeholder="备注（选填）" maxlength="100" />
      </view>

      <view style="height: 200rpx;" />
    </scroll-view>

    <view class="bottom-bar safe-bottom">
      <button class="btn btn-primary bottom-btn" :disabled="!selectedSlot || submitting" :loading="submitting" @tap="onSubmit">
        {{ submitting ? '提交中...' : '提交预约（自动确认）' }}
      </button>
    </view>
  </view>
</template>

<style scoped>
.add-page { min-height: 100vh; background: var(--color-bg-page); display: flex; flex-direction: column; }
.add-content { flex: 1; padding: 0 var(--space-lg); }
.section { margin-top: var(--space-lg); }
.section-title { font-size: 28rpx; font-weight: 600; color: var(--color-text-primary); margin-bottom: var(--space-sm); display: block; }
.form-group { margin-bottom: var(--space-md); }
.form-label { font-size: 24rpx; color: var(--color-text-secondary); margin-bottom: var(--space-xs); display: block; }
.required { color: var(--color-danger); }
.form-input { width: 100%; height: var(--input-height); background: var(--color-bg-card); border: 1rpx solid var(--color-border); border-radius: var(--radius-input); padding: 0 var(--space-md); font-size: 28rpx; }
.form-input:focus { border-color: var(--color-primary); border-width: 2rpx; }
.form-input--error { border-color: var(--color-danger); border-width: 2rpx; background: #FFF8F6; }
.form-error { font-size: 22rpx; color: var(--color-danger); margin-top: 4rpx; }
.form-textarea { width: 100%; min-height: 120rpx; background: var(--color-bg-card); border: 1rpx solid var(--color-border); border-radius: var(--radius-input); padding: var(--space-sm) var(--space-md); font-size: 28rpx; }
.capacity-hint { padding: var(--space-sm) 0; font-size: 24rpx; }
.guest-counter { display: flex; align-items: center; gap: var(--space-md); }
.counter-btn { width: 56rpx; height: 56rpx; border: 2rpx solid var(--color-primary); border-radius: var(--radius-button-sm); display: flex; align-items: center; justify-content: center; }
.counter-btn:active { background: var(--color-primary-bg); }
.counter-btn.disabled { opacity: 0.35; border-color: var(--color-border); }
.counter-btn-text { font-size: 36rpx; color: var(--color-primary); line-height: 1; }
.counter-value { font-size: 36rpx; font-weight: 600; color: var(--color-text-primary); min-width: 80rpx; text-align: center; }
.bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; background: var(--color-bg-card); box-shadow: var(--shadow-md); padding: var(--space-sm) var(--space-lg); z-index: 50; }
.bottom-btn { width: 100%; }
</style>
