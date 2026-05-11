import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { DashboardSession } from '@/api/timer';
import { getTimerDashboard, extendTimer, endTimer } from '@/api/timer';

export const useTimerStore = defineStore('timer', () => {
  const sessions = ref<DashboardSession[]>([]);
  const activeCount = ref(0);
  const availableTables = ref(0);
  const loading = ref(false);
  const error = ref<string>('');
  const pollingTimer = ref<ReturnType<typeof setInterval> | null>(null);

  const sortedSessions = computed(() => {
    return [...sessions.value].sort((a, b) => a.remaining_seconds - b.remaining_seconds);
  });

  /** 加载计时看板数据 */
  async function fetchDashboard(): Promise<void> {
    try {
      const res = await getTimerDashboard();
      if (res.code === 0 && res.data) {
        sessions.value = res.data.sessions;
        activeCount.value = res.data.active_count;
        availableTables.value = res.data.available_tables;
      } else {
        error.value = res.message || '加载失败';
      }
    } catch {
      error.value = '网络错误，请重试';
    }
  }

  /** 加时 */
  async function extendTimerSession(sessionId: number, extensionMinutes: number): Promise<{ success: boolean; message: string }> {
    const res = await extendTimer(sessionId, extensionMinutes);
    if (res.code === 0) {
      await fetchDashboard();
      return { success: true, message: res.message || `已加时 +${extensionMinutes} 分钟` };
    }
    return { success: false, message: res.message || '加时失败' };
  }

  /** 结束计时 */
  async function endTimerSession(sessionId: number): Promise<{ success: boolean; message: string }> {
    const res = await endTimer(sessionId);
    if (res.code === 0) {
      await fetchDashboard();
      return { success: true, message: res.message || '计时已结束' };
    }
    return { success: false, message: res.message || '操作失败' };
  }

  /** 开始轮询（每 10 秒刷新一次） */
  function startPolling(): void {
    stopPolling();
    fetchDashboard();
    pollingTimer.value = setInterval(() => {
      fetchDashboard();
    }, 10000);
  }

  /** 停止轮询 */
  function stopPolling(): void {
    if (pollingTimer.value) {
      clearInterval(pollingTimer.value);
      pollingTimer.value = null;
    }
  }

  return {
    sessions,
    activeCount,
    availableTables,
    loading,
    error,
    sortedSessions,
    fetchDashboard,
    extendTimerSession,
    endTimerSession,
    startPolling,
    stopPolling,
  };
});
