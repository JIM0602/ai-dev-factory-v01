import { request, type ApiResponse } from './request';

export interface CheckinParams {
  table_number?: number;
  coupons?: Array<{
    coupon_code: string;
    coupon_source: string;
    coupon_type?: string;
  }>;
}

export interface CheckinResponse {
  timer_session_id: number;
  table_number: number;
  check_in_time: string;
  expected_end_time: string;
  original_duration_minutes: number;
  reservation_status: string;
}

export interface ExtendResponse {
  timer_session_id: number;
  new_remaining_seconds: number;
  total_extension_minutes: number;
}

export interface EndTimerResponse {
  timer_session_id: number;
  actual_end_time: string;
  total_duration_minutes: number;
  reservation_status: string;
}

export interface DashboardSession {
  id: number;
  customer_name: string;
  table_number: number;
  slot_start_time: string;
  slot_end_time: string;
  check_in_time: string;
  original_duration_minutes: number;
  used_minutes: number;
  remaining_seconds: number;
  total_extension_minutes: number;
  is_urgent: boolean;
  is_critical: boolean;
}

export interface TimerDashboardResponse {
  active_count: number;
  available_tables: number;
  sessions: DashboardSession[];
}

/** 到店登记，开始计时 */
export function checkin(reservationId: number, data: CheckinParams): Promise<ApiResponse<CheckinResponse>> {
  return request.post<CheckinResponse>(`/reservations/${reservationId}/checkin`, data as unknown as Record<string, unknown>, true);
}

/** 加时 */
export function extendTimer(sessionId: number, extensionMinutes: number): Promise<ApiResponse<ExtendResponse>> {
  return request.post<ExtendResponse>(`/timer/${sessionId}/extend`, { extension_minutes: extensionMinutes }, true);
}

/** 结束计时 */
export function endTimer(sessionId: number): Promise<ApiResponse<EndTimerResponse>> {
  return request.post<EndTimerResponse>(`/timer/${sessionId}/end`, {}, true);
}

/** 获取计时看板数据 */
export function getTimerDashboard(): Promise<ApiResponse<TimerDashboardResponse>> {
  return request.get<TimerDashboardResponse>('/timer/dashboard');
}
