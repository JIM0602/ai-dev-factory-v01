import http, { type ApiResponse } from './request'

export interface ReservationRules {
  id: number
  require_confirmation: boolean
  advance_days: number
  cutoff_minutes: number
  auto_cancel_hours: number | null
  customer_cancel_hours: number
  slot_duration: number
}

export interface UpdateRulesParams {
  require_confirmation: boolean
  advance_days: number
  cutoff_minutes: number
  auto_cancel_hours: number | null
  customer_cancel_hours: number
  slot_duration: number
}

/** 获取预约规则 */
export function getRules(): Promise<ApiResponse<ReservationRules>> {
  return http.get('/rules').then((res) => res.data)
}

/** 更新预约规则 */
export function updateRules(params: UpdateRulesParams): Promise<ApiResponse<ReservationRules>> {
  return http.put('/rules', params).then((res) => res.data)
}
