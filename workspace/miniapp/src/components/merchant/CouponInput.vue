<script setup lang="ts">
import { ref } from 'vue';
import { COUPON_SOURCE_LABEL, type CouponSource } from '@/utils/constants';

interface CouponEntry {
  id: string;
  coupon_code: string;
  coupon_source: CouponSource | '';
  coupon_type: string;
}

interface Props {
  modelValue: CouponEntry[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: CouponEntry[]];
}>();

const expanded = ref(false);

const newCoupon = ref<CouponEntry>({
  id: '',
  coupon_code: '',
  coupon_source: '',
  coupon_type: '',
});

let counter = 0;

function addCoupon(): void {
  if (!newCoupon.value.coupon_code.trim()) {
    uni.showToast({ title: '请输入券码', icon: 'none' });
    return;
  }
  if (!newCoupon.value.coupon_source) {
    uni.showToast({ title: '请选择券来源', icon: 'none' });
    return;
  }
  counter++;
  const entry: CouponEntry = {
    ...newCoupon.value,
    id: `coupon_${counter}`,
  };
  const updated = [...props.modelValue, entry];
  emit('update:modelValue', updated);
  newCoupon.value = { id: '', coupon_code: '', coupon_source: '', coupon_type: '' };
}

function removeCoupon(id: string): void {
  const updated = props.modelValue.filter(c => c.id !== id);
  emit('update:modelValue', updated);
}

function toggleExpand(): void {
  expanded.value = !expanded.value;
}

const sourceOptions: Array<{ label: string; value: CouponSource }> = [
  { label: '美团', value: 'meituan' },
  { label: '抖音', value: 'douyin' },
  { label: '其他', value: 'other' },
];

function getSourceLabel(source: string): string {
  return COUPON_SOURCE_LABEL[source as CouponSource] || source;
}
</script>

<template>
  <view class="coupon-input">
    <!-- 折叠头部 -->
    <view class="coupon-header" @tap="toggleExpand">
      <view class="coupon-header-left">
        <text class="coupon-header-icon">&#x1F3AB;</text>
        <text class="coupon-header-text">团购券核销</text>
        <text v-if="modelValue.length > 0" class="coupon-count">
          ({{ modelValue.length }}张)
        </text>
      </view>
      <text class="coupon-arrow" :class="{ 'coupon-arrow--expanded': expanded }">&#x2304;</text>
    </view>

    <!-- 展开内容 -->
    <view v-if="expanded" class="coupon-body">
      <!-- 已添加的券 -->
      <view v-if="modelValue.length > 0" class="coupon-list">
        <view v-for="coupon in modelValue" :key="coupon.id" class="coupon-item">
          <view class="coupon-item-info">
            <text class="coupon-code">{{ coupon.coupon_code }}</text>
            <text class="coupon-source">{{ getSourceLabel(coupon.coupon_source) }}</text>
            <text v-if="coupon.coupon_type" class="coupon-type">{{ coupon.coupon_type }}</text>
          </view>
          <text class="coupon-delete" @tap="removeCoupon(coupon.id)">删除</text>
        </view>
      </view>

      <!-- 新增券表单 -->
      <view class="coupon-form">
        <view class="form-row">
          <input
            v-model="newCoupon.coupon_code"
            class="form-input"
            placeholder="输入券码"
            maxlength="50"
          />
        </view>
        <view class="form-row form-row-split">
          <picker
            mode="selector"
            :range="sourceOptions"
            range-key="label"
            @change="(e: { detail: { value: number } }) => newCoupon.coupon_source = sourceOptions[e.detail.value].value"
          >
            <view class="form-picker">
              <text :class="{ 'picker-placeholder': !newCoupon.coupon_source }">
                {{ newCoupon.coupon_source ? getSourceLabel(newCoupon.coupon_source) : '选择来源' }}
              </text>
              <text class="picker-arrow">&#x2304;</text>
            </view>
          </picker>
          <input
            v-model="newCoupon.coupon_type"
            class="form-input"
            placeholder="券类型(选填)"
            maxlength="30"
          />
        </view>
        <button class="btn btn-text btn-xs" @tap="addCoupon">
          + 添加一张券
        </button>
      </view>
    </view>
  </view>
</template>

<style scoped>
.coupon-input {
  background: var(--color-bg-card);
  border-radius: var(--radius-card-sm);
  border: 1rpx solid var(--color-border);
  overflow: hidden;
}

.coupon-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md);
  min-height: 88rpx;
}

.coupon-header-left {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.coupon-header-icon {
  font-size: 32rpx;
}

.coupon-header-text {
  font-size: 28rpx;
  color: var(--color-text-primary);
  font-weight: 500;
}

.coupon-count {
  font-size: 24rpx;
  color: var(--color-primary);
}

.coupon-arrow {
  font-size: 32rpx;
  color: var(--color-text-placeholder);
  transition: transform 200ms;
}

.coupon-arrow--expanded {
  transform: rotate(180deg);
}

.coupon-body {
  padding: 0 var(--space-md) var(--space-md);
  border-top: 1rpx solid var(--color-border);
}

.coupon-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  margin-top: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.coupon-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm);
  background: var(--color-bg-page);
  border-radius: var(--radius-input);
}

.coupon-item-info {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
}

.coupon-code {
  font-size: 24rpx;
  color: var(--color-text-primary);
  font-weight: 500;
  font-family: monospace;
}

.coupon-source {
  font-size: 20rpx;
  color: var(--color-text-secondary);
  background: var(--color-bg-surface);
  padding: 2rpx 8rpx;
  border-radius: 4rpx;
}

.coupon-type {
  font-size: 20rpx;
  color: var(--color-text-placeholder);
}

.coupon-delete {
  font-size: 22rpx;
  color: var(--color-danger);
  padding: var(--space-xs);
}

.coupon-form {
  padding-top: var(--space-sm);
}

.form-row {
  margin-bottom: var(--space-sm);
}

.form-row-split {
  display: flex;
  gap: var(--space-sm);
}

.form-input {
  flex: 1;
  height: 72rpx;
  background: var(--color-bg-page);
  border: 1rpx solid var(--color-border);
  border-radius: var(--radius-input);
  padding: 0 var(--space-md);
  font-size: 26rpx;
  color: var(--color-text-primary);
}

.form-picker {
  flex: 1;
  height: 72rpx;
  background: var(--color-bg-page);
  border: 1rpx solid var(--color-border);
  border-radius: var(--radius-input);
  padding: 0 var(--space-md);
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 26rpx;
  color: var(--color-text-primary);
}

.picker-placeholder {
  color: var(--color-text-placeholder);
}

.picker-arrow {
  font-size: 28rpx;
  color: var(--color-text-placeholder);
}
</style>
