import http, { type ApiResponse } from './request'

export interface StoreConfig {
  id: number
  name: string
  address: string
  address_guide: string
  phone: string
  photos: string[]
  open_time: string
  close_time: string
  rest_days: number[]
  table_count: number
  description: string
  is_open_today?: boolean
  today_available_slots?: number
  created_at?: string
  updated_at?: string
}

export interface UpdateStoreParams {
  name: string
  address: string
  address_guide?: string
  phone: string
  photos: string[]
  open_time: string
  close_time: string
  rest_days?: number[]
  table_count: number
  description?: string
}

/** 获取门店配置（完整） */
export function getStoreConfig(): Promise<ApiResponse<StoreConfig>> {
  return http.get('/store/config').then((res) => res.data)
}

/** 更新门店配置 */
export function updateStoreConfig(params: UpdateStoreParams): Promise<ApiResponse<StoreConfig>> {
  return http.put('/store/config', params).then((res) => res.data)
}

/** 上传图片 */
export function uploadImage(file: File): Promise<ApiResponse<{ url: string }>> {
  const formData = new FormData()
  formData.append('file', file)
  return http
    .post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => res.data)
}
