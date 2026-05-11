import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';
import type { ReservationItem, ReservationDetail, SlotInfo } from '@/api/reservation';
import { getMyReservations, getReservationDetail, getSlots, createReservation, cancelReservation } from '@/api/reservation';

export const useReservationStore = defineStore('reservation', () => {
  const reservations = ref<ReservationItem[]>([]);
  const currentDetail = ref<ReservationDetail | null>(null);
  const slots = ref<SlotInfo[]>([]);
  const slotsDate = ref<string>('');
  const slotsIsOpen = ref<boolean>(true);

  const loading = ref(false);
  const detailLoading = ref(false);
  const slotsLoading = ref(false);
  const error = ref<string>('');

  const pagination = reactive({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });

  /** 加载我的预约列表 */
  async function fetchMyReservations(params: {
    status?: string;
    page?: number;
    page_size?: number;
  } = {}): Promise<void> {
    loading.value = true;
    error.value = '';
    try {
      const res = await getMyReservations({
        page: params.page || 1,
        page_size: params.page_size || 20,
        status: params.status || undefined,
      });
      if (res.code === 0 && res.data) {
        if (params.page === 1 || !params.page) {
          reservations.value = res.data.list;
        } else {
          reservations.value = [...reservations.value, ...res.data.list];
        }
        Object.assign(pagination, res.data.pagination);
      } else {
        error.value = res.message || '加载失败';
      }
    } catch {
      error.value = '网络错误，请重试';
    } finally {
      loading.value = false;
    }
  }

  /** 加载预约详情 */
  async function fetchReservationDetail(id: number): Promise<void> {
    detailLoading.value = true;
    try {
      const res = await getReservationDetail(id);
      if (res.code === 0 && res.data) {
        currentDetail.value = res.data;
      }
    } finally {
      detailLoading.value = false;
    }
  }

  /** 加载时段列表 */
  async function fetchSlots(date: string): Promise<void> {
    slotsLoading.value = true;
    try {
      const res = await getSlots(date);
      if (res.code === 0 && res.data) {
        slots.value = res.data.slots;
        slotsDate.value = res.data.date;
        slotsIsOpen.value = res.data.is_open;
      }
    } finally {
      slotsLoading.value = false;
    }
  }

  /** 提交预约 */
  async function submitReservation(data: Parameters<typeof createReservation>[0]): Promise<{ success: boolean; message: string; data?: ReservationItem }> {
    const res = await createReservation(data);
    if (res.code === 0 && res.data) {
      return { success: true, message: res.message || '预约成功', data: res.data };
    }
    return { success: false, message: res.message || '预约失败' };
  }

  /** 取消预约 */
  async function cancelReservationById(id: number): Promise<{ success: boolean; message: string }> {
    const res = await cancelReservation(id);
    if (res.code === 0) {
      // 更新本地列表状态
      const item = reservations.value.find(r => r.id === id);
      if (item) {
        item.status = 'cancelled' as const;
        item.can_cancel = false;
      }
      return { success: true, message: res.message || '预约已取消' };
    }
    return { success: false, message: res.message || '取消失败' };
  }

  return {
    reservations,
    currentDetail,
    slots,
    slotsDate,
    slotsIsOpen,
    loading,
    detailLoading,
    slotsLoading,
    error,
    pagination,
    fetchMyReservations,
    fetchReservationDetail,
    fetchSlots,
    submitReservation,
    cancelReservationById,
  };
});
