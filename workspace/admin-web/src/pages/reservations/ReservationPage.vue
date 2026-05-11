<template>
  <div class="page-container">
    <div class="page-header">
      <h1>预约管理</h1>
      <p>查看和处理所有顾客的预约记录</p>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-fields">
        <el-date-picker
          v-model="filters.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          :shortcuts="dateShortcuts"
          style="width: 260px"
        />
        <el-select v-model="filters.status" placeholder="预约状态" clearable style="width: 140px">
          <el-option
            v-for="opt in STATUS_OPTIONS"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <el-input
          v-model="filters.search"
          placeholder="搜索手机号/姓名"
          :prefix-icon="SearchIcon"
          clearable
          style="width: 200px"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
      <div class="filter-actions">
        <el-button type="primary" @click="showAddDialog = true">
          + 添加预约
        </el-button>
      </div>
    </div>

    <!-- 数据表格 -->
    <DataTable
      :columns="columns"
      :data="reservations"
      :loading="loading"
      :error="errMsg"
      :total="pagination.total"
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.pageSize"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
      @row-click="handleRowClick"
      @retry="fetchReservations"
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
      <template #col-source="{ row }">
        <span class="source-tag" :class="row.source">
          {{ row.source === 'customer' ? '小程序' : '商家代约' }}
        </span>
      </template>
      <template #col-status="{ row }">
        <StatusTag :status="row.status as string" />
      </template>
      <template #actions="{ row }">
        <el-button
          v-if="row.status === 'pending'"
          type="success"
          link
          size="small"
          @click.stop="handleConfirm(row)"
        >
          确认
        </el-button>
        <el-button
          v-if="row.status === 'pending'"
          type="danger"
          link
          size="small"
          @click.stop="openRejectDialog(row)"
        >
          拒绝
        </el-button>
        <el-button
          type="primary"
          link
          size="small"
          @click.stop="openDetail(row)"
        >
          详情
        </el-button>
      </template>
    </DataTable>

    <!-- 添加预约弹窗 -->
    <AddReservationDialog
      v-model:visible="showAddDialog"
      @success="handleAddSuccess"
    />

    <!-- 拒绝预约弹窗 -->
    <ConfirmDialog
      v-model:visible="rejectDialog.visible"
      title="拒绝预约"
      message="确认拒绝该预约？"
      :detail="`顾客：${rejectDialog.customerName}，时段：${rejectDialog.slotTime}`"
      type="danger"
      confirm-text="拒绝"
      :loading="rejectDialog.loading"
      @confirm="handleReject"
    />

    <!-- 预约详情抽屉 -->
    <ReservationDetailDrawer
      v-model:visible="detailVisible"
      :reservation="selectedReservation"
      @confirm="handleDetailConfirm"
      @reject="handleDetailReject"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search as SearchIcon } from '@element-plus/icons-vue'
import DataTable, { type TableColumn } from '@/components/common/DataTable.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import AddReservationDialog from './AddReservationDialog.vue'
import ReservationDetailDrawer from './ReservationDetailDrawer.vue'
import {
  getMerchantReservations,
  confirmReservation,
  rejectReservation,
  type ReservationItem,
} from '@/api/reservation'
import { getToday } from '@/utils/format'
import { maskPhone } from '@/utils/format'
import { STATUS_OPTIONS } from '@/utils/constants'

const route = useRoute()
const router = useRouter()

// 表格列定义
const columns: TableColumn[] = [
  { prop: 'customer_name', label: '顾客', width: 100 },
  { prop: 'customer_phone', label: '手机号', width: 130 },
  { prop: 'reservation_date', label: '日期', width: 110, sortable: true },
  { prop: 'slot_time', label: '时段', width: 130 },
  { prop: 'guest_count', label: '人数', width: 70 },
  { prop: 'source', label: '来源', width: 90 },
  { prop: 'status', label: '状态', width: 90 },
]

// 状态
const loading = ref(false)
const errMsg = ref('')
const reservations = ref<ReservationItem[]>([])

