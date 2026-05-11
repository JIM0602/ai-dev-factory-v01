<template>
  <div class="page-container">
    <div class="page-header">
      <h1>门店设置</h1>
      <p>配置门店基本信息，修改后将同步到用户端小程序</p>
    </div>

    <div class="card-container" v-loading="loading">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="left"
        label-width="110px"
        class="store-form"
      >
        <el-divider content-position="left">基本信息</el-divider>

        <el-form-item label="门店名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入门店名称" maxlength="30" show-word-limit />
        </el-form-item>

        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入11位手机号" maxlength="11" />
        </el-form-item>

        <el-form-item label="门店地址" prop="address">
          <el-input v-model="form.address" placeholder="请输入完整地址" maxlength="200" show-word-limit />
        </el-form-item>

        <el-form-item label="门牌指引" prop="address_guide">
          <el-input v-model="form.address_guide" placeholder="如：3楼出电梯右转302室" maxlength="100" show-word-limit />
        </el-form-item>

        <el-form-item label="门店介绍" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入门店介绍，选填"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-divider content-position="left">门店照片</el-divider>

        <el-form-item label="门店照片" prop="photos">
          <ImageUploader v-model="form.photos" />
        </el-form-item>

        <el-divider content-position="left">营业设置</el-divider>

        <el-form-item label="营业时间" prop="open_time">
          <div class="time-range">
            <el-time-picker
              v-model="form.open_time"
              placeholder="开始时间"
              format="HH:mm"
              value-format="HH:mm"
              style="width: 160px"
            />
            <span class="time-sep">至</span>
            <el-time-picker
              v-model="form.close_time"
              placeholder="结束时间"
              format="HH:mm"
              value-format="HH:mm"
              style="width: 160px"
            />
          </div>
        </el-form-item>

        <el-form-item label="休息日" prop="rest_days">
          <DaySelector v-model="form.rest_days" />
        </el-form-item>

        <el-form-item label="桌位总数" prop="table_count">
          <el-input-number v-model="form.table_count" :min="1" :max="99" style="width: 160px" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="saving" @click="handleSave">
            保存设置
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { getStoreConfig, updateStoreConfig, type StoreConfig } from '@/api/store'
import ImageUploader from '@/components/forms/ImageUploader.vue'
import DaySelector from '@/components/forms/DaySelector.vue'
import { VALIDATION_RULES } from '@/utils/constants'

const formRef = ref<FormInstance>()
const loading = ref(false)
const saving = ref(false)
const originalData = ref<StoreConfig | null>(null)

const form = reactive({
  name: '',
  address: '',
  address_guide: '',
  phone: '',
  photos: [] as string[],
  open_time: '',
  close_time: '',
  rest_days: [] as number[],
  table_count: 8,
  description: '',
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入门店名称', trigger: 'blur' },
    { max: 30, message: '最长30个字', trigger: 'blur' },
  ],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: VALIDATION_RULES.phone, message: '请输入正确的11位手机号', trigger: 'blur' },
  ],
  address: [
    { required: true, message: '请输入门店地址', trigger: 'blur' },
  ],
  open_time: [
    { required: true, message: '请选择营业开始时间', trigger: 'change' },
  ],
}

// 仿 time-picker 的 close_time 校验在保存时手动检查

async function fetchConfig(): Promise<void> {
  loading.value = true
  try {
    const res = await getStoreConfig()
    const data = res.data
    originalData.value = data
    form.name = data.name
    form.address = data.address
    form.address_guide = data.address_guide || ''
    form.phone = data.phone
    form.photos = data.photos || []
    form.open_time = data.open_time
    form.close_time = data.close_time
    form.rest_days = data.rest_days || []
    form.table_count = data.table_count
    form.description = data.description || ''
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

  if (!form.close_time) {
    ElMessage.warning('请选择营业结束时间')
    return
  }

  if (form.photos.length < 1) {
    ElMessage.warning('至少保留一张门店照片')
    return
  }

  saving.value = true
  try {
    await updateStoreConfig({
      name: form.name,
      address: form.address,
      address_guide: form.address_guide || undefined,
      phone: form.phone,
      photos: form.photos,
      open_time: form.open_time,
      close_time: form.close_time,
      rest_days: form.rest_days,
      table_count: form.table_count,
      description: form.description || undefined,
    })
    ElMessage.success('设置已保存')
    // 刷新数据
    await fetchConfig()
  } catch {
    // handled
  } finally {
    saving.value = false
  }
}

function handleReset(): void {
  if (originalData.value) {
    const data = originalData.value
    form.name = data.name
    form.address = data.address
    form.address_guide = data.address_guide || ''
    form.phone = data.phone
    form.photos = data.photos || []
    form.open_time = data.open_time
    form.close_time = data.close_time
    form.rest_days = data.rest_days || []
    form.table_count = data.table_count
    form.description = data.description || ''
    ElMessage.info('已重置为上次保存的状态')
  }
}

onMounted(() => {
  fetchConfig()
})
</script>

<style scoped>
.store-form {
  max-width: 700px;
}

.time-range {
  display: flex;
  align-items: center;
  gap: 12px;
}

.time-sep {
  color: var(--color-text-secondary);
  font-size: 14px;
}

:deep(.el-divider__text) {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  background: var(--color-bg-card);
}
</style>
