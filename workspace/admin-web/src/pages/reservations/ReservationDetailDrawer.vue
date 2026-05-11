<template>
  <el-drawer
    :model-value="visible"
    title="预约详情"
    size="480px"
    @update:model-value="$emit('update:visible', $event)"
    @closed="handleClosed"
  >
    <template v-if="loading">
      <LoadingSkeleton type="card" :rows="3" />
    </template>

    <template v-else-if="error">
      <div class="detail-error">
        <p>{{ error }}</p>
        <el-button type="primary" @click="fetchDetail">重试</el-button>
      </div>
    </template>

    <template v-else-if="detail">
      <div class="detail-section">
        <div class="detail-status">
          <StatusTag :status="detail.status" />
        </div>

        <div class="detail-card">
          <h4>顾客信息</h4>
          <div class="detail-row">
            <span class="detail-label">姓名</span>
            <span class="detail-value">{{ detail.customer_name }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">手机号</span>
            <span class="detail-value">
              {{ detail.customer_phone_full || detail.customer_phone }}
            </span>
          </div>
        </div>

        <div class="detail-card">
          <h4>预约信息</h4>
          <div class="detail-row">
            <span class="detail-label">预约日期</span>
            <span class="detail-value">{{ detail.reservation_date }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">时段</span>
            <span class="detail-value">{{ detail.slot_start_time }} - {{ detail.slot_end_time }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">人数</span>
            <span class="detail-value">{{ detail.guest_count }} 人</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">来源</span>
            <span class="detail-value">{{ detail.source === 'customer' ? '小程序' : '商家代约' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">提交时间</span>
            <span class="detail-value">{{ formatDateTime(detail.created_at) }}</span>
          </div>
          <div class="detail-row" v-if="detail.remark">
            <span class="detail-label">备注</span>
            <span class="detail-value">{{ detail.remark }}</span>
          </div>
          <div class="detail-row" v-if="detail.rejection_reason">
            <span class="detail-label">拒绝原因</span>
            <span class="detail-value detail-danger">{{ detail.rejection_reason }}</span>
          </div>
        </div>

        <!-- 状态时间线 -->
        <div class="detail-card" v-if="timeline.length > 0">
          <h4>操作记录</h4>
          <div class="timeline">
            <div v-for="(item, idx) in timeline" :key="idx" class="timeline-item">
              <div class="timeline-dot" :class="item.type"></div>
              <div class="timeline-content">
                <div class="timeline-title">{{ item.title }}</div>
                <div class="timeline-time">{{ item.time }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="detail-actions" v-if="showActions">
        <el-button
          v-if="detail.status === 'pending'"
          type="success"
          @click="handleConfirm"
          :loading="acting"
        >
          确认预约
        </el-button>
        <el-button
          v-if="detail.status === 'pending'"
          type="danger"
          @click="handleReject"
          :loading="acting"
        >
          拒绝预约
        </el-button>
      </div>

      <div class="detail-section" v-else-if="detail.status !== 'pending'">
        <div class="detail-card">
          <div class="detail-row">
            <span class="detail-label">当前状态</span>
            <span class="detail-value">
              <StatusTag :status="detail.status" />
            </span>
          </div>
        </div>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import StatusTag from '@/components/common/StatusTag.vue'
import LoadingSkeleton from '@/components/common/LoadingSkeleton.vue'
import {
  getReservationDetail,
  confirmReservation,
  rejectReservation,
  type ReservationItem,
} from '@/api/reservation'
import { formatDateTime } from '@/utils/format'

/** Detail response includes additional fields */
interface ReservationDetail extends ReservationItem {
  customer_phone_full?: string
  timer_session?: Record<string, unknown> | null
}

const props = defineProps<{
  visible: boolean
  reservation: ReservationItem | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  confirm: []
  reject: []
}>()

const loading = ref(false)
const error = ref('')
const detail = ref<ReservationDetail | null>(null)
const acting = ref(false)

const showActions = computed(() => {
  return detail.value?.status === 'pending'
})

const timeline = computed(() => {
  if (!detail.value) return []
  const items: { title: string; time: string; type: string }[] = []

  items.push({ title: '提交预约', time: formatDateTime(detail.value.created_at), type: 'created' })

  if (detail.value.status === 'confirmed' || detail.value.status === 'in_progress' || detail.value.status === 'completed') {
    items.push({ title: '商家已确认', time: formatDateTime(detail.value.updated_at || ''), type: 'confirmed' })
  }

  if (detail.value.status === 'rejected') {
    items.push({ title: '商家已拒绝', time: formatDateTime(detail.value.updated_at || ''), type: 'rejected' })
  }

  if (detail.value.status === 'cancelled') {
    items.push({ title: '已取消', time: formatDateTime(detail.value.updated_at || ''), type: 'cancelled' })
  }

  if (detail.value.status === 'in_progress' || detail.value.status === 'completed') {
    items.push({ title: '已到店，开始计时', time: formatDateTime(detail.value.updated_at || ''), type: 'in_progress' })
  }

  if (detail.value.status === 'completed') {
    items.push({ title: '计时结束', time: formatDateTime(detail.value.updated_at || ''), type: 'completed' })
  }

  return items
})

async function fetchDetail(): Promise<void> {
  if (!props.reservation) return
  loading.value = true
  error.value = ''
  try {
    const res = await getReservationDetail(props.reservation.id)
    detail.value = res.data
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : '加载失败'
    detail.value = props.reservation
  } finally {
    loading.value = false
  }
}

async function handleConfirm(): Promise<void> {
  if (!detail.value) return
  try {
    await ElMessageBox.confirm(
      `确认接受 ${detail.value.customer_name} 的预约？`,
      '确认操作',
      { type: 'info' }
    )
  } catch {
    return // cancelled
  }

  acting.value = true
  try {
    await confirmReservation(detail.value.id)
    ElMessage.success('预约已确认')
    emit('confirm')
    detail.value.status = 'confirmed'
  } catch {
    // handled
  } finally {
    acting.value = false
  }
}

async function handleReject(): Promise<void> {
  if (!detail.value) return
  try {
    await ElMessageBox.confirm(
      `确认拒绝 ${detail.value.customer_name} 的预约？`,
      '拒绝操作',
      { type: 'warning' }
    )
  } catch {
    return
  }

  acting.value = true
  try {
    await rejectReservation(detail.value.id)
    ElMessage.success('预约已拒绝')
    emit('reject')
    detail.value.status = 'rejected'
  } catch {
    // handled
  } finally {
    acting.value = false
  }
}

function handleClosed(): void {
  detail.value = null
  error.value = ''
}

watch(
  () => props.visible,
  (val) => {
    if (val && props.reservation) {
      fetchDetail()
    }
  }
)

watch(
  () => props.reservation,
  (val) => {
    if (props.visible && val) {
      fetchDetail()
    }
  }
)
</script>

<style scoped>
.detail-section {
  padding: 0 4px;
}

.detail-status {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-card {
  background: var(--color-bg-page);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-card-sm);
  padding: 16px;
  margin-bottom: 12px;
}

.detail-card h4 {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border-light);
}

.detail-row {
  display: flex;
  align-items: flex-start;
  padding: 6px 0;
  font-size: 14px;
}

.detail-label {
  width: 80px;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.detail-value {
  flex: 1;
  color: var(--color-text-primary);
  word-break: break-all;
}

.detail-danger {
  color: var(--color-danger);
}

.detail-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 48px 0;
  color: var(--color-text-secondary);
}

.detail-actions {
  display: flex;
  gap: 12px;
  padding: 16px 0;
}

/* 时间线 */
.timeline {
  position: relative;
  padding-left: 24px;
}

.timeline-item {
  position: relative;
  padding-bottom: 16px;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-dot {
  position: absolute;
  left: -24px;
  top: 4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-border);
}

.timeline-dot.created { background: var(--color-primary); }
.timeline-dot.confirmed { background: var(--color-success); }
.timeline-dot.rejected { background: var(--color-danger); }
.timeline-dot.cancelled { background: var(--color-text-placeholder); }
.timeline-dot.in_progress { background: var(--color-primary); }
.timeline-dot.completed { background: var(--color-info); }

/* 连接线 */
.timeline-item::before {
  content: '';
  position: absolute;
  left: -20px;
  top: 14px;
  bottom: 0;
  width: 2px;
  background: var(--color-border-light);
}

.timeline-item:last-child::before {
  display: none;
}

.timeline-title {
  font-size: 14px;
  color: var(--color-text-primary);
}

.timeline-time {
  font-size: 12px;
  color: var(--color-text-placeholder);
  margin-top: 2px;
}
</style>
