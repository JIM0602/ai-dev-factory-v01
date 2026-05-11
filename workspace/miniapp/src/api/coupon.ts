import { request, type ApiResponse, type PaginationData } from './request';

export interface CouponItem {
  id: number;
  coupon_code: string;
  coupon_source: string;
  coupon_type: string;
  customer_name: string;
  customer_phone: string;
  visit_date: string;
  created_at: string;
}

/** 获取团购券核销记录 */
export function getCoupons(params: {
  source?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}): Promise<ApiResponse<PaginationData<CouponItem>>> {
  return request.get<PaginationData<CouponItem>>('/coupons', params as Record<string, unknown>);
}
