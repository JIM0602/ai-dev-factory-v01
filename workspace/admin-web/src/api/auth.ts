import http, { type ApiResponse } from './request'

export interface LoginParams {
  username: string
  password: string
}

export interface LoginResult {
  token: string
  expires_in: number
  role: string
  username: string
}

/** 登录 */
export function adminLogin(params: LoginParams): Promise<ApiResponse<LoginResult>> {
  return http.post('/auth/admin-login', params).then((res) => res.data)
}

/** 刷新 Token */
export function refreshToken(): Promise<ApiResponse<{ token: string; expires_in: number }>> {
  return http.post('/auth/refresh-token').then((res) => res.data)
}
