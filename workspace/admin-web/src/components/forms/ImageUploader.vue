<template>
  <div class="image-uploader">
    <div class="image-list">
      <div
        v-for="(url, index) in modelValue"
        :key="index"
        class="image-item"
        draggable="true"
        @dragstart="handleDragStart(index)"
        @dragover.prevent="handleDragOver(index)"
        @drop="handleDrop(index)"
      >
        <img :src="url" alt="门店照片" class="image-preview" />
        <div class="image-actions">
          <span class="drag-handle" title="拖拽排序">&#9776;</span>
          <el-button
            type="danger"
            :icon="DeleteIcon"
            circle
            size="small"
            @click="handleRemove(index)"
            title="删除"
          />
        </div>
      </div>

      <el-upload
        v-if="modelValue.length < maxCount"
        :http-request="handleUpload"
        :show-file-list="false"
        :accept="'image/jpeg,image/png,image/webp'"
        :before-upload="beforeUpload"
        class="upload-trigger"
        drag
      >
        <div class="upload-placeholder">
          <span class="upload-icon">+</span>
          <span class="upload-text">上传照片</span>
          <span class="upload-hint">{{ modelValue.length }}/{{ maxCount }}</span>
        </div>
      </el-upload>
    </div>

    <p v-if="error" class="upload-error">{{ error }}</p>
    <p class="upload-tip">支持 JPG、PNG、WebP 格式，单张不超过 2MB，最少 {{ minCount }} 张最多 {{ maxCount }} 张</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Delete as DeleteIcon } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { uploadImage } from '@/api/store'
import { UPLOAD_LIMITS } from '@/utils/constants'

const props = withDefaults(
  defineProps<{
    modelValue: string[]
    maxCount?: number
    minCount?: number
  }>(),
  {
    maxCount: UPLOAD_LIMITS.maxPhotos,
    minCount: UPLOAD_LIMITS.minPhotos,
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const error = ref('')
const uploading = ref(false)

let dragIndex = -1

function handleDragStart(index: number): void {
  dragIndex = index
}

function handleDragOver(_index: number): void {
  // needed for drop to work
}

function handleDrop(index: number): void {
  if (dragIndex === -1 || dragIndex === index) return
  const newList = [...props.modelValue]
  const [removed] = newList.splice(dragIndex, 1)
  newList.splice(index, 0, removed)
  emit('update:modelValue', newList)
  dragIndex = -1
}

function beforeUpload(file: File): boolean {
  error.value = ''
  if (!UPLOAD_LIMITS.acceptTypes.includes(file.type)) {
    error.value = '仅支持 JPG、PNG、WebP 格式'
    return false
  }
  if (file.size > UPLOAD_LIMITS.maxFileSize) {
    error.value = '图片大小不能超过 2MB'
    return false
  }
  return true
}

async function handleUpload(options: { file: File }): Promise<void> {
  if (uploading.value) return
  uploading.value = true
  try {
    const res = await uploadImage(options.file)
    if (res.data?.url) {
      const newList = [...props.modelValue, res.data.url]
      emit('update:modelValue', newList)
      ElMessage.success('上传成功')
    }
  } catch {
    ElMessage.error('上传失败')
  } finally {
    uploading.value = false
  }
}

function handleRemove(index: number): void {
  const newList = [...props.modelValue]
  newList.splice(index, 1)
  emit('update:modelValue', newList)
}
</script>

<script lang="ts">
export default {
  name: 'ImageUploader',
}
</script>

<style scoped>
.image-uploader {
  width: 100%;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.image-item {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: var(--radius-image);
  overflow: hidden;
  border: 1px solid var(--color-border);
  cursor: grab;
}

.image-item:active {
  cursor: grabbing;
}

.image-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-actions {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.image-item:hover .image-actions {
  opacity: 1;
}

.drag-handle {
  color: #fff;
  font-size: 18px;
  cursor: grab;
}

.upload-trigger {
  width: 120px;
  height: 120px;
}

.upload-trigger :deep(.el-upload-dragger) {
  width: 120px;
  height: 120px;
  border-radius: var(--radius-image);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed var(--color-border);
  background: var(--color-bg-page);
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.upload-icon {
  font-size: 24px;
  color: var(--color-text-placeholder);
  line-height: 1;
}

.upload-text {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.upload-hint {
  font-size: 11px;
  color: var(--color-text-placeholder);
}

.upload-error {
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-danger);
}

.upload-tip {
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-text-placeholder);
}
</style>
