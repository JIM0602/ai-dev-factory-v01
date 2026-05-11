import http, { type ApiResponse, type PaginatedData, type PaginationParams } from './request'

export interface CouponItem {
  id: number
  coupon_code: string
  coupon_source: string
  coupon_type: string
  customer_name: string
  customer_phone: string
  visit_date: string
  created_at: string
}

export interface CouponListParams extends PaginationParams {
  source?: string
  start_date?: string
  end_date?: string
}

/** 获取团购券核销记录 */
export function getCoupons(
  params: CouponListParams
): Promise<ApiResponse<PaginatedData<CouponItem>>> {
  return http.get('/coupons', { params }).then((res) => res.data)
}
