<template>
  <div class="search-filter">
    <div class="filter-fields">
      <slot name="filters" />
    </div>
    <div class="filter-actions">
      <el-input
        v-if="showSearch"
        v-model="searchText"
        :placeholder="searchPlaceholder"
        :prefix-icon="SearchIcon"
        clearable
        class="search-input"
        @keyup.enter="$emit('search', searchText)"
        @clear="$emit('search', '')"
      />
      <el-button type="primary" @click="$emit('search', searchText)" v-if="showSearch">
        搜索
      </el-button>
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Search as SearchIcon } from '@element-plus/icons-vue'

const props = withDefaults(
  defineProps<{
    showSearch?: boolean
    searchPlaceholder?: string
    modelValue?: string
  }>(),
  {
    showSearch: true,
    searchPlaceholder: '输入关键词搜索',
    modelValue: '',
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  search: [value: string]
}>()

const searchText = ref(props.modelValue)

watch(
  () => props.modelValue,
  (val) => {
    searchText.value = val
  }
)

watch(searchText, (val) => {
  emit('update:modelValue', val)
})
</script>

<script lang="ts">
export default {
  name: 'SearchFilter',
}
</script>

<style scoped>
.search-filter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-fields {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  flex: 1;
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-input {
  width: 220px;
}
</style>
