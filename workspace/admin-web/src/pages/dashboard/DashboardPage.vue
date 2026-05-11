<template>
  <div class="page-container">
    <div class="page-header">
      <h1>工作台</h1>
      <p>{{ todayText }} · {{ storeName }}</p>
    </div>

    <!-- 概览统计卡片 -->
    <div class="stats-row">
      <StatCard
        label="今日预约总数"
        :value="totalReservations ?? '-'"
        unit="个"
        :loading="loading"
        clickable
        @click="$router.push('/reservations')"
      />
      <StatCard
        label="待确认预约"
        :value="summary.pending_count ?? '-'"
        unit="个"
        value-color="var(--color-warning)"
        :loading="loading"
        clickable
        @click="$router.push({ path: '/reservations', query: { status: 'pending' } })"
      />
      <StatCard
        label="当前在店"
        :value="summary.in_progress_count ?? '-'"
        unit="组"
        value-color="var(--color-primary)"
        :loading="loading"
      />
      <StatCard
        label="空闲桌位"
        :value="idleTables ?? '-'"
        unit="个"
        value-color="var(--color-success)"
        :loading="loading"
      />
    </div>

    <!-- 今日最近预约 -->
    <div class="card-container mt-lg">
      <div class="section-header">
        <h3>今日最近预约</h3>
        <el-button type="primary" link @click="$router.push('/reservations')">
          查看全部 &rarr;
        </el-button>
      </div>

      <DataTable
        :columns="recentColumns"
        :data="recentReservations"
        :loading="loading"
        :error="errMsg"
        :empty-text="'今日暂无预约记录'"
        :show-pagination="false"
        @retry="fetchData"
      >
        <template #col-customer_name="{ row }">
          {{ row.customer_name }}
        </template>
        <template #col-customer_phone="{ row }">
          {{ maskPhone(row.customer_phone as string) }}
        </template>
        <template #col-reservation_date="{ row }">
          {{ row.reservation_date }}
        </template>
        <template #col-slot_time="{ row }">
          {{ row.slot_start_time }} - {{ row.slot_end_time }}
        </template>
        <template #col-guest_count="{ row }">
          {{ row.guest_count }} 人
        </template>
        <template #col-status="{ row }">
          <StatusTag :status="row.status as string" />
        </template>
        <template #actions="{ row }">
          <el-button type="primary" link size="small" @click="$router.push({ path: '/reservations', query: { id: String(row.id) } })">
            查看
          </el-button>
        </template>
      </DataTable>
    </div>

    <!-- 快捷入口 -->
    <div class="card-container mt-lg">
      <div class="section-header">
        <h3>快捷入口</h3>
      </div>
      <div class="quick-links">
        <div class="quick-link-item" v-for="link in quickLinks" :key="link.path" @click="$router.push(link.path)">
          <span class="quick-link-icon" v-html="link.icon"></span>
          <span class="quick-link-label">{{ link.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import StatCard from '@/components/common/StatCard.vue'
import DataTable from '@/components/common/DataTable.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import { getMerchantReservations, type ReservationItem, type ReservationSummary } from '@/api/reservation'
import { useStoreStore } from '@/store/store'
import { maskPhone } from '@/utils/format'
import type { TableColumn } from '@/components/common/DataTable.vue'

const storeStore = useStoreStore()

const loading = ref(false)
const errMsg = ref('')
const summary = ref<ReservationSummary>({ pending_count: 0, confirmed_count: 0, in_progress_count: 0 })
const recentReservations = ref<ReservationItem[]>([])

const storeName = computed(() => storeStore.config?.name || '拼豆店')
const todayText = computed(() => dayjs().format('YYYY年M月D日 dddd'))

const totalReservations = computed(() => {
  return summary.value.pending_count + summary.value.confirmed_count + summary.value.in_progress_count
})

const idleTables = computed(() => {
  const total = storeStore.config?.table_count ?? 0
  return total - summary.value.in_progress_count
})

const recentColumns: TableColumn[] = [
  { prop: 'customer_name', label: '顾客', width: 100 },
  { prop: 'customer_phone', label: '手机号', width: 130 },
  { prop: 'reservation_date', label: '日期', width: 110 },
  { prop: 'slot_time', label: '时段', width: 130 },
  { prop: 'guest_count', label: '人数', width: 70 },
  { prop: 'status', label: '状态', width: 90 },
]

const quickLinks = [
  { path: '/reservations', label: '预约管理', icon: '&#9776;' },
  { path: '/members', label: '会员查询', icon: '&#9787;' },
  { path: '/store/settings', label: '门店设置', icon: '&#9881;' },
  { path: '/store/rules', label: '预约规则', icon: '&#9878;' },
  { path: '/store/capacity', label: '容量设置', icon: '&#9864;' },
  { path: '/coupons', label: '团购券记录', icon: '&#9733;' },
]

async function fetchData(): Promise<void> {
  loading.value = true
  errMsg.value = ''
  try {
    const today = dayjs().format('YYYY-MM-DD')
    const res = await getMerchantReservations({ date: today, page_size: 10 })
    summary.value = res.data.summary
    recentReservations.value = res.data.list
  } catch (err: unknown) {
    errMsg.value = err instanceof Error ? err.message : '加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  storeStore.fetchConfig()
  fetchData()
})
</script>

<style scoped>
.stats-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.mt-lg {
  margin-top: var(--space-lg);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-header h3 {
  font: var(--font-web-h3);
  color: var(--color-text-primary);
  margin: 0;
}

.quick-links {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.quick-link-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-button);
  cursor: pointer;
  transition: all 0.15s;
  background: var(--color-bg-page);
}

.quick-link-item:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

.quick-link-icon {
  font-size: 16px;
  line-height: 1;
}

.quick-link-label {
  font-size: 14px;
}
</style>
