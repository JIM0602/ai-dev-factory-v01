<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useReservationStore } from '@/store/reservation';
import { useStoreInfoStore } from '@/store/store';
import { useUserStore } from '@/store/user';
import { getToday } from '@/utils/date';
import { validatePhone, validateName, validateGuestCount } from '@/utils/validator';
import type { SlotInfo } from '@/api/reservation';

const reservationStore = useReservationStore();
const storeInfoStore = useStoreInfoStore();
const userStore = useUserStore();

// 表单数据
const selectedDate = ref<string>(getToday());
const selectedSlotKey = ref<string>('');
const guestCount = ref<number>(1);
const phone = ref<string>('');
const name = ref<string>('');
const remark = ref<string>('');

// 加载状态
const dateLoading = ref(false);
const submitting = ref(false);

// 表单错误
const phoneError = ref('');
const nameError = ref('');

const selectedSlot = computed<SlotInfo | undefined>(() => {
  if (!selectedSlotKey.value) return undefined;
  return reservationStore.slots.find(
    s => `${s.start_time}-${s.end_time}` === selectedSlotKey.value
  );
});

onMounted(async () => {
  await storeInfoStore.fetchStoreInfo();
  await loadSlots(selectedDate.value);
});

async function loadSlots(date: string): Promise<void> {
  dateLoading.value = true;
  try {
    await reservationStore.fetchSlots(date);
  } finally {
    dateLoading.value = false;
  }
}

async function onDateChange(date: string): Promise<void> {
  selectedDate.value = date;
  selectedSlotKey.value = '';
  await loadSlots(date);
}

function onSlotSelect(slot: SlotInfo): void {
  selectedSlotKey.value = `${slot.start_time}-${slot.end_time}`;
}

function decreaseCount(): void {
  if (guestCount.value > 1) guestCount.value--;
}

function increaseCount(): void {
  if (guestCount.value < 10) guestCount.value++;
}

async function onSubmit(): Promise<void> {
  // 校验
  nameError.value = '';
  phoneError.value = '';

  const nameResult = validateName(name.value);
  if (!nameResult.valid) { nameError.value = nameResult.message; return; }

  const phoneResult = validatePhone(phone.value);
  if (!phoneResult.valid) { phoneError.value = phoneResult.message; return; }

  // 校验时段选择
  if (!selectedSlot.value) {
    uni.showToast({ title: '请选择时段', icon: 'none' });
    return;
  }
  if (!selectedSlot.value.is_available) {
    uni.showToast({ title: '该时段已满，请重新选择', icon: 'none' });
    return;
  }

  submitting.value = true;
  try {
    const result = await reservationStore.submitReservation({
      reservation_date: selectedDate.value,
      slot_start_time: selectedSlot.value.start_time,
      slot_end_time: selectedSlot.value.end_time,
      guest_count: guestCount.value,
      customer_phone: phone.value.trim(),
      customer_name: name.value.trim(),
      remark: remark.value.trim() || undefined,
    });

    if (result.success && result.data) {
      // 跳转到结果页
      const status = result.data.status;
      uni.redirectTo({
        url: `/pages/customer/reservation/result?status=${status}&date=${selectedDate.value}&slot=${selectedSlotKey.value}`,
      });
    } else {
      uni.showToast({ title: result.message, icon: 'none' });
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <view class="create-page">
    <AppNavbar title="发起预约" :show-back="true" />

    <scroll-view scroll-y class="create-content" :enhanced="true" :show-scrollbar="false">
      <!-- 日期选择 -->
      <view class="section">
        <text class="section-title">选择日期</text>
        <DateSelector
          v-model="selectedDate"
          :advance-days="7"
          :rest-days="storeInfoStore.storeInfo?.rest_days || []"
          @change="onDateChange"
        />
      </view>

      <!-- 时段选择 -->
      <view class="section">
        <text class="section-title">选择时段</text>
        <view v-if="!reservationStore.slotsIsOpen" class="slot-closed">
          <text class="slot-closed-text">该日期为非营业日</text>
        </view>
        <SlotPicker
          v-else
          v-model="selectedSlotKey"
          :slots="reservationStore.slots"
          :loading="dateLoading"
          @select="onSlotSelect"
        />
      </view>

      <!-- 人数选择 -->
      <view class="section">
        <text class="section-title">人数</text>
        <view class="guest-counter">
          <view class="counter-btn" :class="{ disabled: guestCount <= 1 }" @tap="decreaseCount">
            <text class="counter-btn-text">-</text>
          </view>
          <text class="counter-value">{{ guestCount }}</text>
          <view class="counter-btn" :class="{ disabled: guestCount >= 10 }" @tap="increaseCount">
            <text class="counter-btn-text">+</text>
          </view>
          <text class="counter-hint">1-10人</text>
        </view>
      </view>

      <!-- 联系人信息 -->
      <view class="section">
        <text class="section-title">联系人信息</text>

        <view class="form-group">
          <text class="form-label">姓名 <text class="required">*</text></text>
          <input
            v-model="name"
            class="form-input"
            :class="{ 'form-input--error': nameError }"
            placeholder="请输入您的姓名"
            maxlength="20"
          />
          <text v-if="nameError" class="form-error">{{ nameError }}</text>
        </view>

        <view class="form-group">
          <text class="form-label">手机号 <text class="required">*</text></text>
          <input
            v-model="phone"
            class="form-input"
            :class="{ 'form-input--error': phoneError }"
            type="number"
            placeholder="请输入11位手机号"
            maxlength="11"
          />
          <text v-if="phoneError" class="form-error">{{ phoneError }}</text>
        </view>

        <view class="form-group">
          <text class="form-label">备注</text>
          <textarea
            v-model="remark"
            class="form-textarea"
            placeholder="如有特殊需求请备注（选填）"
            maxlength="100"
          />
          <text class="form-count">{{ remark.length }}/100</text>
        </view>
      </view>

      <!-- 底部占位 -->
      <view style="height: 180rpx;" />
    </scroll-view>

    <!-- 底部提交按钮 -->
    <view class="bottom-bar safe-bottom">
      <view class="bottom-info">
        <text v-if="selectedSlot" class="bottom-summary">
          {{ selectedDate }} {{ selectedSlot.start_time }}-{{ selectedSlot.end_time }} | {{ guestCount }}人
        </text>
        <text v-else class="bottom-summary bottom-summary--placeholder">请选择日期和时段</text>
      </view>
      <button
        class="btn btn-primary bottom-btn"
        :disabled="!selectedSlot || submitting"
        :loading="submitting"
        @tap="onSubmit"
      >
        {{ submitting ? '提交中...' : '确认预约' }}
      </button>
    </view>
  </view>
</template>

<style scoped>
.create-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-page);
}

.create-content {
  flex: 1;
  padding: 0 var(--space-lg);
}

.section {
  margin-top: var(--space-lg);
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--space-sm);
  display: block;
}

