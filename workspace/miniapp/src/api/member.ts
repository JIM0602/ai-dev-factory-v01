import { request, type ApiResponse, type PaginationData } from './request';

export interface MemberItem {
  id: number;
  name: string;
  phone: string;
  total_visits: number;
  total_duration_minutes: number;
  last_visit_date: string;
}

export interface ConsumptionRecord {
  id: number;
  visit_date: string;
  check_in_time: string;
  check_out_time: string;
  duration_minutes: number;
  has_coupon: boolean;
  source: string;
}

export interface MemberDetail extends MemberItem {
  phone_full: string;
  records: PaginationData<ConsumptionRecord>;
}

/** 搜索会员 */
export function searchMembers(params: {
  search: string;
  page?: number;
  page_size?: number;
}): Promise<ApiResponse<PaginationData<MemberItem>>> {
  return request.get<PaginationData<MemberItem>>('/members', params as Record<string, unknown>);
}

/** 查看会员详情 */
export function getMemberDetail(id: number, page = 1, pageSize = 20): Promise<ApiResponse<MemberDetail>> {
  return request.get<MemberDetail>(`/members/${id}`, { page, page_size: pageSize });
}
