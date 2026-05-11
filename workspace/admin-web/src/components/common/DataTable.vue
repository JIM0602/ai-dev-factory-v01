<template>
  <div class="data-table-wrapper">
    <div class="table-toolbar" v-if="$slots.toolbar">
      <slot name="toolbar" />
    </div>

    <div class="table-content">
      <!-- 加载态 -->
      <LoadingSkeleton v-if="loading" type="table" :rows="5" :cols="columns.length" />

      <!-- 错误态 -->
      <div v-else-if="error" class="table-error">
        <p>{{ error }}</p>
        <el-button type="primary" size="small" @click="$emit('retry')">重试</el-button>
      </div>

      <!-- 空态 -->
      <EmptyState
        v-else-if="!loading && data.length === 0"
        :description="emptyText"
      >
        <slot name="empty-actions" />
      </EmptyState>

      <!-- 数据表格 -->
      <el-table
        v-else
        :data="data"
        :stripe="false"
        :border="false"
        :row-class-name="() => ''"
        :default-sort="defaultSort"
        @sort-change="handleSortChange"
        @row-click="handleRowClick"
        style="width: 100%"
      >
        <el-table-column
          v-for="col in columns"
          :key="col.prop"
          :prop="col.prop"
          :label="col.label"
          :width="col.width"
          :min-width="col.minWidth"
          :fixed="col.fixed"
          :sortable="col.sortable ? 'custom' : false"
          :align="col.align || 'left'"
          :show-overflow-tooltip="col.showOverflow !== false"
        >
          <template #default="{ row }">
            <slot :name="'col-' + col.prop" :row="row">
              {{ row[col.prop] }}
            </slot>
          </template>
        </el-table-column>

        <!-- 操作列 -->
        <el-table-column
          v-if="$slots.actions"
          label="操作"
          :width="actionWidth"
          fixed="right"
          align="center"
        >
          <template #default="{ row }">
            <div class="table-actions">
              <slot name="actions" :row="row" />
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页器 -->
    <div class="table-pagination" v-if="showPagination && !loading && data.length > 0">
      <el-pagination
        v-model:current-page="currentPageModel"
        v-model:page-size="pageSizeModel"
        :page-sizes="pageSizes"
        :total="total"
        :layout="paginationLayout"
        background
        @size-change="handlePageSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import EmptyState from './EmptyState.vue'
import LoadingSkeleton from './LoadingSkeleton.vue'

export interface TableColumn {
  prop: string
  label: string
  width?: string | number
  minWidth?: string | number
  fixed?: 'left' | 'right' | boolean
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  showOverflow?: boolean
}

const props = withDefaults(
  defineProps<{
    columns: TableColumn[]
    data: Record<string, unknown>[]
    loading?: boolean
    error?: string
    emptyText?: string
    total?: number
    currentPage?: number
    pageSize?: number
    pageSizes?: number[]
    showPagination?: boolean
    actionWidth?: string | number
    defaultSort?: { prop: string; order: 'ascending' | 'descending' }
  }>(),
  {
    loading: false,
    error: '',
    emptyText: '暂无数据',
    total: 0,
    currentPage: 1,
    pageSize: 20,
    pageSizes: () => [10, 20, 50],
    showPagination: true,
    actionWidth: 160,
  }
)

const emit = defineEmits<{
  'update:currentPage': [value: number]
  'update:pageSize': [value: number]
  'page-change': [page: number]
  'page-size-change': [size: number]
  'sort-change': [sort: { prop: string; order: string }]
  'row-click': [row: Record<string, unknown>]
  retry: []
}>()

const currentPageModel = computed({
  get: () => props.currentPage,
  set: (val) => emit('update:currentPage', val),
})

const pageSizeModel = computed({
  get: () => props.pageSize,
  set: (val) => emit('update:pageSize', val),
})

const paginationLayout = computed(() => {
  return 'total, sizes, prev, pager, next, jumper'
})

function handleSortChange(sort: { prop: string; order: string }): void {
  emit('sort-change', sort)
}

function handlePageChange(page: number): void {
  emit('page-change', page)
}

function handlePageSizeChange(size: number): void {
  emit('page-size-change', size)
}

function handleRowClick(row: Record<string, unknown>): void {
  emit('row-click', row)
}
</script>

<script lang="ts">
export default {
  name: 'DataTable',
}
</script>

<style scoped>
.data-table-wrapper {
  display: flex;
  flex-direction: column;
}

.table-toolbar {
  margin-bottom: 12px;
}

.table-content {
  background: var(--color-bg-card);
  border-radius: var(--radius-card);
  border: 1px solid var(--table-border);
  overflow: hidden;
}

.table-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  gap: 16px;
  min-height: 200px;
  color: var(--color-text-secondary);
}

.table-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}

.table-actions :deep(.el-button) {
  padding: 4px 10px;
  font-size: 12px;
}

.table-pagination {
  display: flex;
  justify-content: flex-end;
  padding: 16px 0 0;
}
</style>
