import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getStoreConfig, type StoreConfig } from '@/api/store'

export const useStoreStore = defineStore('storeConfig', () => {
  const config = ref<StoreConfig | null>(null)
  const loading = ref(false)

  async function fetchConfig(): Promise<void> {
    loading.value = true
    try {
      const res = await getStoreConfig()
      config.value = res.data
    } finally {
      loading.value = false
    }
  }

  function clearConfig(): void {
    config.value = null
  }

  return {
    config,
    loading,
    fetchConfig,
    clearConfig,
  }
})
