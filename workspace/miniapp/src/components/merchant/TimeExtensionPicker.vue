<script setup lang="ts">
import { ref } from 'vue';
import { EXTENSION_OPTIONS } from '@/utils/constants';

interface Props {
  visible: boolean;
  customerName?: string;
}

defineProps<Props>();

const emit = defineEmits<{
  confirm: [minutes: number];
  close: [];
}>();

const selectedOption = ref(-1);
const customMinutes = ref('30');

function handleSelect(value: number): void {
  selectedOption.value = value;
}

function handleConfirm(): void {
  if (selectedOption.value === -1) {
    // 自定义
    const mins = parseInt(customMinutes.value, 10);
    if (isNaN(mins) || mins <= 0) {
      uni.showToast({ title: '请输入有效时长', icon: 'none' });
      return;
    }
    emit('confirm', mins);
  } else {
    emit('confirm', selectedOption.value);
  }
}

function handleClose(): void {
  selectedOption.value = -1;
  customMinutes.value = '30';
  emit('close');
}

function onMaskClick(): void {
  handleClose();
}
</script>

<template>
  <view v-if="visible" class="picker-overlay" @tap="onMaskClick">
    <view class="picker-container" @tap.stop>
      <view class="picker-header">
        <text class="picker-title">
          选择加时时长
          <text v-if="customerName"> - {{ customerName }}</text>
        </text>
      </view>

      <view class="picker-body">
        <view class="extension-options">
          <view
            v-for="option in EXTENSION_OPTIONS"
            :key="option.value"
            class="extension-option"
            :class="{
              'extension-option--selected': selectedOption === option.value,
            }"
            @tap="handleSelect(option.value)"
          >
            <text class="option-label">{{ option.label }}</text>
          </view>
        </view>

        <!-- 自定义输入 -->
        <view v-if="selectedOption === -1" class="custom-input-row">
          <text class="custom-label">自定义时长</text>
          <view class="custom-input-wrap">
            <input
              v-model="customMinutes"
              type="number"
              class="custom-input"
              placeholder="分钟数"
            />
            <text class="custom-unit">分钟</text>
          </view>
        </view>
      </view>

      <view class="picker-footer">
        <button class="btn btn-secondary btn-dialog" @tap="handleClose">取消</button>
        <button class="btn btn-primary btn-dialog" @tap="handleConfirm">确认加时</button>
      </view>
    </view>
  </view>
</template>

<style scoped>
.picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(61, 44, 46, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  animation: fadeIn 200ms ease-out;
}

.picker-container {
  width: 100%;
  background: var(--color-bg-card);
  border-radius: var(--radius-modal) var(--radius-modal) 0 0;
  box-shadow: var(--shadow-lg);
  animation: slideUp 300ms ease-out;
  padding-bottom: env(safe-area-inset-bottom);
}

.picker-header {
  padding: var(--space-lg);
  text-align: center;
  border-bottom: 1rpx solid var(--color-border);
}

.picker-title {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--color-text-primary);
}

.picker-body {
  padding: var(--space-md) var(--space-lg);
}

.extension-options {
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.extension-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-md) var(--space-sm);
  background: var(--color-bg-card);
  border: 2rpx solid var(--color-border);
  border-radius: var(--radius-input);
  min-height: 80rpx;
  transition: all 150ms;
}

.extension-option--selected {
  background: var(--color-primary-bg);
  border-color: var(--color-primary);
}

.option-label {
  font-size: 26rpx;
  font-weight: 500;
  color: var(--color-text-primary);
}

.extension-option--selected .option-label {
  color: var(--color-primary);
}

.custom-input-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) 0;
}

.custom-label {
  font-size: 26rpx;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.custom-input-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  background: var(--color-bg-page);
  border: 1rpx solid var(--color-border);
  border-radius: var(--radius-input);
  padding: 0 var(--space-md);
  height: 72rpx;
}

.custom-input {
  flex: 1;
  font-size: 28rpx;
  color: var(--color-text-primary);
}

.custom-unit {
  font-size: 24rpx;
  color: var(--color-text-secondary);
}

.picker-footer {
  display: flex;
  gap: var(--space-sm);
  padding: 0 var(--space-lg) var(--space-md);
}

.btn-dialog {
  flex: 1;
  min-height: 80rpx !important;
  font-size: 30rpx !important;
}
</style>
