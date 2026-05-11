import http, { type ApiResponse, type PaginatedData, type PaginationParams } from './request'

export interface MemberItem {
  id: number
  name: string
  phone: string
  total_visits: number
  total_duration_minutes: number
  last_visit_date: string
}

export interface ConsumptionRecord {
  id: number
  visit_date: string
  check_in_time: string
  check_out_time: string
  duration_minutes: number
  has_coupon: boolean
  source: string
}

export interface MemberDetail {
  id: number
  name: string
  phone: string
  phone_full: string
  total_visits: number
  total_duration_minutes: number
  last_visit_date: string
  records: PaginatedData<ConsumptionRecord>
}

export interface MemberListParams extends PaginationParams {
  search: string
}

/** 搜索会员 */
export function getMembers(
  params: MemberListParams
): Promise<ApiResponse<PaginatedData<MemberItem>>> {
  return http.get('/members', { params }).then((res) => res.data)
}

/** 获取会员详情 */
export function getMemberDetail(
  id: number,
  params?: PaginationParams
): Promise<ApiResponse<MemberDetail>> {
  return http.get(`/members/${id}`, { params }).then((res) => res.data)
}
