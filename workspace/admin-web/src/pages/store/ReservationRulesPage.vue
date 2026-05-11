<template>
  <div class="page-container">
    <div class="page-header">
      <h1>预约规则</h1>
      <p>配置预约相关的业务规则，修改后即时生效</p>
    </div>

    <div class="card-container" v-loading="loading">
      <el-form
        ref="formRef"
        :model="form"
        label-position="left"
        label-width="200px"
        class="rules-form"
      >
        <el-form-item label="预约需商家确认">
          <el-switch
            v-model="form.require_confirmation"
            active-text="开启"
            inactive-text="关闭"
          />
          <div class="form-hint">
            开启后，顾客提交的预约需商家手动确认方可生效
          </div>
        </el-form-item>

        <el-form-item
          v-if="form.require_confirmation"
          label="自动取消时间"
          prop="auto_cancel_hours"
          :rules="autoCancelRules"
        >
          <div class="input-with-unit">
            <el-input-number
              v-model="autoCancelHoursModel"
              :min="0"
              :max="48"
              style="width: 140px"
              placeholder="不启用"
            />
            <span class="unit-text">小时（距离预约开始前未确认则自动取消）</span>
          </div>
          <div class="form-hint">
            设为 null 表示不启用自动取消
          </div>
        </el-form-item>

        <el-form-item label="提前预约天数" prop="advance_days">
          <div class="input-with-unit">
            <el-input-number v-model="form.advance_days" :min="1" :max="90" style="width: 140px" />
            <span class="unit-text">天</span>
          </div>
          <div class="form-hint">顾客可预约未来多少天内的时段</div>
        </el-form-item>

        <el-form-item label="预约截止时间" prop="cutoff_minutes">
          <div class="input-with-unit">
            <el-input-number v-model="form.cutoff_minutes" :min="0" :max="1440" style="width: 140px" />
            <span class="unit-text">分钟（时段开始前）</span>
          </div>
          <div class="form-hint">距离时段开始前多少分钟停止接受预约</div>
        </el-form-item>

        <el-form-item label="顾客自主取消截止" prop="customer_cancel_hours">
          <div class="input-with-unit">
            <el-input-number v-model="form.customer_cancel_hours" :min="0" :max="72" style="width: 140px" />
            <span class="unit-text">小时（距离预约开始前）</span>
          </div>
          <div class="form-hint">顾客可在距离预约开始前多少小时内自行取消预约</div>
        </el-form-item>

        <el-form-item label="时段时长" prop="slot_duration">
          <el-select v-model="form.slot_duration" style="width: 200px">
            <el-option
              v-for="opt in SLOT_DURATION_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <div class="form-hint">每个预约时段的时长，修改后仅影响新生成的时段</div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="saving" @click="handleSave">
            保存规则
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { getRules, updateRules, type ReservationRules } from '@/api/rules'
import { SLOT_DURATION_OPTIONS } from '@/utils/constants'

const formRef = ref<FormInstance>()
const loading = ref(false)
const saving = ref(false)
const originalData = ref<ReservationRules | null>(null)

const form = reactive({
  require_confirmation: false,
  advance_days: 7,
  cutoff_minutes: 60,
  auto_cancel_hours: null as number | null,
  customer_cancel_hours: 3,
  slot_duration: 60,
})

// auto_cancel_hours 使用独立的 model 处理 null 值
const autoCancelHoursModel = ref<number | undefined>(undefined)

watch(
  () => form.auto_cancel_hours,
  (val) => {
    autoCancelHoursModel.value = val ?? undefined
  }
)

watch(autoCancelHoursModel, (val) => {
  form.auto_cancel_hours = val ?? null
})

const autoCancelRules: Record<string, unknown> = {
  auto_cancel_hours: [
    {
      validator: (_rule: unknown, _value: unknown, callback: (error?: Error) => void) => {
        if (autoCancelHoursModel.value != null && autoCancelHoursModel.value < 0) {
          callback(new Error('不能为负数'))
        } else {
          callback()
        }
      },
      trigger: 'change',
    },
  ],
}

async function fetchRules(): Promise<void> {
  loading.value = true
  try {
    const res = await getRules()
    const data = res.data
    originalData.value = data
    form.require_confirmation = data.require_confirmation
    form.advance_days = data.advance_days
    form.cutoff_minutes = data.cutoff_minutes
    form.auto_cancel_hours = data.auto_cancel_hours
    form.customer_cancel_hours = data.customer_cancel_hours
    form.slot_duration = data.slot_duration
  } catch {
    // handled
  } finally {
    loading.value = false
  }
}

async function handleSave(): Promise<void> {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    await updateRules({
      require_confirmation: form.require_confirmation,
      advance_days: form.advance_days,
      cutoff_minutes: form.cutoff_minutes,
      auto_cancel_hours: form.auto_cancel_hours,
      customer_cancel_hours: form.customer_cancel_hours,
      slot_duration: form.slot_duration,
    })
    ElMessage.success('规则已保存')
    await fetchRules()
  } catch {
    // handled
  } finally {
    saving.value = false
  }
}

function handleReset(): void {
  if (originalData.value) {
    const data = originalData.value
    form.require_confirmation = data.require_confirmation
    form.advance_days = data.advance_days
    form.cutoff_minutes = data.cutoff_minutes
    form.auto_cancel_hours = data.auto_cancel_hours
    form.customer_cancel_hours = data.customer_cancel_hours
    form.slot_duration = data.slot_duration
    ElMessage.info('已重置为上次保存的状态')
  }
}

onMounted(() => {
  fetchRules()
})
</script>

<style scoped>
.rules-form {
  max-width: 650px;
}

.input-with-unit {
  display: flex;
  align-items: center;
  gap: 10px;
}

.unit-text {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.form-hint {
  font-size: 12px;
  color: var(--color-text-placeholder);
  margin-top: 4px;
  line-height: 1.4;
}

:deep(.el-switch__label) {
  font-size: 13px;
}
</style>