.slot-closed {
  padding: var(--space-xl);
  text-align: center;
}

.slot-closed-text {
  font-size: 26rpx;
  color: var(--color-text-placeholder);
}

/* 人数计数器 */
.guest-counter {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.counter-btn {
  width: 56rpx;
  height: 56rpx;
  border: 2rpx solid var(--color-primary);
  border-radius: var(--radius-button-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 150ms;
}

.counter-btn:active {
  background: var(--color-primary-bg);
}

.counter-btn.disabled {
  opacity: 0.35;
  border-color: var(--color-border);
}

.counter-btn-text {
  font-size: 36rpx;
  color: var(--color-primary);
  line-height: 1;
}

.counter-value {
  font-size: 36rpx;
  font-weight: 600;
  color: var(--color-text-primary);
  min-width: 80rpx;
  text-align: center;
}

.counter-hint {
  font-size: 24rpx;
  color: var(--color-text-placeholder);
}

/* 表单 */
.form-group {
  margin-bottom: var(--space-md);
  position: relative;
}

.form-label {
  font-size: 24rpx;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-xs);
  display: block;
}

.required {
  color: var(--color-danger);
}

.form-input {
  width: 100%;
  height: var(--input-height);
  background: var(--color-bg-card);
  border: 1rpx solid var(--color-border);
  border-radius: var(--radius-input);
  padding: 0 var(--space-md);
  font-size: 28rpx;
  color: var(--color-text-primary);
}

.form-input:focus {
  border-color: var(--color-primary);
  border-width: 2rpx;
}

.form-input--error {
  border-color: var(--color-danger);
  border-width: 2rpx;
  background: #FFF8F6;
}

.form-textarea {
  width: 100%;
  min-height: 120rpx;
  background: var(--color-bg-card);
  border: 1rpx solid var(--color-border);
  border-radius: var(--radius-input);
  padding: var(--space-sm) var(--space-md);
  font-size: 28rpx;
  color: var(--color-text-primary);
}

.form-error {
  font-size: 22rpx;
  color: var(--color-danger);
  margin-top: 4rpx;
}

.form-count {
  font-size: 22rpx;
  color: var(--color-text-placeholder);
  text-align: right;
  display: block;
  margin-top: 4rpx;
}

/* 底部栏 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--color-bg-card);
  box-shadow: var(--shadow-md);
  padding: var(--space-sm) var(--space-lg);
  z-index: 50;
}

.bottom-info {
  margin-bottom: var(--space-sm);
}

.bottom-summary {
  font-size: 26rpx;
  color: var(--color-text-primary);
  font-weight: 500;
}

.bottom-summary--placeholder {
  color: var(--color-text-placeholder);
  font-weight: 400;
}

.bottom-btn {
  width: 100%;
}
</style>
