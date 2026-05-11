<template>
  <el-dialog
    :model-value="visible"
    title="会员详情"
    width="680px"
    :close-on-click-modal="false"
    @update:model-value="$emit('update:visible', $event)"
    @opened="fetchDetail"
  >
    <div v-loading="loading">
      <div v-if="error" class="detail-error">
        <p>{{ error }}</p>
        <el-button type="primary" @click="fetchDetail">重试</el-button>
      </div>

      <template v-if="detail">
        <!-- 会员信息 -->
        <div class="member-info">
          <div class="info-item">
            <span class="info-label">姓名</span>
            <span class="info-value">{{ detail.name }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">手机号</span>
            <span class="info-value">{{ detail.phone_full || detail.phone }}</span>
          </div>
          <div class="info-row">
            <div class="info-item">
              <span class="info-label">累计到店</span>
              <span class="info-value highlight">{{ detail.total_visits }} 次</span>
            </div>
            <div class="info-item">
              <span class="info-label">消费总时长</span>
              <span class="info-value highlight">{{ formatDuration(detail.total_duration_minutes) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">最近到店</span>
              <span class="info-value">{{ detail.last_visit_date || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- 消费记录 -->
        <div class="records-section">
          <h4>消费记录</h4>
          <el-table :data="records" style="width: 100%" size="small">
            <el-table-column prop="visit_date" label="日期" width="110" />
            <el-table-column label="到店时间" width="90">
              <template #default="{ row }">
                {{ formatTime(row.check_in_time) }}
              </template>
            </el-table-column>
            <el-table-column label="离店时间" width="90">
              <template #default="{ row }">
                {{ formatTime(row.check_out_time) }}
              </template>
            </el-table-column>
            <el-table-column label="时长" width="90">
              <template #default="{ row }">
                {{ formatDuration(row.duration_minutes) }}
              </template>
            </el-table-column>
            <el-table-column label="团购券" width="80" align="center">
              <template #default="{ row }">
                <span v-if="row.has_coupon" class="coupon-badge">有</span>
                <span v-else class="text-muted">无</span>
              </template>
            </el-table-column>
            <el-table-column label="来源" width="90">
              <template #default="{ row }">
                {{ row.source === 'customer' ? '小程序' : '商家代约' }}
              </template>
            </el-table-column>
          </el-table>

          <div class="records-empty" v-if="records.length === 0 && !loading">
            暂无消费记录
          </div>

          <!-- 分页 -->
          <div class="records-pagination" v-if="recordTotal > recordPageSize">
            <el-pagination
              v-model:current-page="recordPage"
              :page-size="recordPageSize"
              :total="recordTotal"
              layout="total, prev, pager, next"
              size="small"
              @current-change="recordPage = $event; fetchRecords()"
            />
          </div>
        </div>
      </template>
    </div>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { getMemberDetail, type MemberDetail, type ConsumptionRecord } from '@/api/member'
import { formatDuration, formatTime } from '@/utils/format'

const props = defineProps<{
  visible: boolean
  memberId: number
}>()

defineEmits<{
  'update:visible': [value: boolean]
}>()

const loading = ref(false)
const error = ref('')
const detail = ref<MemberDetail | null>(null)
const records = ref<ConsumptionRecord[]>([])
const recordPage = ref(1)
const recordPageSize = 20
const recordTotal = ref(0)

async function fetchDetail(): Promise<void> {
  if (!props.memberId) return
  loading.value = true
  error.value = ''
  try {
    const res = await getMemberDetail(props.memberId, {
      page: recordPage.value,
      page_size: recordPageSize,
    })
    detail.value = res.data
    records.value = res.data.records.list
    recordTotal.value = res.data.records.pagination.total
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : '加载失败'
  } finally {
    loading.value = false
  }
}

async function fetchRecords(): Promise<void> {
  if (!props.memberId) return
  try {
    const res = await getMemberDetail(props.memberId, {
      page: recordPage.value,
      page_size: recordPageSize,
    })
    records.value = res.data.records.list
    recordTotal.value = res.data.records.pagination.total
  } catch {
    // handled
  }
}

watch(
  () => props.visible,
  (val) => {
    if (val && props.memberId) {
      recordPage.value = 1
      fetchDetail()
    }
  }
)
</script>

<style scoped>
.member-info {
  background: var(--color-bg-page);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-card-sm);
  padding: 16px;
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  gap: 32px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border-light);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: var(--color-text-placeholder);
}

.info-value {
  font-size: 14px;
  color: var(--color-text-primary);
}

.info-value.highlight {
  font-weight: 600;
  color: var(--color-primary);
}

.records-section h4 {
  font: var(--font-web-h3);
  margin: 0 0 12px;
}

.records-empty {
  text-align: center;
  padding: 32px;
  color: var(--color-text-placeholder);
  font-size: 14px;
}

.records-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.coupon-badge {
  display: inline-block;
  padding: 1px 6px;
  background: var(--color-accent-bg);
  color: var(--color-accent);
  border-radius: 3px;
  font-size: 12px;
}

.text-muted {
  color: var(--color-text-placeholder);
}

.detail-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 48px 0;
  color: var(--color-text-secondary);
}
</style>
