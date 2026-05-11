<template>
  <div class="page-container">
    <div class="page-header">
      <h1>容量设置</h1>
      <p>查看各时段的预约容量情况</p>
    </div>

    <!-- 日期选择 -->
    <div class="filter-bar">
      <el-date-picker
        v-model="selectedDate"
        type="date"
        placeholder="选择日期"
        value-format="YYYY-MM-DD"
        :disabled-date="disabledDate"
        @change="fetchCapacity"
      />
      <el-tag v-if="!isOpen" type="danger">休息日</el-tag>
      <el-tag v-if="isOpen" type="success">营业日</el-tag>
    </div>

    <!-- 容量表格 -->
    <DataTable
      :columns="columns"
      :data="slotList"
      :loading="loading"
      :error="errMsg"
      :empty-text="'该日期无可用时段'"
      :show-pagination="false"
      @retry="fetchCapacity"
    >
      <template #col-available_count="{ row }">
        <span :class="row.is_available ? 'text-success' : 'text-danger'">
          {{ row.available_count }} / {{ row.total_tables }}
        </span>
      </template>
      <template #col-status="{ row }">
        <span v-if="row.is_past" class="text-muted">已过期</span>
        <span v-else-if="!row.is_available && row.available_count === 0" class="text-danger">已满</span>
        <span v-else-if="row.is_cutoff" class="text-warning">已截止</span>
        <span v-else class="text-success">可预约</span>
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getSlots, type SlotItem } from '@/api/reservation'
import DataTable, { type TableColumn } from '@/components/common/DataTable.vue'
import { getToday } from '@/utils/format'
import dayjs from 'dayjs'

const loading = ref(false)
const errMsg = ref('')
const selectedDate = ref(getToday())
const isOpen = ref(true)
const slotList = ref<SlotItem[]>([])

const columns: TableColumn[] = [
  { prop: 'start_time', label: '时段开始', width: 120 },
  { prop: 'end_time', label: '时段结束', width: 120 },
  { prop: 'total_tables', label: '总桌位', width: 90, align: 'center' },
  { prop: 'booked_count', label: '已预约', width: 90, align: 'center' },
  { prop: 'available_count', label: '剩余/总容量', width: 130, align: 'center' },
  { prop: 'status', label: '状态', width: 90 },
]

function disabledDate(date: Date): boolean {
  const today = dayjs().startOf('day')
  return dayjs(date).isBefore(today, 'day')
}

async function fetchCapacity(): Promise<void> {
  if (!selectedDate.value) return
  loading.value = true
  errMsg.value = ''
  try {
    const res = await getSlots(selectedDate.value)
    isOpen.value = res.data.is_open
    slotList.value = res.data.slots
  } catch (err: unknown) {
    errMsg.value = err instanceof Error ? err.message : '加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCapacity()
})
</script>

<style scoped>
.text-success {
  color: var(--color-success);
  font-weight: 500;
}

.text-danger {
  color: var(--color-danger);
  font-weight: 500;
}

.text-warning {
  color: var(--color-warning);
}

.text-muted {
  color: var(--color-text-placeholder);
}
</style>
