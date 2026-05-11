<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useReservationStore } from '@/store/reservation';
import { formatDateDisplay, formatDateTime } from '@/utils/date';
import { maskPhone } from '@/utils/index';

const reservationStore = useReservationStore();

const loading = ref(true);
const error = ref('');
const reservationId = ref<number>(0);
const cancelDialogVisible = ref(false);

const detail = computed(() => reservationStore.currentDetail);

onLoad((options) => {
  const id = parseInt(options?.id as string, 10);
  if (id) {
    reservationId.value = id;
    loadDetail();
  } else {
    error.value = '预约ID无效';
    loading.value = false;
  }
});

async function loadDetail(): Promise<void> {
  loading.value = true;
  error.value = '';
  try {
    await reservationStore.fetchReservationDetail(reservationId.value);
    if (!reservationStore.currentDetail) {
      error.value = '未找到该预约';
    }
  } catch {
    error.value = '加载失败，请重试';
  } finally {
    loading.value = false;
  }
}

function onCancelClick(): void {
  cancelDialogVisible.value = true;
}

async function handleConfirmCancel(): Promise<void> {
  const result = await reservationStore.cancelReservationById(reservationId.value);
  if (result.success) {
    uni.showToast({ title: '预约已取消', icon: 'success' });
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
  } else {
    uni.showToast({ title: result.message, icon: 'none' });
  }
  cancelDialogVisible.value = false;
}

function onContactPhone(): void {
  // 拨打商家电话
  uni.makePhoneCall({ phoneNumber: '13800000000' });
}

function onNavigate(): void {
  uni.openLocation({
    latitude: 23.1291,
    longitude: 113.2644,
    name: '门店',
    address: detail.value?.store_address || '',
    scale: 16,
  });
}
</script>

<template>
  <view class="detail-page">
    <AppNavbar title="预约详情" :show-back="true" />

    <PageContainer
      :loading="loading"
      :error="error"
      :show-navbar="false"
      @retry="loadDetail"
    >
      <template v-if="detail">
        <view class="detail-content">
          <!-- 状态区 -->
          <view class="status-section">
            <StatusBadge :status="detail.status" size="large" />
            <text class="status-tip">
              {{ detail.status === 'pending' ? '等待商家确认中' : '' }}
              {{ detail.status === 'confirmed' ? '请按时到店' : '' }}
              {{ detail.status === 'completed' ? '消费已完成' : '' }}
              {{ detail.status === 'cancelled' ? '预约已取消' : '' }}
              {{ detail.status === 'rejected' ? '预约被拒绝' : '' }}
            </text>
          </view>

          <!-- 预约信息 -->
          <view class="card info-card">
            <text class="card-title">预约信息</text>
            <view class="info-grid">
              <view class="info-row">
                <text class="info-label">预约日期</text>
                <text class="info-value">{{ formatDateDisplay(detail.reservation_date) }}</text>
              </view>
              <view class="info-row">
                <text class="info-label">预约时段</text>
                <text class="info-value">{{ detail.slot_start_time }} - {{ detail.slot_end_time }}</text>
              </view>
              <view class="info-row">
                <text class="info-label">人数</text>
                <text class="info-value">{{ detail.guest_count }}人</text>
              </view>
              <view class="info-row">
                <text class="info-label">手机号</text>
                <text class="info-value">{{ maskPhone(detail.customer_phone || '') }}</text>
              </view>
              <view class="info-row">
                <text class="info-label">提交时间</text>
                <text class="info-value">{{ formatDateTime(detail.created_at) }}</text>
              </view>
              <view v-if="detail.remark" class="info-row">
                <text class="info-label">备注</text>
                <text class="info-value">{{ detail.remark }}</text>
              </view>
            </view>
          </view>

          <!-- 门店信息 -->
          <view v-if="detail.store_name" class="card info-card">
            <text class="card-title">门店信息</text>
            <view class="info-grid">
              <view class="info-row">
                <text class="info-label">门店</text>
                <text class="info-value">{{ detail.store_name }}</text>
              </view>
              <view v-if="detail.store_address" class="info-row">
                <text class="info-label">地址</text>
                <text class="info-value">{{ detail.store_address }}</text>
              </view>
            </view>
          </view>

          <!-- 计时信息（如有） -->
          <view v-if="detail.timer_session" class="card info-card">
            <text class="card-title">计时信息</text>
            <view class="info-grid">
              <view class="info-row">
                <text class="info-label">桌位号</text>
                <text class="info-value">{{ detail.timer_session.table_number }}号桌</text>
              </view>
              <view class="info-row">
                <text class="info-label">到店时间</text>
                <text class="info-value">{{ formatDateTime(detail.timer_session.check_in_time) }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 底部操作 -->
        <view v-if="detail.can_cancel" class="bottom-bar safe-bottom">
          <button class="btn btn-danger bottom-btn" @tap="onCancelClick">
            取消预约
          </button>
        </view>
        <view v-else class="bottom-bar safe-bottom">
          <view class="bottom-actions">
            <button class="btn btn-text btn-sm" @tap="onContactPhone">
              联系商家
            </button>
            <button class="btn btn-primary btn-sm" @tap="onNavigate">
              导航到店
            </button>
          </view>
        </view>
      </template>
    </PageContainer>

    <ConfirmDialog
      :visible="cancelDialogVisible"
      title="确认取消"
      content="确认取消该预约？取消后如需重新预约需再次选择时段。"
      confirm-text="确认取消"
      confirm-type="danger"
      @confirm="handleConfirmCancel"
      @close="cancelDialogVisible = false"
    />
  </view>
</template>

<style scoped>
.detail-page {
  min-height: 100vh;
  background: var(--color-bg-page);
  display: flex;
  flex-direction: column;
}

.detail-content {
  flex: 1;
  padding: var(--space-md) var(--space-lg);
  padding-bottom: 160rpx;
}

.status-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-xl) 0;
}

.status-tip {
  margin-top: var(--space-sm);
  font-size: 26rpx;
  color: var(--color-text-secondary);
}

.info-card {
  padding: var(--space-md);
  margin-bottom: var(--space-md);
}

.card-title {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--space-md);
  display: block;
}

.info-grid {
  display: flex;
  flex-direction: column;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: var(--space-xs) 0;
}

.info-row + .info-row {
  border-top: 1rpx solid var(--color-border);
  margin-top: var(--space-xs);
  padding-top: var(--space-sm);
}

.info-label {
  font-size: 26rpx;
  color: var(--color-text-secondary);
  flex-shrink: 0;
  margin-right: var(--space-md);
}

.info-value {
  font-size: 26rpx;
  color: var(--color-text-primary);
  text-align: right;
  word-break: break-all;
}

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

.bottom-btn {
  width: 100%;
}

.bottom-actions {
  display: flex;
  gap: var(--space-sm);
  justify-content: center;
}
</style>
