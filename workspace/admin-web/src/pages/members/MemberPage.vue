<template>
  <div class="page-container">
    <div class="page-header">
      <h1>会员管理</h1>
      <p>按手机号或姓名搜索会员，查看消费记录</p>
    </div>

    <!-- 搜索栏 -->
    <div class="filter-bar">
      <el-input
        v-model="searchText"
        placeholder="输入手机号（精确匹配）或姓名（模糊搜索）"
        :prefix-icon="SearchIcon"
        clearable
        style="width: 360px"
        @keyup.enter="handleSearch"
        @clear="handleSearch"
      />
      <el-button type="primary" @click="handleSearch" :loading="loading">
        搜索
      </el-button>
      <div class="search-hint" v-if="!hasSearched">
        <span>&#8505;</span> 输入手机号或姓名搜索会员
      </div>
    </div>

    <!-- 搜索结果 -->
    <DataTable
      :columns="columns"
      :data="searchResults"
      :loading="loading"
      :error="errMsg"
      :total="pagination.total"
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.pageSize"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
      @retry="handleSearch"
    >
      <template #col-name="{ row }">
        {{ row.name }}
      </template>
      <template #col-phone="{ row }">
        {{ maskPhone(row.phone as string) }}
      </template>
      <template #col-total_visits="{ row }">
        {{ row.total_visits }} 次
      </template>
      <template #col-total_duration_minutes="{ row }">
        {{ formatDuration(row.total_duration_minutes as number) }}
      </template>
      <template #col-last_visit_date="{ row }">
        {{ row.last_visit_date || '-' }}
      </template>
      <template #actions="{ row }">
        <el-button type="primary" link size="small" @click="openDetail(row)">
          查看详情
        </el-button>
      </template>
    </DataTable>

    <!-- 会员详情弹窗 -->
    <MemberDetailDialog
      v-model:visible="detailVisible"
      :member-id="selectedMemberId"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Search as SearchIcon } from '@element-plus/icons-vue'
import DataTable, { type TableColumn } from '@/components/common/DataTable.vue'
import MemberDetailDialog from './MemberDetailDialog.vue'
import { getMembers, type MemberItem } from '@/api/member'
import { maskPhone, formatDuration } from '@/utils/format'

const columns: TableColumn[] = [
  { prop: 'name', label: '姓名', width: 120 },
  { prop: 'phone', label: '手机号', width: 140 },
  { prop: 'total_visits', label: '累计到店', width: 100, align: 'center' },
  { prop: 'total_duration_minutes', label: '累计消费时长', width: 130 },
  { prop: 'last_visit_date', label: '最近到店', width: 120 },
]

const loading = ref(false)
const errMsg = ref('')
const searchText = ref('')
const hasSearched = ref(false)
const searchResults = ref<MemberItem[]>([])

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

// 详情
const detailVisible = ref(false)
const selectedMemberId = ref(0)

async function handleSearch(): Promise<void> {
  if (!searchText.value.trim()) {
    return
  }

  hasSearched.value = true
  loading.value = true
  errMsg.value = ''
  try {
    const res = await getMembers({
      search: searchText.value.trim(),
      page: pagination.page,
      page_size: pagination.pageSize,
    })
    searchResults.value = res.data.list
    pagination.total = res.data.pagination.total
  } catch (err: unknown) {
    errMsg.value = err instanceof Error ? err.message : '搜索失败'
  } finally {
    loading.value = false
  }
}

function handlePageChange(page: number): void {
  pagination.page = page
  handleSearch()
}

function handlePageSizeChange(size: number): void {
  pagination.pageSize = size
  pagination.page = 1
  handleSearch()
}

function openDetail(row: Record<string, unknown>): void {
  selectedMemberId.value = row.id as number
  detailVisible.value = true
}
</script>

<style scoped>
.search-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--color-text-placeholder);
  margin-left: 12px;
}
</style>
