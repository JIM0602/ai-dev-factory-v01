<template>
  <el-dialog
    :model-value="visible"
    :title="title"
    :width="width"
    :close-on-click-modal="false"
    @update:model-value="$emit('update:visible', $event)"
  >
    <div class="confirm-body">
      <div class="confirm-icon" v-if="type">
        <span v-if="type === 'danger'" class="icon-danger">&#9888;</span>
        <span v-else-if="type === 'warning'" class="icon-warning">&#9888;</span>
        <span v-else class="icon-info">&#8505;</span>
      </div>
      <div class="confirm-content">
        <p class="confirm-message">{{ message }}</p>
        <p v-if="detail" class="confirm-detail">{{ detail }}</p>
        <slot />
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="$emit('update:visible', false)" :disabled="loading">取消</el-button>
        <el-button
          :type="confirmButtonType"
          @click="$emit('confirm')"
          :loading="loading"
        >
          {{ confirmText }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    visible: boolean
    title?: string
    message: string
    detail?: string
    type?: 'info' | 'warning' | 'danger'
    confirmText?: string
    loading?: boolean
    width?: string
  }>(),
  {
    title: '操作确认',
    type: 'info',
    confirmText: '确认',
    loading: false,
    width: '420px',
  }
)

defineEmits<{
  'update:visible': [value: boolean]
  confirm: []
}>()

const confirmButtonType = computed(() => {
  if (props.type === 'danger') return 'danger'
  if (props.type === 'warning') return 'warning'
  return 'primary'
})
</script>

<style scoped>
.confirm-body {
  display: flex;
  gap: 16px;
  padding: 8px 0;
}

.confirm-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.icon-danger {
  background: #FDEAE4;
  color: var(--color-danger);
}

.icon-warning {
  background: #FDF6E8;
  color: var(--color-warning);
}

.icon-info {
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

.confirm-content {
  flex: 1;
}

.confirm-message {
  font-size: 15px;
  color: var(--color-text-primary);
  margin: 0 0 4px;
  line-height: 1.5;
}

.confirm-detail {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 4px 0 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
