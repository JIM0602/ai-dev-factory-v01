import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getStoreInfo } from '@/api/store';
import type { StoreInfo } from '@/api/store';

export const useStoreInfoStore = defineStore('storeInfo', () => {
  const storeInfo = ref<StoreInfo | null>(null);
  const loading = ref(false);
  const error = ref<string>('');

  /** 加载门店信息 */
  async function fetchStoreInfo(): Promise<void> {
    loading.value = true;
    error.value = '';
    try {
      const res = await getStoreInfo();
      if (res.code === 0 && res.data) {
        storeInfo.value = res.data;
      } else {
        error.value = res.message || '加载门店信息失败';
      }
    } catch {
      error.value = '网络错误，请重试';
    } finally {
      loading.value = false;
    }
  }

  return {
    storeInfo,
    loading,
    error,
    fetchStoreInfo,
  };
});
