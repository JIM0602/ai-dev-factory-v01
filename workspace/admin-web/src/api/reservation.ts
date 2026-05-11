import http, { type ApiResponse, type PaginatedData, type PaginationParams } from './request'

export interface ReservationItem {
  id: number
  customer_name: string
  customer_phone: string
  reservation_date: string
  slot_start_time: string
  slot_end_time: string
  guest_count: number
  status: string
  source: string
  remark?: string
  cancel_reason?: string
  rejection_reason?: string
  created_at: string
  updated_at?: string
}

export interface ReservationSummary {
  pending_count: number
  confirmed_count: number
  in_progress_count: number
}

export interface MerchantReservationListData extends PaginatedData<ReservationItem> {
  summary: ReservationSummary
}

export interface ReservationListParams extends PaginationParams {
  date?: string
  status?: string
  search?: string
}

export interface SlotItem {
  start_time: string
  end_time: string
  total_tables: number
  booked_count: number
  available_count: number
  is_available: boolean
  is_past: boolean
  is_cutoff: boolean
}

export interface SlotsData {
  date: string
  is_open: boolean
  slots: SlotItem[]
}

export interface CreateReservationParams {
  reservation_date: string
  slot_start_time: string
  slot_end_time: string
  guest_count?: number
  customer_phone: string
  customer_name: string
  remark?: string
}

/** 获取可预约时段 */
export function getSlots(date: string): Promise<ApiResponse<SlotsData>> {
  return http.get('/reservations/slots', { params: { date } }).then((res) => res.data)
}

/** 商家查看所有预约列表 */
export function getMerchantReservations(
  params: ReservationListParams
): Promise<ApiResponse<MerchantReservationListData>> {
  return http.get('/reservations/merchant', { params }).then((res) => res.data)
}

/** 获取预约详情 */
export function getReservationDetail(id: number): Promise<ApiResponse<ReservationItem>> {
  return http.get(`/reservations/${id}`).then((res) => res.data)
}

/** 商家手动添加预约 */
export function createMerchantReservation(
  params: CreateReservationParams
): Promise<ApiResponse<ReservationItem>> {
  return http.post('/reservations/merchant', params).then((res) => res.data)
}

/** 确认预约 */
export function confirmReservation(id: number): Promise<ApiResponse<null>> {
  return http.post(`/reservations/${id}/confirm`).then((res) => res.data)
}

/** 拒绝预约 */
export function rejectReservation(
  id: number,
  reason?: string
): Promise<ApiResponse<null>> {
  return http.post(`/reservations/${id}/reject`, { reason }).then((res) => res.data)
}
