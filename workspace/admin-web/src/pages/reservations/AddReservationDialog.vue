<template>
  <el-dialog
    :model-value="visible"
    title="添加预约"
    width="520px"
    :close-on-click-modal="false"
    @update:model-value="$emit('update:visible', $event)"
    @closed="handleClosed"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="left"
      label-width="90px"
    >
      <el-form-item label="顾客姓名" prop="customer_name">
        <el-input v-model="form.customer_name" placeholder="请输入顾客姓名" maxlength="30" />
      </el-form-item>

      <el-form-item label="手机号" prop="customer_phone">
        <el-input v-model="form.customer_phone" placeholder="请输入11位手机号" maxlength="11" />
      </el-form-item>

      <el-form-item label="预约日期" prop="reservation_date">
        <el-date-picker
          v-model="form.reservation_date"
          type="date"
          placeholder="选择日期"
          value-format="YYYY-MM-DD"
          :disabled-date="disabledDate"
          style="width: 100%"
          @change="handleDateChange"
        />
      </el-form-item>

      <el-form-item label="预约时段" prop="slot_start_time">
        <el-select
          v-model="form.slot_start_time"
          placeholder="请选择时段"
          style="width: 100%"
          :disabled="!form.reservation_date"
          @change="handleSlotChange"
        >
          <el-option
            v-for="slot in availableSlots"
            :key="slot.start_time"
            :label="`${slot.start_time} - ${slot.end_time} (余${slot.available_count}位)`"
            :value="slot.start_time"
            :disabled="!slot.is_available"
          />
        </el-select>
        <div class="slot-tip" v-if="selectedSlot">
          该时段还可预约 {{ selectedSlot.available_count }} 个桌位
        </div>
      </el-form-item>

      <el-form-item label="人数" prop="guest_count">
        <el-input-number
          v-model="form.guest_count"
          :min="1"
          :max="10"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="备注" prop="remark">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="3"
          placeholder="选填，最多100字"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        提交预约
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { getSlots, createMerchantReservation, type SlotItem } from '@/api/reservation'
import { VALIDATION_RULES } from '@/utils/constants'
import dayjs from 'dayjs'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  success: []
}>()

const formRef = ref<FormInstance>()
const submitting = ref(false)
const availableSlots = ref<SlotItem[]>([])
const selectedSlot = ref<SlotItem | null>(null)

const form = reactive({
  customer_name: '',
  customer_phone: '',
  reservation_date: '',
  slot_start_time: '',
  guest_count: 1,
  remark: '',
})

const rules: FormRules = {
  customer_name: [
    { required: true, message: '请输入顾客姓名', trigger: 'blur' },
  ],
  customer_phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: VALIDATION_RULES.phone, message: '请输入正确的11位手机号', trigger: 'blur' },
  ],
  reservation_date: [
    { required: true, message: '请选择预约日期', trigger: 'change' },
  ],
  slot_start_time: [
    { required: true, message: '请选择预约时段', trigger: 'change' },
  ],
}

function disabledDate(date: Date): boolean {
  const today = dayjs().startOf('day')
  return dayjs(date).isBefore(today, 'day')
}

async function handleDateChange(): Promise<void> {
  form.slot_start_time = ''
  selectedSlot.value = null
  availableSlots.value = []

  if (!form.reservation_date) return

  try {
    const res = await getSlots(form.reservation_date)
    availableSlots.value = res.data.slots
    if (!res.data.is_open) {
      ElMessage.warning('所选日期为非营业日')
    }
  } catch {
    // handled
  }
}

function handleSlotChange(): void {
  selectedSlot.value =
    availableSlots.value.find((s) => s.start_time === form.slot_start_time) || null
}

async function handleSubmit(): Promise<void> {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  const slot = availableSlots.value.find((s) => s.start_time === form.slot_start_time)
  if (!slot) {
    ElMessage.error('请选择有效时段')
    return
  }

  submitting.value = true
  try {
    await createMerchantReservation({
      reservation_date: form.reservation_date,
      slot_start_time: slot.start_time,
      slot_end_time: slot.end_time,
      guest_count: form.guest_count,
      customer_name: form.customer_name,
      customer_phone: form.customer_phone,
      remark: form.remark || undefined,
    })
    ElMessage.success('预约添加成功')
    emit('success')
    emit('update:visible', false)
  } catch {
    // handled by interceptor
  } finally {
    submitting.value = false
  }
}

function handleClosed(): void {
  formRef.value?.resetFields()
  form.customer_name = ''
  form.customer_phone = ''
  form.reservation_date = ''
  form.slot_start_time = ''
  form.guest_count = 1
  form.remark = ''
  availableSlots.value = []
  selectedSlot.value = null
}

// 当弹窗打开时，若表单为空则初始化
watch(
  () => props.visible,
  (val) => {
    if (!val) return
    availableSlots.value = []
    selectedSlot.value = null
  }
)
</script>

<style scoped>
.slot-tip {
  margin-top: 6px;
  font-size: 12px;
  color: var(--color-text-secondary);
}
</style>
