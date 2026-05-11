/**
 * uni.request 封装
 * - 自动注入 Authorization header
 * - Token 过期自动尝试 refresh
 * - 统一错误处理
 */

// API 基础地址（开发环境）
const BASE_URL = 'http://localhost:3000/api';

// 存储 Token 的 key
const TOKEN_KEY = 'beadstore_token';
const TOKEN_EXPIRY_KEY = 'beadstore_token_expiry';

interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: Record<string, unknown>;
  header?: Record<string, string>;
  showLoading?: boolean;
  loadingText?: string;
}

interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

interface PaginationData<T> {
  list: T[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

class Request {
  private refreshing = false;
  private refreshQueue: Array<() => void> = [];

  /** 获取存储的 Token */
  getToken(): string {
    try {
      return uni.getStorageSync(TOKEN_KEY) || '';
    } catch {
      return '';
    }
  }

  /** 存储 Token */
  setToken(token: string, expiresIn: number): void {
    try {
      uni.setStorageSync(TOKEN_KEY, token);
      uni.setStorageSync(TOKEN_EXPIRY_KEY, Date.now() + expiresIn * 1000);
    } catch {
      // ignore
    }
  }

  /** 清除 Token */
  clearToken(): void {
    try {
      uni.removeStorageSync(TOKEN_KEY);
      uni.removeStorageSync(TOKEN_EXPIRY_KEY);
    } catch {
      // ignore
    }
  }

  /** 判断 Token 是否过期 */
  isTokenExpired(): boolean {
    try {
      const expiry = uni.getStorageSync(TOKEN_EXPIRY_KEY);
      if (!expiry) return false;
      return Date.now() > expiry;
    } catch {
      return false;
    }
  }

  /** 刷新 Token */
  async refreshToken(): Promise<boolean> {
    if (this.refreshing) {
      return new Promise(resolve => {
        this.refreshQueue.push(() => resolve(true));
      });
    }
    this.refreshing = true;
    try {
      const token = this.getToken();
      if (!token) return false;
      const res = await this._request<{ token: string; expires_in: number }>({
        url: '/auth/refresh-token',
        method: 'POST',
        header: { Authorization: `Bearer ${token}` },
      });
      if (res.code === 0) {
        this.setToken(res.data.token, res.data.expires_in);
        this.refreshQueue.forEach(cb => cb());
        this.refreshQueue = [];
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      this.refreshing = false;
    }
  }

  /** 核心请求方法 */
  async _request<T>(options: RequestOptions): Promise<ApiResponse<T>> {
    const { url, method = 'GET', data, header = {} } = options;

    return new Promise((resolve, reject) => {
      uni.request({
        url: `${BASE_URL}${url}`,
        method,
        data,
        header: {
          'Content-Type': 'application/json',
          ...header,
        },
        timeout: 15000,
        success: (res) => {
          const statusCode = res.statusCode;
          if (statusCode === 200) {
            resolve(res.data as ApiResponse<T>);
          } else if (statusCode === 401) {
            resolve({
              code: 10001,
              message: '未登录或登录已过期',
              data: null as T,
            });
          } else if (statusCode === 403) {
            resolve({
              code: 10003,
              message: '无权限访问',
              data: null as T,
            });
          } else {
            resolve({
              code: statusCode || 50001,
              message: `请求失败 (${statusCode})`,
              data: null as T,
            });
          }
        },
        fail: (err) => {
          // 网络错误
          resolve({
            code: 50001,
            message: err.errMsg || '网络连接失败，请检查网络',
            data: null as T,
          });
        },
      });
    });
  }

  /** 公开请求方法 (自动注入 Token + 过期处理) */
  async request<T>(options: RequestOptions): Promise<ApiResponse<T>> {
    const { showLoading = false, loadingText = '加载中...' } = options;

    if (showLoading) {
      uni.showLoading({ title: loadingText, mask: true });
    }

    const token = this.getToken();
    const header: Record<string, string> = { ...options.header };
    if (token) {
      header['Authorization'] = `Bearer ${token}`;
    }

    let res = await this._request<T>({ ...options, header });

    // 如果返回 401 且本地有 Token，尝试刷新
    if (res.code === 10001 && token && !this.isTokenExpired()) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        const newToken = this.getToken();
        header['Authorization'] = `Bearer ${newToken}`;
        res = await this._request<T>({ ...options, header });
      } else {
        this.clearToken();
      }
    }

    if (showLoading) {
      uni.hideLoading();
    }

    // 业务错误统一 Toast（可被调用方覆盖）
    if (res.code !== 0 && !options.url.includes('refresh')) {
      // 静默处理，由调用方决定是否展示
    }

    return res;
  }

  /** GET 请求 */
  async get<T>(url: string, params?: Record<string, unknown>, showLoading = false): Promise<ApiResponse<T>> {
    let queryString = '';
    if (params) {
      const parts = Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
      if (parts.length > 0) {
        queryString = `?${parts.join('&')}`;
      }
    }
    return this.request<T>({ url: `${url}${queryString}`, method: 'GET', showLoading });
  }

  /** POST 请求 */
  async post<T>(url: string, data?: Record<string, unknown>, showLoading = false): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: 'POST', data, showLoading });
  }

  /** PUT 请求 */
  async put<T>(url: string, data?: Record<string, unknown>, showLoading = false): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: 'PUT', data, showLoading });
  }

  /** DELETE 请求 */
  async delete<T>(url: string, showLoading = false): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: 'DELETE', showLoading });
  }
}

export const request = new Request();
export type { ApiResponse, PaginationData };
