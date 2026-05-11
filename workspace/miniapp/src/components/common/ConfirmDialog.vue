<script setup lang="ts">
interface Props {
  visible: boolean;
  title?: string;
  content: string;
  confirmText?: string;
  cancelText?: string;
  confirmType?: 'primary' | 'danger';
  showCancel?: boolean;
}

withDefaults(defineProps<Props>(), {
  visible: false,
  title: '提示',
  content: '',
  confirmText: '确认',
  cancelText: '取消',
  confirmType: 'primary',
  showCancel: true,
});

const emit = defineEmits<{
  confirm: [];
  cancel: [];
  close: [];
}>();

function handleConfirm(): void {
  emit('confirm');
}

function handleCancel(): void {
  emit('cancel');
  emit('close');
}

function handleMaskClick(): void {
  emit('close');
}
</script>

<template>
  <view v-if="visible" class="dialog-overlay" @tap="handleMaskClick">
    <view class="dialog-container" @tap.stop>
      <view v-if="title" class="dialog-header">
        <text class="dialog-title">{{ title }}</text>
      </view>
      <view class="dialog-body">
        <text class="dialog-content">{{ content }}</text>
      </view>
      <view class="dialog-footer">
        <button v-if="showCancel" class="btn btn-secondary btn-dialog" @tap="handleCancel">
          {{ cancelText }}
        </button>
        <button
          class="btn btn-dialog"
          :class="confirmType === 'danger' ? 'btn-danger-solid' : 'btn-primary'"
          @tap="handleConfirm"
        >
          {{ confirmText }}
        </button>
      </view>
    </view>
  </view>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(61, 44, 46, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 200ms ease-out;
}

.dialog-container {
  width: 610rpx;
  background: var(--color-bg-card);
  border-radius: var(--radius-modal);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  animation: dialogPopIn 300ms ease-out;
}

@keyframes dialogPopIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.dialog-header {
  padding: var(--space-lg) var(--space-lg) 0;
}

.dialog-title {
  font-size: 34rpx;
  font-weight: 600;
  color: var(--color-text-primary);
}

.dialog-body {
  padding: var(--space-lg);
}

.dialog-content {
  font-size: 28rpx;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.dialog-footer {
  display: flex;
  gap: var(--space-sm);
  padding: 0 var(--space-md) var(--space-md);
}

.btn-dialog {
  flex: 1;
  min-height: 80rpx !important;
  font-size: 30rpx !important;
  border-radius: var(--radius-button) !important;
}
</style>
