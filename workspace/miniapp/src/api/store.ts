import { request, type ApiResponse } from './request';

export interface StoreInfo {
  id: number;
  name: string;
  address: string;
  address_guide: string | null;
  phone: string;
  photos: string[];
  open_time: string;
  close_time: string;
  rest_days: number[];
  table_count: number;
  description: string | null;
  is_open_today: boolean;
  today_available_slots: number;
}

/** 获取门店公开信息 */
export function getStoreInfo(): Promise<ApiResponse<StoreInfo>> {
  return request.get<StoreInfo>('/store/info');
}

/** 获取门店完整配置（商家） */
export function getStoreConfig(): Promise<ApiResponse<StoreInfo>> {
  return request.get<StoreInfo>('/store/config');
}
