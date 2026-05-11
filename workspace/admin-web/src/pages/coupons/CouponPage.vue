<template>
  <div class="page-container">
    <div class="page-header">
      <h1>团购券记录</h1>
      <p>查看所有团购券核销记录</p>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-fields">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width: 260px"
        />
        <el-select v-model="source" placeholder="券来源" clearable style="width: 140px">
          <el-option
            v-for="opt in COUPON_SOURCE_OPTIONS"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </div>

    <!-- 数据表格 -->
    <DataTable
      :columns="columns"
      :data="coupons"
      :loading="loading"
      :error="errMsg"
      :total="pagination.total"
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.pageSize"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
      @retry="fetchCoupons"
    >
      <template #col-coupon_source="{ row }">
        <span class="source-tag" :class="row.coupon_source">
          {{ getSourceLabel(row.coupon_source as string) }}
        </span>
      </template>
      <template #col-coupon_type="{ row }">
        {{ row.coupon_type || '-' }}
      </template>
      <template #col-customer_name="{ row }">
        {{ row.customer_name }}
      </template>
      <template #col-customer_phone="{ row }">
        {{ maskPhone(row.customer_phone as string) }}
      </template>
      <template #col-visit_date="{ row }">
        {{ row.visit_date }}
      </template>
      <template #col-created_at="{ row }">
        {{ formatDateTime(row.created_at as string) }}
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import DataTable, { type TableColumn } from '@/components/common/DataTable.vue'
import { getCoupons, type CouponItem } from '@/api/coupon'
import { COUPON_SOURCE_OPTIONS } from '@/utils/constants'
import { maskPhone, formatDateTime, getToday, getDateAfter } from '@/utils/format'

const columns: TableColumn[] = [
  { prop: 'visit_date', label: '核销日期', width: 110 },
  { prop: 'coupon_code', label: '券码', width: 160 },
  { prop: 'coupon_source', label: '来源', width: 80 },
  { prop: 'coupon_type', label: '类型', width: 120 },
  { prop: 'customer_name', label: '顾客', width: 100 },
  { prop: 'customer_phone', label: '手机号', width: 140 },
  { prop: 'created_at', label: '核销时间', width: 160 },
]

const loading = ref(false)
const errMsg = ref('')
const coupons = ref<CouponItem[]>([])
const dateRange = ref<string[]>([getDateAfter(-30), getToday()])
const source = ref('all')

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

function getSourceLabel(src: string): string {
  const map: Record<string, string> = {
    meituan: '美团',
    douyin: '抖音',
    other: '其他',
  }
  return map[src] || src
}

async function fetchCoupons(): Promise<void> {
  loading.value = true
  errMsg.value = ''
  try {
    const params: Record<string, unknown> = {
      page: pagination.page,
      page_size: pagination.pageSize,
    }
    if (source.value !== 'all') {
      params.source = source.value
    }
    if (dateRange.value && dateRange.value.length === 2) {
      params.start_date = dateRange.value[0]
      params.end_date = dateRange.value[1]
    }
    const res = await getCoupons(params)
    coupons.value = res.data.list
    pagination.total = res.data.pagination.total
  } catch (err: unknown) {
    errMsg.value = err instanceof Error ? err.message : '加载失败'
  } finally {
    loading.value = false
  }
}

function handleSearch(): void {
  pagination.page = 1
  fetchCoupons()
}

function handleReset(): void {
  dateRange.value = [getDateAfter(-30), getToday()]
  source.value = 'all'
  pagination.page = 1
  fetchCoupons()
}

function handlePageChange(page: number): void {
  pagination.page = page
  fetchCoupons()
}

function handlePageSizeChange(size: number): void {
  pagination.pageSize = size
  pagination.page = 1
  fetchCoupons()
}

onMounted(() => {
  fetchCoupons()
})
</script>

<style scoped>
.filter-fields {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.source-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: var(--radius-tag);
}

.source-tag.meituan {
  background: #FDF6E8;
  color: #D4953A;
}

.source-tag.douyin {
  background: #FDE8F0;
  color: #D44A7A;
}

.source-tag.other {
  background: var(--color-bg-surface);
  color: var(--color-text-secondary);
}
</style>
