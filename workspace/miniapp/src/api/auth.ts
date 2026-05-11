import { request, type ApiResponse } from './request';

export interface WechatLoginResponse {
  token: string;
  expires_in: number;
  role: 'customer' | 'merchant';
  nickname: string;
  openid: string;
}

export interface AdminLoginResponse {
  token: string;
  expires_in: number;
  role: 'merchant';
  username: string;
}

export interface RefreshTokenResponse {
  token: string;
  expires_in: number;
}

/** 微信小程序登录 */
export function wechatLogin(code: string): Promise<ApiResponse<WechatLoginResponse>> {
  return request.post<WechatLoginResponse>('/auth/wechat-login', { code });
}

/** 刷新 Token */
export function refreshToken(): Promise<ApiResponse<RefreshTokenResponse>> {
  return request.post<RefreshTokenResponse>('/auth/refresh-token');
}
