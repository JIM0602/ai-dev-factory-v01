import { request, type ApiResponse, type PaginationData } from './request';
import type { ReservationStatus } from '@/utils/constants';

export interface SlotInfo {
  start_time: string;
  end_time: string;
  total_tables: number;
  booked_count: number;
  available_count: number;
  is_available: boolean;
  is_past: boolean;
  is_cutoff: boolean;
}

export interface SlotsResponse {
  date: string;
  is_open: boolean;
  slots: SlotInfo[];
}

export interface CreateReservationParams {
  reservation_date: string;
  slot_start_time: string;
  slot_end_time: string;
  guest_count?: number;
  customer_phone: string;
  customer_name: string;
  remark?: string;
}

export interface ReservationItem {
  id: number;
  reservation_date: string;
  slot_start_time: string;
  slot_end_time: string;
  guest_count: number;
  customer_name?: string;
  customer_phone?: string;
  status: ReservationStatus;
  source: string;
  remark?: string;
  can_cancel?: boolean;
  store_name?: string;
  created_at: string;
}

export interface ReservationDetail extends ReservationItem {
  customer_phone_full?: string;
  customer_phone?: string;
  cancel_reason?: string | null;
  rejection_reason?: string | null;
  store_name?: string;
  store_address?: string;
  timer_session?: TimerSessionInfo | null;
  updated_at: string;
}

export interface TimerSessionInfo {
  id: number;
  table_number: number;
  check_in_time: string;
  expected_end_time: string;
  actual_end_time: string | null;
  original_duration_minutes: number;
  total_extension_minutes: number;
  status: string;
  remaining_seconds: number;
  extensions: Array<{ id: number; extension_minutes: number; created_at: string }>;
  coupons: Array<{ id: number; coupon_code: string; coupon_source: string; coupon_type: string }>;
}

/** 获取指定日期的可预约时段 */
export function getSlots(date: string): Promise<ApiResponse<SlotsResponse>> {
  return request.get<SlotsResponse>('/reservations/slots', { date });
}

/** 顾客提交预约 */
export function createReservation(data: CreateReservationParams): Promise<ApiResponse<ReservationItem>> {
  return request.post<ReservationItem>('/reservations', data as unknown as Record<string, unknown>, true);
}

/** 顾客查看自己的预约列表 */
export function getMyReservations(params: {
  status?: string;
  page?: number;
  page_size?: number;
}): Promise<ApiResponse<PaginationData<ReservationItem>>> {
  return request.get<PaginationData<ReservationItem>>('/reservations/my', params as Record<string, unknown>);
}

/** 顾客查看预约详情 */
export function getReservationDetail(id: number): Promise<ApiResponse<ReservationDetail>> {
  return request.get<ReservationDetail>(`/reservations/${id}`);
}

/** 顾客取消预约 */
export function cancelReservation(id: number): Promise<ApiResponse<null>> {
  return request.post<null>(`/reservations/${id}/cancel`);
}

/** 商家查看所有预约列表 */
export function getMerchantReservations(params: {
  date?: string;
  status?: string;
  search?: string;
  page?: number;
  page_size?: number;
}): Promise<ApiResponse<PaginationData<ReservationItem> & {
  summary?: {
    pending_count: number;
    confirmed_count: number;
    in_progress_count: number;
  };
}>> {
  return request.get<PaginationData<ReservationItem>>('/reservations/merchant', params as Record<string, unknown>);
}

/** 商家手动添加预约 */
export function createMerchantReservation(data: CreateReservationParams): Promise<ApiResponse<ReservationItem>> {
  return request.post<ReservationItem>('/reservations/merchant', data as unknown as Record<string, unknown>, true);
}

/** 商家确认预约 */
export function confirmReservation(id: number): Promise<ApiResponse<null>> {
  return request.post<null>(`/reservations/${id}/confirm`);
}

/** 商家拒绝预约 */
export function rejectReservation(id: number, reason?: string): Promise<ApiResponse<null>> {
  return request.post<null>(`/reservations/${id}/reject`, { reason });
}