const filters = reactive({
  dateRange: [getToday(), getToday()] as string[],
  status: 'all',
  search: '',
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

const dateShortcuts = [
  { text: '今天', value: () => { const d = new Date(); return [d, d] } },
  { text: '昨天', value: () => { const d = new Date(); d.setDate(d.getDate() - 1); return [d, d] } },
  { text: '最近7天', value: () => { const end = new Date(); const start = new Date(); start.setDate(start.getDate() - 6); return [start, end] } },
  { text: '最近30天', value: () => { const end = new Date(); const start = new Date(); start.setDate(start.getDate() - 29); return [start, end] } },
]

// 添加预约
const showAddDialog = ref(false)

// 拒绝
const rejectDialog = reactive({
  visible: false,
  customerName: '',
  slotTime: '',
  rejectId: 0,
  loading: false,
})

// 详情
const detailVisible = ref(false)
const selectedReservation = ref<ReservationItem | null>(null)

async function fetchReservations(): Promise<void> {
  loading.value = true
  errMsg.value = ''
  try {
    const params: Record<string, unknown> = {
      page: pagination.page,
      page_size: pagination.pageSize,
    }
    if (filters.dateRange.length === 2) {
      params.date = filters.dateRange[0]
      // 若需要日期范围，可扩展为 date_from / date_to
      // V1 简化：API 的 date 参数为单日期
    }
    if (filters.status !== 'all') {
      params.status = filters.status
    }
    if (filters.search) {
      params.search = filters.search
    }

    const res = await getMerchantReservations(params as Parameters<typeof getMerchantReservations>[0])
    reservations.value = res.data.list
    pagination.total = res.data.pagination.total
  } catch (err: unknown) {
    errMsg.value = err instanceof Error ? err.message : '加载失败'
  } finally {
    loading.value = false
  }
}

function handleSearch(): void {
  pagination.page = 1
  fetchReservations()
}

function handleReset(): void {
  filters.dateRange = [getToday(), getToday()]
  filters.status = 'all'
  filters.search = ''
  pagination.page = 1
  fetchReservations()
}

function handlePageChange(page: number): void {
  pagination.page = page
  fetchReservations()
}

function handlePageSizeChange(size: number): void {
  pagination.pageSize = size
  pagination.page = 1
  fetchReservations()
}

function handleRowClick(row: Record<string, unknown>): void {
  selectedReservation.value = row as unknown as ReservationItem
  detailVisible.value = true
}

async function handleConfirm(row: Record<string, unknown>): Promise<void> {
  try {
    await confirmReservation(row.id as number)
    ElMessage.success('预约已确认')
    fetchReservations()
  } catch {
    // handled by interceptor
  }
}

function openRejectDialog(row: Record<string, unknown>): void {
  rejectDialog.rejectId = row.id as number
  rejectDialog.customerName = row.customer_name as string
  rejectDialog.slotTime = `${row.slot_start_time} - ${row.slot_end_time}`
  rejectDialog.visible = true
}

async function handleReject(): Promise<void> {
  rejectDialog.loading = true
  try {
    await rejectReservation(rejectDialog.rejectId)
    ElMessage.success('预约已拒绝')
    rejectDialog.visible = false
    fetchReservations()
  } catch {
    // handled by interceptor
  } finally {
    rejectDialog.loading = false
  }
}

function openDetail(row: Record<string, unknown>): void {
  selectedReservation.value = row as unknown as ReservationItem
  detailVisible.value = true
}

function handleAddSuccess(): void {
  showAddDialog.value = false
  fetchReservations()
}

function handleDetailConfirm(): void {
  fetchReservations()
}

function handleDetailReject(): void {
  fetchReservations()
}

// 从 URL 参数初始化筛选
onMounted(() => {
  const queryStatus = route.query.status as string
  const queryId = route.query.id as string
  if (queryStatus) {
    filters.status = queryStatus
  }
  fetchReservations()
  // 如果有 id 参数，直接打开对应预约详情
  if (queryId) {
    const id = Number(queryId)
    const item = reservations.value.find((r) => r.id === id)
    if (item) {
      selectedReservation.value = item
      detailVisible.value = true
    }
  }
})
</script>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: var(--space-md);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  margin-bottom: var(--space-sm);
  flex-wrap: wrap;
}

.filter-fields {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.source-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: var(--radius-tag);
}

.source-tag.customer {
  background: var(--color-secondary-bg);
  color: var(--color-secondary);
}

.source-tag.merchant {
  background: var(--color-primary-bg);
  color: var(--color-primary);
}
</style>
